
import { vfs } from '@sdkwork/magic-studio-fs';
import { pathUtils } from '@sdkwork/magic-studio-commons/utils/helpers';
import { getPlatformRuntime, isBrowserHostedRuntimeKind } from '../../platform';
import { thumbnailGenerator } from './thumbnailGenerator';
import {
    isMagicStudioAssetPath,
    isRenderableAssetUrl,
    resolveRuntimeMagicStudioAssetUrl,
    resolveRuntimeMagicStudioRootLayout,
} from '../../storage';
import { downloadService } from './downloadService';
import { logger } from '@sdkwork/magic-studio-commons/utils/logger';
import type { AnyMediaResource } from '@sdkwork/magic-studio-types/media';
import { resolveEntityKey } from '@sdkwork/magic-studio-types/entity';

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

    private getResourceKey(resource: AnyMediaResource): string {
        return resolveEntityKey(resource);
    }

    async initialize() {
        if (this.initPromise) return this.initPromise;
        this.initPromise = (async () => {
            const runtime = getPlatformRuntime();
            const rootLayout = await resolveRuntimeMagicStudioRootLayout(runtime);
            try { await vfs.createDir(rootLayout.systemCacheRoot); } catch {
                // Cache root may already exist.
            }
            try { await vfs.createDir(rootLayout.systemThumbnailCacheDir); } catch {
                // Thumbnail cache may already exist.
            }
            try { await vfs.createDir(rootLayout.systemWaveformsCacheDir); } catch {
                // Waveform cache may already exist.
            }
            try { await vfs.createDir(rootLayout.systemTempRoot); } catch {
                // Temp cache may already exist.
            }
        })();
        return this.initPromise;
    }

    async getVideoThumbnail(resourceId: string, sourceUrl: string, time: number): Promise<string | null> {
        if (!sourceUrl) {
            return null;
        }

        const runtime = getPlatformRuntime();
        await this.initialize();
        
        // Quantize time to 0.1s (10fps) for better cache hits vs visual accuracy balance
        // Previous 0.5s was too coarse for zooming
        const timeKey = Math.floor(time * 10) / 10; 
        
        const cacheFilename = `${this.hashString(resourceId)}_${timeKey}.jpg`;
        const rootLayout = await resolveRuntimeMagicStudioRootLayout(runtime);
        const vfsPath = pathUtils.join(rootLayout.systemThumbnailCacheDir, cacheFilename);
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
                let usableUrl = sourceUrl;
                if (!isRenderableAssetUrl(usableUrl)) {
                    usableUrl = await resolveRuntimeMagicStudioAssetUrl(runtime, usableUrl);
                }

                if (!isRenderableAssetUrl(usableUrl)) return null;

                const blob = await thumbnailGenerator.extractVideoFrame(usableUrl, time);
                if (blob) {
                    const buffer = await blob.arrayBuffer();
                    const uint8 = new Uint8Array(buffer);
                    vfs.writeFileBinary(vfsPath, uint8).catch(() => {});
                    const url = URL.createObjectURL(blob);
                    this.memoryCache.set(cacheKey, url);
                    return url;
                }
            } catch (_e) {
                // console.warn(`[MediaService] Thumbnail generation error for ${resourceId}:`, e);
            }
            return null;
        })();

        this.pendingRequests.set(cacheKey, task);
        return task.finally(() => this.pendingRequests.delete(cacheKey));
    }

    async getAudioWaveform(resource: AnyMediaResource): Promise<Float32Array | null> {
        const resourceId = this.getResourceKey(resource);
        
        if (this.waveformCache.has(resourceId)) return this.waveformCache.get(resourceId)!;
        if (this.pendingWaveforms.has(resourceId)) return this.pendingWaveforms.get(resourceId)!;
        
        const task = (async () => {
            try {
                // Resolve the resource through the canonical runtime asset helpers first.
                const runtime = getPlatformRuntime();
                const runtimeKind = runtime.system.kind();

                if (isBrowserHostedRuntimeKind(runtimeKind) && isMagicStudioAssetPath(resource.path)) {
                    await downloadService.hydrateState(resource);
                }

                let url = resource.path || resource.url;
                if (!url) {
                    return null;
                }

                const localUrl = downloadService.getLocalUrl(resourceId);
                if (localUrl) {
                    url = localUrl;
                }

                let fetchUrl = url;
                if (!isRenderableAssetUrl(fetchUrl)) {
                    fetchUrl = await resolveRuntimeMagicStudioAssetUrl(runtime, fetchUrl);
                }

                if (!isRenderableAssetUrl(fetchUrl)) {
                    return null;
                }

                const response = await fetch(fetchUrl);
                if (!response.ok) throw new Error(`HTTP Error ${response.status} for URL: ${fetchUrl}`);
                const arrayBuffer = await response.arrayBuffer();
                
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
                const channelData = audioBuffer.getChannelData(0);
                
                // Direct main thread computation
                const peaks = this.computeWaveform(channelData, audioBuffer.sampleRate, 100);
                
                this.waveformCache.set(resourceId, peaks);
                audioContext.close();
                return peaks;

            } catch (_e) {
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
