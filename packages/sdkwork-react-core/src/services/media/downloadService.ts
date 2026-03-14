
import { vfs } from '@sdkwork/react-fs';
import { pathUtils } from '@sdkwork/react-commons';
import { getPlatformRuntime } from '../../platform';
import { storageConfig } from '@sdkwork/react-fs';
import { AnyMediaResource } from '@sdkwork/react-commons';
;

export interface DownloadTask {
    url: string;
    resourceId: string;
    progress: number;
    status: 'pending' | 'downloading' | 'completed' | 'error';
    localPath?: string;
    error?: string;
}

class DownloadService {
    private tasks = new Map<string, DownloadTask>();
    private localPathCache = new Map<string, string>(); // resourceId -> Blob URL
    private listeners = new Set<(resourceId: string, progress: number, isComplete: boolean) => void>();
    private initPromise: Promise<void> | null = null;
    
    // Cache map for resolved VFS paths: resourceId -> string (path)
    private vfsPathCache = new Map<string, string>();
    
    // Throttle tracking
    private lastNotifyTime = new Map<string, number>();

    // Guard against re-hydrating the same resource concurrently
    private hydrating = new Set<string>();

    constructor() {}

    private async ensureInit() {
        if (this.initPromise) return this.initPromise;
        this.initPromise = (async () => {
            const runtime = getPlatformRuntime();
            const root = await runtime.system.path('documents');
            const downloadDir = pathUtils.join(root, storageConfig.library.downloads);
            try { await vfs.createDir(downloadDir); } catch {}
        })();
        return this.initPromise;
    }

    /**
     * Checks if a resource is currently available in memory (Blob URL).
     */
    public getLocalUrl(resourceId: string): string | null {
        return this.localPathCache.get(resourceId) || null;
    }

    /**
     * Get the absolute VFS path if the file is downloaded/cached.
     */
    public async getLocalPath(resource: AnyMediaResource): Promise<string | null> {
        // 1. Check memory cache
        if (this.vfsPathCache.has(resource.id)) {
            return this.vfsPathCache.get(resource.id)!;
        }

        // 2. Resolve path logic
        let path = resource.path || resource.localFile?.path;
        if (!path) {
            path = await this.resolveLocalPath(resource);
        } else if (path.startsWith('assets://')) {
            // Stub: assets:// protocol handling - to be implemented with actual assetService
            path = path.replace('assets://', '');
        }
        
        try {
            // 3. Verify existence
            const stats = await vfs.stat(path);
            if (stats.size > 0) {
                this.vfsPathCache.set(resource.id, path);
                return path;
            }
        } catch (e) {
            // Not found
        }
        return null;
    }

    public isDownloading(resourceId: string): boolean {
        const task = this.tasks.get(resourceId);
        return task?.status === 'downloading' || task?.status === 'pending';
    }

    public getProgress(resourceId: string): number {
        return this.tasks.get(resourceId)?.progress || 0;
    }

    public subscribe(listener: (id: string, p: number, c: boolean) => void) {
        this.listeners.add(listener);
        return () => { this.listeners.delete(listener); };
    }

    private notify(id: string, progress: number, complete: boolean) {
        const now = Date.now();
        const last = this.lastNotifyTime.get(id) || 0;
        
        // Throttle progress updates (allow complete/error to pass through instantly)
        if (!complete && progress > 0 && progress < 100 && (now - last < 100)) {
            return;
        }
        
        this.lastNotifyTime.set(id, now);

        // CRITICAL FIX: Force async to break call stack recursion
        // Using setTimeout(..., 0) ensures that the listener (which usually calls setState)
        // runs in the next tick, preventing "Maximum call stack size exceeded".
        setTimeout(() => {
            this.listeners.forEach(cb => {
                try {
                    cb(id, progress, complete);
                } catch (e) {
                    console.error("[DownloadService] Listener error:", e);
                }
            });
        }, 0);
    }

    /**
     * Checks if the file exists on disk. If yes, loads it into memory cache (Blob URL).
     * Does NOT download if missing.
     * @returns true if local file exists and is now cached.
     */
    public async hydrateState(resource: AnyMediaResource): Promise<boolean> {
        // Fast exit if already cached in memory
        if (this.localPathCache.has(resource.id)) return true;
        
        // Guard against parallel hydration attempts for same resource
        if (this.hydrating.has(resource.id)) return false; 
        
        this.hydrating.add(resource.id);

        try {
            await this.ensureInit();
            
            // FIX: Prioritize existing local path if available (e.g. from importAsset)
            // Check 'path' first (new standard), then 'localFile.path' (legacy)
            let localPath = resource.path || resource.localFile?.path;

            // Resolve Virtual Paths (assets://) to Absolute Paths for VFS access
            if (localPath && localPath.startsWith('assets://')) {
                // Stub: assets:// protocol handling - to be implemented with actual assetService
                localPath = localPath.replace('assets://', '');
            }
            
            if (!localPath) {
                localPath = await this.resolveLocalPath(resource);
            }
            
            try {
                const stats = await vfs.stat(localPath);
                if (stats.size > 0) {
                    // Cache the VFS path
                    this.vfsPathCache.set(resource.id, localPath);

                    // For Desktop, we might prefer using asset:// protocol URL directly instead of reading blob
                    // But for consistency and WebGL textures in web mode, Blob is safer fallback
                    
                    if (getPlatformRuntime().system.kind() === 'desktop') {
                        const assetUrl = getPlatformRuntime().fileSystem.convertFileSrc(localPath);
                        this.localPathCache.set(resource.id, assetUrl);
                    } else {
                        // Read into memory to create Blob URL for UI (Web Mode)
                        const data = await vfs.readFileBinary(localPath);
                        
                        // Determine mime type
                        const ext = resource.extension || resource.url?.split('.').pop()?.split('?')[0] || 'bin';
                        const mime = resource.mimeType || this.guessMime(ext);
                        
                        const blobUrl = this.createBlobUrl(data, mime);
                        this.localPathCache.set(resource.id, blobUrl);
                    }
                    
                    // Update resource object if needed (Prefer path over localFile)
                    // Note: We store the virtual path if it was originally virtual, or absolute if not
                    if (!resource.path) resource.path = localPath;
                    
                    // Notify listeners that this resource is ready
                    this.notify(resource.id, 100, true);
                    
                    return true;
                }
            } catch (e) {
                // File not found locally
            }
        } finally {
            this.hydrating.delete(resource.id);
        }
        return false;
    }

    /**
     * Downloads a resource. If already local, returns the Blob URL immediately.
     */
    public async download(resource: AnyMediaResource): Promise<string> {
        if (!resource.url) throw new Error("Resource has no URL");
        
        // 1. Check if we already have it (Memory or Disk)
        if (await this.hydrateState(resource)) {
             return this.localPathCache.get(resource.id)!;
        }

        // 2. Check if already downloading (debounce)
        if (this.tasks.has(resource.id)) {
             return new Promise((resolve, reject) => {
                 // Simple polling for existing task
                 const checkInterval = setInterval(() => {
                     if (this.localPathCache.has(resource.id)) {
                         clearInterval(checkInterval);
                         resolve(this.localPathCache.get(resource.id)!);
                     } else if (!this.tasks.has(resource.id)) {
                         clearInterval(checkInterval);
                         reject(new Error("Download failed or cancelled"));
                     }
                 }, 500);
             });
        }

        // 3. Initialize Task
        this.tasks.set(resource.id, {
            url: resource.url,
            resourceId: resource.id,
            progress: 0,
            status: 'pending'
        });

        const localPath = await this.resolveLocalPath(resource);

        try {
            const task = this.tasks.get(resource.id);
            if (task) task.status = 'downloading';
            
            this.notify(resource.id, 0, false);

            const response = await fetch(resource.url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const contentLength = Number(response.headers.get('content-length')) || 0;
            const reader = response.body?.getReader();
            
            if (!reader) throw new Error("ReadableStream not supported");

            const chunks: Uint8Array[] = [];
            let received = 0;

            while(true) {
                const { done, value } = await reader.read();
                if (done) break;
                if (value) {
                    chunks.push(value);
                    received += value.length;
                    const percent = contentLength ? (received / contentLength) * 100 : 0;
                    
                    const t = this.tasks.get(resource.id);
                    if (t) {
                        t.progress = percent;
                        this.notify(resource.id, percent, false);
                    }
                }
            }

            const combined = new Uint8Array(received);
            let offset = 0;
            for(const c of chunks) {
                combined.set(c, offset);
                offset += c.length;
            }

            // Save to Disk
            await vfs.writeFileBinary(localPath, combined);
            this.vfsPathCache.set(resource.id, localPath);

            // Create Blob (Web) or Use Path (Desktop)
            const ext = resource.extension || resource.url.split('.').pop()?.split('?')[0] || 'bin';
            
            let finalUrl = '';
            if (getPlatformRuntime().system.kind() === 'desktop') {
                finalUrl = getPlatformRuntime().fileSystem.convertFileSrc(localPath);
            } else {
                const blobUrl = this.createBlobUrl(combined, resource.mimeType || this.guessMime(ext));
                finalUrl = blobUrl;
            }
            
            this.localPathCache.set(resource.id, finalUrl);
            
            // Set Path property
            resource.path = localPath;
            // Clean up legacy
            if (resource.localFile) resource.localFile = undefined;

            this.tasks.delete(resource.id);
            this.notify(resource.id, 100, true); 

            return finalUrl;

        } catch (e: any) {
            const t = this.tasks.get(resource.id);
            if (t) {
                t.status = 'error';
                t.error = e.message;
            }
            this.tasks.delete(resource.id);
            this.notify(resource.id, 0, true);
            throw e;
        }
    }

    private async resolveLocalPath(resource: AnyMediaResource): Promise<string> {
        await this.ensureInit();
        const root = await getPlatformRuntime().system.path('documents');
        const ext = resource.extension || resource.url?.split('.').pop()?.split('?')[0] || 'bin';
        const filename = `${resource.id}.${ext}`;
        return pathUtils.join(root, storageConfig.library.downloads, filename);
    }

    private createBlobUrl(data: Uint8Array, mime: string) {
        const blob = new Blob([data] as any, { type: mime });
        return URL.createObjectURL(blob);
    }

    private guessMime(ext: string) {
         const map: any = { 'mp4': 'video/mp4', 'png': 'image/png', 'jpg': 'image/jpeg', 'mp3': 'audio/mpeg' };
         return map[ext.replace('.', '').toLowerCase()] || 'application/octet-stream';
    }
}

export const downloadService = new DownloadService();
