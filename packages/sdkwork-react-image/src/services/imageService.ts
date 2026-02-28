
import { GoogleGenAI } from "@google/genai";
import { ImageGenerationConfig } from '../entities';
export type GenerationConfig = ImageGenerationConfig;
import { vfs } from '@sdkwork/react-fs';
import { resolveAssetUrlByAssetIdFirst } from '@sdkwork/react-assets';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { platform as _platform } from '@sdkwork/react-core';

const API_KEY = process.env.API_KEY || '';
const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

const resolveToData = async (source: string): Promise<{ mimeType: string, data: string } | null> => {
    if (!source) return null;

    const matches = source.match(/^data:(.+);base64,(.+)$/);
    if (matches) {
        return { mimeType: matches[1], data: matches[2] };
    }

    try {
        let buffer: Uint8Array | null = null;
        let mimeType = 'image/png';

        if (
            source.startsWith('http://') ||
            source.startsWith('https://') ||
            source.startsWith('blob:') ||
            source.startsWith('data:') ||
            source.startsWith('asset:')
        ) {
            const res = await fetch(source);
            const blob = await res.blob();
            buffer = new Uint8Array(await blob.arrayBuffer());
            mimeType = blob.type;
        } else {
            let absPath = source;
            if (source.startsWith('assets://')) {
                const resolved = await resolveAssetUrlByAssetIdFirst(source);
                if (resolved) {
                    const res = await fetch(resolved);
                    const blob = await res.blob();
                    buffer = new Uint8Array(await blob.arrayBuffer());
                    mimeType = blob.type || mimeType;
                    absPath = '';
                } else {
                    return null;
                }
            }

            if (absPath) {
                buffer = await vfs.readFileBinary(absPath);
                
                if (absPath.endsWith('.jpg') || absPath.endsWith('.jpeg')) mimeType = 'image/jpeg';
                if (absPath.endsWith('.png')) mimeType = 'image/png';
                if (absPath.endsWith('.webp')) mimeType = 'image/webp';
            }
        }

        if (!buffer) {
            return null;
        }

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

    generateImage: async (config: GenerationConfig): Promise<string> => {
        if (!ai) throw new Error("API Key not configured");

        const parts: any[] = [];

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

        parts.push({ text: config.prompt });

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

// Adapter types for dependency injection
export interface GenAIAdapter {
    generateImage: (config: any) => Promise<string>;
    enhancePrompt: (prompt: string) => Promise<string>;
}

export interface AssetServiceAdapter {
    saveAsset: (data: any) => Promise<any>;
}

// Adapter setters for testing and mocking (stub implementations)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function setGenAIAdapter(_adapter: GenAIAdapter) {
    // Stub implementation for future use
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function setAssetServiceAdapter(_adapter: AssetServiceAdapter) {
    // Stub implementation for future use
}
