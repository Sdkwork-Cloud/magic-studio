// Video project type definitions
// All video-related types are defined here to avoid circular dependencies

import type { BaseEntity } from './base.types';

// ============================================================================
// Video Aspect Ratio and Resolution Types
// ============================================================================

export type VideoAspectRatio = '16:9' | '9:16' | '1:1' | '4:3' | '3:4' | '21:9';

export type VideoResolution = '720p' | '1080p' | '4k';

export type VideoDuration = `${number}s`;

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

export type LipSyncDriverType = 'audio' | 'tts';

export type LipSyncSourceType = 'video' | 'image';

export type LipSyncStage =
  | 'draft'
  | 'validating'
  | 'queued'
  | 'processing'
  | 'succeeded'
  | 'failed'
  | 'canceled';

export type VideoTaskType = 'generation' | 'lip_sync';

export type VideoGenerationAssetType = 'image' | 'video' | 'audio' | 'text';

export interface VideoGenerationAsset {
  role: string;
  type: VideoGenerationAssetType;
  value: string;
}

export interface VideoStyleSelection {
  id: string;
  prompt: string;
}

export interface UnifiedVideoGenerationRequest {
  generationType: VideoGenerationMode;
  assets: VideoGenerationAsset[];
  prompt: string;
  negativePrompt: string;
  duration: VideoDuration;
  resolution: VideoResolution;
  aspectRatio: VideoAspectRatio;
  model: string;
  videoStyle: VideoStyleSelection;
  options?: Record<string, unknown>;
}

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
  targetImage?: string;
  driverAudio?: string;
  motionVideo?: string;
  audioUrl?: string;
  referenceVideos?: string[];

  // Shared advanced controls
  shotType?: 'single-shot' | 'multi-shot';
  promptExtend?: boolean;
  watermark?: boolean;
  generateAudio?: boolean;
  cameraFixed?: boolean;
  seed?: number;

  // Lip Sync extended options
  lipSyncSourceType?: LipSyncSourceType;
  lipSyncDriverType?: LipSyncDriverType;
  lipSyncSyncMode?: 'standard' | 'pro';
  lipSyncPreset?: 'dialogue' | 'speech' | 'emotion';
  lipSyncLipStrength?: number;
  lipSyncExpressionStrength?: number;
  lipSyncPreserveHeadMotion?: boolean;
  lipSyncDenoise?: boolean;
  lipSyncTrimSilence?: boolean;
  lipSyncTargetLufs?: number;
  lipSyncKeepOriginalBgm?: boolean;
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
  generationRequest?: UnifiedVideoGenerationRequest;
  status: 'pending' | 'completed' | 'failed';
  results?: GeneratedVideoResult[];
  error?: string;
  progress?: number;
  isFavorite?: boolean;
  stage?: LipSyncStage;
  taskType?: VideoTaskType;
  provider?: string;
  remoteTaskId?: string;
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
