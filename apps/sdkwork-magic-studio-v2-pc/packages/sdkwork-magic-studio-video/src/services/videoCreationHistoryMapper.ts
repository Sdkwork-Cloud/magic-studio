import type {
  CanonicalCreationHistoryMapper,
} from '@sdkwork/magic-studio-generation-history';
import { MediaResourceType } from '@sdkwork/magic-studio-types/vocabulary';

import {
  createGeneratedVideoResult,
  createVideoInputResourceRef,
  createVideoTask,
  type GeneratedVideoResult,
  type VideoConfig,
  type VideoInputResourceRef,
  type VideoTask,
} from '../entities';

const VIDEO_STANDARD_CONFIG_FIELDS = new Set([
  'prompt',
  'mediaType',
  'aspectRatio',
  'model',
  'useMultiModel',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0
    ? value.trim()
    : undefined;
}

function readBoolean(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined;
}

function readNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function readStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const items = value
    .map((item) => readString(item))
    .filter((item): item is string => Boolean(item));
  return items.length > 0 ? items : undefined;
}

function readTypedString<T extends string | undefined>(value: unknown): T {
  return readString(value) as T;
}

function toVideoConfigMode(value: unknown): VideoConfig['mode'] | undefined {
  const mode = readString(value);
  if (!mode) {
    return undefined;
  }

  if (mode === 'style-transfer') {
    return 'video-to-video';
  }

  return mode as VideoConfig['mode'];
}

function toIsoTimestamp(value: string | number | null | undefined): string | undefined {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return new Date(value).toISOString();
  }
  return undefined;
}

function toVideoTaskStatus(status: string): VideoTask['status'] {
  switch (status) {
    case 'completed':
      return 'completed';
    case 'failed':
    case 'cancelled':
      return 'failed';
    case 'processing':
    case 'draft':
    case 'pending':
    default:
      return 'pending';
  }
}

function toMediaResourceType(
  value: unknown,
  fallback: MediaResourceType,
): MediaResourceType {
  return typeof value === 'string'
    && Object.values(MediaResourceType).includes(value as MediaResourceType)
    ? (value as MediaResourceType)
    : fallback;
}

function toVideoInputRef(value: unknown, fallbackType: VideoInputResourceRef['type']) {
  if (!isRecord(value)) {
    return undefined;
  }

  const type = value.type;
  const resolvedType =
    type === 'audio' || type === 'video' || type === 'image'
      ? type
      : fallbackType;

  return createVideoInputResourceRef({
    ...value,
    type: resolvedType,
  });
}

function toVideoInputRefArray(
  value: unknown,
  fallbackType: VideoInputResourceRef['type'],
) {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const items = value
    .map((item) => toVideoInputRef(item, fallbackType))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  return items.length > 0 ? items : undefined;
}

function toCreationHistoryResource(
  resource: GeneratedVideoResult['resource'] | GeneratedVideoResult['coverResource'],
) {
  if (!resource) {
    return undefined;
  }

  return {
    id: typeof resource.id === 'string' ? resource.id : undefined,
    uuid: resource.uuid,
    assetId: resource.assetId,
    assetUuid: resource.assetUuid,
    primaryResourceId: resource.primaryResourceId,
    primaryResourceUuid: resource.primaryResourceUuid,
    resourceViewId: resource.resourceViewId,
    resourceViewUuid: resource.resourceViewUuid,
    type: resource.type,
    path: resource.path,
    url: resource.url,
    mimeType: resource.mimeType,
    name: resource.name,
    metadata: {
      ...(isRecord(resource.metadata) ? resource.metadata : {}),
      ...('duration' in resource && typeof resource.duration !== 'undefined'
        ? { duration: resource.duration }
        : {}),
      ...('width' in resource && typeof resource.width !== 'undefined'
        ? { width: resource.width }
        : {}),
      ...('height' in resource && typeof resource.height !== 'undefined'
        ? { height: resource.height }
        : {}),
      ...('fps' in resource && typeof resource.fps !== 'undefined'
        ? { fps: resource.fps }
        : {}),
      ...('resolution' in resource && typeof resource.resolution !== 'undefined'
        ? { resolution: resource.resolution }
        : {}),
      ...('refAssets' in resource && typeof resource.refAssets !== 'undefined'
        ? { refAssets: resource.refAssets }
        : {}),
      ...('aspectRatio' in resource && typeof resource.aspectRatio !== 'undefined'
        ? { aspectRatio: resource.aspectRatio }
        : {}),
      ...('splitImages' in resource && typeof resource.splitImages !== 'undefined'
        ? { splitImages: resource.splitImages }
        : {}),
    },
  };
}

function toVideoResult(result: {
  id?: string | null;
  uuid?: string;
  assetId?: string | null;
  assetUuid?: string | null;
  primaryResourceId?: string | null;
  primaryResourceUuid?: string | null;
  resourceViewId?: string | null;
  resourceViewUuid?: string | null;
  artifactUuid?: string | null;
  executionId?: string | null;
  path?: string;
  url?: string;
  mimeType?: string;
  posterUrl?: string;
  modelId?: string;
  duration?: number;
  resource?: {
    id?: string | null;
    uuid?: string;
    assetId?: string | null;
    assetUuid?: string | null;
    primaryResourceId?: string | null;
    primaryResourceUuid?: string | null;
    resourceViewId?: string | null;
    resourceViewUuid?: string | null;
    type?: string;
    path?: string;
    url?: string;
    mimeType?: string;
    name?: string;
    metadata?: Record<string, unknown>;
  };
  coverResource?: {
    id?: string | null;
    uuid?: string;
    assetId?: string | null;
    assetUuid?: string | null;
    primaryResourceId?: string | null;
    primaryResourceUuid?: string | null;
    resourceViewId?: string | null;
    resourceViewUuid?: string | null;
    type?: string;
    path?: string;
    url?: string;
    mimeType?: string;
    name?: string;
    metadata?: Record<string, unknown>;
  };
}) {
  const resourceMetadata = isRecord(result.resource?.metadata)
    ? result.resource?.metadata
    : undefined;
  const coverMetadata = isRecord(result.coverResource?.metadata)
    ? result.coverResource?.metadata
    : undefined;

  return createGeneratedVideoResult({
    id: result.id ?? null,
    uuid: result.uuid,
    assetId: result.assetId ?? result.resource?.assetId ?? null,
    assetUuid: result.assetUuid ?? result.resource?.assetUuid ?? null,
    primaryResourceId: result.primaryResourceId ?? result.resource?.primaryResourceId ?? null,
    primaryResourceUuid:
      result.primaryResourceUuid ?? result.resource?.primaryResourceUuid ?? null,
    resourceViewId: result.resourceViewId ?? result.resource?.resourceViewId ?? null,
    resourceViewUuid: result.resourceViewUuid ?? result.resource?.resourceViewUuid ?? null,
    artifactUuid: result.artifactUuid ?? null,
    executionId: result.executionId ?? null,
    modelId: result.modelId,
    resource: {
      id: result.resource?.id ?? result.primaryResourceId ?? result.id ?? null,
      uuid: result.resource?.uuid ?? result.primaryResourceUuid ?? result.uuid,
      assetId: result.resource?.assetId ?? result.assetId ?? null,
      assetUuid: result.resource?.assetUuid ?? result.assetUuid ?? null,
      primaryResourceId:
        result.resource?.primaryResourceId ?? result.primaryResourceId ?? result.id ?? null,
      primaryResourceUuid:
        result.resource?.primaryResourceUuid ?? result.primaryResourceUuid ?? result.uuid,
      resourceViewId: result.resource?.resourceViewId ?? result.resourceViewId ?? null,
      resourceViewUuid: result.resource?.resourceViewUuid ?? result.resourceViewUuid ?? null,
      type: toMediaResourceType(result.resource?.type, MediaResourceType.VIDEO),
      path: result.resource?.path ?? result.path,
      url: result.resource?.url ?? result.url ?? result.path,
      mimeType: result.resource?.mimeType ?? result.mimeType,
      name:
        result.resource?.name
        || `generated-video-${result.resource?.uuid || result.resourceViewUuid || result.uuid || 'result'}`,
      metadata: resourceMetadata,
      duration: result.duration ?? readNumber(resourceMetadata?.duration),
      width: readNumber(resourceMetadata?.width),
      height: readNumber(resourceMetadata?.height),
      fps: readNumber(resourceMetadata?.fps),
      resolution: readString(resourceMetadata?.resolution),
      refAssets: Array.isArray(resourceMetadata?.refAssets)
        ? resourceMetadata.refAssets
        : undefined,
    },
    coverResource: result.coverResource
      ? {
          id: result.coverResource.id ?? null,
          uuid: result.coverResource.uuid,
          assetId: result.coverResource.assetId ?? null,
          assetUuid: result.coverResource.assetUuid ?? null,
          primaryResourceId: result.coverResource.primaryResourceId ?? null,
          primaryResourceUuid: result.coverResource.primaryResourceUuid ?? null,
          resourceViewId: result.coverResource.resourceViewId ?? null,
          resourceViewUuid: result.coverResource.resourceViewUuid ?? null,
          type: toMediaResourceType(result.coverResource.type, MediaResourceType.IMAGE),
          path: result.coverResource.path,
          url: result.coverResource.url ?? result.posterUrl,
          mimeType: result.coverResource.mimeType,
          name: result.coverResource.name || 'generated-video-cover',
          metadata: coverMetadata,
          width: readNumber(coverMetadata?.width),
          height: readNumber(coverMetadata?.height),
          aspectRatio: readString(coverMetadata?.aspectRatio),
          splitImages: Array.isArray(coverMetadata?.splitImages)
            ? coverMetadata.splitImages
            : undefined,
          refAssets: Array.isArray(coverMetadata?.refAssets)
            ? coverMetadata.refAssets
            : undefined,
        }
      : undefined,
  });
}

function toVideoConfigMetadata(task: VideoTask): Record<string, unknown> | undefined {
  const metadataEntries = Object.entries(task.config).filter(([key, value]) => (
    !VIDEO_STANDARD_CONFIG_FIELDS.has(key)
    && typeof value !== 'undefined'
    && value !== null
  ));

  const metadata: Record<string, unknown> = Object.fromEntries(metadataEntries);

  if (task.generationRequest) {
    metadata.generationRequest = task.generationRequest;
  }

  if (task.recipe) {
    metadata.recipe = task.recipe;
  }

  if (task.execution) {
    metadata.execution = task.execution;
  }

  if (task.artifactSet) {
    metadata.artifactSet = task.artifactSet;
  }

  if (typeof task.progress === 'number') {
    metadata.progress = task.progress;
  }

  if (task.stage) {
    metadata.stage = task.stage;
  }

  if (task.taskType) {
    metadata.taskType = task.taskType;
  }

  if (task.provider) {
    metadata.provider = task.provider;
  }

  if (task.remoteTaskId) {
    metadata.remoteTaskId = task.remoteTaskId;
  }

  return Object.keys(metadata).length > 0 ? metadata : undefined;
}

export const videoCreationHistoryMapper: CanonicalCreationHistoryMapper<VideoTask> = {
  product: 'video',

  fromEntry(entry) {
    const rawMetadata = isRecord(entry.config.metadata) ? entry.config.metadata : {};

    return createVideoTask({
      id: entry.id,
      uuid: entry.uuid,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
      status: toVideoTaskStatus(entry.status),
      generationRequest: isRecord(rawMetadata.generationRequest)
        ? (rawMetadata.generationRequest as unknown as VideoTask['generationRequest'])
        : undefined,
      recipe: isRecord(rawMetadata.recipe)
        ? (rawMetadata.recipe as unknown as VideoTask['recipe'])
        : undefined,
      execution: isRecord(rawMetadata.execution)
        ? (rawMetadata.execution as unknown as VideoTask['execution'])
        : undefined,
      artifactSet: isRecord(rawMetadata.artifactSet)
        ? (rawMetadata.artifactSet as unknown as VideoTask['artifactSet'])
        : undefined,
      results: Array.isArray(entry.results)
        ? entry.results.map((result) => toVideoResult(result))
        : [],
      error: readString(entry.error),
      progress: readNumber(rawMetadata.progress),
      isFavorite: Boolean(entry.isFavorite),
      stage: readString(rawMetadata.stage) as VideoTask['stage'] | undefined,
      taskType: readString(rawMetadata.taskType) as VideoTask['taskType'] | undefined,
      provider: readString(rawMetadata.provider),
      remoteTaskId: readString(rawMetadata.remoteTaskId),
      config: {
        mode: toVideoConfigMode(rawMetadata.mode) ?? 'text',
        prompt: entry.config.prompt ?? '',
        negativePrompt: readString(rawMetadata.negativePrompt),
        styleId: readString(rawMetadata.styleId) ?? 'none',
        aspectRatio:
          (entry.config.aspectRatio as VideoConfig['aspectRatio'] | undefined)
          ?? '16:9',
        resolution:
          (readString(rawMetadata.resolution) as VideoConfig['resolution'] | undefined)
          ?? '720p',
        duration:
          (readString(rawMetadata.duration) as VideoConfig['duration'] | undefined)
          ?? '5s',
        fps: (readNumber(rawMetadata.fps) as VideoConfig['fps'] | undefined) ?? 30,
        model: entry.config.model ?? readString(rawMetadata.model) ?? '',
        useMultiModel: entry.config.useMultiModel ?? readBoolean(rawMetadata.useMultiModel),
        models: readStringArray(rawMetadata.models),
        mediaType: 'video',
        batchSize: readNumber(rawMetadata.batchSize),
        image: toVideoInputRef(rawMetadata.image, 'image'),
        lastFrame: toVideoInputRef(rawMetadata.lastFrame, 'image'),
        referenceImages: toVideoInputRefArray(rawMetadata.referenceImages, 'image'),
        characterImage: toVideoInputRef(rawMetadata.characterImage, 'image'),
        voiceId: readString(rawMetadata.voiceId),
        targetVideo: toVideoInputRef(rawMetadata.targetVideo, 'video'),
        targetImage: toVideoInputRef(rawMetadata.targetImage, 'image'),
        driverAudio: toVideoInputRef(rawMetadata.driverAudio, 'audio'),
        motionVideo: toVideoInputRef(rawMetadata.motionVideo, 'video'),
        audioTrack: toVideoInputRef(rawMetadata.audioTrack, 'audio'),
        referenceVideos: toVideoInputRefArray(rawMetadata.referenceVideos, 'video'),
        shotType: readTypedString<VideoConfig['shotType']>(rawMetadata.shotType),
        promptExtend: readBoolean(rawMetadata.promptExtend),
        watermark: readBoolean(rawMetadata.watermark),
        generateAudio: readBoolean(rawMetadata.generateAudio),
        cameraFixed: readBoolean(rawMetadata.cameraFixed),
        seed: readNumber(rawMetadata.seed),
        lipSyncSourceType:
          readTypedString<VideoConfig['lipSyncSourceType']>(rawMetadata.lipSyncSourceType),
        lipSyncDriverType:
          readTypedString<VideoConfig['lipSyncDriverType']>(rawMetadata.lipSyncDriverType),
        lipSyncSyncMode:
          readTypedString<VideoConfig['lipSyncSyncMode']>(rawMetadata.lipSyncSyncMode),
        lipSyncPreset:
          readTypedString<VideoConfig['lipSyncPreset']>(rawMetadata.lipSyncPreset),
        lipSyncLipStrength: readNumber(rawMetadata.lipSyncLipStrength),
        lipSyncExpressionStrength: readNumber(rawMetadata.lipSyncExpressionStrength),
        lipSyncPreserveHeadMotion: readBoolean(rawMetadata.lipSyncPreserveHeadMotion),
        lipSyncDenoise: readBoolean(rawMetadata.lipSyncDenoise),
        lipSyncTrimSilence: readBoolean(rawMetadata.lipSyncTrimSilence),
        lipSyncTargetLufs: readNumber(rawMetadata.lipSyncTargetLufs),
        lipSyncKeepOriginalBgm: readBoolean(rawMetadata.lipSyncKeepOriginalBgm),
      },
    });
  },

  toUpsertRequest(task) {
    const completedAt =
      task.status === 'completed'
        ? toIsoTimestamp(task.updatedAt) || toIsoTimestamp(task.createdAt)
        : undefined;

    return {
      id: typeof task.id === 'string' ? task.id : undefined,
      uuid: task.uuid ?? undefined,
      product: 'video',
      source: 'imported',
      status: task.status,
      error: task.error,
      isFavorite: task.isFavorite,
      config: {
        prompt: task.config.prompt,
        mediaType: 'video',
        aspectRatio: task.config.aspectRatio,
        model: task.config.model,
        useMultiModel: task.config.useMultiModel,
        metadata: toVideoConfigMetadata(task),
      },
      results: Array.isArray(task.results)
        ? task.results.map((result) => ({
            id: typeof result.id === 'string' ? result.id : undefined,
            uuid: result.uuid,
            assetId: result.assetId,
            assetUuid: result.assetUuid,
            primaryResourceId: result.primaryResourceId,
            primaryResourceUuid: result.primaryResourceUuid,
            resourceViewId: result.resourceViewId,
            resourceViewUuid: result.resourceViewUuid,
            artifactUuid: result.artifactUuid,
            executionId: result.executionId,
            path: result.resource?.path,
            url: result.resource?.url ?? result.url,
            mimeType: result.resource?.mimeType,
            posterUrl: result.coverResource?.url ?? result.posterUrl,
            modelId: result.modelId,
            duration: result.resource?.duration,
            resource: toCreationHistoryResource(result.resource),
            coverResource: toCreationHistoryResource(result.coverResource),
          }))
        : [],
      createdAt: toIsoTimestamp(task.createdAt),
      updatedAt: toIsoTimestamp(task.updatedAt),
      completedAt,
    };
  },

  merge(current, patch) {
    return {
      ...current,
      ...patch,
      config: patch.config
        ? {
            ...current.config,
            ...patch.config,
          }
        : current.config,
      results: Array.isArray(patch.results) ? patch.results : current.results,
    };
  },
};
