// Video project type definitions
// All video-related types are defined here to avoid circular dependencies

import type { BaseEntity } from './base.types';

// ============================================================================
// Video Aspect Ratio and Resolution Types
// ============================================================================

export type VideoAspectRatio = '16:9' | '9:16' | '1:1' | '4:3' | '3:4' | '21:9';

export type VideoResolution = '720p' | '1080p' | '4k';

export type VideoDuration = '5s' | '10s' | '60s';

// ============================================================================
// Video Generation Mode
// ============================================================================

export type VideoGenerationMode =
  | 'smart_reference'
  | 'start_end'
  | 'smart_multi'
  | 'subject_ref'
  | 'text'
  | 'image'
  | 'avatar'
  | 'lip-sync'
  | 'multi-image'
  | 'face-swap'
  | 'text-to-video'
  | 'image-to-video'
  | 'video-to-video';

// ============================================================================
// Video Model
// ============================================================================

export interface VideoModel {
  id: string;
  name: string;
  provider: string;
  region: 'US' | 'CN' | 'EU';
  badge?: string;
  description: string;
  maxAssetsCount?: number;
  capabilities: {
    maxDuration: number;
    resolutions: VideoResolution[];
    ratios: VideoAspectRatio[];
  };
}

// ============================================================================
// Video Config
// ============================================================================

export interface VideoConfig {
  mode: VideoGenerationMode;
  prompt: string;
  negativePrompt?: string;

  // Core Parameters
  model: string;
  styleId: string;

  // Multi-Model Mode
  useMultiModel?: boolean;
  models?: string[];

  aspectRatio: VideoAspectRatio;
  resolution: VideoResolution;
  duration: VideoDuration;
  fps: 24 | 30 | 60;

  // Batch Generation
  batchSize?: number;

  // --- Inputs for different modes ---

  // Used for 'start_end' (Start Frame) and 'smart_reference'/'subject_ref' (Main Ref)
  image?: string;

  // Used for 'start_end' (End Frame)
  lastFrame?: string;

  // Used for 'smart_multi'
  referenceImages?: string[];

  // Compatibility (Legacy)
  mediaType?: 'video';
  characterImage?: string;
  voiceId?: string;
  targetVideo?: string;
  driverAudio?: string;
  motionVideo?: string;
}

// ============================================================================
// Generated Video Result
// ============================================================================

export interface GeneratedVideoResult {
  id: string;
  url: string;
  mp4Url?: string;
  posterUrl?: string;
  modelId?: string;
}

// ============================================================================
// Video Task
// ============================================================================

export interface VideoTask extends BaseEntity {
  config: VideoConfig;
  status: 'pending' | 'completed' | 'failed';
  results?: GeneratedVideoResult[];
  error?: string;
  progress?: number;
  isFavorite?: boolean;
}

// ============================================================================
// Video Project (Extended)
// ============================================================================

export interface VideoProject extends BaseEntity {
  type: 'VIDEO_PROJECT';
  name: string;
  description?: string;
  tasks: VideoTask[];
  settings?: VideoProjectSettings;
}

export interface VideoProjectSettings {
  defaultAspectRatio?: VideoAspectRatio;
  defaultResolution?: VideoResolution;
  defaultDuration?: VideoDuration;
  defaultFps?: 24 | 30 | 60;
}

// ============================================================================
// Video Generation Status
// ============================================================================

export type VideoGenerationStatus =
  | 'idle'
  | 'preparing'
  | 'uploading'
  | 'generating'
  | 'downloading'
  | 'completed'
  | 'failed'
  | 'cancelled';

// ============================================================================
// Video Style
// ============================================================================

export interface VideoStyle {
  id: string;
  name: string;
  description?: string;
  previewUrl?: string;
  category?: string;
  tags?: string[];
}

// ============================================================================
// Video Preset
// ============================================================================

export interface VideoPreset {
  id: string;
  name: string;
  description?: string;
  config: Partial<VideoConfig>;
  thumbnailUrl?: string;
  category?: string;
}
