import {
    isExplicitLocalAssetLocator,
    isManagedAssetLocator,
} from '@sdkwork/magic-studio-assets/asset-center';
import { vfs } from '@sdkwork/magic-studio-fs';
import { pathUtils } from '@sdkwork/magic-studio-commons/utils/helpers';
import { getPlatformRuntime } from '@sdkwork/magic-studio-core/platform';
import { resolveRuntimeMagicStudioRootLayout } from '@sdkwork/magic-studio-core/storage';
import { resolveAssetUrlByAssetIdFirst } from '../utils/assetUrlResolver';

/**
 * Service responsible for creating local, seekable proxies of remote assets.
 * This ensures that "skimming" (hover-scrub) is buttery smooth by removing network latency.
 * 
 * STANDARD: Now respects assets:// protocol to avoid re-caching already local files.
 */
class AssetCacheService {
    private cacheMap = new Map<string, string>(); // url -> blobUrl
    private pendingDownloads = new Map<string, Promise<string>>();

    /**
     * Synchronously check if a URL is currently cached in memory
     */
    has(url: string): boolean {
        return this.cacheMap.has(url);
    }

    /**
     * Get cached blob URL if available
     */
    getCached(url: string): string | undefined {
        return this.cacheMap.get(url);
    }

    /**
     * Ensures the asset is available locally.
     * Supports progress callback.
     */
    async ensureLocal(
        url: string, 
        id: string, 
        onProgress?: (percent: number) => void
    ): Promise<string> {
        if (!url) return '';
        
        // 0. Optimization: If already local/virtual/blob, resolve directly without caching
        // This connects the Cache layer to the Standard Asset layer.
        if (isManagedAssetLocator(url) || isExplicitLocalAssetLocator(url) || url.startsWith('blob:') || url.startsWith('data:')) {
            onProgress?.(100);
            return resolveAssetUrlByAssetIdFirst(url);
        }
        
        // 1. Memory Cache Hit
        if (this.cacheMap.has(url)) {
            onProgress?.(100);
            return this.cacheMap.get(url)!;
        }

        // 2. Check inflight
        if (this.pendingDownloads.has(url)) {
            return this.pendingDownloads.get(url)!;
        }

        // 3. Start Download Task (Only for actual remote HTTP URLs)
        const task = this.downloadAndCache(url, id, onProgress);
        this.pendingDownloads.set(url, task);
        
        try {
            const result = await task;
            this.cacheMap.set(url, result);
            return result;
        } catch (e) {
            console.error("[AssetCache] Failed to cache:", e);
            throw e;
        } finally {
            this.pendingDownloads.delete(url);
        }
    }

    private async downloadAndCache(
        url: string, 
        id: string,
        onProgress?: (percent: number) => void
    ): Promise<string> {
        const runtime = getPlatformRuntime();
        // Construct cache path
        const rootLayout = await resolveRuntimeMagicStudioRootLayout(runtime);
        
        // Determine extension
        let ext = url.split('.').pop()?.split('?')[0] || 'bin';
        if (ext.length > 4) ext = 'bin'; 
        
        const filename = `${id}.${ext}`;
        const cachePath = pathUtils.join(rootLayout.systemTempRoot, filename);
        const mimeType = this.getMimeType(ext);

        // A. Check VFS (Disk Cache)
        try {
            const stats = await vfs.stat(cachePath);
            if (stats.size > 0) {
                // Disk Hit: Load into memory
                onProgress?.(100);
                const data = await vfs.readFileBinary(cachePath);
                return this.createBlobUrl(data, mimeType);
            }
        } catch (_e) {
            // Not found, proceed to download
        }

        // B. Network Download with Progress
        // Use runtime network capability so browser-hosted and desktop hosts share one access path.
        const response = await runtime.network.request(url, { method: 'GET' });
        if (!response.ok) throw new Error(`HTTP error ${response.status}`);
        
        const contentLength = response.headers.get('content-length');
        const total = contentLength ? parseInt(contentLength, 10) : 0;
        
        if (!response.body) throw new Error("ReadableStream not supported");

        const reader = response.body.getReader();
        const chunks: Uint8Array[] = [];
        let receivedLength = 0;

        while(true) {
            const { done, value } = await reader.read();
            
            if (done) break;
            
            if (value) {
                chunks.push(value);
                receivedLength += value.length;
                
                if (total > 0 && onProgress) {
                    // Update progress
                    onProgress((receivedLength / total) * 100);
                }
            }
        }

        // Combine chunks
        const combined = new Uint8Array(receivedLength);
        let offset = 0;
        for (const chunk of chunks) {
            combined.set(chunk, offset);
            offset += chunk.length;
        }

        // C. Write to VFS (Fire and forget write)
        const dir = pathUtils.dirname(cachePath);
        try {
            await vfs.createDir(dir);
        } catch (_e) {
            // Cache directory may already exist.
        }
        
        // We write asynchronously to not block UI updates
        vfs.writeFileBinary(cachePath, combined).catch(err => console.warn("[AssetCacheService] Cache write failed", err));

        return this.createBlobUrl(combined, mimeType);
    }

    private createBlobUrl(data: Uint8Array, mimeType: string): string {
        const blob = new Blob([data] as any, { type: mimeType });
        return URL.createObjectURL(blob);
    }

    private getMimeType(ext: string): string {
        const map: Record<string, string> = {
            'mp4': 'video/mp4', 'webm': 'video/webm', 'mov': 'video/quicktime',
            'jpg': 'image/jpeg', 'png': 'image/png', 'gif': 'image/gif', 'webp': 'image/webp',
            'mp3': 'audio/mpeg', 'wav': 'audio/wav', 'ogg': 'audio/ogg'
        };
        return map[ext.toLowerCase()] || 'application/octet-stream';
    }
}

export const assetCacheService = new AssetCacheService();

