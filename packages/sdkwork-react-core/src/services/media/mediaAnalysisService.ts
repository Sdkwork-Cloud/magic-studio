// Stub types - to be replaced with actual sdkwork-react-assets types
type AssetType = 'image' | 'video' | 'audio' | 'music' | 'voice' | 'speech' | 'file';

interface AssetMetadata {
    type: string;
    size?: number;
    duration?: number;
    width?: number;
    height?: number;
    format?: string;
}

;

export interface MediaAnalysisResult {
    metadata: Partial<AssetMetadata>;
    thumbnailBlob?: Blob;
}

/**
 * Service for deep analysis of media files via DOM APIs.
 * Handles Duration, Dimensions, and Smart Thumbnail generation.
 * Optimized to minimize DOM thrashing.
 */
class MediaAnalysisService {

    /**
     * Analyze media from a viewable URL (Blob or Asset Protocol).
     * @param url - The renderable URL of the media (must NOT be assets://)
     * @param type - The type of asset
     */
    public async analyze(url: string, type: AssetType): Promise<MediaAnalysisResult> {
        // Safety check: ensure we never pass internal protocol to DOM elements
        if (url.startsWith('assets://')) {
            console.error("[MediaAnalysis] Received raw assets:// URL. This should be resolved before analysis.");
            return { metadata: {} };
        }

        if (type === 'image') {
            return this.analyzeImage(url);
        } else if (type === 'video') {
            return this.analyzeVideo(url);
        } else if (type === 'audio' || type === 'music' || type === 'voice' || type === 'speech') {
            return this.analyzeAudio(url);
        }

        return { metadata: {} };
    }

    private async analyzeImage(url: string): Promise<MediaAnalysisResult> {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                resolve({
                    metadata: {
                        width: img.naturalWidth,
                        height: img.naturalHeight,
                        duration: 0
                    }
                });
            };
            img.onerror = () => {
                console.warn(`[MediaAnalysis] Failed to load image: ${url}`);
                resolve({ metadata: {} });
            };
            img.src = url;
        });
    }

    private async analyzeAudio(url: string): Promise<MediaAnalysisResult> {
        return new Promise((resolve) => {
            const audio = document.createElement('audio');
            audio.preload = 'metadata';
            
            const onLoaded = () => {
                const duration = audio.duration;
                if (!isFinite(duration)) {
                    resolve({ metadata: {} });
                    return;
                }
                resolve({
                    metadata: { duration }
                });
            };

            audio.onloadedmetadata = onLoaded;
            audio.onerror = () => {
                 console.warn(`[MediaAnalysis] Failed to load audio metadata: ${url}`);
                 resolve({ metadata: {} });
            };
            
            setTimeout(() => {
                if (audio.readyState === 0) resolve({ metadata: {} });
            }, 5000);

            audio.src = url;
        });
    }

    /**
     * Smart Video Analysis (Optimized)
     * 1. Loads video once.
     * 2. Extracts Metadata.
     * 3. Seeks sequentially to find a non-black frame for thumbnail.
     */
    private async analyzeVideo(url: string): Promise<MediaAnalysisResult> {
        return new Promise((resolve) => {
            const video = document.createElement('video');
            video.preload = 'auto'; // Need data for frame extraction
            video.muted = true;
            video.playsInline = true;
            video.crossOrigin = "anonymous"; // Essential for canvas extraction
            
            // Hidden but attached for better browser compatibility
            video.style.position = 'fixed';
            video.style.top = '-9999px';
            video.style.left = '-9999px';
            video.style.width = '1px';
            video.style.height = '1px';
            video.style.opacity = '0';
            document.body.appendChild(video);

            let hasResolved = false;

            const cleanup = () => {
                video.removeAttribute('src');
                video.load();
                if (document.body.contains(video)) {
                    document.body.removeChild(video);
                }
            };

            const finish = (result: MediaAnalysisResult) => {
                if (hasResolved) return;
                hasResolved = true;
                cleanup();
                resolve(result);
            };

            const onError = () => {
                const err = video.error;
                console.warn(`[MediaAnalysis] Video error for ${url}:`, err?.code, err?.message);
                finish({ metadata: {} });
            };

            video.onerror = onError;

            // Wait for metadata first
            video.onloadedmetadata = async () => {
                const duration = video.duration;
                const width = video.videoWidth;
                const height = video.videoHeight;

                if (!isFinite(duration) || width === 0 || height === 0) {
                    finish({ metadata: {} });
                    return;
                }

                // --- Smart Thumbnail Extraction ---
                // Scan the first 2 seconds in 0.3s steps to find non-black content
                const candidates: number[] = [];
                const maxSearch = Math.min(duration, 2.0); // Stop after 2s
                
                for (let t = 0.1; t < maxSearch; t += 0.3) {
                    candidates.push(t);
                }
                // Fallback for extremely short videos
                if (candidates.length === 0) candidates.push(Math.min(0.1, duration / 2));

                let bestBlob: Blob | null = null;

                // Sequential check using the SAME video element
                for (const time of candidates) {
                    try {
                        await this.seekTo(video, time);
                        const blob = await this.captureFrame(video);
                        
                        if (blob && await this.isFrameUsable(blob)) {
                            bestBlob = blob;
                            break; // Found good frame
                        }
                        
                        // Fallback: keep first valid capture even if black
                        if (blob && !bestBlob) bestBlob = blob;
                    } catch (e) {
                        // Ignore seek errors, try next
                    }
                }

                finish({
                    metadata: {
                        duration,
                        width,
                        height
                    },
                    thumbnailBlob: bestBlob || undefined
                });
            };

            // Timeout safety - Force cleanup if loading hangs
            setTimeout(() => {
                if (!hasResolved) {
                    console.warn("[MediaAnalysis] Video load timeout");
                    finish({ metadata: {} });
                }
            }, 15000);

            video.src = url;
        });
    }

    /**
     * Helper to seek video and wait for data
     */
    private seekTo(video: HTMLVideoElement, time: number): Promise<void> {
        return new Promise((resolve, reject) => {
            const onSeeked = () => {
                video.removeEventListener('seeked', onSeeked);
                video.removeEventListener('error', onError);
                resolve();
            };
            const onError = () => {
                video.removeEventListener('seeked', onSeeked);
                video.removeEventListener('error', onError);
                reject();
            };
            
            video.addEventListener('seeked', onSeeked);
            video.addEventListener('error', onError);
            video.currentTime = time;
        });
    }

    /**
     * Helper to capture current video frame to Blob
     */
    private captureFrame(video: HTMLVideoElement): Promise<Blob | null> {
        return new Promise((resolve) => {
            try {
                const canvas = document.createElement('canvas');
                // Target width 480px for thumb
                const scale = 480 / video.videoWidth;
                canvas.width = 480;
                canvas.height = Math.floor(video.videoHeight * scale);
                
                const ctx = canvas.getContext('2d');
                if (!ctx) return resolve(null);
                
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.7);
            } catch (e) {
                resolve(null);
            }
        });
    }

    /**
     * Analyzes image brightness/alpha. 
     * Returns false if image is almost completely black or transparent.
     */
    private async isFrameUsable(blob: Blob): Promise<boolean> {
        return new Promise((resolve) => {
            const img = new Image();
            const url = URL.createObjectURL(blob);
            img.onload = () => {
                const canvas = document.createElement('canvas');
                // Downsample for speed check
                canvas.width = 50;
                canvas.height = 50;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    URL.revokeObjectURL(url);
                    return resolve(true); // Assume good if cant check
                }
                
                ctx.drawImage(img, 0, 0, 50, 50);
                const data = ctx.getImageData(0, 0, 50, 50).data;
                
                let brightnessSum = 0;
                let alphaSum = 0;
                const totalPixels = 50 * 50;

                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i];
                    const g = data[i+1];
                    const b = data[i+2];
                    const a = data[i+3];
                    
                    // Simple luminance
                    brightnessSum += (r + g + b) / 3;
                    alphaSum += a;
                }

                const avgBrightness = brightnessSum / totalPixels;
                const avgAlpha = alphaSum / totalPixels;

                URL.revokeObjectURL(url);
                
                // Criteria: Not fully transparent AND not fully black (threshold ~15/255)
                const isUsable = avgAlpha > 10 && avgBrightness > 15;
                resolve(isUsable);
            };
            img.onerror = () => {
                URL.revokeObjectURL(url);
                resolve(true); // Assume good if check fails
            };
            img.src = url;
        });
    }
}

export const mediaAnalysisService = new MediaAnalysisService();
