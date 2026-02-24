
import { BaseEntity } from '../../../types/core';

export type CharacterArchetype = 'hero' | 'villain' | 'npc' | 'mascot' | 'cyberpunk' | 'fantasy' | 'anime';
export type CharacterGender = 'male' | 'female';
export type CharacterViewMode = 'full-body' | 'three-view' | 'portrait';

export interface CharacterConfig {
    // Identity
    name: string;
    description: string;
    archetype: CharacterArchetype;
    gender: CharacterGender;
    age: string;
    
    // Visual Settings
    avatarMode: CharacterViewMode; // Full body, Three-view, etc.
    avatarImage?: string; // Main character image (Base64/URL)
    referenceImages: string[]; // Additional references
    
    // Voice Settings
    voiceSource: 'preset' | 'upload';
    voiceId?: string; // ID from preset voices
    voiceSample?: string; // Base64/URL of uploaded sample
    
    // Generation Params
    styleId: string;
    model: string;
    mediaType: 'character';
    aspectRatio: '1:1' | '9:16' | '3:4';
    batchSize: number;
}

export interface GeneratedCharacterResult {
    id: string;
    url: string; // Base64
}

export interface CharacterTask extends BaseEntity {
    // Inherited: id, createdAt, updatedAt
    config: CharacterConfig;
    status: 'pending' | 'completed' | 'failed';
    results?: GeneratedCharacterResult[];
    error?: string;
    isFavorite?: boolean;
}
