import { BaseEntity } from 'sdkwork-react-commons'; // eslint-disable-line @typescript-eslint/no-unused-vars

export type CharacterArchetype = 'hero' | 'villain' | 'npc' | 'fantasy' | 'cyberpunk' | 'anime' | 'mascot';
export type CharacterGender = 'male' | 'female';

export interface CharacterConfig {
    prompt: string;
    name?: string;
    description?: string;
    model?: string;
    archetype?: CharacterArchetype;
    gender?: CharacterGender;
    mediaType: 'character';
    age?: number;
    outfit?: string;
    hairstyle?: string;
    hairColor?: string;
    eyeColor?: string;
    skinTone?: string;
    accessories?: string;
    aspectRatio?: string;
    voiceId?: string;
    avatarMode?: string;
    avatarImage?: string;
}

export interface Character extends BaseEntity {
    name: string;
    description: string;
    avatarUrl?: string;
    config?: CharacterConfig;
}

export interface CharacterTask extends BaseEntity {
    config: CharacterConfig;
    status: 'pending' | 'completed' | 'failed';
    results?: Character[];
    error?: string;
    isFavorite?: boolean;
}
