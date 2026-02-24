
import { BaseEntity } from '../../../types/core';

export type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
export type MediaType = 'image' | 'video' | 'audio' | 'voice' | 'music' | 'speech';

export interface ImageStyle {
    id: string;
    label: string;
    value: string; // The prompt suffix
    previewColor: string;
}

export interface GenerationConfig {
    prompt: string;
    negativePrompt?: string;
    aspectRatio: AspectRatio;
    styleId: string;
    
    // Single Model Mode
    model?: string; 
    
    // Multi-Model Mode
    useMultiModel?: boolean;
    models?: string[]; // Array of model IDs

    quality?: 'standard' | 'hd' | 'ultra'; // Image quality/resolution setting
    referenceImage?: string; // Legacy Single Base64
    referenceImages?: string[]; // Multiple Base64/URL for mixing
    batchSize: number; // Number of images per model
    mediaType?: MediaType; // Defaults to image

    // Optional fields for video/audio compatibility
    resolution?: string;
    duration?: string | number;
}

export interface GeneratedResult {
    url: string;
    id: string;
    modelId?: string; // Track which model generated this specific result
    posterUrl?: string; // Video thumbnail / Cover image
}

export interface ImageTask extends BaseEntity {
    // Inherited: id, createdAt, updatedAt
    config: GenerationConfig;
    status: 'pending' | 'completed' | 'failed';
    results?: GeneratedResult[]; 
    error?: string;
    isFavorite?: boolean;
}
