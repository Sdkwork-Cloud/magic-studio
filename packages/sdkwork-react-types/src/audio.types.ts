// Audio project type definitions
// All audio-related types are defined here to avoid circular dependencies

import type { BaseEntity } from './base.types';

// ============================================================================
// Audio Model Types
// ============================================================================

export type AudioModelType =
  | 'tts'
  | 'music'
  | 'sfx'
  | 'voice'
  | 'gemini-2.5-flash-tts'
  | 'eleven-labs-turbo'
  | 'azure-speech';

// ============================================================================
// Audio Generation Params
// ============================================================================

export interface AudioGenerationParams {
  prompt: string;
  negativePrompt?: string;
  model?: AudioModelType;
  voice?: string;
  duration?: number;
  seed?: number;
}

// ============================================================================
// Audio Task Result
// ============================================================================

export interface AudioTaskResult {
  url: string;
  duration?: number;
}

// ============================================================================
// Audio Task
// ============================================================================

export interface AudioTask extends BaseEntity {
  url?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  prompt?: string;
  duration?: number;
  results?: AudioTaskResult[];
  config?: AudioGenerationParams;
  isFavorite?: boolean;
}

// ============================================================================
// Audio Project
// ============================================================================

export interface AudioProject extends BaseEntity {
  type: 'AUDIO_PROJECT';
  name: string;
  description?: string;
  tasks: AudioTask[];
}

// ============================================================================
// Audio Voice
// ============================================================================

export interface AudioVoice {
  id: string;
  name: string;
  language: string;
  gender: 'male' | 'female' | 'neutral';
  previewUrl?: string;
  provider: string;
}

// ============================================================================
// Audio Preset
// ============================================================================

export interface AudioPreset {
  id: string;
  name: string;
  description?: string;
  params: Partial<AudioGenerationParams>;
  category?: string;
}
