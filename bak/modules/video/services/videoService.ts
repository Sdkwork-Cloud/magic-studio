
import { GoogleGenAI } from "@google/genai";
import { VideoConfig } from '../entities/video.entity';
import { vfs } from '../../fs/vfs';
import { assetService } from '../../assets/services/assetService';

const API_KEY = process.env.API_KEY || '';
const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

// Helper: Convert any source (Path, URL, Base64) to API-ready Base64
const resolveToData = async (source: string): Promise<{ mimeType: string, data: string } | null> => {
    if (!source) return null;

    // 1. Already Base64 Data URI
    const matches = source.match(/^data:(.+);base64,(.+)$/);
    if (matches) {
        return { mimeType: matches[1], data: matches[2] };
    }

    // 2. Virtual Path (assets://) or Absolute Path
    try {
        let buffer: Uint8Array;
        let mimeType = 'image/png'; // Default for video input frames

        if (source.startsWith('http')) {
            const res = await fetch(source);
            const blob = await res.blob();
            buffer = new Uint8Array(await blob.arrayBuffer());
            mimeType = blob.type;
        } else {
            let absPath = source;
            if (source.startsWith('assets://')) {
                absPath = await assetService.toAbsolutePath(source);
            }
            buffer = await vfs.readFileBinary(absPath);
            
            // Extension checks
            if (absPath.endsWith('.jpg') || absPath.endsWith('.jpeg')) mimeType = 'image/jpeg';
            if (absPath.endsWith('.png')) mimeType = 'image/png';
            if (absPath.endsWith('.webp')) mimeType = 'image/webp';
            if (absPath.endsWith('.mp4')) mimeType = 'video/mp4';
        }

        let binary = '';
        const len = buffer.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(buffer[i]);
        }
        return { mimeType, data: btoa(binary) };

    } catch (e) {
        console.warn(`[VideoService] Failed to resolve source: ${source}`, e);
        return null;
    }
};

export const videoService = {
    isConfigured: () => !!ai,

    /**
     * Generate a video using Google Veo models.
     */
    generateVideo: async (config: VideoConfig): Promise<string> => {
        if (!ai) throw new Error("API Key not configured");

        let operation;
        
        // --- 1. Avatar / Digital Human Mode (Mock) ---
        if (config.mode === 'avatar' && config.characterImage) {
            console.log('[VideoService] Generating Digital Human...');
            await new Promise(resolve => setTimeout(resolve, 3000));
            return "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4";
        }
        
        // --- 2. Lip Sync Mode (Mock) ---
        if (config.mode === 'lip-sync' && config.targetVideo && config.driverAudio) {
            console.log('[VideoService] Generating Lip Sync...');
            await new Promise(resolve => setTimeout(resolve, 3000));
            return "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4";
        }

        // --- 3. Multi-Image Reference Mode ---
        if ((config.mode === 'multi-image' || config.mode === 'smart_multi') && config.referenceImages && config.referenceImages.length > 0) {
            const references = await Promise.all(config.referenceImages.map(async (img) => {
                const parsed = await resolveToData(img);
                if (!parsed) return null;
                return {
                    image: {
                        imageBytes: parsed.data,
                        mimeType: parsed.mimeType
                    },
                    referenceType: 'ASSET' as const 
                };
            }));

            const validRefs = references.filter(Boolean) as any[];

            if (validRefs.length === 0) throw new Error("Could not load reference images");

            operation = await ai.models.generateVideos({
                model: 'veo-3.1-generate-preview',
                prompt: config.prompt || "Animate these references",
                config: {
                    numberOfVideos: 1,
                    resolution: '720p',
                    aspectRatio: '16:9'
                }
            });
        }
        // --- 4. Image-to-Video Mode (Start + Optional End) ---
        else if ((config.mode === 'image' || config.mode === 'start_end' || config.mode === 'smart_reference' || config.mode === 'subject_ref') && config.image) {
            const startFrame = await resolveToData(config.image);
            if (!startFrame) throw new Error("Invalid start frame data");

            const request: any = {
                model: config.model,
                prompt: config.prompt || "Animate this image",
                image: {
                    imageBytes: startFrame.data,
                    mimeType: startFrame.mimeType
                },
                config: {
                    numberOfVideos: 1,
                    resolution: config.resolution,
                    aspectRatio: config.aspectRatio
                }
            };

            // Add End Frame if present
            if (config.lastFrame) {
                const endFrame = await resolveToData(config.lastFrame);
                if (endFrame) {
                    request.config.lastFrame = {
                        imageBytes: endFrame.data,
                        mimeType: endFrame.mimeType
                    };
                }
            }

            operation = await ai.models.generateVideos(request);
        }
        // --- 5. Text-to-Video Mode ---
        else {
            operation = await ai.models.generateVideos({
                model: config.model,
                prompt: config.prompt,
                config: {
                    numberOfVideos: 1,
                    resolution: config.resolution,
                    aspectRatio: config.aspectRatio
                }
            });
        }

        // Poll for Completion
        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 5000));
            console.log('[VideoService] Polling operation status...');
            operation = await ai.operations.getVideosOperation({ operation: operation });
        }

        // Extract Result
        const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!videoUri) throw new Error("Video generation failed: No URI returned.");

        // Fetch the actual video bytes
        const res = await fetch(`${videoUri}&key=${API_KEY}`);
        if (!res.ok) throw new Error("Failed to download video bytes");
        
        const blob = await res.blob();
        return URL.createObjectURL(blob);
    }
};
