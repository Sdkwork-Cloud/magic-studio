// Music project type definitions
// All music-related types are defined here to avoid circular dependencies

import type { BaseEntity } from './base.types';

// ============================================================================
// Music Model Types
// ============================================================================

export type MusicModelType = 'suno-v3' | 'suno-v3.5' | 'udio-v1' | 'musicgen-large';

// ============================================================================
// Music Style
// ============================================================================

export interface MusicStyle {
  id: string;
  label: string;
  value: string;
  color: string;
}

// ============================================================================
// Music Config
// ============================================================================

export interface MusicConfig {
  customMode: boolean;
  prompt: string;
  lyrics: string;
  style: string;
  title: string;
  instrumental: boolean;
  model: MusicModelType;
  duration?: number;
  mediaType: 'music';
  aspectRatio?: string;
}

// ============================================================================
// Generated Music Result
// ============================================================================

export interface GeneratedMusicResult {
  id: string;
  url: string;
  coverUrl?: string;
  title: string;
  duration: number;
  lyrics?: string;
  style?: string;
}

// ============================================================================
// Music Task
// ============================================================================

export interface MusicTask extends BaseEntity {
  config: MusicConfig;
  status: 'pending' | 'completed' | 'failed';
  results?: GeneratedMusicResult[];
  error?: string;
  isFavorite?: boolean;
}

// ============================================================================
// Music Project
// ============================================================================

export interface MusicProject extends BaseEntity {
  type: 'MUSIC_PROJECT';
  name: string;
  description?: string;
  tasks: MusicTask[];
  settings?: MusicProjectSettings;
}

export interface MusicProjectSettings {
  defaultModel?: MusicModelType;
  defaultDuration?: number;
  defaultInstrumental?: boolean;
}

// ============================================================================
// Music Genre
// ============================================================================

export interface MusicGenre {
  id: string;
  name: string;
  description?: string;
  tags?: string[];
}
