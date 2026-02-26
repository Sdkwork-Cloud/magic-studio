
import { AnyMediaResource } from '@sdkwork/react-commons';
import { downloadService } from '@sdkwork/react-core';
import { getRobustResourceUrl, isVfsPath } from '../../utils/resourceUtils';


const logger = {
    error: (...args: any[]) => console.error(...args),
    warn: (...args: any[]) => console.warn(...args),
    info: (...args: any[]) => console.info(...args),
};

export class ResourceManager {
    private videoCache = new Map<string, HTMLVideoElement>();
    private videoPlayPromises = new Map<string, Promise<void> | null>();
    private videoCacheAccessOrder: string[] = [];
    private lockedClipIds = new Set<string>();
    
    // Seek Queue (Debounced)
    private pendingSeeks = new Map<string, number>(); // clipId -> targetTime
    private isSeeking = new Map<string, boolean>();
    
    private imageCache = new Map<string, HTMLImageElement>();
    
    // Logic State
    private pendingHydrations = new Set<string>();
    private hiddenContainer: HTMLDivElement;

    // Callbacks
    private onFrameReady?: () => void;

    constructor() {
        this.hiddenContainer = document.createElement('div');
        this.hiddenContainer.style.cssText = "position:fixed;left:-9999px;top:-9999px;width:1px;height:1px;opacity:0.001;pointer-events:none;overflow:hidden;";
        document.body.appendChild(this.hiddenContainer);
    }

    public setRenderCallback(fn: () => void) {
        this.onFrameReady = fn;
    }

    public startFrame(): void {
        // Clear locked clip IDs from previous frame
        this.lockedClipIds.clear();
    }

    public cleanup() {
        this.videoCache.forEach(v => {
            v.pause();
            v.removeAttribute('src');
            v.load();
        });
        this.videoCache.clear();
        this.videoPlayPromises.clear();
        this.pendingSeeks.clear();
        this.isSeeking.clear();
        this.videoCacheAccessOrder = [];
        this.imageCache.clear();
        this.pendingHydrations.clear();
        
        if (this.hiddenContainer && this.hiddenContainer.parentNode) {
            this.hiddenContainer.parentNode.removeChild(this.hiddenContainer);
        }
    }

    public getVideoElement(id: string, url: string): HTMLVideoElement {
        const cached = this.videoCache.get(id);
        if (cached) {
            this.updateVideoAccessOrder(id);
            if (cached.src !== url && url) { 
                cached.src = url; 
                cached.load(); 
            }
            // Force mute ensure (in case browser unmutes for some reason)
            if (!cached.muted) cached.muted = true;
            return cached;
        }
        
        this.evictLRUVideo();
        
        const video = document.createElement('video');
        video.crossOrigin = 'anonymous';
        // CRITICAL: Always mute the video element. Audio is handled by AudioEngine/WebAudio API.
        video.muted = true; 
        video.defaultMuted = true;
        // Set volume to 0 as a double safety measure
        video.volume = 0; 
        
        video.playsInline = true;
        video.preload = 'auto'; 
        video.autoplay = false; 
        
        // Optimize for smoothness
        video.playbackRate = 1.0;

        if (url) video.src = url;
        
        // Notify engine when new data arrives so it can repaint
        const onReady = () => { 
            if (this.onFrameReady) this.onFrameReady(); 
        };
        
        video.addEventListener('seeked', () => {
             this.isSeeking.set(id, false);
             // Check if another seek is pending
             const nextSeek = this.pendingSeeks.get(id);
             if (nextSeek !== undefined) {
                 this.pendingSeeks.delete(id);
                 this.performSeek(video, nextSeek, id);
             } else {
                 onReady();
             }
        });
        
        video.addEventListener('canplay', onReady);
        video.addEventListener('loadeddata', onReady);
        video.addEventListener('loadedmetadata', onReady); 

        this.hiddenContainer.appendChild(video);
        this.videoCache.set(id, video);
        this.videoCacheAccessOrder.push(id);
        
        return video;
    }

    public getImageElement(id: string, url: string): HTMLImageElement {
        if (this.imageCache.has(id)) return this.imageCache.get(id)!;
        
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = url;
        img.onload = () => {
             if (this.onFrameReady) this.onFrameReady();
        };
        this.imageCache.set(id, img);
        return img;
    }

    public resolveResourceUrl(resource: AnyMediaResource): string | null {
        let url = getRobustResourceUrl(resource);

        if (isVfsPath(url) && !this.pendingHydrations.has(resource.id)) {
            const localUrl = downloadService.getLocalUrl(resource.id);
            if (localUrl) {
                return localUrl;
            } else {
                this.pendingHydrations.add(resource.id);
                downloadService.hydrateState(resource).then(success => {
                    if (success) {
                        const newUrl = downloadService.getLocalUrl(resource.id);
                        if (newUrl && this.onFrameReady) this.onFrameReady();
                    }
                }).finally(() => {
                    this.pendingHydrations.delete(resource.id);
                });
                return null;
            }
        }
        return url;
    }

    public syncVideoTime(video: HTMLVideoElement, targetTime: number, isPlaying: boolean, clipId: string, speed: number = 1.0) {
        // Double check mute status during sync to prevent leakage
        if (!video.muted) video.muted = true;
        
        // Ensure playback rate matches clip speed
        if (Math.abs(video.playbackRate - speed) > 0.01) {
            video.playbackRate = speed;
        }
        
        if (isPlaying) {
             // PLAYBACK MODE: Direct sync
             if (video.paused) {
                 const playPromise = video.play();
                 if (playPromise !== undefined) {
                     this.videoPlayPromises.set(clipId, playPromise);
                     playPromise.catch(_e => { /* Ignore auto-play errors */ });
                 }
             }
             
             // Only correct if drift is significant to avoid stutter
             const drift = Math.abs(video.currentTime - targetTime);
             if (drift > 0.4) {
                 // Snap back if we drifted too far
                 try { video.currentTime = targetTime; } catch(e) {
                     logger.warn('[ResourceManager] video.currentTime set failed', e);
                 }
             }
        } else {
             // SCRUBBING MODE: Aggressive Fast Seeking
             if (!video.paused) {
                 const playPromise = this.videoPlayPromises.get(clipId);
                 if (playPromise) {
                     playPromise.then(() => {
                         video.pause();
                         this.videoPlayPromises.delete(clipId);
                     }).catch(() => {});
                 } else {
                     video.pause();
                 }
             }
             
             const seekDiff = Math.abs(video.currentTime - targetTime);
             
             // For scrubbing, we want high responsiveness.
             // If difference is noticeable, seek immediately.
             if (seekDiff > 0.05) {
                 if (this.isSeeking.get(clipId)) {
                     // If already seeking, queue the LATEST target time
                     this.pendingSeeks.set(clipId, targetTime);
                 } else {
                     // Perform immediate seek
                     this.performSeek(video, targetTime, clipId);
                 }
             }
        }
    }
    
    private performSeek(video: HTMLVideoElement, time: number, id: string) {
        this.isSeeking.set(id, true);
        try {
            // Prioritize fastSeek for scrubbing!
            if (video.fastSeek) {
                 video.fastSeek(time);
            } else {
                 video.currentTime = time;
            }
        } catch (e) {
            this.isSeeking.set(id, false);
        }
    }

    public pauseAllVideos(exceptClipIds: Set<string>) {
        this.videoCache.forEach((video, id) => {
            if (!exceptClipIds.has(id) && !video.paused) {
                 video.pause();
                 this.videoPlayPromises.delete(id);
            }
        });
    }

    private updateVideoAccessOrder(id: string) {
        const idx = this.videoCacheAccessOrder.indexOf(id);
        if (idx > -1) this.videoCacheAccessOrder.splice(idx, 1);
        this.videoCacheAccessOrder.push(id);
    }
    
    private evictLRUVideo() {
        if (this.videoCache.size >= 15) {
            const lruId = this.videoCacheAccessOrder.shift();
            if (lruId) {
                const video = this.videoCache.get(lruId);
                if (video) {
                    video.pause();
                    video.removeAttribute('src');
                    video.load();
                    if (video.parentNode) video.parentNode.removeChild(video);
                }
                this.videoCache.delete(lruId);
                this.videoPlayPromises.delete(lruId);
                this.pendingSeeks.delete(lruId);
                this.isSeeking.delete(lruId);
            }
        }
    }
}

