
import { vfs } from '@sdkwork/magic-studio-fs';
import { pathUtils } from '@sdkwork/magic-studio-commons/utils/helpers';
import { getPlatformRuntime } from '../../platform';
import {
    isMagicStudioAssetPath,
    listMagicStudioSystemLibraryDirs,
    resolveMagicStudioSystemLibraryAbsoluteDir,
    resolveRuntimeMagicStudioAssetAbsolutePath,
    resolveRuntimeMagicStudioAssetUrl,
    resolveRuntimeMagicStudioRootLayout,
} from '../../storage';
import type { AnyMediaResource } from '@sdkwork/magic-studio-types/media';
import { resolveEntityKey } from '@sdkwork/magic-studio-types/entity';

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

    private getResourceKey(resource: AnyMediaResource): string {
        return resolveEntityKey(resource);
    }

    private toFileSafeKey(value: string): string {
        return value.replace(/[^a-zA-Z0-9._-]+/g, '_');
    }

    private async ensureInit() {
        if (this.initPromise) return this.initPromise;
        this.initPromise = (async () => {
            const runtime = getPlatformRuntime();
            const rootLayout = await resolveRuntimeMagicStudioRootLayout(runtime);
            for (const dir of [rootLayout.systemLibraryRoot, ...listMagicStudioSystemLibraryDirs(rootLayout)]) {
                try {
                    await vfs.createDir(dir);
                } catch {
                    // Directory may already exist.
                }
            }
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
        const resourceKey = this.getResourceKey(resource);
        // 1. Check memory cache
        if (this.vfsPathCache.has(resourceKey)) {
            return this.vfsPathCache.get(resourceKey)!;
        }

        // 2. Resolve path logic
        let path = resource.path || resource.localFile?.path;
        if (!path) {
            path = await this.resolveLocalPath(resource);
        } else if (isMagicStudioAssetPath(path)) {
            path = await resolveRuntimeMagicStudioAssetAbsolutePath(getPlatformRuntime(), path);
        }
        
        try {
            // 3. Verify existence
            const stats = await vfs.stat(path);
            if (stats.size > 0) {
                this.vfsPathCache.set(resourceKey, path);
                return path;
            }
        } catch (_e) {
            // Not found.
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
        const resourceKey = this.getResourceKey(resource);
        // Fast exit if already cached in memory
        if (this.localPathCache.has(resourceKey)) return true;
        
        // Guard against parallel hydration attempts for same resource
        if (this.hydrating.has(resourceKey)) return false;
        
        this.hydrating.add(resourceKey);

        try {
            await this.ensureInit();
            
            // FIX: Prioritize existing local path if available (e.g. from importAsset)
            // Check 'path' first (new standard), then 'localFile.path' (legacy)
            let localPath = resource.path || resource.localFile?.path;

            // Resolve Virtual Paths (assets://) to Absolute Paths for VFS access
            if (localPath && isMagicStudioAssetPath(localPath)) {
                localPath = await resolveRuntimeMagicStudioAssetAbsolutePath(getPlatformRuntime(), localPath);
            }
            
            if (!localPath) {
                localPath = await this.resolveLocalPath(resource);
            }
            
            try {
                const stats = await vfs.stat(localPath);
                if (stats.size > 0) {
                    // Cache the VFS path
                    this.vfsPathCache.set(resourceKey, localPath);

                    // For Desktop, we might prefer using asset:// protocol URL directly instead of reading blob
                    // But for consistency and WebGL textures in web mode, Blob is safer fallback
                    const resolvedUrl = await resolveRuntimeMagicStudioAssetUrl(
                        getPlatformRuntime(),
                        localPath
                    );
                    this.localPathCache.set(resourceKey, resolvedUrl);
                    
                    // Update resource object if needed (Prefer path over localFile)
                    // Note: We store the virtual path if it was originally virtual, or absolute if not
                    if (!resource.path) resource.path = localPath;
                    
                    // Notify listeners that this resource is ready
                    this.notify(resourceKey, 100, true);
                    
                    return true;
                }
            } catch (_e) {
                // File not found locally.
            }
        } finally {
            this.hydrating.delete(resourceKey);
        }
        return false;
    }

    /**
     * Downloads a resource. If already local, returns the Blob URL immediately.
     */
    public async download(resource: AnyMediaResource): Promise<string> {
        if (!resource.url) throw new Error("Resource has no URL");
        const resourceKey = this.getResourceKey(resource);
        
        // 1. Check if we already have it (Memory or Disk)
        if (await this.hydrateState(resource)) {
             return this.localPathCache.get(resourceKey)!;
        }

        // 2. Check if already downloading (debounce)
        if (this.tasks.has(resourceKey)) {
             return new Promise((resolve, reject) => {
                 // Simple polling for existing task
                 const checkInterval = setInterval(() => {
                     if (this.localPathCache.has(resourceKey)) {
                         clearInterval(checkInterval);
                         resolve(this.localPathCache.get(resourceKey)!);
                     } else if (!this.tasks.has(resourceKey)) {
                         clearInterval(checkInterval);
                         reject(new Error("Download failed or cancelled"));
                     }
                 }, 500);
             });
        }

        // 3. Initialize Task
        this.tasks.set(resourceKey, {
            url: resource.url,
            resourceId: resourceKey,
            progress: 0,
            status: 'pending'
        });

        const localPath = await this.resolveLocalPath(resource);

        try {
            const task = this.tasks.get(resourceKey);
            if (task) task.status = 'downloading';
            
            this.notify(resourceKey, 0, false);

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
                    
                    const t = this.tasks.get(resourceKey);
                    if (t) {
                        t.progress = percent;
                        this.notify(resourceKey, percent, false);
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
            this.vfsPathCache.set(resourceKey, localPath);

            // Create Blob (Web) or Use Path (Desktop)
            let finalUrl = '';
            finalUrl = await resolveRuntimeMagicStudioAssetUrl(getPlatformRuntime(), localPath);
            
            this.localPathCache.set(resourceKey, finalUrl);
            
            // Set Path property
            resource.path = localPath;
            // Clean up legacy
            if (resource.localFile) resource.localFile = undefined;

            this.tasks.delete(resourceKey);
            this.notify(resourceKey, 100, true);

            return finalUrl;

        } catch (e: any) {
            const t = this.tasks.get(resourceKey);
            if (t) {
                t.status = 'error';
                t.error = e.message;
            }
            this.tasks.delete(resourceKey);
            this.notify(resourceKey, 0, true);
            throw e;
        }
    }

    private async resolveLocalPath(resource: AnyMediaResource): Promise<string> {
        await this.ensureInit();
        const runtime = getPlatformRuntime();
        const rootLayout = await resolveRuntimeMagicStudioRootLayout(runtime);
        const resourceKey = this.getResourceKey(resource);
        const ext = (resource.extension || resource.url?.split('.').pop()?.split('?')[0] || 'bin')
            .replace(/^\./, '') || 'bin';
        const filename = `${this.toFileSafeKey(resourceKey)}.${ext}`;
        const targetDir = resolveMagicStudioSystemLibraryAbsoluteDir(rootLayout, resource.type || 'file');
        return pathUtils.join(targetDir, filename);
    }

}

export const downloadService = new DownloadService();
