
import { 
    MediaResourceType, 
    VideoMediaResource, 
    ImageMediaResource, 
    AudioMediaResource, 
    MusicMediaResource, 
    CharacterMediaResource,
    FileMediaResource,
    AnyMediaResource as UnifiedResource
} from '../../../../types';
import { AssetType } from '../../../assets/entities/asset.entity';

export type AssetOrigin = 'upload' | 'ai' | 'stock' | 'system';

// Alias specific types for clearer usage in MagicCut module, 
// while ensuring they are 100% compatible with the base interfaces.

export type VideoAsset = VideoMediaResource;
export type ImageAsset = ImageMediaResource;
export type AudioAsset = AudioMediaResource;

// Enhanced Text Asset for Title previews
export type TextAsset = FileMediaResource & { 
    type: MediaResourceType.TEXT, 
    metadata?: {
        fontFamily?: string;
        color?: string;
        fontSize?: number;
        text?: string; // Default text content
        thumbnailUrl?: string;
        stylePreset?: string; // e.g. "neon", "subtitle"
    } 
};

// Enhanced Effect Asset
export type EffectAsset = FileMediaResource & { 
    type: MediaResourceType.EFFECT, 
    category?: string,
    metadata?: {
        thumbnailUrl?: string;
        previewVideoUrl?: string; // Future: Hover video preview
        intensity?: number;
    }
};

// Enhanced Transition Asset
export type TransitionAsset = FileMediaResource & { 
    type: MediaResourceType.TRANSITION, 
    duration?: number,
    metadata?: {
        thumbnailUrl?: string;
        iconType?: 'dissolve' | 'wipe' | 'slide' | 'zoom' | 'push'; // For rendering specific icons
    }
};

export type AnyAsset = UnifiedResource | TextAsset | EffectAsset | TransitionAsset;

export { MediaResourceType };
export type { AssetType };
