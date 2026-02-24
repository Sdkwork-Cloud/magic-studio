
import { BaseEntity } from '../../../types/core';

export type SfxModelType = 'eleven-labs-sfx' | 'audioldm-2' | 'tango';

export interface SfxConfig {
    prompt: string;
    duration: number; // in seconds
    model: SfxModelType;
    mediaType: 'audio'; // Compatible with generic components
}

export interface GeneratedSfxResult {
    id: string;
    url: string;
    duration: number;
}

export interface SfxTask extends BaseEntity {
    // Inherited: id, createdAt, updatedAt
    config: SfxConfig;
    status: 'pending' | 'completed' | 'failed';
    results?: GeneratedSfxResult[];
    error?: string;
    isFavorite?: boolean;
}
