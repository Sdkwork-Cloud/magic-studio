// Image project type definitions
// All image-related types are defined here to avoid circular dependencies

import type { BaseEntity } from './base.types';

// ============================================================================
// Image Aspect Ratio
// ============================================================================

export type ImageAspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4' | '21:9' | 'custom';

// ============================================================================
// Image Style
// ============================================================================

export type ImageStyle = 'realistic' | 'anime' | 'painting' | 'sketch' | '3d' | 'abstract' | 'custom';

// ============================================================================
// Image Generation Config
// ============================================================================

export interface ImageGenerationConfig {
  prompt: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
  aspectRatio?: ImageAspectRatio;
  steps?: number;
  guidance?: number;
  seed?: number;
  style?: ImageStyle;
  model?: string;
  [key: string]: any;
}

// ============================================================================
// Generated Image Result
// ============================================================================

export interface GeneratedImageResult {
  id: string;
  url: string;
  thumbnailUrl?: string;
  prompt?: string;
  negativePrompt?: string;
  seed?: number;
  width?: number;
  height?: number;
}

// ============================================================================
// Image Task
// ============================================================================

export interface ImageTask extends BaseEntity {
  config: ImageGenerationConfig;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  results?: GeneratedImageResult[];
  error?: string;
  progress?: number;
  isFavorite?: boolean;
}

// ============================================================================
// Image Project
// ============================================================================

export interface ImageProject extends BaseEntity {
  type: 'IMAGE_PROJECT';
  name: string;
  description?: string;
  tasks: ImageTask[];
  settings?: ImageProjectSettings;
}

export interface ImageProjectSettings {
  defaultAspectRatio?: ImageAspectRatio;
  defaultWidth?: number;
  defaultHeight?: number;
  defaultModel?: string;
  defaultStyle?: ImageStyle;
}

// ============================================================================
// Image Model
// ============================================================================

export interface ImageModel {
  id: string;
  name: string;
  provider: string;
  description?: string;
  maxWidth?: number;
  maxHeight?: number;
  supportedAspectRatios?: ImageAspectRatio[];
  supportedStyles?: ImageStyle[];
}

// ============================================================================
// Image Preset
// ============================================================================

export interface ImagePreset {
  id: string;
  name: string;
  description?: string;
  config: Partial<ImageGenerationConfig>;
  thumbnailUrl?: string;
  category?: string;
}
