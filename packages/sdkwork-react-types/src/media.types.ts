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
// Voice Media Resource
// ============================================================================

export interface VoiceMediaResource extends AudioMediaResource {
    speakerId?: string;
    language?: string;
    gender?: string;
    emotion?: string;
}

// ============================================================================
// Text Media Resource
// ============================================================================

export interface TextMediaResource extends FileMediaResource {
    text?: string;
    language?: string;
    fontFamily?: string;
    fontSize?: number;
}

// ============================================================================
// Subtitle Media Resource
// ============================================================================

export interface SubtitleMediaResource extends FileMediaResource {
    language?: string;
    cueCount?: number;
    format?: 'srt' | 'ass' | 'vtt';
}

// ============================================================================
// Effect Media Resource
// ============================================================================

export interface EffectMediaResource extends FileMediaResource {
    effectType?: string;
    intensity?: number;
}

// ============================================================================
// Transition Media Resource
// ============================================================================

export interface TransitionMediaResource extends FileMediaResource {
    transitionType?: string;
    duration?: number;
}

// ============================================================================
// Lottie Media Resource
// ============================================================================

export interface LottieMediaResource extends FileMediaResource {
    frameRate?: number;
    loop?: boolean;
}

// ============================================================================
// Model3D Media Resource
// ============================================================================

export interface Model3DMediaResource extends FileMediaResource {
    polygonCount?: number;
    hasRig?: boolean;
    hasAnimation?: boolean;
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
// Digital Human Media Resource
// ============================================================================

export interface DigitalHumanMediaResource extends CharacterMediaResource {
    rigType?: 'face' | 'body' | 'full';
    style?: 'realistic' | 'anime' | 'cartoon' | 'stylized';
    voiceProfileId?: string;
}

// ============================================================================
// SFX Media Resource
// ============================================================================

export interface SfxMediaResource extends AudioMediaResource {
    category?: 'ambient' | 'ui' | 'foley' | 'weapons' | 'vehicles' | 'nature' | 'sci-fi' | 'fantasy';
    intensity?: 'soft' | 'medium' | 'loud';
    loopable?: boolean;
}

// ============================================================================
// Asset Content Key
// ============================================================================

export type AssetContentKey =
    | 'video'
    | 'image'
    | 'audio'
    | 'music'
    | 'voice'
    | 'text'
    | 'character'
    | 'digitalHuman'
    | 'model3d'
    | 'lottie'
    | 'file'
    | 'effect'
    | 'transition'
    | 'subtitle'
    | 'sfx';

// ============================================================================
// Asset Media Resource
// ============================================================================

export interface AssetMediaResource extends MediaResource {
    // Single-content slots use explicit keys.
    image?: ImageMediaResource;
    video?: VideoMediaResource;
    audio?: AudioMediaResource;
    music?: MusicMediaResource;
    voice?: VoiceMediaResource;
    text?: TextMediaResource;
    character?: CharacterMediaResource;
    digitalHuman?: DigitalHumanMediaResource;
    model3d?: Model3DMediaResource;
    lottie?: LottieMediaResource;
    file?: FileMediaResource;
    effect?: EffectMediaResource;
    transition?: TransitionMediaResource;
    subtitle?: SubtitleMediaResource;
    sfx?: SfxMediaResource;
    // Multi-content assets must be placed in this array.
    assets?: AssetMediaResource[];
    // Primary slot marker for render/query optimization.
    primary?: AssetContentKey;
    extraProps?: Record<string, any>;
}

// ========================================================================
// Asset Atomic Media Resource
// ========================================================================

// Asset-center payload and repository layers should use this pure resource type.
// It intentionally excludes composite slot/container fields from AssetMediaResource.
export type AssetAtomicMediaResource = Omit<
    AssetMediaResource,
    | 'image'
    | 'video'
    | 'audio'
    | 'music'
    | 'voice'
    | 'text'
    | 'character'
    | 'digitalHuman'
    | 'model3d'
    | 'lottie'
    | 'file'
    | 'effect'
    | 'transition'
    | 'subtitle'
    | 'sfx'
    | 'assets'
>;

// ============================================================================
// Any Media Resource Union Type
// ============================================================================

export type AnyMediaResource =
    | FileMediaResource
    | VideoMediaResource
    | ImageMediaResource
    | AudioMediaResource
    | MusicMediaResource
    | VoiceMediaResource
    | TextMediaResource
    | SubtitleMediaResource
    | EffectMediaResource
    | TransitionMediaResource
    | LottieMediaResource
    | Model3DMediaResource
    | CharacterMediaResource
    | DigitalHumanMediaResource
    | SfxMediaResource
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
