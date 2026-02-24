
import { BaseEntity } from '../../../types/core';

export type MusicModelType = 'suno-v3' | 'suno-v3.5' | 'udio-v1' | 'musicgen-large';

export interface MusicStyle {
    id: string;
    label: string;
    value: string; // The style prompt suffix
    color: string;
}

export interface MusicConfig {
    customMode: boolean;
    prompt: string; // Description in simple mode
    lyrics: string; // Lyrics in custom mode
    style: string;  // Style description in custom mode
    title: string;
    instrumental: boolean;
    model: MusicModelType;
    duration?: number;
    
    // Compatibility with generic components
    mediaType: 'music'; 
    aspectRatio?: string; // Optional stub for compatibility
}

export interface GeneratedMusicResult {
    id: string;
    url: string; // Audio URL
    coverUrl?: string; // Album Art
    title: string;
    duration: number;
    lyrics?: string;
    style?: string;
}

export interface MusicTask extends BaseEntity {
    // Inherited: id, createdAt, updatedAt
    config: MusicConfig;
    status: 'pending' | 'completed' | 'failed';
    results?: GeneratedMusicResult[];
    error?: string;
    isFavorite?: boolean;
}
