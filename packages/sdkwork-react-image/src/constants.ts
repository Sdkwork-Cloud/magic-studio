import { ModelProvider, IMAGE_STYLES } from '@sdkwork/react-commons'
import React from 'react';
import { Globe, Image, Cpu, Video } from 'lucide-react';

export { IMAGE_STYLES };

export const STORAGE_KEY_HISTORY = 'open_studio_image_history_v1';

export const IMAGE_PROVIDERS: ModelProvider[] = [
    {
        id: 'google',
        name: 'Google',
        icon: React.createElement(Globe, { size: 14 }),
        color: 'text-green-500',
        models: [
            { id: 'gemini-3-pro-image-preview', name: 'Gemini 3 Pro', description: 'Complex reasoning & detail', badge: 'ULTRA', badgeColor: 'bg-purple-600' },
            { id: 'gemini-2.5-flash-image', name: 'Gemini Flash', description: 'Speed & efficiency', badge: 'FAST' }
        ]
    },
    {
        id: 'replicate',
        name: 'Replicate',
        icon: React.createElement(Image, { size: 14 }),
        color: 'text-blue-500',
        models: [
            { id: 'black-forest-labs/flux-kontext-pro', name: 'Flux Kontext Pro', description: 'Context-aware generation', badge: 'NEW', badgeColor: 'bg-green-600' },
            { id: 'black-forest-labs/flux-kontext-max', name: 'Flux Kontext Max', description: 'Maximum quality', badge: 'PRO', badgeColor: 'bg-purple-600' },
            { id: 'black-forest-labs/flux-canny-pro', name: 'Flux Canny Pro', description: 'Edge detection control', badge: 'CTRL' },
            { id: 'black-forest-labs/flux-depth-pro', name: 'Flux Depth Pro', description: 'Depth map control', badge: 'CTRL' },
            { id: 'black-forest-labs/flux-fill-pro', name: 'Flux Fill Pro', description: 'Inpainting & outpainting', badge: 'EDIT' },
            { id: 'black-forest-labs/flux-reduce-pro', name: 'Flux Reduce Pro', description: 'Image compression' },
        ]
    },
    {
        id: 'siliconflow',
        name: 'SiliconFlow',
        icon: React.createElement(Cpu, { size: 14 }),
        color: 'text-cyan-500',
        models: [
            { id: 'black-forest-labs/FLUX.1-schnell', name: 'Flux Schnell', description: 'Fast generation', badge: 'FAST' },
            { id: 'black-forest-labs/FLUX.1-dev', name: 'Flux Dev', description: 'Development version' },
            { id: 'stabilityai/stable-diffusion-3-5-large', name: 'SD 3.5 Large', description: 'Stable Diffusion 3.5', badge: 'SD' },
        ]
    },
    {
        id: 'volcengine',
        name: 'VolcEngine',
        icon: React.createElement(Video, { size: 14 }),
        color: 'text-orange-500',
        models: [
            { id: 'doubao-seedream-3-0-t2i-250415', name: 'Seedream 3.0', description: 'ByteDance image model', badge: 'NEW', badgeColor: 'bg-green-600' },
        ]
    },
];
