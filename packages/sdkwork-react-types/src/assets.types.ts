// Assets type definitions
// All asset-related types are defined here to avoid circular dependencies

import type { BaseEntity } from './base.types';
import type {
  MediaResource,
  FileMediaResource,
  VideoMediaResource,
  ImageMediaResource,
  AudioMediaResource
} from './media.types';

// ============================================================================
// Asset Types and Origins
// ============================================================================

export type AssetType =
  | 'image'
  | 'video'
  | 'audio'
  | 'music'
  | 'voice'
  | 'text'
  | 'character'
  | 'digital-human'
  | 'model3d'
  | 'lottie'
  | 'file'
  | 'effect'
  | 'transition'
  | 'subtitle'
  | 'sfx';

export type AssetOrigin = 'upload' | 'ai' | 'stock' | 'system';

// ============================================================================
// Asset Category
// ============================================================================

export interface AssetCategory {
  id: string;
  label: string;
  accepts: string[];
}

// ============================================================================
// Asset Metadata
// ============================================================================

export interface AssetMetadata {
  originalName?: string;
  extension?: string;
  mimeType?: string;
  size?: number;
  width?: number;
  height?: number;
  duration?: number;
  fps?: number;
  thumbnailPath?: string;
  thumbnailUrl?: string;
  source?: string;
  [key: string]: any;
}

// ============================================================================
// Base Asset
// ============================================================================

export interface Asset extends BaseEntity {
  name: string;
  type: AssetType;
  path: string;
  size: number;
  origin: AssetOrigin;
  metadata: AssetMetadata;
  isFavorite?: boolean;
}

// ============================================================================
// Enhanced Asset Types (extending MediaResource types)
// ============================================================================

export type VideoAsset = VideoMediaResource;

export type ImageAsset = ImageMediaResource;

export type AudioAsset = AudioMediaResource;

export interface DigitalHumanAsset extends FileMediaResource {
  category?: 'avatar' | 'character' | 'avatar-animation' | 'full-body';
  metadata?: {
    modelName?: string;
    version?: string;
    rigType?: 'face' | 'body' | 'full';
    animationSupport?: boolean;
    morphTargets?: string[];
    thumbnailUrl?: string;
    previewVideoUrl?: string;
    voiceActor?: string;
    personality?: string;
    languages?: string[];
    style?: 'realistic' | 'anime' | 'cartoon' | 'stylized';
  };
}

export interface SfxAsset extends AudioMediaResource {
  category?: 'ambient' | 'ui' | 'foley' | 'weapons' | 'vehicles' | 'nature' | 'sci-fi' | 'fantasy';
  metadata?: {
    intensity?: 'soft' | 'medium' | 'loud';
    duration?: number;
    loopable?: boolean;
    bpm?: number;
    key?: string;
    genreTags?: string[];
    thumbnailUrl?: string;
    waveformUrl?: string;
  };
}

export interface TextAsset extends FileMediaResource {
  category?: string;
  metadata?: {
    fontFamily?: string;
    color?: string;
    fontSize?: number;
    text?: string;
    thumbnailUrl?: string;
    stylePreset?: string;
    textAlign?: string;
    letterSpacing?: number;
    strokeColor?: string;
    strokeWidth?: number;
  };
}

export interface EffectAsset extends FileMediaResource {
  category?: string;
  metadata?: {
    thumbnailUrl?: string;
    previewVideoUrl?: string;
    intensity?: number;
  };
}

export interface TransitionAsset extends FileMediaResource {
  duration?: number;
  metadata?: {
    thumbnailUrl?: string;
    iconType?: 'dissolve' | 'wipe' | 'slide' | 'zoom' | 'push';
  };
}

export type AnyAsset = MediaResource | DigitalHumanAsset | SfxAsset | TextAsset | EffectAsset | TransitionAsset;

// ============================================================================
// Asset Collection/Folder
// ============================================================================

export interface AssetFolder extends BaseEntity {
  name: string;
  parentId?: string;
  assetIds: string[];
}

// ============================================================================
// Asset Search/Filter
// ============================================================================

export interface AssetFilter {
  types?: AssetType[];
  origins?: AssetOrigin[];
  searchQuery?: string;
  isFavorite?: boolean;
  dateFrom?: number;
  dateTo?: number;
}

export interface AssetSearchResult {
  assets: Asset[];
  total: number;
  hasMore: boolean;
}
