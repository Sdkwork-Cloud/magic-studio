
import { platform } from '../../platform';
import { logger } from 'sdkwork-react-commons';

export interface MediaDimensions {
    width: number;
    height: number;
    ratio: number;
    label: string; // e.g. "16:9"
}

class AspectRatioService {
    
    /**
     * Calculate the Greatest Common Divisor
     */
    private gcd(a: number, b: number): number {
        return b === 0 ? a : this.gcd(b, a % b);
    }

    /**
     * Get a human-readable aspect ratio string (e.g., "16:9")
     * If it's a non-standard ratio, it approximates or returns simple division.
     */
    public calculateLabel(width: number, height: number): string {
        if (!width || !height) return '16:9'; // Default
        
        // Handle common floating point quirks or slight off-pixels
        const w = Math.round(width);
        const h = Math.round(height);

        const divisor = this.gcd(w, h);
        const ratioW = w / divisor;
        const ratioH = h / divisor;

        // Check against common standards with tolerance
        const ratio = w / h;
        if (Math.abs(ratio - 16/9) < 0.02) return '16:9';
        if (Math.abs(ratio - 9/16) < 0.02) return '9:16';
        if (Math.abs(ratio - 4/3) < 0.02) return '4:3';
        if (Math.abs(ratio - 3/4) < 0.02) return '3:4';
        if (Math.abs(ratio - 1) < 0.02) return '1:1';
        if (Math.abs(ratio - 21/9) < 0.02) return '21:9';

        // Return exact simplified ratio if not standard
        return `${ratioW}:${ratioH}`;
    }

    public getCssRatio(label: string): number {
        const [w, h] = label.split(':').map(Number);
        if (isNaN(w) || isNaN(h) || h === 0) return 16/9;
        return w / h;
    }

    /**
     * Extract dimensions from a video URL or File
     */
    public async getVideoMetadata(source: string | File): Promise<MediaDimensions> {
        return new Promise((resolve, reject) => {
            const video = document.createElement('video');
            video.preload = 'metadata';
            
            let url = '';
            if (source instanceof File) {
                url = URL.createObjectURL(source);
            } else {
                url = source;
                // Handle Tauri paths
                if (platform.getPlatform() === 'desktop' && !url.startsWith('http') && !url.startsWith('blob:') && !url.startsWith('data:')) {
                    try { url = platform.convertFileSrc(url); } catch(e) {
                        logger.warn('[AspectRatioService] convertFileSrc failed', e);
                    }
                }
            }

            video.onloadedmetadata = () => {
                const width = video.videoWidth;
                const height = video.videoHeight;
                const label = this.calculateLabel(width, height);
                
                // Cleanup blob if created
                if (source instanceof File) URL.revokeObjectURL(url);
                
                resolve({
                    width,
                    height,
                    ratio: width / height,
                    label
                });
            };

            video.onerror = () => {
                if (source instanceof File) URL.revokeObjectURL(url);
                reject(new Error("Failed to load video metadata"));
            };

            video.src = url;
        });
    }

    /**
     * Extract dimensions from an image URL or File
     */
    public async getImageMetadata(source: string | File): Promise<MediaDimensions> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            
            let url = '';
            if (source instanceof File) {
                url = URL.createObjectURL(source);
            } else {
                url = source;
                // Handle Tauri paths
                if (platform.getPlatform() === 'desktop' && !url.startsWith('http') && !url.startsWith('blob:') && !url.startsWith('data:')) {
                    try { url = platform.convertFileSrc(url); } catch(e) {
                        logger.warn('[AspectRatioService] convertFileSrc failed', e);
                    }
                }
            }

            img.onload = () => {
                const width = img.naturalWidth;
                const height = img.naturalHeight;
                const label = this.calculateLabel(width, height);

                if (source instanceof File) URL.revokeObjectURL(url);

                resolve({
                    width,
                    height,
                    ratio: width / height,
                    label
                });
            };

            img.onerror = () => {
                if (source instanceof File) URL.revokeObjectURL(url);
                reject(new Error("Failed to load image metadata"));
            };

            img.src = url;
        });
    }
}

export const aspectRatioService = new AspectRatioService();
