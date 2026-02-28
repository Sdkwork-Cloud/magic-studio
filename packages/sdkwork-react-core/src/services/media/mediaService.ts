
import { vfs } from '@sdkwork/react-fs';
import { pathUtils } from '@sdkwork/react-commons';
import { platform } from '../../platform';
import { thumbnailGenerator } from './thumbnailGenerator';
import { storageConfig } from '@sdkwork/react-fs';
;
import { downloadService } from './downloadService';
import { AnyMediaResource } from '@sdkwork/react-commons';
import { logger } from '@sdkwork/react-commons';

declare global {
    interface Window {
        webkitAudioContext?: new (options?: AudioContextOptions) => AudioContext;
    }
}

class MediaService {
    private initPromise: Promise<void> | null = null;
    private memoryCache: Map<string, string> = new Map();
    private pendingRequests: Map<string, Promise<string | null>> = new Map();
    
    private waveformCache = new Map<string, Float32Array>();
    private pendingWaveforms = new Map<string, Promise<Float32Array | null>>();
    
    constructor() {
    }

    async initialize() {
        if (this.initPromise) return this.initPromise;
        this.initPromise = (async () => {
            const root = await platform.getPath('documents');
            try { await vfs.createDir(pathUtils.join(root, storageConfig.globalCache.root)); } catch {}
            try { await vfs.createDir(pathUtils.join(root, storageConfig.globalCache.thumbnails)); } catch {}
            try { await vfs.createDir(pathUtils.join(root, storageConfig.globalCache.waveforms)); } catch {}
            try { await vfs.createDir(pathUtils.join(root, storageConfig.globalCache.temp)); } catch {}
        })();
        return this.initPromise;
    }

    async getVideoThumbnail(resourceId: string, sourceUrl: string, time: number): Promise<string | null> {
        // Validation: If URL is empty or unresolved assets path without handling, we can't generate
        if (!sourceUrl || (sourceUrl.startsWith('assets://') && platform.getPlatform() === 'web')) {
             // For web, if it's still virtual, try to resolve it first
             if (sourceUrl.startsWith('assets://')) {
                  // Fallthrough to attempt resolve inside task
             } else {
                  return null;
             }
        }

        await this.initialize();
        
        // Quantize time to 0.1s (10fps) for better cache hits vs visual accuracy balance
        // Previous 0.5s was too coarse for zooming
        const timeKey = Math.floor(time * 10) / 10; 
        
        const cacheFilename = `${this.hashString(resourceId)}_${timeKey}.jpg`;
        const root = await platform.getPath('documents');
        const vfsPath = pathUtils.join(root, storageConfig.globalCache.thumbnails, cacheFilename);
        const cacheKey = `thumb:${vfsPath}`;

        if (this.memoryCache.has(cacheKey)) return this.memoryCache.get(cacheKey)!;
        if (this.pendingRequests.has(cacheKey)) return this.pendingRequests.get(cacheKey)!;

        const task = (async () => {
            // Check VFS Cache
            try {
                const stats = await vfs.stat(vfsPath);
                if (stats.size > 0) {
                    const data = await vfs.readFileBinary(vfsPath);
                    const blob = new Blob([new Uint8Array(data)], { type: 'image/jpeg' });
                    const url = URL.createObjectURL(blob);
                    this.memoryCache.set(cacheKey, url);
                    return url;
                }
            } catch (e) {
                logger.warn('[MediaService] VFS cache check failed', e);
            }

            // Generate
            try {
                // Ensure the sourceURL is resolvable/fetchable
                let usableUrl = sourceUrl;
                // Stub: Unified resolution call - to be implemented with actual assetService
                // const resolved = await assetService.resolveAssetUrl({ url: sourceUrl, path: sourceUrl.startsWith('assets://') ? sourceUrl : undefined });
                const resolved = sourceUrl; // Pass through for now
                if (resolved) usableUrl = resolved;

                if (!usableUrl) return null;

                const blob = await thumbnailGenerator.extractVideoFrame(usableUrl, time);
                if (blob) {
                    const buffer = await blob.arrayBuffer();
                    const uint8 = new Uint8Array(buffer);
                    vfs.writeFileBinary(vfsPath, uint8).catch(() => {});
                    const url = URL.createObjectURL(blob);
                    this.memoryCache.set(cacheKey, url);
                    return url;
                }
            } catch (e) {
                // console.warn(`[MediaService] Thumbnail generation error for ${resourceId}:`, e);
            }
            return null;
        })();

        this.pendingRequests.set(cacheKey, task);
        return task.finally(() => this.pendingRequests.delete(cacheKey));
    }

    async getAudioWaveform(resource: AnyMediaResource): Promise<Float32Array | null> {
        const resourceId = resource.id;
        
        if (this.waveformCache.has(resourceId)) return this.waveformCache.get(resourceId)!;
        if (this.pendingWaveforms.has(resourceId)) return this.pendingWaveforms.get(resourceId)!;
        
        const task = (async () => {
            try {
                // 1. Resolve resource to a concrete, readable source (URL or VFS path)
                const plat = platform.getPlatform();

                // On Web, hydrate virtual assets (assets://) into VFS/blob URLs
                if (plat === 'web' && resource.path?.startsWith('assets://')) {
                    await downloadService.hydrateState(resource);
                }

                let url = resource.path || resource.url;
                if (!url) {
                    return null;
                }

                let fetchUrl: string | null = null;
                let vfsPath: string | null = null;

                // Normalize virtual asset protocol
                if (url.startsWith('assets://')) {
                    url = url.replace('assets://', '');
                }

                if (url.startsWith('blob:') || url.startsWith('http') || url.startsWith('https://asset.localhost')) {
                    fetchUrl = url;
                } else if (url.startsWith('asset:')) {
                    // Older asset protocol â€?strip prefix and treat as VFS path
                    vfsPath = url.replace(/^asset:\/\//, '');
                } else if (plat === 'desktop') {
                    // Desktop: local filesystem path, convert to fetchable URL
                    fetchUrl = platform.convertFileSrc(url);
                } else {
                    // Web + plain path -> VFS
                    vfsPath = url;
                }

                let arrayBuffer: ArrayBuffer;

                if (fetchUrl) {
                    const response = await fetch(fetchUrl);
                    if (!response.ok) throw new Error(`HTTP Error ${response.status} for URL: ${fetchUrl}`);
                    arrayBuffer = await response.arrayBuffer();
                } else if (vfsPath) {
                    const data = await vfs.readFileBinary(vfsPath);
                    arrayBuffer = new Uint8Array(data).buffer as ArrayBuffer;
                } else {
                    return null;
                }
                
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
                const channelData = audioBuffer.getChannelData(0);
                
                // Direct main thread computation
                const peaks = this.computeWaveform(channelData, audioBuffer.sampleRate, 100);
                
                this.waveformCache.set(resourceId, peaks);
                audioContext.close();
                return peaks;

            } catch (e) {
                // console.error(`[MediaService] Waveform generation failed for ${resource.name}`, e);
                return null;
            }
        })();
        
        this.pendingWaveforms.set(resourceId, task);
        return task.finally(() => this.pendingWaveforms.delete(resourceId));
    }

    private computeWaveform(channelData: Float32Array, sampleRate: number, peaksPerSec: number): Float32Array {
        const duration = channelData.length / sampleRate;
        const totalPeaks = Math.ceil(duration * peaksPerSec);
        const blockSize = Math.floor(sampleRate / peaksPerSec);
        const peaks = new Float32Array(totalPeaks);
        
        for (let i = 0; i < totalPeaks; i++) {
            const start = i * blockSize;
            const end = Math.min(start + blockSize, channelData.length);
            let sum = 0;
            let count = 0;
            // Downsample for speed
            for (let j = start; j < end; j += 10) {
                const val = channelData[j];
                sum += val * val;
                count++;
            }
            const rms = count > 0 ? Math.sqrt(sum / count) : 0;
            peaks[i] = Math.min(1.0, rms * 3.0);
        }
        return peaks;
    }

    public cleanupSession() {
        this.memoryCache.forEach((url) => {
            if (url.startsWith('blob:')) URL.revokeObjectURL(url);
        });
        this.memoryCache.clear();
        this.waveformCache.clear();
    }

    private hashString(str: string | null | undefined): string {
        const s = String(str ?? '');
        if (s.length === 0) return '0';

        let hash = 0;
        for (let i = 0; i < s.length; i++) {
            const char = s.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash |= 0;
        }
        return Math.abs(hash).toString(16);
    }
}

export const mediaService = new MediaService();
