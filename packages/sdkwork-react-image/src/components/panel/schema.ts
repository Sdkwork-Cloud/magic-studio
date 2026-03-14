import type { ImageAspectRatio, ImageGenerationConfig } from '../../entities';
import type {
    ImageAspectRatioOption,
    ImageBatchSizeOption,
    ImageModelOutputPolicy,
    ImagePanelGenerationRequirement,
    ImagePanelRuntimeState,
    ImagePanelSchema
} from './types';

export const DEFAULT_IMAGE_MODEL = 'gemini-3-flash-image';

const BASE_ASPECT_RATIO_OPTIONS: ImageAspectRatioOption[] = [
    { id: '1:1', label: 'Square', icon: 'SQ', recommended: true },
    { id: '4:3', label: 'Standard', icon: 'STD' },
    { id: '3:4', label: 'Portrait', icon: 'POR' },
    { id: '16:9', label: 'Landscape', icon: 'WIDE' },
    { id: '9:16', label: 'Story', icon: 'STORY' },
    { id: '21:9', label: 'Ultra', icon: 'ULTRA' }
];

const buildBatchSizeOptions = (
    max: number,
    recommended: number = 1
): ImageBatchSizeOption[] => {
    const bounded = Math.max(1, max);
    const safeRecommended = Math.min(bounded, Math.max(1, recommended));
    return Array.from({ length: bounded }).map((_, index) => {
        const value = index + 1;
        return {
            id: value,
            label: String(value),
            recommended: value === safeRecommended
        };
    });
};

const pickAspectRatios = (
    ...ratios: ImageAspectRatio[]
): ImageAspectRatioOption[] => {
    const ratioSet = new Set(ratios);
    return BASE_ASPECT_RATIO_OPTIONS.filter((item) => ratioSet.has(item.id));
};

const DEFAULT_OUTPUT_POLICY: ImageModelOutputPolicy = {
    defaultAspectRatio: '1:1',
    defaultBatchSize: 1,
    maxReferenceImages: 5,
    aspectRatios: pickAspectRatios('1:1', '4:3', '3:4', '16:9', '9:16'),
    batchSizes: buildBatchSizeOptions(4, 1)
};

const IMAGE_MODEL_OUTPUT_POLICY_MAP: Record<string, ImageModelOutputPolicy> = {
    'gemini-3-flash-image': DEFAULT_OUTPUT_POLICY,
    'gemini-3-pro-image-preview': {
        defaultAspectRatio: '1:1',
        defaultBatchSize: 1,
        maxReferenceImages: 5,
        aspectRatios: pickAspectRatios('1:1', '4:3', '3:4', '16:9', '9:16'),
        batchSizes: buildBatchSizeOptions(2, 1)
    },
    'gemini-2.5-flash-image': {
        defaultAspectRatio: '1:1',
        defaultBatchSize: 1,
        maxReferenceImages: 5,
        aspectRatios: pickAspectRatios('1:1', '4:3', '3:4', '16:9', '9:16'),
        batchSizes: buildBatchSizeOptions(4, 1)
    },
    'black-forest-labs/flux-kontext-pro': {
        defaultAspectRatio: '1:1',
        defaultBatchSize: 1,
        maxReferenceImages: 5,
        aspectRatios: pickAspectRatios('1:1', '4:3', '3:4', '16:9', '9:16'),
        batchSizes: buildBatchSizeOptions(2, 1)
    },
    'black-forest-labs/flux-kontext-max': {
        defaultAspectRatio: '1:1',
        defaultBatchSize: 1,
        maxReferenceImages: 5,
        aspectRatios: pickAspectRatios('1:1', '4:3', '3:4', '16:9', '9:16'),
        batchSizes: buildBatchSizeOptions(2, 1)
    },
    'black-forest-labs/flux-fill-pro': {
        defaultAspectRatio: '1:1',
        defaultBatchSize: 1,
        maxReferenceImages: 5,
        aspectRatios: pickAspectRatios('1:1', '4:3', '3:4', '16:9', '9:16'),
        batchSizes: buildBatchSizeOptions(1, 1)
    },
    'doubao-seedream-3-0-t2i-250415': {
        defaultAspectRatio: '1:1',
        defaultBatchSize: 1,
        maxReferenceImages: 5,
        aspectRatios: pickAspectRatios('1:1', '4:3', '3:4', '16:9', '9:16', '21:9'),
        batchSizes: buildBatchSizeOptions(4, 1)
    }
};

export const IMAGE_PANEL_SCHEMA: ImagePanelSchema = {
    sections: ['reference', 'prompt', 'style', 'output', 'advanced', 'generate'],
    generationRule: {
        allOf: [{ key: 'prompt' }]
    }
};

const evaluateRequirement = (
    requirement: ImagePanelGenerationRequirement,
    state: ImagePanelRuntimeState
): boolean => {
    switch (requirement.key) {
        case 'prompt':
            return state.hasPrompt;
        case 'reference_image':
            return state.hasReferenceImage;
        default:
            return false;
    }
};

const evaluateRule = (
    state: ImagePanelRuntimeState,
    rule: ImagePanelSchema['generationRule']
): boolean => {
    const allOf = rule.allOf || [];
    const anyOf = rule.anyOf || [];
    const allPassed = allOf.every((requirement) => evaluateRequirement(requirement, state));
    const anyPassed =
        anyOf.length === 0 ||
        anyOf.some((requirement) => evaluateRequirement(requirement, state));
    return allPassed && anyPassed;
};

export const createImagePanelRuntimeState = (
    config: ImageGenerationConfig,
    isGenerating: boolean
): ImagePanelRuntimeState => {
    const referenceImages = (config.referenceImages || []).filter(
        (item: unknown): item is string => typeof item === 'string' && item.length > 0
    );
    const fallbackReferenceImage =
        typeof config.referenceImage === 'string' && config.referenceImage.length > 0
            ? config.referenceImage
            : null;
    const referenceCount =
        referenceImages.length > 0 ? referenceImages.length : fallbackReferenceImage ? 1 : 0;

    return {
        isGenerating,
        hasPrompt: config.prompt.trim().length > 0,
        hasReferenceImage: referenceCount > 0,
        referenceCount
    };
};

export const canGenerateByImagePanelSchema = (
    state: ImagePanelRuntimeState
): boolean => {
    if (state.isGenerating) {
        return false;
    }
    return evaluateRule(state, IMAGE_PANEL_SCHEMA.generationRule);
};

const resolveActiveAspectRatioOptions = (
    policy: ImageModelOutputPolicy
): ImageAspectRatioOption[] => {
    return policy.aspectRatios.filter((item) => item.enabled !== false);
};

const resolveActiveBatchSizeOptions = (
    policy: ImageModelOutputPolicy
): ImageBatchSizeOption[] => {
    return policy.batchSizes.filter((item) => item.enabled !== false);
};

export const resolveImageOutputPolicy = (model: string): ImageModelOutputPolicy => {
    return IMAGE_MODEL_OUTPUT_POLICY_MAP[model] || DEFAULT_OUTPUT_POLICY;
};

export const getNearestSupportedAspectRatio = (
    model: string,
    aspectRatio?: ImageAspectRatio
): ImageAspectRatio => {
    const policy = resolveImageOutputPolicy(model);
    const ratioOptions = resolveActiveAspectRatioOptions(policy);
    if (ratioOptions.length === 0) {
        return policy.defaultAspectRatio;
    }
    if (aspectRatio && ratioOptions.some((item) => item.id === aspectRatio)) {
        return aspectRatio;
    }
    const recommended = ratioOptions.find((item) => item.recommended);
    return recommended?.id || ratioOptions[0].id;
};

export const getNearestSupportedBatchSize = (
    model: string,
    batchSize?: number
): number => {
    const policy = resolveImageOutputPolicy(model);
    const sizeOptions = resolveActiveBatchSizeOptions(policy);
    if (sizeOptions.length === 0) {
        return policy.defaultBatchSize;
    }

    if (
        typeof batchSize === 'number' &&
        sizeOptions.some((item) => item.id === batchSize)
    ) {
        return batchSize;
    }

    if (typeof batchSize === 'number') {
        let nearest = sizeOptions[0].id;
        let nearestDiff = Math.abs(sizeOptions[0].id - batchSize);
        sizeOptions.forEach((item) => {
            const diff = Math.abs(item.id - batchSize);
            if (diff < nearestDiff) {
                nearest = item.id;
                nearestDiff = diff;
            }
        });
        return nearest;
    }

    const recommended = sizeOptions.find((item) => item.recommended);
    return recommended?.id || sizeOptions[0].id;
};

export const getImageOutputConfigPatch = (
    model: string,
    config: ImageGenerationConfig
): Partial<ImageGenerationConfig> | null => {
    const outputPolicy = resolveImageOutputPolicy(model);
    const nextAspectRatio = getNearestSupportedAspectRatio(model, config.aspectRatio);
    const nextBatchSize = getNearestSupportedBatchSize(model, config.batchSize);
    const configReferenceImages = (config.referenceImages || []).filter(
        (item: unknown): item is string => typeof item === 'string' && item.length > 0
    );
    const fallbackReferenceImage =
        typeof config.referenceImage === 'string' && config.referenceImage.length > 0
            ? config.referenceImage
            : null;
    const mergedReferenceImages =
        configReferenceImages.length > 0
            ? configReferenceImages
            : fallbackReferenceImage
                ? [fallbackReferenceImage]
                : [];
    const normalizedReferenceImages = Array.from(new Set(mergedReferenceImages)).slice(
        0,
        outputPolicy.maxReferenceImages
    );
    const normalizedReferenceImage = normalizedReferenceImages[0];

    const patch: Partial<ImageGenerationConfig> = {};
    if (config.aspectRatio !== nextAspectRatio) {
        patch.aspectRatio = nextAspectRatio;
    }
    if (config.batchSize !== nextBatchSize) {
        patch.batchSize = nextBatchSize;
    }
    if (
        normalizedReferenceImages.length !== configReferenceImages.length ||
        normalizedReferenceImages.some((item, index) => configReferenceImages[index] !== item)
    ) {
        patch.referenceImages = normalizedReferenceImages;
    }
    if (config.referenceImage !== normalizedReferenceImage) {
        patch.referenceImage = normalizedReferenceImage;
    }

    return Object.keys(patch).length > 0 ? patch : null;
};
