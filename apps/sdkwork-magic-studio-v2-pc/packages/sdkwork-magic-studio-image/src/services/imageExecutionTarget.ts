import {
    hasImageInputResourceReference,
    type ImageGenerationConfig,
} from '../entities';

export type ImageExecutionOperation =
    | 'create'
    | 'variation'
    | 'edit'
    | 'upscale'
    | 'enhance-prompt'
    | 'read-task'
    | 'cancel-task';

export interface ImageExecutionTarget {
    operation: ImageExecutionOperation;
    unavailableReason: string | null;
}

interface ImageExecutionTargetOptions {
    resolvedReferenceAssetCount?: number | null;
}

const resolveReferenceImageCount = (
    config: ImageGenerationConfig,
    options: ImageExecutionTargetOptions = {}
): number => {
    if (
        typeof options.resolvedReferenceAssetCount === 'number' &&
        Number.isFinite(options.resolvedReferenceAssetCount)
    ) {
        return Math.max(0, options.resolvedReferenceAssetCount);
    }

    const referenceImages = (config.referenceImages || []).filter(
        (item): item is NonNullable<typeof item> => hasImageInputResourceReference(item)
    );
    if (referenceImages.length > 0) {
        return referenceImages.length;
    }

    return hasImageInputResourceReference(config.referenceImage) ? 1 : 0;
};

export const hasImageExecutionReferenceImages = (
    config: ImageGenerationConfig,
    options: ImageExecutionTargetOptions = {}
): boolean => resolveReferenceImageCount(config, options) > 0;

export const readImageExecutionTargetFromConfig = (
    config: ImageGenerationConfig,
    options: ImageExecutionTargetOptions = {}
): ImageExecutionTarget => {
    const hasPrompt = config.prompt.trim().length > 0;
    const hasReferenceImages = hasImageExecutionReferenceImages(config, options);

    return {
        operation: !hasPrompt && hasReferenceImages ? 'variation' : 'create',
        unavailableReason: null,
    };
};
