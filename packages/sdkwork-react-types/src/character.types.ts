// Character type definitions
// All character-related types are defined here to avoid circular dependencies

import type { BaseEntity } from './base.types';

// ============================================================================
// Character Archetype and Gender
// ============================================================================

export type CharacterArchetype = 'hero' | 'villain' | 'npc' | 'fantasy' | 'cyberpunk' | 'anime' | 'mascot';

export type CharacterGender = 'male' | 'female' | 'neutral';

// ============================================================================
// Character Config
// ============================================================================

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

// ============================================================================
// Character
// ============================================================================

export interface Character extends BaseEntity {
  name: string;
  description: string;
  avatarUrl?: string;
  config?: CharacterConfig;
}

// ============================================================================
// Character Task
// ============================================================================

export interface CharacterTask extends BaseEntity {
  config: CharacterConfig;
  status: 'pending' | 'completed' | 'failed';
  results?: Character[];
  error?: string;
  isFavorite?: boolean;
}

// ============================================================================
// Character Style/Preset
// ============================================================================

export interface CharacterStyle {
  id: string;
  name: string;
  description?: string;
  previewUrl?: string;
  category?: string;
}

// ============================================================================
// Character Conversation
// ============================================================================

export interface CharacterMessage {
  id: string;
  role: 'user' | 'character';
  content: string;
  timestamp: string; // ISO 8601 format: yyyy-MM-dd HH:mm:ss
  emotion?: string;
}

export interface CharacterConversation extends BaseEntity {
  characterId: string;
  messages: CharacterMessage[];
  title?: string;
}
