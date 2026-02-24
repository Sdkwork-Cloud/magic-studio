
import { GoogleGenAI } from "@google/genai";
import { GenerationConfig } from '../entities/image.entity';
import { vfs } from '../../fs/vfs';
import { assetService } from '../../assets/services/assetService';
import { platform } from '../../../platform';

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
    // If it's a remote HTTP URL, we fetch it. If it's VFS, we read it.
    try {
        let buffer: Uint8Array;
        let mimeType = 'image/png'; // Default

        if (source.startsWith('http')) {
            const res = await fetch(source);
            const blob = await res.blob();
            buffer = new Uint8Array(await blob.arrayBuffer());
            mimeType = blob.type;
        } else {
            // It's a path. Resolve absolute path first if needed.
            let absPath = source;
            if (source.startsWith('assets://')) {
                absPath = await assetService.toAbsolutePath(source);
            }
            buffer = await vfs.readFileBinary(absPath);
            
            // Simple extension inference if mime unknown
            if (absPath.endsWith('.jpg') || absPath.endsWith('.jpeg')) mimeType = 'image/jpeg';
            if (absPath.endsWith('.png')) mimeType = 'image/png';
            if (absPath.endsWith('.webp')) mimeType = 'image/webp';
        }

        // Convert Buffer to Base64
        let binary = '';
        const len = buffer.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(buffer[i]);
        }
        return { mimeType, data: btoa(binary) };

    } catch (e) {
        console.warn(`[ImageService] Failed to resolve source: ${source}`, e);
        return null;
    }
};

export const imageService = {
    isConfigured: () => !!ai,

    /**
     * Generate an image using Gemini Flash Image model.
     */
    generateImage: async (config: GenerationConfig): Promise<string> => {
        if (!ai) throw new Error("API Key not configured");

        // Construct parts
        const parts: any[] = [];

        // Handle Multiple Reference Images (Priority)
        if (config.referenceImages && config.referenceImages.length > 0) {
            for (const imgPath of config.referenceImages) {
                const data = await resolveToData(imgPath);
                if (data) {
                    parts.push({
                        inlineData: {
                            mimeType: data.mimeType,
                            data: data.data
                        }
                    });
                }
            }
        } 
        // Fallback to Single Reference Image
        else if (config.referenceImage) {
            const data = await resolveToData(config.referenceImage);
            if (data) {
                parts.push({
                    inlineData: {
                        mimeType: data.mimeType,
                        data: data.data
                    }
                });
            }
        }

        // Add Text Prompt
        parts.push({ text: config.prompt });

        // Select model based on complexity (Ref Image requires Pro usually, but Flash Image supports it too)
        const model = 'gemini-2.5-flash-image';

        const response = await ai.models.generateContent({
            model: model,
            contents: { parts },
            config: {
                imageConfig: config.aspectRatio ? {
                    aspectRatio: config.aspectRatio
                } : undefined
            }
        });

        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                return `data:image/png;base64,${part.inlineData.data}`;
            }
        }
        throw new Error("No image generated from API response");
    },

    /**
     * Enhance a simple prompt into a detailed descriptive prompt using a text model.
     */
    enhancePrompt: async (simplePrompt: string): Promise<string> => {
        if (!ai) throw new Error("API Key not configured");

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `You are an expert AI Art Prompter. Rewrite the following user description into a highly detailed, descriptive prompt suitable for an image generation model. 
            Include details about lighting, composition, texture, and mood. Keep it under 100 words. Return ONLY the raw prompt text, no markdown.
            
            User description: "${simplePrompt}"`
        });

        return response.text?.trim() || simplePrompt;
    }
};
