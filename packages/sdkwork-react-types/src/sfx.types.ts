// SFX (Sound Effects) project type definitions
// All sfx-related types are defined here to avoid circular dependencies

import type { BaseEntity } from './base.types';

// ============================================================================
// SFX Model Types
// ============================================================================

export type SfxModelType = 'eleven-labs-sfx' | 'audioldm-2' | 'tango';

// ============================================================================
// SFX Config
// ============================================================================

export interface SfxConfig {
  prompt: string;
  duration: number; // in seconds
  model: SfxModelType;
  mediaType: 'audio'; // Compatible with generic components
}

// ============================================================================
// Generated SFX Result
// ============================================================================

export interface GeneratedSfxResult {
  id: string;
  url: string;
  duration: number;
}

// ============================================================================
// SFX Task
// ============================================================================

export interface SfxTask extends BaseEntity {
  config: SfxConfig;
  status: 'pending' | 'completed' | 'failed';
  results?: GeneratedSfxResult[];
  error?: string;
  isFavorite?: boolean;
}

// ============================================================================
// SFX Project
// ============================================================================

export interface SfxProject extends BaseEntity {
  type: 'SFX_PROJECT';
  name: string;
  description?: string;
  tasks: SfxTask[];
  settings?: SfxProjectSettings;
}

export interface SfxProjectSettings {
  defaultModel?: SfxModelType;
  defaultDuration?: number;
}

// ============================================================================
// SFX Category
// ============================================================================

export interface SfxCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
}

// ============================================================================
// SFX Preset
// ============================================================================

export interface SfxPreset {
  id: string;
  name: string;
  description?: string;
  prompt: string;
  duration: number;
  category?: string;
}
