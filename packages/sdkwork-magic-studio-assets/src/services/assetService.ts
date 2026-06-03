import { Asset, AssetType, AssetCategory, AssetMetadata, AssetOrigin } from '../entities';
import { vfs } from '@sdkwork/magic-studio-fs';
import {
    matchesEntityKey,
    resolveEntityKey,
} from '@sdkwork/magic-studio-types/entity';
import {
    Result,
    type IBaseService,
    type ServiceResult,
} from '@sdkwork/magic-studio-types/service';
import type {
    AssetContentKey,
    AnyMediaResource,
} from '@sdkwork/magic-studio-types/media';
import type {
    Page,
    PageRequest,
} from '@sdkwork/magic-studio-types/pagination';
import type { AssetLocator, AssetScope } from '@sdkwork/magic-studio-types/asset-center';
import { MediaResourceType } from '@sdkwork/magic-studio-types/vocabulary';
import { generateUUID, pathUtils } from '@sdkwork/magic-studio-commons/utils/helpers';
import { logger } from '@sdkwork/magic-studio-commons/utils/logger';
import { getPlatformRuntime, isDesktopShellRuntimeKind } from '@sdkwork/magic-studio-core/platform';
import { mediaAnalysisService } from '@sdkwork/magic-studio-core/services';
import {
    buildMagicStudioRootLayout,
    isCanonicalMagicStudioAssetReference,
    isLocalFilePath,
    isRenderableAssetUrl,
    listMagicStudioSystemLibraryDirs,
    resolveMagicStudioAssetAbsolutePath,
    resolveRuntimeMagicStudioAssetUrl,
    resolveMagicStudioAssetVirtualPath,
    resolveMagicStudioSystemLibraryDir,
} from '@sdkwork/magic-studio-core/storage';
import {
    assetCenterService,
    isDesktopAssetLocator,
    isExplicitLocalAssetLocator,
    isManagedAssetLocator,
    readWorkspaceScope,
    stripExplicitLocalAssetLocatorProtocol,
} from '../asset-center';
import { createSpringPage } from './impl/springPage';
import { loadResolvedMagicStudioStorageConfig } from '../asset-center/application/magicStudioStorageConfig';

const formatTimestamp = () => new Date().toISOString();
const ignoreAssetServiceError = (error: unknown): void => {
    void error;
};
const toEpochMillis = (value?: string | number): number => {
    if (typeof value === 'number') return value;
    if (!value) return 0;
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
};

type AssetSortField = 'name' | 'createdAt' | 'updatedAt' | 'size';
type AssetSortDirection = 'asc' | 'desc';
type AssetSortOrder = { field: AssetSortField; direction: AssetSortDirection };

const DEFAULT_SORT_ORDER: AssetSortOrder = { field: 'updatedAt', direction: 'desc' };

const parseSortOrders = (sort?: string[], fallback = true): AssetSortOrder[] => {
    if (!sort || sort.length === 0) return fallback ? [DEFAULT_SORT_ORDER] : [];
    const orders: AssetSortOrder[] = [];
    for (const item of sort) {
        const [rawField, rawDir] = item.split(',');
        const field = (rawField || '').trim();
        const direction = rawDir?.trim().toLowerCase() === 'asc' ? 'asc' : 'desc';
        if (field === 'name' || field === 'createdAt' || field === 'updatedAt' || field === 'size') {
            orders.push({ field, direction });
        }
    }
    if (orders.length > 0) {
        return orders;
    }
    return fallback ? [DEFAULT_SORT_ORDER] : [];
};

export const ASSET_CATEGORIES: AssetCategory[] = [
  { id: 'image', label: 'Images', accepts: ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg', '.bmp', '.tiff'] },
  { id: 'video', label: 'Videos', accepts: ['.mp4', '.mov', '.webm', '.avi', '.mkv', '.m4v'] },
  { id: 'audio', label: 'Audio', accepts: ['.wav', '.mp3', '.ogg', '.flac', '.aac', '.m4a'] },
  { id: 'music', label: 'Music', accepts: ['.mp3', '.wav', '.ogg', '.flac'] },
  { id: 'voice', label: 'Voices', accepts: ['.json', '.voice', '.wav', '.mp3'] },
  { id: 'text', label: 'Texts', accepts: ['.txt', '.md'] },
  { id: 'character', label: 'Characters', accepts: ['.json', '.char', '.dh', '.png', '.glb', '.gltf', '.fbx'] },
  { id: 'sfx', label: 'Sound Effects', accepts: ['.wav', '.mp3', '.ogg', '.aac'] },
  { id: 'effect', label: 'Effects', accepts: ['.effect', '.cube', '.lut', '.fx'] },
  { id: 'transition', label: 'Transitions', accepts: ['.transition', '.trans'] },
  { id: 'subtitle', label: 'Subtitles', accepts: ['.srt', '.ass', '.vtt'] },
  { id: 'model3d', label: '3D Models', accepts: ['.glb', '.gltf', '.obj', '.fbx'] },
  { id: 'lottie', label: 'Animations', accepts: ['.json', '.lottie'] },
  { id: 'file', label: 'Files', accepts: [] }
];

export interface MediaAnalysisAdapter {
    analyze(url: string, type: AssetType): Promise<{ metadata: Partial<AssetMetadata>; thumbnailBlob?: Blob }>;
}

export type MediaAnalysisResult = { metadata: Partial<AssetMetadata>; thumbnailBlob?: Blob };

let _mediaAnalysisAdapter: MediaAnalysisAdapter | null = null;

export function setMediaAnalysisAdapter(adapter: MediaAnalysisAdapter) {
    _mediaAnalysisAdapter = adapter;
}

class AssetService implements IBaseService<Asset> {
    private _cache: Asset[] = [];
    private _urlCache: Map<string, string> = new Map();
    private _resolveRequests: Map<string, Promise<string>> = new Map();
    private _initialized = false;

    constructor() {}

    private async ensureInitialized() {
        if (!this._initialized) {
            await this.refreshIndex();
            this._initialized = true;
        }
    }

    private async getMagicStudioRoot(): Promise<string> {
        const homeRoot = await getPlatformRuntime().system.path('home');
        return (await loadResolvedMagicStudioStorageConfig(homeRoot)).rootDir;
    }

    private async getMagicStudioStorageConfig() {
        const homeRoot = await getPlatformRuntime().system.path('home');
        return loadResolvedMagicStudioStorageConfig(homeRoot);
    }

    public async getLibraryRoot(): Promise<string> {
        const rootLayout = buildMagicStudioRootLayout({
            rootDir: await this.getMagicStudioRoot()
        });
        return rootLayout.systemLibraryRoot;
    }

    public async toVirtualPath(absolutePath: string): Promise<string> {
        return resolveMagicStudioAssetVirtualPath(
            await this.getMagicStudioStorageConfig(),
            absolutePath
        );
    }

    public async toAbsolutePath(virtualPath: string): Promise<string> {
        if (!isManagedAssetLocator(virtualPath)) return virtualPath;
        return resolveMagicStudioAssetAbsolutePath(
            await this.getMagicStudioStorageConfig(),
            virtualPath
        );
    }

    private toAssetContentKey(type: AssetType): AssetContentKey {
        return type;
    }

    private resolveScopeByType(type: AssetType): AssetScope {
        const workspaceScope = readWorkspaceScope();
        const workspaceId = workspaceScope.workspaceId;
        const projectId = workspaceScope.projectId;

        const domainMap: Record<AssetType, AssetScope['domain']> = {
            image: 'image-studio',
            video: 'video-studio',
            audio: 'audio-studio',
            music: 'music',
            voice: 'voice-speaker',
            text: 'notes',
            character: 'character',
            sfx: 'sfx',
            effect: 'magiccut',
            transition: 'magiccut',
            subtitle: 'magiccut',
            model3d: 'canvas',
            lottie: 'canvas',
            file: 'asset-center'
        };

        return {
            workspaceId,
            projectId,
            domain: domainMap[type] || 'asset-center'
        };
    }

    private async registerToAssetCenter(asset: Asset): Promise<void> {
        try {
            await assetCenterService.initialize();
            const contentType = this.toAssetContentKey(asset.type);
            const scope = this.resolveScopeByType(asset.type);
            const isRemote = asset.path.startsWith('http://') || asset.path.startsWith('https://');
            let locator: AssetLocator;

            if (isRemote) {
                locator = {
                    protocol: asset.path.startsWith('https://') ? 'https' : 'http',
                    uri: asset.path,
                    url: asset.path
                };
            } else if (isManagedAssetLocator(asset.path)) {
                locator = {
                    protocol: 'assets',
                    uri: asset.path,
                    path: await this.toAbsolutePath(asset.path)
                };
            } else if (isExplicitLocalAssetLocator(asset.path)) {
                locator = {
                    protocol: isDesktopAssetLocator(asset.path) ? 'desktop' : 'file',
                    uri: asset.path,
                    path: stripExplicitLocalAssetLocatorProtocol(asset.path)
                };
            } else {
                locator = {
                    protocol: 'file',
                    uri: asset.path,
                    path: isLocalFilePath(asset.path)
                        ? asset.path
                        : await this.toAbsolutePath(asset.path)
                };
            }

            const status =
                asset.origin === 'ai'
                    ? 'generated'
                    : asset.origin === 'upload'
                        ? 'imported'
                        : 'ready';

            await assetCenterService.registerExistingAsset({
                assetId: asset.id,
                scope,
                type: contentType,
                name: asset.name,
                locator,
                metadata: {
                    ...asset.metadata,
                    origin: asset.origin
                },
                status,
                size: asset.size,
                createdAt: String(asset.createdAt),
                updatedAt: String(asset.updatedAt)
            });
        } catch (e) {
            logger.warn('[AssetService] Failed to register asset into asset-center', e);
        }
    }

    public async importAsset(
        dataOrBlob: Uint8Array | Blob | null, 
        originalName: string, 
        type: AssetType, 
        origin: AssetOrigin = 'upload',
        sourcePath?: string
    ): Promise<Asset> {
        await this.ensureInitialized();

        const root = await this.getLibraryRoot();
        const subDir = this.getSubDirForType(type);
        const targetDir = pathUtils.join(root, subDir);
        await vfs.createDir(targetDir);

        let ext = pathUtils.extname(originalName);
        if (!ext || ext === '.') {
             let sniffedExt = '';
             if (dataOrBlob instanceof Blob) sniffedExt = this.getExtensionFromMime(dataOrBlob.type);
             if (!sniffedExt) sniffedExt = this.getExtensionForType(type);
             ext = sniffedExt;
        }

        const storageId = generateUUID();
        const diskFileName = `${storageId}${ext}`;
        const finalName = pathUtils.join(targetDir, diskFileName);

        const runtime = getPlatformRuntime();
        if (sourcePath && isDesktopShellRuntimeKind(runtime.system.kind())) {
             try {
                 await vfs.copyFile(sourcePath, finalName);
             } catch (e) {
                 if (dataOrBlob) {
                     if (dataOrBlob instanceof Blob) await vfs.writeFileBlob(finalName, dataOrBlob);
                     else await vfs.writeFileBinary(finalName, dataOrBlob);
                 } else throw e;
             }
        } else {
             if (!dataOrBlob) throw new Error("Import failed: No data provided");
             if (dataOrBlob instanceof Blob) await vfs.writeFileBlob(finalName, dataOrBlob);
             else await vfs.writeFileBinary(finalName, dataOrBlob);
        }

        const virtualPath = await this.toVirtualPath(finalName);
        const viewableUrl = await this.resolveAssetUrl({ path: virtualPath });
        
        console.log(`[AssetService] Analyzing media: ${originalName} (${type})`);
        
        let metadata: Partial<AssetMetadata> = {};
        let thumbnailBlob: Blob | undefined;
        
        if (_mediaAnalysisAdapter) {
            const result = await _mediaAnalysisAdapter.analyze(viewableUrl, type as any);
            metadata = result.metadata;
            thumbnailBlob = result.thumbnailBlob;
        } else {
            try {
                const result = await mediaAnalysisService.analyze(viewableUrl, type as any);
                metadata = result.metadata;
                thumbnailBlob = result.thumbnailBlob;
            } catch (e) {
                console.warn('[AssetService] Media analysis failed', e);
            }
        }
        
        if (thumbnailBlob) {
            const rootLayout = buildMagicStudioRootLayout({
                rootDir: await this.getMagicStudioRoot()
            });
            const thumbDir = rootLayout.systemThumbnailCacheDir;
            await vfs.createDir(thumbDir);
            
            const thumbName = `${storageId}_thumb.jpg`;
            const thumbPath = pathUtils.join(thumbDir, thumbName);
            
            await vfs.writeFileBlob(thumbPath, thumbnailBlob);
            metadata.thumbnailPath = await this.toVirtualPath(thumbPath);
        }

        const assetMeta: AssetMetadata = {
            ...metadata,
            originalName,
            extension: ext,
            mimeType: this.guessMimeType(originalName)
        };
        
        const metaPath = `${finalName}.meta.json`;
        await vfs.writeFile(metaPath, JSON.stringify({
            metadata: assetMeta,
            origin,
            type, 
            name: originalName,
            createdAt: formatTimestamp()
        }, null, 2));

        const asset: Asset = {
            id: virtualPath, 
            uuid: storageId,
            name: originalName,
            type,
            path: virtualPath,
            size: (dataOrBlob instanceof Blob) ? dataOrBlob.size : (dataOrBlob ? dataOrBlob.length : 0), 
            origin,
            createdAt: formatTimestamp(),
            updatedAt: formatTimestamp(),
            metadata: assetMeta
        };

        if (sourcePath && !dataOrBlob) {
            try {
                const stats = await vfs.stat(finalName);
                asset.size = stats.size;
            } catch (error) {
                logger.warn('[AssetService] Failed to stat imported asset', finalName, error);
            }
        }

        this._cache.unshift(asset);
        this._urlCache.set(virtualPath, viewableUrl);
        await this.registerToAssetCenter(asset);

        return asset;
    }

    public async resolveAssetUrl(assetLike: { path?: string; id?: string; url?: string }): Promise<string> {
        const path = assetLike.path || assetLike.url;
        if (!path) return '';

        if (isRenderableAssetUrl(path)) {
             return path;
        }

        const isCanonicalLocator =
            isCanonicalMagicStudioAssetReference(path) ||
            isLocalFilePath(path);

        if (!isCanonicalLocator) {
            return '';
        }

        if (this._urlCache.has(path)) {
            return this._urlCache.get(path)!;
        }
        
        if (this._resolveRequests.has(path)) {
            return this._resolveRequests.get(path)!;
        }

        const resolveTask = (async () => {
            try {
                const resolved = await assetCenterService.resolveLocatorUrl(path);
                if (resolved) {
                    this._urlCache.set(path, resolved);
                    return resolved;
                }

                if (isManagedAssetLocator(path)) {
                    let absPath = await this.toAbsolutePath(path);
                    const runtime = getPlatformRuntime();
                    if (isDesktopShellRuntimeKind(runtime.system.kind())) {
                        const url = await resolveRuntimeMagicStudioAssetUrl(runtime, absPath);
                        this._urlCache.set(path, url);
                        return url;
                    } else {
                        return await this.loadVfsToBlob(absPath, path);
                    }
                }

                if (isExplicitLocalAssetLocator(path) || isLocalFilePath(path)) {
                    const runtime = getPlatformRuntime();
                    const url = await resolveRuntimeMagicStudioAssetUrl(runtime, path);
                    if (url) {
                        this._urlCache.set(path, url);
                    }
                    return url;
                }
            } catch (e) {
                console.warn(`[AssetService] Resolve failed for ${path}`, e);
                return '';
            }

            return '';
        })();

        this._resolveRequests.set(path, resolveTask);
        
        try {
            return await resolveTask;
        } finally {
            this._resolveRequests.delete(path);
        }
    }

    private async loadVfsToBlob(absPath: string, cacheKey: string): Promise<string> {
        const blob = await vfs.readFileBlob(absPath);
        const mime = blob.type || this.guessMimeType(absPath);
        const finalBlob = blob.type !== mime ? new Blob([blob], { type: mime }) : blob;
        const url = URL.createObjectURL(finalBlob);
        this._urlCache.set(cacheKey, url);
        return url;
    }

    public async createDerivativeAsset(sourceAsset: Asset | AnyMediaResource, newType: AssetType, nameSuffix: string = '_audio'): Promise<Asset> {
        await this.ensureInitialized();
        const sourcePath = sourceAsset.path;
        if (!sourcePath) throw new Error("Source asset has no path");
        const root = await this.getLibraryRoot();
        const absSourcePath = await this.toAbsolutePath(sourcePath);
        const subDir = this.getSubDirForType(newType);
        const targetDir = pathUtils.join(root, subDir);
        await vfs.createDir(targetDir);
        const originalName = sourceAsset.name;
        const ext = pathUtils.extname(originalName);
        const baseName = pathUtils.basename(originalName).replace(ext, '');
        const newDisplayName = `${baseName}${nameSuffix}${ext}`;
        const storageId = generateUUID();
        const diskFileName = `${storageId}${ext}`;
        const finalPath = pathUtils.join(targetDir, diskFileName);
        await vfs.copyFile(absSourcePath, finalPath);
        const meta: AssetMetadata = { ...(sourceAsset.metadata || {}), originalName: newDisplayName, source: `derived:${sourceAsset.id}` };
        const metaPath = `${finalPath}.meta.json`;
        await vfs.writeFile(metaPath, JSON.stringify({ metadata: meta, origin: 'system', type: newType, name: newDisplayName, createdAt: formatTimestamp() }, null, 2));
        const virtualPath = await this.toVirtualPath(finalPath);
        const newAsset: Asset = { id: virtualPath, uuid: storageId, name: newDisplayName, type: newType, path: virtualPath, size: sourceAsset.size || 0, origin: 'system', createdAt: formatTimestamp(), updatedAt: formatTimestamp(), metadata: meta };
        this._cache.unshift(newAsset);
        await this.registerToAssetCenter(newAsset);
        return newAsset;
    }
    
    public async renameAsset(virtualPath: string, newName: string): Promise<ServiceResult<string>> {
        await this.ensureInitialized();
        const assetIndex = this._cache.findIndex(a => a.path === virtualPath);
        if (assetIndex === -1) return Result.error("Asset not found");
        const asset = this._cache[assetIndex];
        const absPath = await this.toAbsolutePath(asset.path);
        const metaPath = `${absPath}.meta.json`;
        try {
            let existingMeta: any = {};
            try {
                const content = await vfs.readFile(metaPath);
                existingMeta = JSON.parse(content);
            } catch (error) {
                ignoreAssetServiceError(error);
            }
            existingMeta.name = newName; 
            await vfs.writeFile(metaPath, JSON.stringify(existingMeta, null, 2));
            this._cache[assetIndex] = { ...asset, name: newName, updatedAt: formatTimestamp() };
            return Result.success(virtualPath); 
        } catch (e: any) { return Result.error(e.message); }
    }
    
    public async refreshIndex(): Promise<void> {
        const root = await this.getLibraryRoot();
        const assets: Asset[] = [];
        try {
            await vfs.createDir(root);
            const rootLayout = buildMagicStudioRootLayout({
                rootDir: await this.getMagicStudioRoot()
            });
            for (const dir of listMagicStudioSystemLibraryDirs(rootLayout)) {
                await vfs.createDir(dir);
            }
        } catch (e) {
            logger.warn('[AssetService] Failed to create library directories', e);
        }
        const scan = async (dir: string) => {
            try {
                const entries = await vfs.readdir(dir);
                for (const entryPath of entries) {
                    const name = pathUtils.basename(entryPath);
                    if (name.startsWith('.')) continue;
                    if (name.endsWith('.meta.json')) continue;
                    const stat = await vfs.stat(entryPath);
                    if (stat.isDirectory) {
                        await scan(entryPath);
                    } else {
                        const ext = pathUtils.extname(name);
                        const metaPath = `${entryPath}.meta.json`;
                        let metadata: AssetMetadata = { extension: ext, originalName: name };
                        let origin: AssetOrigin = 'stock';
                        let createdAt = Date.now();
                        let storedType: AssetType | undefined;
                        let displayName = name; 
                        try {
                            const metaContent = await vfs.readFile(metaPath);
                            const saved = JSON.parse(metaContent);
                            if (saved.metadata) metadata = { ...metadata, ...saved.metadata };
                            if (saved.origin) origin = saved.origin;
                            if (saved.createdAt) createdAt = saved.createdAt;
                            if (saved.type) storedType = saved.type;
                            if (saved.name) displayName = saved.name; 
                        } catch (e) {
                            logger.warn('[AssetService] Failed to read meta file', metaPath, e);
                        }
                        const virtualPath = await this.toVirtualPath(entryPath);
                        const type = storedType || this.getTypeFromExt(ext);
                        const uuidCandidate = pathUtils.basename(name).replace(ext, '');
                        const uuid = uuidCandidate.length > 20 ? uuidCandidate : generateUUID();
                        let size = 0;
                        try { const s = await vfs.stat(entryPath); size = s.size; } catch (e) {
                            logger.warn('[AssetService] Failed to stat asset', entryPath, e);
                        }
                        assets.push({ id: virtualPath, uuid, name: displayName, type, path: virtualPath, size, origin, createdAt, updatedAt: formatTimestamp(), metadata });
                    }
                }
            } catch (e) {
                logger.warn('[AssetService] Failed to scan directory', dir, e);
            }
        };
        await scan(root);
        this._cache = assets.sort((a, b) => toEpochMillis(b.createdAt) - toEpochMillis(a.createdAt));
        await Promise.all(this._cache.map((asset) => this.registerToAssetCenter(asset)));
    }
    
    private getTypeFromExt(ext: string): AssetType {
        const e = ext.toLowerCase();
        for (const cat of ASSET_CATEGORIES) {
            if (cat.accepts.includes(e)) return cat.id as AssetType;
        }
        return 'file';
    }
    private getSubDirForType(type: AssetType): string {
        return resolveMagicStudioSystemLibraryDir(type);
    }
    private getExtensionForType(type: AssetType): string {
        switch(type) {
            case 'image':
                return '.png';
            case 'video':
                return '.mp4';
            case 'audio':
            case 'music':
            case 'voice':
            case 'sfx':
                return '.mp3';
            case 'text':
                return '.txt';
            case 'effect':
                return '.effect';
            case 'transition':
                return '.transition';
            case 'subtitle':
                return '.srt';
            case 'model3d':
                return '.glb';
            default:
                return '.bin';
        }
    }
    private getExtensionFromMime(mime: string): string { if (mime.includes('image/jpeg')) return '.jpg'; if (mime.includes('image/png')) return '.png'; if (mime.includes('image/webp')) return '.webp'; if (mime.includes('image/gif')) return '.gif'; if (mime.includes('video/mp4')) return '.mp4'; if (mime.includes('video/webm')) return '.webm'; if (mime.includes('audio/mpeg')) return '.mp3'; if (mime.includes('audio/wav')) return '.wav'; return ''; }
    private guessMimeType(filename: string): string { const ext = pathUtils.extname(filename).toLowerCase(); const map: any = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.mp4': 'video/mp4', '.mov': 'video/quicktime', '.webm': 'video/webm', '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.ogg': 'audio/ogg' }; return map[ext] || 'application/octet-stream'; }
    
    public toMediaResource(asset: Asset): AnyMediaResource { 
        const typeMap: Record<string, MediaResourceType> = {
            image: MediaResourceType.IMAGE,
            video: MediaResourceType.VIDEO,
            audio: MediaResourceType.AUDIO,
            music: MediaResourceType.MUSIC,
            voice: MediaResourceType.VOICE,
            text: MediaResourceType.TEXT,
            character: MediaResourceType.CHARACTER,
            model3d: MediaResourceType.MODEL_3D,
            lottie: MediaResourceType.LOTTIE,
            effect: MediaResourceType.EFFECT,
            transition: MediaResourceType.TRANSITION,
            subtitle: MediaResourceType.SUBTITLE,
            sfx: MediaResourceType.AUDIO
        }; 
        const mediaType = typeMap[asset.type] || MediaResourceType.FILE; 
        const effectiveMetadata: any = { ...asset.metadata }; 
        if (effectiveMetadata.thumbnailPath && !effectiveMetadata.thumbnailUrl) { effectiveMetadata.thumbnailUrl = effectiveMetadata.thumbnailPath; } 
        return { id: asset.id, uuid: asset.uuid, name: asset.name, createdAt: asset.createdAt, updatedAt: asset.updatedAt, type: mediaType, path: asset.path, size: asset.size, origin: asset.origin, metadata: effectiveMetadata, duration: asset.metadata.duration, width: asset.metadata.width, height: asset.metadata.height, isFavorite: asset.isFavorite } as AnyMediaResource; 
    }
    
    public async saveGeneratedAsset( data: string | Uint8Array, type: AssetType, metadata?: Partial<AssetMetadata>, filename?: string, origin: AssetOrigin = 'ai' ): Promise<Asset> { 
        let buffer: Uint8Array; 
        if (typeof data === 'string') { 
            if (data.startsWith('data:')) { 
                const base64 = data.split(',')[1]; 
                const binaryString = atob(base64); 
                buffer = new Uint8Array(binaryString.length); 
                for (let i = 0; i < binaryString.length; i++) { buffer[i] = binaryString.charCodeAt(i); } 
            } else if (data.startsWith('blob:') || data.startsWith('http')) { 
                try { 
                    const res = await fetch(data); 
                    const blob = await res.blob(); 
                    buffer = new Uint8Array(await blob.arrayBuffer()); 
                } catch (error) {
                    throw new Error(`Failed to fetch generated asset from ${data}`, { cause: error });
                } 
            } else { throw new Error("Invalid data format for asset save."); } 
        } else { buffer = data; } 
        const asset = await this.importAsset(buffer, filename || `gen_${Date.now()}`, type, origin); 
        if (metadata) { 
            asset.metadata = { ...asset.metadata, ...metadata }; 
            const absPath = await this.toAbsolutePath(asset.path); 
            const metaPath = `${absPath}.meta.json`; 
            let existing = {}; 
            try {
                existing = JSON.parse(await vfs.readFile(metaPath));
            } catch (error) {
                ignoreAssetServiceError(error);
            } 
            await vfs.writeFile(metaPath, JSON.stringify({ ...existing, metadata: asset.metadata }, null, 2)); 
        } 
        await this.registerToAssetCenter(asset);
        return asset; 
    }
    
    async findAll(pageRequest?: PageRequest, typeFilter?: AssetType, typeFilters?: AssetType[]): Promise<ServiceResult<Page<Asset>>> { 
        await this.ensureInitialized(); 
        let items = this._cache; 
        const keyword = pageRequest?.keyword?.trim().toLowerCase();
        if (keyword) items = items.filter(a => a.name.toLowerCase().includes(keyword)); 
        if (typeFilters && typeFilters.length > 0) {
            const filterSet = new Set(typeFilters);
            items = items.filter(a => filterSet.has(a.type));
        } else if (typeFilter) {
            items = items.filter(a => a.type === typeFilter);
        }

        const requestedSortOrders = parseSortOrders(pageRequest?.sort, false);
        const sortOrders = requestedSortOrders.length > 0 ? requestedSortOrders : [DEFAULT_SORT_ORDER];
        items = [...items].sort((a, b) => {
            for (const sortOption of sortOrders) {
                const factor = sortOption.direction === 'asc' ? 1 : -1;
                const compared = (() => {
                    switch (sortOption.field) {
                        case 'name':
                            return a.name.localeCompare(b.name);
                        case 'size':
                            return (a.size || 0) - (b.size || 0);
                        case 'createdAt':
                            return toEpochMillis(a.createdAt) - toEpochMillis(b.createdAt);
                        case 'updatedAt':
                        default:
                            return toEpochMillis(a.updatedAt) - toEpochMillis(b.updatedAt);
                    }
                })();
                if (compared !== 0) {
                    return compared * factor;
                }
            }
            return 0;
        });

        const size = Math.max(1, pageRequest?.size ?? 50); 
        const page = Math.max(0, pageRequest?.page ?? 0); 
        const pageResult = createSpringPage(items, {
            page,
            size,
            sort: requestedSortOrders.map((order) => `${order.field},${order.direction}`)
        });
        return Result.success(pageResult); 
    }
    
    async findById(id: string): Promise<ServiceResult<Asset | null>> {
        await this.ensureInitialized();
        return Result.success(this._cache.find(a => matchesEntityKey(a, id)) || null);
    }
    
    async deleteById(id: string): Promise<ServiceResult<void>> { 
        const asset = (await this.findById(id)).data; 
        if (asset) { 
            const absPath = await this.toAbsolutePath(asset.path); 
            await vfs.delete(absPath); 
            try {
                await vfs.delete(absPath + '.meta.json');
            } catch (error) {
                ignoreAssetServiceError(error);
            }
            if (asset.metadata.thumbnailPath) {
                const thumbAbs = await this.toAbsolutePath(asset.metadata.thumbnailPath);
                try {
                    await vfs.delete(thumbAbs);
                } catch (error) {
                    ignoreAssetServiceError(error);
                }
            } 
            
            this._cache = this._cache.filter(a => !matchesEntityKey(a, id)); 
            
            if (this._urlCache.has(asset.path)) {
                const url = this._urlCache.get(asset.path);
                if (url && url.startsWith('blob:')) URL.revokeObjectURL(url);
                this._urlCache.delete(asset.path);
            }
            try {
                await assetCenterService.deleteById(asset.id);
            } catch (e) {
                logger.warn('[AssetService] Failed to delete asset from asset-center', e);
            }
        } 
        return Result.success(undefined); 
    }
    
    async save(_entity: Partial<Asset>): Promise<ServiceResult<Asset>> { throw new Error("Use importAsset"); }
    async saveAll(): Promise<ServiceResult<Asset[]>> { throw new Error("Not supported"); }
    async delete(entity: Asset): Promise<ServiceResult<void>> { return this.deleteById(resolveEntityKey(entity)); }
    async deleteAll(ids: string[]): Promise<ServiceResult<void>> { for(const id of ids) await this.deleteById(id); return Result.success(undefined); }
    async findAllById(ids: string[]): Promise<ServiceResult<Asset[]>> {
        return Result.success(this._cache.filter(a => ids.some(id => matchesEntityKey(a, id))));
    }
    async count(): Promise<number> { return this._cache.length; }
    async existsById(id: string): Promise<boolean> { return !!this._cache.find(a => matchesEntityKey(a, id)); }
}

export const assetService = new AssetService();
