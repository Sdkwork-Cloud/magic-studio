import type { ImageAspectRatio } from '@sdkwork/react-types';

export type ImagePanelSectionKey =
    | 'reference'
    | 'prompt'
    | 'style'
    | 'output'
    | 'advanced'
    | 'generate';

export type ImagePanelRequirementKey = 'prompt' | 'reference_image';

export interface ImagePanelGenerationRequirement {
    key: ImagePanelRequirementKey;
    minCount?: number;
}

export interface ImagePanelGenerationRule {
    allOf?: ImagePanelGenerationRequirement[];
    anyOf?: ImagePanelGenerationRequirement[];
}

export interface ImagePanelSchema {
    sections: ImagePanelSectionKey[];
    generationRule: ImagePanelGenerationRule;
}

export interface ImagePanelRuntimeState {
    isGenerating: boolean;
    hasPrompt: boolean;
    hasReferenceImage: boolean;
    referenceCount: number;
}

export interface ImageAspectRatioOption {
    id: ImageAspectRatio;
    label: string;
    icon: string;
    enabled?: boolean;
    recommended?: boolean;
}

export interface ImageBatchSizeOption {
    id: number;
    label: string;
    enabled?: boolean;
    recommended?: boolean;
}

export interface ImageModelOutputPolicy {
    defaultAspectRatio: ImageAspectRatio;
    defaultBatchSize: number;
    maxReferenceImages: number;
    aspectRatios: ImageAspectRatioOption[];
    batchSizes: ImageBatchSizeOption[];
}
