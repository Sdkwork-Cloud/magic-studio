
import { Asset, AssetType, AssetCategory, AssetMetadata, AssetOrigin } from '../entities/asset.entity';
import { vfs } from 'sdkwork-react-fs';
import { pathUtils, generateUUID, IBaseService, ServiceResult, Result, Page, PageRequest, logger, MediaResource as _MediaResource, MediaResourceType, AnyMediaResource } from 'sdkwork-react-commons';
import { platform } from 'sdkwork-react-core';
import { storageConfig, LIBRARY_SUBDIRS } from 'sdkwork-react-fs';
import { mediaAnalysisService } from 'sdkwork-react-core';

export const ASSET_CATEGORIES: AssetCategory[] = [
  { id: 'image', label: 'Images', accepts: ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg', '.bmp', '.tiff'] },
  { id: 'video', label: 'Videos', accepts: ['.mp4', '.mov', '.webm', '.avi', '.mkv', '.m4v'] },
  { id: 'audio', label: 'Audio', accepts: ['.wav', '.mp3', '.ogg', '.flac', '.aac', '.m4a'] },
  { id: 'music', label: 'Music', accepts: ['.mp3', '.wav', '.ogg', '.flac'] },
  { id: 'voice', label: 'Voices', accepts: ['.json', '.voice', '.wav', '.mp3'] },
  { id: 'character', label: 'Characters', accepts: ['.json', '.char', '.png'] },
  { id: 'digital-human', label: 'Digital Humans', accepts: ['.json', '.dh', '.glb', '.gltf', '.fbx'] },
  { id: 'sfx', label: 'Sound Effects', accepts: ['.wav', '.mp3', '.ogg', '.aac'] },
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
    private _libraryRoot: string | null = null;

    constructor() {}

    private async ensureInitialized() {
        if (!this._initialized) {
            await this.refreshIndex();
            this._initialized = true;
        }
    }

    public async getLibraryRoot(): Promise<string> {
        if (this._libraryRoot) return this._libraryRoot;
        const docRoot = await platform.getPath('documents');
        this._libraryRoot = pathUtils.join(docRoot, storageConfig.library.root);
        return this._libraryRoot;
    }

    public async toVirtualPath(absolutePath: string): Promise<string> {
        const root = await this.getLibraryRoot();
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
        const root = await this.getLibraryRoot();
        const relative = virtualPath.substring(PROTOCOL.length);
        return pathUtils.join(root, relative);
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
            const thumbDir = pathUtils.join(root, storageConfig.globalCache.thumbnails); 
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
            createdAt: Date.now()
        }, null, 2));

        const asset: Asset = {
            id: virtualPath, 
            uuid: storageId,
            name: originalName,
            type,
            path: virtualPath,
            size: (dataOrBlob instanceof Blob) ? dataOrBlob.size : (dataOrBlob ? dataOrBlob.length : 0), 
            origin,
            createdAt: Date.now(),
            updatedAt: Date.now(),
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
        await vfs.writeFile(metaPath, JSON.stringify({ metadata: meta, origin: 'system', type: newType, name: newDisplayName, createdAt: Date.now() }, null, 2));
        const virtualPath = await this.toVirtualPath(finalPath);
        const newAsset: Asset = { id: virtualPath, uuid: storageId, name: newDisplayName, type: newType, path: virtualPath, size: sourceAsset.size || 0, origin: 'system', createdAt: Date.now(), updatedAt: Date.now(), metadata: meta };
        this._cache.unshift(newAsset);
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
            this._cache[assetIndex] = { ...asset, name: newName, updatedAt: Date.now() };
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
                const entries = await vfs.readDir(dir);
                for (const entry of entries) {
                    if (entry.name.startsWith('.')) continue;
                    if (entry.name.endsWith('.meta.json')) continue;
                    if (entry.isDirectory) {
                        await scan(entry.path);
                    } else {
                        const ext = pathUtils.extname(entry.name);
                        const metaPath = `${entry.path}.meta.json`;
                        let metadata: AssetMetadata = { extension: ext, originalName: entry.name };
                        let origin: AssetOrigin = 'stock';
                        let createdAt = Date.now();
                        let storedType: AssetType | undefined;
                        let displayName = entry.name; 
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
                        const virtualPath = await this.toVirtualPath(entry.path);
                        const type = storedType || this.getTypeFromExt(ext);
                        const uuidCandidate = pathUtils.basename(entry.name).replace(ext, '');
                        const uuid = uuidCandidate.length > 20 ? uuidCandidate : generateUUID();
                        let size = 0;
                        try { const s = await vfs.stat(entry.path); size = s.size; } catch (e) {
                            logger.warn('[AssetService] Failed to stat asset', entry.path, e);
                        }
                        assets.push({ id: virtualPath, uuid, name: displayName, type, path: virtualPath, size, origin, createdAt, updatedAt: Date.now(), metadata });
                    }
                }
            } catch (e) {
                logger.warn('[AssetService] Failed to scan directory', dir, e);
            }
        };
        await scan(root);
        this._cache = assets.sort((a, b) => b.createdAt - a.createdAt);
    }
    
    private getTypeFromExt(ext: string): AssetType { const e = ext.toLowerCase(); for (const cat of ASSET_CATEGORIES) { if (cat.accepts.includes(e)) return cat.id as AssetType; } return 'file'; }
    private getSubDirForType(type: AssetType): string { switch(type) { case 'image': return LIBRARY_SUBDIRS.IMAGES; case 'video': return LIBRARY_SUBDIRS.VIDEO; case 'audio': case 'music': case 'voice': return LIBRARY_SUBDIRS.AUDIO; case 'model3d': return LIBRARY_SUBDIRS.MODELS; default: return 'misc'; } }
    private getExtensionForType(type: AssetType): string { switch(type) { case 'image': return '.png'; case 'video': return '.mp4'; case 'audio': case 'music': return '.mp3'; default: return '.bin'; } }
    private getExtensionFromMime(mime: string): string { if (mime.includes('image/jpeg')) return '.jpg'; if (mime.includes('image/png')) return '.png'; if (mime.includes('image/webp')) return '.webp'; if (mime.includes('image/gif')) return '.gif'; if (mime.includes('video/mp4')) return '.mp4'; if (mime.includes('video/webm')) return '.webm'; if (mime.includes('audio/mpeg')) return '.mp3'; if (mime.includes('audio/wav')) return '.wav'; return ''; }
    private guessMimeType(filename: string): string { const ext = pathUtils.extname(filename).toLowerCase(); const map: any = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.mp4': 'video/mp4', '.mov': 'video/quicktime', '.webm': 'video/webm', '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.ogg': 'audio/ogg' }; return map[ext] || 'application/octet-stream'; }
    
    public toMediaResource(asset: Asset): AnyMediaResource { 
        const typeMap: Record<string, MediaResourceType> = { 'image': MediaResourceType.IMAGE, 'video': MediaResourceType.VIDEO, 'audio': MediaResourceType.AUDIO, 'music': MediaResourceType.MUSIC, 'voice': MediaResourceType.VOICE, 'text': MediaResourceType.TEXT }; 
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
        return asset; 
    }
    
    async findAll(pageRequest?: PageRequest, typeFilter?: AssetType): Promise<ServiceResult<Page<Asset>>> { 
        await this.ensureInitialized(); 
        let items = this._cache; 
        if (pageRequest?.keyword) items = items.filter(a => a.name.toLowerCase().includes(pageRequest.keyword!.toLowerCase())); 
        if (typeFilter) items = items.filter(a => a.type === typeFilter); 
        const size = pageRequest?.size || 50; 
        const page = pageRequest?.page || 0; 
        const paged = items.slice(page * size, (page + 1) * size); 
        return Result.success({ 
            content: paged, 
            pageable: { pageNumber: page, pageSize: size, offset: page * size, paged: true, unpaged: false, sort: { sorted: false, unsorted: true, empty: true } }, 
            last: (page + 1) * size >= items.length, 
            totalPages: Math.ceil(items.length / size), 
            totalElements: items.length, 
            size, 
            number: page, 
            first: page === 0, 
            numberOfElements: paged.length, 
            empty: paged.length === 0, 
            sort: { sorted: false, unsorted: true, empty: true } 
        }); 
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
