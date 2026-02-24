
export type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';

export interface ImageStyle {
    id: string;
    label: string;
    promptModifier: string; // Text appended to prompt
    previewColor: string;
}

export const IMAGE_STYLES: ImageStyle[] = [
    { id: 'none', label: 'None', promptModifier: '', previewColor: '#333' },
    { id: 'photo', label: 'Photorealistic', promptModifier: ', highly detailed, photorealistic, 8k, cinematic lighting, photography', previewColor: '#10b981' },
    { id: 'anime', label: 'Anime', promptModifier: ', anime style, studio ghibli, vibrant colors, cel shaded', previewColor: '#f472b6' },
    { id: 'digital', label: 'Digital Art', promptModifier: ', digital art, concept art, trending on artstation, highly detailed', previewColor: '#60a5fa' },
    { id: '3d', label: '3D Render', promptModifier: ', 3d render, blender, unreal engine 5, octane render, iso', previewColor: '#a78bfa' },
    { id: 'cyberpunk', label: 'Cyberpunk', promptModifier: ', cyberpunk, neon lights, futuristic, high contrast, sci-fi', previewColor: '#facc15' },
    { id: 'oil', label: 'Oil Painting', promptModifier: ', oil painting, textured, classic art style, impressionism', previewColor: '#fb923c' },
    { id: 'vector', label: 'Vector', promptModifier: ', vector art, flat design, illustrator, minimal, clean lines', previewColor: '#f87171' },
];

export interface GenerationConfig {
    prompt: string;
    styleId: string;
    aspectRatio: AspectRatio;
    referenceImage?: string; // Base64
}

export interface GeneratedImage {
    id: string;
    url: string; // Base64 data URL
    prompt: string;
    createdAt: number;
}
