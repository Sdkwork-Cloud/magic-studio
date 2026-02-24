// eslint-disable-next-line @typescript-eslint/no-unused-vars
import {
    MediaResourceType,
    VideoMediaResource,
    ImageMediaResource,
    AudioMediaResource,
    FileMediaResource,
    AnyMediaResource
} from 'sdkwork-react-commons';
import { AssetType, AssetOrigin } from './asset.entity';

// Re-export base types for convenience
export type { AssetType, AssetOrigin } from './asset.entity';

// Enhanced asset types for specialized use cases

/**
 * Enhanced Video Asset with additional metadata
 */
export type VideoAsset = VideoMediaResource;

/**
 * Enhanced Image Asset with additional metadata
 */
export type ImageAsset = ImageMediaResource;

/**
 * Enhanced Audio Asset with additional metadata
 */
export type AudioAsset = AudioMediaResource;

/**
 * Enhanced Digital Human Asset for virtual characters and avatars
 */
export type DigitalHumanAsset = FileMediaResource & { 
    type: MediaResourceType.CHARACTER; // Using CHARACTER type for digital humans
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
};

/**
 * Enhanced Sound Effect Asset with rich metadata
 */
export type SfxAsset = AudioMediaResource & { 
    type: MediaResourceType.AUDIO;
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
};

/**
 * Enhanced Text Asset for Title previews and text overlays
 */
export type TextAsset = FileMediaResource & { 
    type: MediaResourceType.TEXT;
    category?: string;
    metadata?: {
        fontFamily?: string;
        color?: string;
        fontSize?: number;
        text?: string; // Default text content
        thumbnailUrl?: string;
        stylePreset?: string; // e.g. "neon", "subtitle"
        textAlign?: string;
        letterSpacing?: number;
        strokeColor?: string;
        strokeWidth?: number;
    };
};

/**
 * Enhanced Effect Asset for visual effects
 */
export type EffectAsset = FileMediaResource & { 
    type: MediaResourceType.EFFECT;
    category?: string;
    metadata?: {
        thumbnailUrl?: string;
        previewVideoUrl?: string; // Future: Hover video preview
        intensity?: number;
    };
};

/**
 * Enhanced Transition Asset for scene transitions
 */
export type TransitionAsset = FileMediaResource & { 
    type: MediaResourceType.TRANSITION;
    duration?: number;
    metadata?: {
        thumbnailUrl?: string;
        iconType?: 'dissolve' | 'wipe' | 'slide' | 'zoom' | 'push'; // For rendering specific icons
    };
};

/**
 * Union type for all asset types
 */
export type AnyAsset = AnyMediaResource | DigitalHumanAsset | SfxAsset | TextAsset | EffectAsset | TransitionAsset;

// Export MediaResourceType for convenience
export { MediaResourceType };