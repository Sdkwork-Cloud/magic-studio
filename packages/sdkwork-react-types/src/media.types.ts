// Media Resource type definitions
// All media-related types are defined here to avoid circular dependencies

import type { BaseEntity } from './base.types';
import type { MediaResourceType, MediaScene, AudioFormat } from './common.types';
import type { TagsContent } from './common.types';

// ============================================================================
// Base Media Resource
// ============================================================================

export interface MediaResource extends BaseEntity {
    url?: string;
    bytes?: number[];
    base64?: string;
    path?: string;
    localFile?: Record<string, any>;
    type: MediaResourceType;
    mimeType?: string;
    size?: number;
    name: string;
    extension?: string;
    scene?: MediaScene;
    prompt?: string;
    metadata?: Record<string, any>;
    tags?: TagsContent;
    origin?: 'upload' | 'ai' | 'stock' | 'system';
    isFavorite?: boolean;
}

// ============================================================================
// File Media Resource
// ============================================================================

export interface FileMediaResource extends MediaResource {
    mime_type?: string;
}

// ============================================================================
// Video Media Resource
// ============================================================================

export interface VideoMediaResource extends MediaResource {
    duration?: number;
    width?: number;
    height?: number;
    fps?: number;
    resolution?: string;
    refAssets?: AssetMediaResource[];
}

// ============================================================================
// Image Media Resource
// ============================================================================

export interface ImageMediaResource extends MediaResource {
    width?: number;
    height?: number;
    aspectRatio?: string;
    splitImages?: ObjectRef<'ImageMediaResource'>[];
    refAssets?: AssetMediaResource[];
}

// ============================================================================
// Audio Media Resource
// ============================================================================

export interface AudioMediaResource extends MediaResource {
    format?: AudioFormat;
    bitRate?: string;
    sampleRate?: number;
    channels?: number;
    duration?: number;
}

// ============================================================================
// Music Media Resource
// ============================================================================

export interface MusicMediaResource extends AudioMediaResource {
    genre?: string;
    bpm?: number;
    artist?: string;
}

// ============================================================================
// Character Media Resource
// ============================================================================

export interface CharacterMediaResource extends MediaResource {
    characterType?: string;
    gender?: string;
    ageGroup?: string;
    avatarUrl?: string;
    avatarVideoUrl?: string;
    speakerId?: string;
    appearanceParams?: Record<string, any>;
    animationParams?: Record<string, any>;
    refAssets?: AssetMediaResource[];
}

// ============================================================================
// Asset Media Resource
// ============================================================================

export interface AssetMediaResource extends MediaResource {
    image?: ImageMediaResource;
    video?: VideoMediaResource;
    audio?: AudioMediaResource;
    music?: MusicMediaResource;
    character?: CharacterMediaResource;
    file?: FileMediaResource;
    extraProps?: Record<string, any>;
}

// ============================================================================
// Any Media Resource Union Type
// ============================================================================

export type AnyMediaResource =
    | FileMediaResource
    | VideoMediaResource
    | ImageMediaResource
    | AudioMediaResource
    | MusicMediaResource
    | CharacterMediaResource
    | AssetMediaResource;

// ============================================================================
// Object Reference (for media relationships)
// ============================================================================

export interface ObjectRef<T extends string = any> {
    id: string;
    uuid: string;
    type: T;
}

// ============================================================================
// Generation Product & Platform
// ============================================================================

export type GenerationProduct =
    | 'TEXT_TO_VIDEO'
    | 'IMAGE_TO_VIDEO'
    | 'START_END_FRAMES'
    | 'REFERENCE_GUIDED'
    | 'MULTI_FRAME_INTELLIGENT'
    | 'UNIVERSAL_REFERENCE';

export type GenerationPlatform =
    | 'KELING'
    | 'VIDU'
    | 'JIMENG'
    | 'SORA'
    | 'GOOGLE'
    | 'RUNWAY'
    | 'PIKA';

// ============================================================================
// Media Resource Origin
// ============================================================================

export type MediaResourceOrigin = 'upload' | 'ai' | 'stock' | 'system';

// ============================================================================
// Media Resource Status
// ============================================================================

export type MediaResourceStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

// ============================================================================
// Media Resource Filter
// ============================================================================

export interface MediaResourceFilter {
    types?: MediaResourceType[];
    scenes?: MediaScene[];
    origins?: MediaResourceOrigin[];
    searchQuery?: string;
    isFavorite?: boolean;
    dateFrom?: number;
    dateTo?: number;
}

// ============================================================================
// Media Resource Search Result
// ============================================================================

export interface MediaResourceSearchResult {
    resources: MediaResource[];
    total: number;
    hasMore: boolean;
}
