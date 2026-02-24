
import { BaseEntity } from '../../../types/core';

export type AudioModelType = 'gemini-2.5-flash-tts' | 'eleven-labs-turbo' | 'azure-speech';

export interface AudioConfig {
    text: string;
    model: AudioModelType;
    voice: string;
    speed: number;
    language: string;
    
    // Core compatibility
    mediaType: 'speech';
}

export interface GeneratedAudioResult {
    id: string;
    url: string; // Blob URL
    duration: number;
    text: string;
}

export interface AudioTask extends BaseEntity {
    // Inherited: id, createdAt, updatedAt
    config: AudioConfig;
    status: 'pending' | 'completed' | 'failed';
    results?: GeneratedAudioResult[];
    error?: string;
    isFavorite?: boolean;
}
