import {
    createImageInputResourceRef,
    ImageGenerationConfig,
    resolveGeneratedImageResultUrl,
    resolveImageInputResourceKey,
    resolveImageInputResourcePath,
    resolveImageInputResourceUrl,
    type GeneratedImageResult,
    type ImageEditRequest,
    type ImageInputResourceRef,
} from '../entities';
export type GenerationConfig = ImageGenerationConfig;
import {
    importAssetBySdk,
    resolveAssetPrimaryUrlBySdk,
} from '@sdkwork/magic-studio-assets/services';
import { resolveAssetUrlByAssetIdFirst } from '@sdkwork/magic-studio-assets/asset-center';
import {
    type AgiGenerationMode,
    type GenerationOutcome,
    type MediaInputRef
} from '@sdkwork/magic-studio-types/agi';
import {
    isRenderableInputResourceUrl,
} from '@sdkwork/magic-studio-types/input-resource';
import {
    createGenerationOutcome,
} from '@sdkwork/magic-studio-core/ai';
import {
    assertRuntimeMagicStudioExecutionOperationReady,
    createRuntimeMagicStudioServerClient,
    readDefaultPlatformRuntime,
} from '@sdkwork/magic-studio-core/sdk';
import {
    inlineDataService,
    waitForCanonicalTaskResult,
} from '@sdkwork/magic-studio-core/services';
import type {
    MagicStudioGenerationArtifact,
    MagicStudioGenerationPromptEnhanceRequest,
    MagicStudioGenerationPromptEnhanceResult,
    MagicStudioGenerationTask,
    MagicStudioImageEditRequest,
    MagicStudioImageGenerationRequest,
    MagicStudioImageUpscaleRequest,
} from '@sdkwork/magic-studio-server';
import {
    readAssetRecordMetadataValue,
    resolveAssetRecordAssetUuid,
    resolveAssetRecordClientUuid,
} from '@sdkwork/magic-studio-commons/utils/assetIdentity';
import { readImageExecutionTargetFromConfig } from './imageExecutionTarget';

let genAIAdapterOverride: GenAIAdapter | null = null;
let assetServiceAdapterOverride: AssetServiceAdapter | null = null;

interface ApiEnvelope<T> {
    data?: T;
    code?: string | number;
    msg?: string;
    message?: string;
}

type ImageServerClient = ReturnType<typeof createRuntimeMagicStudioServerClient>;

export interface ImageEditExecutionInput extends ImageEditRequest {
    prompt?: string;
    model?: string;
    strength?: number;
    format?: string;
    n?: number;
}

export interface ImageUpscaleExecutionInput {
    source: GeneratedImageResult;
    mode?: 'upscale';
    mask?: string | null;
    prompt?: string;
    model?: string;
    scale?: 2 | 3 | 4;
    targetWidth?: number;
    targetHeight?: number;
    format?: string;
    n?: number;
}

interface ImageOutcomeContext {
    prompt: string;
    negativePrompt?: string;
    model?: string;
    width?: number;
    height?: number;
    aspectRatio?: string;
    steps?: number;
    guidance?: number;
    seed?: number;
    style?: string;
    quality?: string;
    inputRefs: MediaInputRef[];
    mode: AgiGenerationMode;
    parameters?: Record<string, unknown>;
    providerPayload?: Record<string, unknown>;
}

const TASK_POLL_INTERVAL_MS = 1200;
const TASK_POLL_MAX_ATTEMPTS = 15;
const SUCCESS_CODES = new Set(['0', '200', '2000']);

const unwrapApiData = (
    payload: unknown,
    fallbackMessage: string
): unknown => {
    if (!payload) {
        return undefined;
    }

    if (typeof payload === 'object') {
        const envelope = payload as ApiEnvelope<unknown>;
        const isEnvelope =
            'data' in envelope ||
            'code' in envelope ||
            'msg' in envelope ||
            'message' in envelope;
        if (!isEnvelope) {
            return payload;
        }

        const code = safeIdString(envelope.code);
        if (code && !SUCCESS_CODES.has(code)) {
            throw new Error(
                normalizeString(envelope.msg) ||
                normalizeString(envelope.message) ||
                fallbackMessage
            );
        }
        if (envelope.data !== undefined) {
            return envelope.data;
        }
        return undefined;
    }

    return payload;
};

const normalizeString = (value: unknown): string | null => {
    if (typeof value !== 'string') {
        return null;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
};

const safeIdString = (value: unknown): string => {
    if (typeof value === 'string' && value.trim().length > 0) {
        return value.trim();
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
        return String(value);
    }
    return '';
};

const toOptionalNumber = (value: unknown): number | undefined => {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
    }
    if (typeof value === 'string' && value.trim().length > 0) {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) {
            return parsed;
        }
    }
    return undefined;
};

const pickFirstString = (...values: unknown[]): string | null => {
    for (const value of values) {
        const normalized = normalizeString(value);
        if (normalized) {
            return normalized;
        }
    }
    return null;
};

const mapTaskStatus = (
    status?: MagicStudioGenerationTask['status']
): 'queued' | 'processing' | 'succeeded' | 'failed' | 'cancelled' => {
    switch ((status || '').toLowerCase()) {
        case 'processing':
            return 'processing';
        case 'succeeded':
            return 'succeeded';
        case 'failed':
            return 'failed';
        case 'cancelled':
            return 'cancelled';
        case 'queued':
        default:
            return 'queued';
    }
};

const isTerminalStatus = (task?: MagicStudioGenerationTask): boolean => {
    const normalized = (task?.status || '').toLowerCase();
    return normalized === 'succeeded' || normalized === 'failed' || normalized === 'cancelled';
};

const mapImageInputRefToMediaInputRef = (
    ref: ImageInputResourceRef,
    role: MediaInputRef['role'] = 'reference'
): MediaInputRef => {
    const renderableUrl = normalizeString(ref.url);
    const { url: _url, ...refWithoutUrl } = ref;

    return {
        ...refWithoutUrl,
        assetId: ref.assetId ?? null,
        assetUuid: ref.assetUuid ?? null,
        primaryResourceId: ref.primaryResourceId ?? null,
        primaryResourceUuid: ref.primaryResourceUuid ?? null,
        resourceViewId: ref.resourceViewId ?? null,
        resourceViewUuid: ref.resourceViewUuid ?? null,
        ...(renderableUrl && isRenderableInputResourceUrl(renderableUrl)
            ? { url: renderableUrl }
            : {}),
        type: 'image',
        role,
        resource: ref.resource ? { ...ref.resource } : undefined,
    };
};

const collectReferenceInputs = (
    config: ImageGenerationConfig
): ImageInputResourceRef[] => {
    const references =
        config.referenceImages && config.referenceImages.length > 0
            ? config.referenceImages
            : config.referenceImage
                ? [config.referenceImage]
                : [];

    const unique = new Map<string, ImageInputResourceRef>();
    references.forEach((ref) => {
        const key = resolveImageInputResourceKey(ref);
        if (!key) {
            return;
        }
        unique.set(key, ref);
    });

    return Array.from(unique.values());
};

export const buildImageInputRefs = (
    config: ImageGenerationConfig
): MediaInputRef[] => collectReferenceInputs(config).map((ref) => mapImageInputRefToMediaInputRef(ref));

export const resolveImageGenerationSource = async (
    source: string | ImageInputResourceRef
): Promise<string | null> => {
    if (typeof source === 'string') {
        const trimmed = source.trim();
        if (!trimmed) {
            return null;
        }

        if (isRenderableInputResourceUrl(trimmed)) {
            return trimmed;
        }

        return (await resolveAssetUrlByAssetIdFirst(trimmed)) || null;
    }

    const directUrl = resolveImageInputResourceUrl(source);
    if (directUrl && isRenderableInputResourceUrl(directUrl)) {
        return directUrl;
    }

    if (source.assetId) {
        const resolvedFromAssetId = await resolveAssetUrlByAssetIdFirst({
            assetId: source.assetId,
        });
        if (resolvedFromAssetId) {
            return resolvedFromAssetId;
        }
    }

    const canonicalPath = resolveImageInputResourcePath(source);
    if (canonicalPath) {
        return (await resolveAssetUrlByAssetIdFirst(canonicalPath)) || null;
    }

    return null;
};

const toImageInputRefFromGeneratedResult = (
    source: GeneratedImageResult
): ImageInputResourceRef =>
    createImageInputResourceRef({
        id: source.id ?? null,
        uuid: source.uuid,
        assetId: source.assetId ?? null,
        assetUuid: source.assetUuid ?? null,
        primaryResourceId: source.primaryResourceId ?? null,
        primaryResourceUuid: source.primaryResourceUuid ?? null,
        resourceViewId: source.resourceViewId ?? null,
        resourceViewUuid: source.resourceViewUuid ?? null,
        path: source.resource?.path,
        url: resolveGeneratedImageResultUrl(source) || undefined,
        name: source.resource?.name,
        mimeType: source.resource?.mimeType,
        resource: source.resource ? { ...source.resource } : null,
    });

const createUploadedImageInputRef = ({
    asset,
    url,
    name,
    mimeType,
}: {
    asset: Record<string, unknown>;
    url: string;
    name: string;
    mimeType: string;
}): ImageInputResourceRef => {
    const runtimeUuid = resolveAssetRecordClientUuid(asset) || undefined;
    const assetUuid = resolveAssetRecordAssetUuid(asset) ?? null;
    const primaryResourceId = readAssetRecordMetadataValue(asset, 'primaryResourceId') ?? null;
    const primaryResourceUuid = readAssetRecordMetadataValue(asset, 'primaryResourceUuid') ?? null;
    const resourceViewId = readAssetRecordMetadataValue(asset, 'resourceViewId') ?? null;
    const resourceViewUuid = readAssetRecordMetadataValue(asset, 'resourceViewUuid') ?? null;
    const resourceUuid =
        resourceViewUuid ||
        primaryResourceUuid ||
        assetUuid ||
        runtimeUuid ||
        undefined;

    return createImageInputResourceRef({
        id: null,
        uuid: runtimeUuid,
        assetId: pickFirstString(asset.id) ?? null,
        assetUuid,
        primaryResourceId,
        primaryResourceUuid,
        resourceViewId,
        resourceViewUuid,
        path: pickFirstString(asset.path) || url,
        url,
        name,
        mimeType,
        resource: {
            id: null,
            uuid: resourceUuid,
            assetId: pickFirstString(asset.id) ?? null,
            primaryResourceId,
            resourceViewId,
            url,
            path: pickFirstString(asset.path) || url,
            name,
            mimeType,
        },
    });
};

const uploadMaskAsInputRef = async (mask: string): Promise<ImageInputResourceRef | null> => {
    const normalizedMask = normalizeString(mask);
    if (!normalizedMask) {
        return null;
    }

    const inlineData = await inlineDataService.tryExtractInlineData(normalizedMask);
    if (!inlineData) {
        return createImageInputResourceRef({
            path: normalizedMask,
            url: normalizedMask,
            name: 'mask.png',
            mimeType: 'image/png',
        });
    }

    const uploaded = await importAssetBySdk(
        {
            name: `image-edit-mask-${Date.now()}.png`,
            data: inlineData,
        },
        'image',
        { domain: 'image-studio' }
    );
    const resolvedUrl =
        (await resolveAssetPrimaryUrlBySdk(uploaded.id)) ||
        uploaded.path ||
        normalizedMask;

    return createUploadedImageInputRef({
        asset: uploaded as unknown as Record<string, unknown>,
        url: resolvedUrl,
        name: pickFirstString(uploaded.name, 'mask.png') || 'mask.png',
        mimeType: 'image/png',
    });
};

const resolveImageEditPrompt = (input: ImageEditExecutionInput): string => {
    const explicitPrompt = normalizeString(input.prompt);
    if (explicitPrompt) {
        return explicitPrompt;
    }

    const sourcePrompt = normalizeString(input.source.prompt);
    switch (input.mode) {
        case 'remove':
            return sourcePrompt
                ? `Remove the masked content and reconstruct the area naturally while preserving the original style. Source style: ${sourcePrompt}`
                : 'Remove the masked content and reconstruct the area naturally while preserving the original style.';
        case 'outpaint':
            return sourcePrompt
                ? `Extend the image beyond the current frame while preserving the original style. Source style: ${sourcePrompt}`
                : 'Extend the image beyond the current frame while preserving the original style.';
        case 'inpaint':
        default:
            return sourcePrompt
                ? `Regenerate the masked area so it blends naturally with the original style. Source style: ${sourcePrompt}`
                : 'Regenerate the masked area so it blends naturally with the surrounding image.';
    }
};

const resolveImageUpscalePrompt = (input: ImageUpscaleExecutionInput): string =>
    normalizeString(input.prompt) ||
    'Upscale the source image while preserving details and overall composition.';

const mapEditModeToOutcomeMode = (
    mode: ImageEditExecutionInput['mode']
): AgiGenerationMode => {
    switch (mode) {
        case 'outpaint':
            return 'outpaint';
        case 'remove':
        case 'inpaint':
        default:
            return 'inpaint';
    }
};

const readRecordString = (
    record: Record<string, unknown> | undefined,
    key: string
): string | null => normalizeString(record?.[key]);

const readRecordNumber = (
    record: Record<string, unknown> | undefined,
    key: string
): number | undefined => toOptionalNumber(record?.[key]);

const hasRenderableImageArtifactUrl = (
    artifact: MagicStudioGenerationArtifact | null | undefined
): artifact is MagicStudioGenerationArtifact => Boolean(normalizeString(artifact?.url));

const resolvePrimaryImageArtifact = (
    task: MagicStudioGenerationTask
): MagicStudioGenerationArtifact | null => {
    if (hasRenderableImageArtifactUrl(task.primaryArtifact)) {
        return task.primaryArtifact;
    }

    return (
        task.artifacts.find(
            (artifact) => artifact.type === 'image' && hasRenderableImageArtifactUrl(artifact)
        ) ||
        task.artifacts.find((artifact) => hasRenderableImageArtifactUrl(artifact)) ||
        null
    );
};

const resolveImageDimensions = (
    artifact?: MagicStudioGenerationArtifact | null
): { width?: number; height?: number; aspectRatio?: string } => {
    if (!artifact) {
        return {};
    }

    return {
        width: toOptionalNumber(artifact.width),
        height: toOptionalNumber(artifact.height),
        aspectRatio: readRecordString(artifact.metadata, 'aspectRatio') ?? undefined,
    };
};

const buildImageOutcomeFromTask = (
    task: MagicStudioGenerationTask,
    context: ImageOutcomeContext
): GenerationOutcome => {
    const primaryArtifact = resolvePrimaryImageArtifact(task);
    const primaryUrl = normalizeString(primaryArtifact?.url);

    if (!primaryArtifact || !primaryUrl) {
        throw new Error(task.errorMessage || 'Image generation did not return a primary artifact url');
    }

    const dimensions = resolveImageDimensions(primaryArtifact);
    const seed = context.seed ?? readRecordNumber(task.parameters, 'seed');
    const aspectRatio =
        context.aspectRatio ??
        readRecordString(task.parameters, 'aspectRatio') ??
        dimensions.aspectRatio ??
        null;

    return createGenerationOutcome({
        product: 'image',
        mode: context.mode,
        provider: task.provider || 'runtime-image',
        providerModel: task.providerModel || context.model || 'image-generation',
        prompt: task.prompt ?? context.prompt,
        negativePrompt: task.negativePrompt ?? context.negativePrompt,
        parameters: {
            aspectRatio,
            width: context.width ?? readRecordNumber(task.parameters, 'width') ?? dimensions.width ?? null,
            height: context.height ?? readRecordNumber(task.parameters, 'height') ?? dimensions.height ?? null,
            steps: context.steps ?? readRecordNumber(task.parameters, 'steps') ?? null,
            guidance: context.guidance ?? readRecordNumber(task.parameters, 'guidance') ?? null,
            seed: seed ?? null,
            style: context.style ?? readRecordString(task.parameters, 'style') ?? null,
            model: context.model ?? task.providerModel ?? null,
            quality: context.quality ?? readRecordString(task.parameters, 'quality') ?? null,
            referenceCount: context.inputRefs.length,
            ...(task.parameters || {}),
            ...(context.parameters || {}),
        },
        providerPayload: {
            ...(task.providerPayload || {}),
            requestedModel: context.model ?? null,
            quality: context.quality ?? null,
            style: context.style ?? null,
            taskProduct: task.product,
            taskMode: task.mode,
            taskStatus: task.status ?? null,
            ...(context.providerPayload || {}),
        },
        remoteJobId: task.remoteJobId || safeIdString(task.taskId) || null,
        status: mapTaskStatus(task.status),
        progress: typeof task.progress === 'number' ? task.progress : undefined,
        artifact: {
            type: 'image',
            url: primaryUrl,
            mimeType: primaryArtifact.mimeType || 'image/png',
            name:
                primaryArtifact.name ||
                `generated-image-${safeIdString(task.taskId) || Date.now()}.png`,
            width: dimensions.width ?? context.width,
            height: dimensions.height ?? context.height,
            metadata: {
                ...(primaryArtifact.metadata || {}),
                aspectRatio,
                negativePrompt: task.negativePrompt ?? context.negativePrompt ?? null,
                quality: context.quality ?? null,
                style: context.style ?? null,
                seed: seed ?? null,
            },
        },
        inputRefs: context.inputRefs,
    });
};

const pollTaskResult = async (
    taskId: string,
    serverClient: ImageServerClient,
    timeoutMessage: string
): Promise<MagicStudioGenerationTask | null> => {
    return waitForCanonicalTaskResult({
        taskId,
        readTask: async (readTaskId) => {
            const response = await serverClient.readImageGenerationTask(readTaskId);
            return unwrapApiData(
                response as ApiEnvelope<MagicStudioGenerationTask> | MagicStudioGenerationTask,
                'Failed to load image generation task status.'
            ) as MagicStudioGenerationTask | undefined;
        },
        shouldReturnTask: isTerminalStatus,
        waitMs: TASK_POLL_INTERVAL_MS,
        maxAttempts: TASK_POLL_MAX_ATTEMPTS,
        timeoutMessage,
    });
};

const resolveEnhancedPrompt = (
    payload:
        | MagicStudioGenerationPromptEnhanceResult
        | ApiEnvelope<MagicStudioGenerationPromptEnhanceResult>
        | undefined
): string => {
    const data = unwrapApiData(
        payload as
            | MagicStudioGenerationPromptEnhanceResult
            | ApiEnvelope<MagicStudioGenerationPromptEnhanceResult>
            | undefined,
        'Failed to enhance image prompt.'
    ) as MagicStudioGenerationPromptEnhanceResult | undefined;
    const prompt = normalizeString(data?.prompt);
    if (!prompt) {
        throw new Error('Image prompt enhancement returned an empty prompt');
    }
    return prompt;
};

const getImageServerClient = (): ImageServerClient => {
    const runtime = readDefaultPlatformRuntime('ImageService');
    return createRuntimeMagicStudioServerClient(runtime);
};

const assertImageTaskSucceeded = (
    task: MagicStudioGenerationTask | null | undefined,
    fallbackMessage: string
): MagicStudioGenerationTask => {
    if (!task) {
        throw new Error(fallbackMessage);
    }

    const status = (task.status || '').toLowerCase();
    if (status === 'failed' || status === 'cancelled') {
        throw new Error(task.errorMessage || fallbackMessage);
    }

    return task;
};

export const imageService = {
    isConfigured: () => true,

    generateImage: async (config: GenerationConfig): Promise<GenerationOutcome> => {
        if (genAIAdapterOverride) {
            return genAIAdapterOverride.generateImage(config);
        }

        const inputRefs = buildImageInputRefs(config);
        const generationTarget = readImageExecutionTargetFromConfig(config, {
            resolvedReferenceAssetCount: inputRefs.length,
        });
        const shouldUseVariationEndpoint = generationTarget.operation === 'variation';
        await assertRuntimeMagicStudioExecutionOperationReady(
            'image-generation',
            generationTarget.operation,
            { feature: 'ImageService' }
        );

        const serverClient = getImageServerClient();
        const requestBody: MagicStudioImageGenerationRequest = {
            prompt: config.prompt,
            negativePrompt: config.negativePrompt,
            model: config.model,
            width: config.width,
            height: config.height,
            quality: config.quality,
            style: config.style,
            styleId: config.styleId,
            steps: config.steps,
            guidance: config.guidance,
            aspectRatio: config.aspectRatio,
            seed: config.seed,
            batchSize: config.batchSize,
            useMultiModel: config.useMultiModel,
            models: config.models,
            mediaType: config.mediaType,
            ...(inputRefs.length > 0
                ? {
                    referenceImages: inputRefs,
                }
                : {}),
        };

        const response = shouldUseVariationEndpoint
            ? await serverClient.createImageVariationTask(requestBody)
            : await serverClient.createImageGenerationTask(requestBody);

        const task = assertImageTaskSucceeded(
            unwrapApiData(
                response as ApiEnvelope<MagicStudioGenerationTask> | MagicStudioGenerationTask,
                'Failed to start image generation.'
            ) as MagicStudioGenerationTask | undefined,
            'Image generation did not return a task payload'
        );

        if (resolvePrimaryImageArtifact(task)) {
            return buildImageOutcomeFromTask(task, {
                prompt: config.prompt,
                negativePrompt: config.negativePrompt,
                model: config.model,
                width: config.width,
                height: config.height,
                aspectRatio: config.aspectRatio,
                steps: config.steps,
                guidance: config.guidance,
                seed: config.seed,
                style: config.style,
                quality: config.quality,
                inputRefs,
                mode: shouldUseVariationEndpoint
                    ? 'variation'
                    : inputRefs.length > 0
                        ? 'image-to-image'
                        : 'text-to-image',
            });
        }

        const taskId = safeIdString(task.taskId);
        if (!taskId) {
            throw new Error(task.errorMessage || 'Image generation did not return a task id');
        }

        const finalTask = assertImageTaskSucceeded(
            await pollTaskResult(
                taskId,
                serverClient,
                'Image generation timed out before output became available'
            ),
            'Image generation timed out before output became available'
        );

        return buildImageOutcomeFromTask(finalTask, {
            prompt: config.prompt,
            negativePrompt: config.negativePrompt,
            model: config.model,
            width: config.width,
            height: config.height,
            aspectRatio: config.aspectRatio,
            steps: config.steps,
            guidance: config.guidance,
            seed: config.seed,
            style: config.style,
            quality: config.quality,
            inputRefs,
            mode: shouldUseVariationEndpoint
                ? 'variation'
                : inputRefs.length > 0
                    ? 'image-to-image'
                    : 'text-to-image',
        });
    },

    editImage: async (input: ImageEditExecutionInput): Promise<GenerationOutcome> => {
        if (genAIAdapterOverride?.editImage) {
            return genAIAdapterOverride.editImage(input);
        }

        await assertRuntimeMagicStudioExecutionOperationReady(
            'image-generation',
            'edit',
            { feature: 'ImageService' }
        );

        const serverClient = getImageServerClient();

        const sourceRef = toImageInputRefFromGeneratedResult(input.source);
        const maskRef = input.mask ? await uploadMaskAsInputRef(input.mask) : null;
        const sourceInputRef = mapImageInputRefToMediaInputRef(sourceRef, 'source-image');
        const maskInputRef = maskRef ? mapImageInputRefToMediaInputRef(maskRef, 'mask') : null;
        const prompt = resolveImageEditPrompt(input);
        const requestBody: MagicStudioImageEditRequest = {
            source: sourceInputRef,
            ...(maskInputRef ? { mask: maskInputRef } : {}),
            prompt,
            negativePrompt: input.source.negativePrompt,
            model: input.model,
            strength: input.strength ?? 1,
            format: input.format ?? 'png',
            n: input.n ?? 1,
            width: input.source.width,
            height: input.source.height,
        };
        const response = await serverClient.createImageEditTask(requestBody);

        const task = assertImageTaskSucceeded(
            unwrapApiData(
                response as ApiEnvelope<MagicStudioGenerationTask> | MagicStudioGenerationTask,
                'Failed to start image edit.'
            ) as MagicStudioGenerationTask | undefined,
            'Image edit did not return a task payload'
        );

        const inputRefs = [
            sourceInputRef,
            ...(maskInputRef ? [maskInputRef] : []),
        ];
        const buildOutcome = (resolvedTask: MagicStudioGenerationTask): GenerationOutcome =>
            buildImageOutcomeFromTask(resolvedTask, {
                prompt,
                negativePrompt: input.source.negativePrompt,
                model: input.model,
                width: input.source.width,
                height: input.source.height,
                inputRefs,
                mode: mapEditModeToOutcomeMode(input.mode),
                parameters: {
                    editorAction: input.mode,
                    strength: input.strength ?? 1,
                    format: input.format ?? 'png',
                    n: input.n ?? 1,
                    referenceCount: 1,
                    maskAssetCount: maskInputRef ? 1 : 0,
                },
                providerPayload: {
                    editMode: input.mode,
                },
            });

        if (resolvePrimaryImageArtifact(task)) {
            return buildOutcome(task);
        }

        const taskId = safeIdString(task.taskId);
        if (!taskId) {
            throw new Error(task.errorMessage || 'Image edit did not return a task id');
        }

        const finalTask = assertImageTaskSucceeded(
            await pollTaskResult(
                taskId,
                serverClient,
                'Image edit timed out before output became available'
            ),
            'Image edit timed out before output became available'
        );

        return buildOutcome(finalTask);
    },

    upscaleImage: async (input: ImageUpscaleExecutionInput): Promise<GenerationOutcome> => {
        if (genAIAdapterOverride?.upscaleImage) {
            return genAIAdapterOverride.upscaleImage(input);
        }

        await assertRuntimeMagicStudioExecutionOperationReady(
            'image-generation',
            'upscale',
            { feature: 'ImageService' }
        );

        const serverClient = getImageServerClient();

        const sourceRef = toImageInputRefFromGeneratedResult(input.source);
        const sourceInputRef = mapImageInputRefToMediaInputRef(sourceRef, 'source-image');
        const prompt = resolveImageUpscalePrompt(input);
        const requestBody: MagicStudioImageUpscaleRequest = {
            source: sourceInputRef,
            prompt,
            negativePrompt: input.source.negativePrompt,
            model: input.model,
            scale: input.scale ?? 2,
            targetWidth: input.targetWidth,
            targetHeight: input.targetHeight,
            format: input.format ?? 'png',
            n: input.n ?? 1,
        };
        const response = await serverClient.createImageUpscaleTask(requestBody);

        const task = assertImageTaskSucceeded(
            unwrapApiData(
                response as ApiEnvelope<MagicStudioGenerationTask> | MagicStudioGenerationTask,
                'Failed to start image upscale.'
            ) as MagicStudioGenerationTask | undefined,
            'Image upscale did not return a task payload'
        );

        const inputRefs = [sourceInputRef];
        const buildOutcome = (resolvedTask: MagicStudioGenerationTask): GenerationOutcome =>
            buildImageOutcomeFromTask(resolvedTask, {
                prompt,
                negativePrompt: input.source.negativePrompt,
                model: input.model,
                width: input.targetWidth ?? input.source.width,
                height: input.targetHeight ?? input.source.height,
                inputRefs,
                mode: 'upscale',
                parameters: {
                    scale: input.scale ?? 2,
                    targetWidth: input.targetWidth ?? null,
                    targetHeight: input.targetHeight ?? null,
                    format: input.format ?? 'png',
                    n: input.n ?? 1,
                },
                providerPayload: {
                    scale: input.scale ?? 2,
                },
            });

        if (resolvePrimaryImageArtifact(task)) {
            return buildOutcome(task);
        }

        const taskId = safeIdString(task.taskId);
        if (!taskId) {
            throw new Error(task.errorMessage || 'Image upscale did not return a task id');
        }

        const finalTask = assertImageTaskSucceeded(
            await pollTaskResult(
                taskId,
                serverClient,
                'Image upscale timed out before output became available'
            ),
            'Image upscale timed out before output became available'
        );

        return buildOutcome(finalTask);
    },

    enhancePrompt: async (simplePrompt: string): Promise<string> => {
        if (genAIAdapterOverride) {
            return genAIAdapterOverride.enhancePrompt(simplePrompt);
        }

        const serverClient = getImageServerClient();
        const requestBody = {
            prompt: simplePrompt,
            scene: 'image-generation',
            maxWords: 100,
        } satisfies MagicStudioGenerationPromptEnhanceRequest;
        const response = await serverClient.enhanceImageGenerationPrompt(requestBody);

        return resolveEnhancedPrompt(response);
    }
};

// Adapter types for dependency injection
export interface GenAIAdapter {
    generateImage: (config: GenerationConfig) => Promise<GenerationOutcome>;
    editImage?: (input: ImageEditExecutionInput) => Promise<GenerationOutcome>;
    enhancePrompt: (prompt: string) => Promise<string>;
    upscaleImage?: (input: ImageUpscaleExecutionInput) => Promise<GenerationOutcome>;
}

export interface AssetServiceAdapter {
    saveAsset: (data: unknown) => Promise<unknown>;
}

// Adapter setters for testing and mocking (stub implementations)
export function setGenAIAdapter(_adapter: GenAIAdapter | null) {
    genAIAdapterOverride = _adapter;
}

export function setAssetServiceAdapter(_adapter: AssetServiceAdapter | null) {
    assetServiceAdapterOverride = _adapter;
}

export function getGenAIAdapter(): GenAIAdapter | null {
    return genAIAdapterOverride;
}

export function getAssetServiceAdapter(): AssetServiceAdapter | null {
    return assetServiceAdapterOverride;
}
