
import { Asset, AssetType, AssetCategory, AssetMetadata, AssetOrigin } from '../entities';
import { vfs } from '@sdkwork/react-fs';
import { pathUtils, generateUUID, IBaseService, ServiceResult, Result, Page, PageRequest, logger, MediaResource as _MediaResource, MediaResourceType, AnyMediaResource } from '@sdkwork/react-commons';
import { platform } from '@sdkwork/react-core';
import { LIBRARY_SUBDIRS } from '@sdkwork/react-fs';
import { mediaAnalysisService } from '@sdkwork/react-core';
import type { AssetContentKey, AssetLocator, AssetScope } from '@sdkwork/react-types';
import { assetCenterService, readWorkspaceScope } from '../asset-center';
import {
    buildMagicStudioRootLayout,
} from '../../../sdkwork-react-core/src/storage/magicStudioPaths';
import { createSpringPage } from './impl/springPage';
import { loadResolvedMagicStudioStorageConfig } from '../asset-center/application/magicStudioStorageConfig';

const formatTimestamp = () => new Date().toISOString();
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

const PROTOCOL = 'assets://';

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
        const homeRoot = await platform.getPath('home');
        const storageConfig = await loadResolvedMagicStudioStorageConfig(homeRoot);
        return storageConfig.rootDir;
    }

    public async getLibraryRoot(): Promise<string> {
        const rootLayout = buildMagicStudioRootLayout({
            rootDir: await this.getMagicStudioRoot()
        });
        return rootLayout.systemLibraryRoot;
    }

    public async toVirtualPath(absolutePath: string): Promise<string> {
        const root = await this.getMagicStudioRoot();
        const normRoot = pathUtils.normalize(root);
        const normPath = pathUtils.normalize(absolutePath);
        const sep = pathUtils.detectSeparator(normRoot);
        const rootWithSep = normRoot.endsWith(sep) ? normRoot : normRoot + sep;

        if (normPath.startsWith(rootWithSep)) {
            let relative = normPath.substring(rootWithSep.length);
            return `${PROTOCOL}${relative.replace(/\\/g, '/')}`;
        } else if (normPath === normRoot) {
            return PROTOCOL; 
        }
        return absolutePath;
    }

    public async toAbsolutePath(virtualPath: string): Promise<string> {
        if (!virtualPath.startsWith(PROTOCOL)) return virtualPath;
        const root = await this.getMagicStudioRoot();
        const relative = virtualPath.substring(PROTOCOL.length);
        return pathUtils.join(root, relative);
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
            const absolutePath = isRemote ? undefined : await this.toAbsolutePath(asset.path);
            const locator: AssetLocator = isRemote
                ? {
                    protocol: asset.path.startsWith('https://') ? 'https' : 'http',
                    uri: asset.path,
                    url: asset.path
                }
                : {
                    protocol: 'assets' as const,
                    uri: asset.path,
                    path: absolutePath
                };

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

        if (sourcePath && platform.getPlatform() === 'desktop') {
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
            } catch {}
        }

        this._cache.unshift(asset);
        this._urlCache.set(virtualPath, viewableUrl);
        await this.registerToAssetCenter(asset);

        return asset;
    }

    public async resolveAssetUrl(assetLike: { path?: string; id?: string; url?: string }): Promise<string> {
        if (assetLike.url && (assetLike.url.startsWith('blob:') || assetLike.url.startsWith('data:'))) {
            return assetLike.url;
        }

        const path = assetLike.path || assetLike.id;
        if (!path) return '';

        const isInternal = path.startsWith(PROTOCOL);

        if (!isInternal && (path.startsWith('http:') || path.startsWith('https:') || path.startsWith('asset:'))) {
             return path;
        }

        if (this._urlCache.has(path)) {
            return this._urlCache.get(path)!;
        }
        
        if (this._resolveRequests.has(path)) {
            return this._resolveRequests.get(path)!;
        }

        const resolveTask = (async () => {
            try {
                let absPath = path;
                if (isInternal) {
                    absPath = await this.toAbsolutePath(path);
                } 
                
                if (platform.getPlatform() === 'desktop') {
                    const url = platform.convertFileSrc(absPath);
                    this._urlCache.set(path, url);
                    return url;
                } else {
                    return await this.loadVfsToBlob(absPath, path);
                }
            } catch (e) {
                console.warn(`[AssetService] Resolve failed for ${path}`, e);
                return '';
            }
        })();

        this._resolveRequests.set(path, resolveTask);
        
        try {
            return await resolveTask;
        } finally {
            this._resolveRequests.delete(path);
        }
    }

    private async loadVfsToBlob(absPath: string, cacheKey: string): Promise<string> {
        try {
            const blob = await vfs.readFileBlob(absPath);
            const mime = blob.type || this.guessMimeType(absPath);
            const finalBlob = blob.type !== mime ? new Blob([blob], { type: mime }) : blob;
            const url = URL.createObjectURL(finalBlob);
            this._urlCache.set(cacheKey, url);
            return url;
        } catch (e) {
            throw e;
        }
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
            try { const content = await vfs.readFile(metaPath); existingMeta = JSON.parse(content); } catch {}
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
            for (const subdir of Object.values(LIBRARY_SUBDIRS)) { await vfs.createDir(pathUtils.join(root, subdir)); }
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
        switch(type) {
            case 'image':
                return LIBRARY_SUBDIRS.IMAGES;
            case 'video':
                return LIBRARY_SUBDIRS.VIDEO;
            case 'audio':
            case 'music':
            case 'voice':
            case 'sfx':
                return LIBRARY_SUBDIRS.AUDIO;
            case 'model3d':
            case 'character':
                return LIBRARY_SUBDIRS.MODELS;
            case 'text':
            case 'effect':
            case 'transition':
            case 'subtitle':
                return LIBRARY_SUBDIRS.DOWNLOADS;
            default:
                return 'misc';
        }
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
                } catch (e) { throw new Error(`Failed to fetch generated asset from ${data}`); } 
            } else { throw new Error("Invalid data format for asset save."); } 
        } else { buffer = data; } 
        const asset = await this.importAsset(buffer, filename || `gen_${Date.now()}`, type, origin); 
        if (metadata) { 
            asset.metadata = { ...asset.metadata, ...metadata }; 
            const absPath = await this.toAbsolutePath(asset.path); 
            const metaPath = `${absPath}.meta.json`; 
            let existing = {}; 
            try { existing = JSON.parse(await vfs.readFile(metaPath)); } catch {} 
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
                let compared = 0;
                switch (sortOption.field) {
                    case 'name':
                        compared = a.name.localeCompare(b.name);
                        break;
                    case 'size':
                        compared = (a.size || 0) - (b.size || 0);
                        break;
                    case 'createdAt':
                        compared = toEpochMillis(a.createdAt) - toEpochMillis(b.createdAt);
                        break;
                    case 'updatedAt':
                    default:
                        compared = toEpochMillis(a.updatedAt) - toEpochMillis(b.updatedAt);
                        break;
                }
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
    
    async findById(id: string): Promise<ServiceResult<Asset | null>> { await this.ensureInitialized(); return Result.success(this._cache.find(a => a.id === id) || null); }
    
    async deleteById(id: string): Promise<ServiceResult<void>> { 
        const asset = (await this.findById(id)).data; 
        if (asset) { 
            const absPath = await this.toAbsolutePath(asset.path); 
            await vfs.delete(absPath); 
            try { await vfs.delete(absPath + '.meta.json'); } catch {} 
            if (asset.metadata.thumbnailPath) { const thumbAbs = await this.toAbsolutePath(asset.metadata.thumbnailPath); try { await vfs.delete(thumbAbs); } catch {} } 
            
            this._cache = this._cache.filter(a => a.id !== id); 
            
            if (this._urlCache.has(asset.path)) {
                const url = this._urlCache.get(asset.path);
                if (url && url.startsWith('blob:')) URL.revokeObjectURL(url);
                this._urlCache.delete(asset.path);
            }
            try {
                await assetCenterService.deleteById(id);
            } catch (e) {
                logger.warn('[AssetService] Failed to delete asset from asset-center', e);
            }
        } 
        return Result.success(undefined); 
    }
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async save(_entity: Partial<Asset>): Promise<ServiceResult<Asset>> { throw new Error("Use importAsset"); }
    async saveAll(): Promise<ServiceResult<Asset[]>> { throw new Error("Not supported"); }
    async delete(entity: Asset): Promise<ServiceResult<void>> { return this.deleteById(entity.id); }
    async deleteAll(ids: string[]): Promise<ServiceResult<void>> { for(const id of ids) await this.deleteById(id); return Result.success(undefined); }
    async findAllById(ids: string[]): Promise<ServiceResult<Asset[]>> { return Result.success(this._cache.filter(a => ids.includes(a.id))); }
    async count(): Promise<number> { return this._cache.length; }
    async existsById(id: string): Promise<boolean> { return !!this._cache.find(a => a.id === id); }
}

export const assetService = new AssetService();
