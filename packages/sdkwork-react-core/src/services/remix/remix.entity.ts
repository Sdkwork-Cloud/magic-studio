
import { MediaResourceType } from '@sdkwork/react-commons';

export type RemixTargetModule = 'video' | 'image' | 'audio' | 'music' | 'character';

export interface RemixMediaReference {
    url: string;
    type: MediaResourceType;
    role: 'start_frame' | 'end_frame' | 'reference' | 'grid_source' | 'mask' | 'control';
}

/**
 * Universal Remix Intent
 * Defines the "DNA" of a creation to be reconstructed in a Studio.
 */
export interface RemixIntent {
    targetModule: RemixTargetModule;
    
    // Core Creative Data
    prompt: string;
    negativePrompt?: string;
    
    // Assets
    mediaReferences: RemixMediaReference[];
    
    // Technical Specs
    modelId?: string;
    seed?: number;
    aspectRatio?: string; // "16:9", "1:1"
    
    // Module Specific Hints
    modeHint?: string; // e.g. "image-to-video", "style-transfer"
    
    // Metadata for UI
    sourceName?: string;
    sourceAuthor?: string;
}
