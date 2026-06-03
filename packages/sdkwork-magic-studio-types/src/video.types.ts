// Video project type definitions
// All video-related types are defined here to avoid circular dependencies

import type { BaseEntity, EntityId } from './base.types';
import { createClientEntityIdentity } from './base.types';
import type { ArtifactSet, GenerationExecution, GenerationRecipe, MediaInputRef } from './agi.types';
import { MediaResourceType } from './vocabulary.types.ts';
import {
  hasInputResourceReference,
  isRenderableInputResourceUrl,
  resolveInputResourceReference,
  resolveInputResourcePath,
  resolveInputResourceUrl,
} from './input-resource.utils';
import type { AudioMediaResource, ImageMediaResource, VideoMediaResource } from './media.types';

// ============================================================================
// Video Aspect Ratio and Resolution Types
// ============================================================================

export type VideoAspectRatio = '16:9' | '9:16' | '1:1' | '4:3' | '3:4' | '21:9';

export type VideoResolution = '720p' | '1080p' | '4k';

export type VideoDuration = `${number}s`;

// ============================================================================
// Video Generation Mode
// ============================================================================

export type VideoGenerationMode =
  | 'smart_reference'
  | 'start_end'
  | 'smart_multi'
  | 'subject_ref'
  | 'text'
  | 'image'
  | 'avatar'
  | 'lip-sync'
  | 'multi-image'
  | 'face-swap'
  | 'text-to-video'
  | 'image-to-video'
  | 'video-to-video'
  | 'extend';

export type VideoCanonicalGenerationType =
  | Exclude<VideoGenerationMode, 'video-to-video'>
  | 'style-transfer';

export const resolveCanonicalVideoGenerationType = (
  mode: VideoGenerationMode | VideoCanonicalGenerationType
): VideoCanonicalGenerationType => (mode === 'video-to-video' ? 'style-transfer' : mode);

export type LipSyncDriverType = 'audio' | 'tts';

export type LipSyncSourceType = 'video' | 'image';

export type LipSyncStage =
  | 'draft'
  | 'validating'
  | 'queued'
  | 'processing'
  | 'succeeded'
  | 'failed'
  | 'canceled';

export type VideoTaskType = 'generation' | 'lip_sync';

export type VideoGenerationAssetType = 'image' | 'video' | 'audio' | 'text';

export type VideoInputResourceType = Exclude<VideoGenerationAssetType, 'text'>;

export type VideoInputResource =
  | ImageMediaResource
  | VideoMediaResource
  | AudioMediaResource;

export interface VideoInputResourceRef extends Omit<MediaInputRef, 'role' | 'type' | 'resource'> {
  assetUuid?: string | null;
  primaryResourceUuid?: string | null;
  resourceViewUuid?: string | null;
  type: VideoInputResourceType;
  url?: string;
  name?: string;
  mimeType?: string;
  resource?: VideoInputResource | null;
  metadata?: Record<string, unknown>;
}

export interface VideoGenerationAsset {
  role: string;
  type: VideoGenerationAssetType;
  value: string;
  assetId?: string | null;
  assetUuid?: string | null;
  primaryResourceId?: string | null;
  primaryResourceUuid?: string | null;
  resourceViewId?: string | null;
  resourceViewUuid?: string | null;
  ref?: MediaInputRef;
}

export interface VideoStyleSelection {
  id: string;
  prompt: string;
}

export interface UnifiedVideoGenerationRequest {
  generationType: VideoCanonicalGenerationType;
  assets: VideoGenerationAsset[];
  prompt: string;
  negativePrompt: string;
  duration: VideoDuration;
  resolution: VideoResolution;
  aspectRatio: VideoAspectRatio;
  model: string;
  videoStyle: VideoStyleSelection;
  options?: Record<string, unknown>;
}

// ============================================================================
// Video Model
// ============================================================================

export interface VideoModel {
  id: string;
  name: string;
  provider: string;
  region: 'US' | 'CN' | 'EU';
  badge?: string;
  description: string;
  maxAssetsCount?: number;
  capabilities: {
    maxDuration: number;
    resolutions: VideoResolution[];
    ratios: VideoAspectRatio[];
  };
}

// ============================================================================
// Video Config
// ============================================================================

export interface VideoConfig {
  mode: VideoGenerationMode;
  prompt: string;
  negativePrompt?: string;

  // Core Parameters
  model: string;
  styleId: string;

  // Multi-Model Mode
  useMultiModel?: boolean;
  models?: string[];

  aspectRatio: VideoAspectRatio;
  resolution: VideoResolution;
  duration: VideoDuration;
  fps: 24 | 30 | 60;

  // Batch Generation
  batchSize?: number;

  // --- Inputs for different modes ---

  // Used for 'start_end' (Start Frame) and 'smart_reference'/'subject_ref' (Main Ref)
  image?: VideoInputResourceRef;

  // Used for 'start_end' (End Frame)
  lastFrame?: VideoInputResourceRef;

  // Used for 'smart_multi'
  referenceImages?: VideoInputResourceRef[];

  // Unified asset-center inputs
  mediaType?: 'video';
  characterImage?: VideoInputResourceRef;
  voiceId?: string;
  targetVideo?: VideoInputResourceRef;
  targetImage?: VideoInputResourceRef;
  driverAudio?: VideoInputResourceRef;
  motionVideo?: VideoInputResourceRef;
  audioTrack?: VideoInputResourceRef;
  referenceVideos?: VideoInputResourceRef[];

  // Shared advanced controls
  shotType?: 'single-shot' | 'multi-shot';
  promptExtend?: boolean;
  watermark?: boolean;
  generateAudio?: boolean;
  cameraFixed?: boolean;
  seed?: number;

  // Lip Sync extended options
  lipSyncSourceType?: LipSyncSourceType;
  lipSyncDriverType?: LipSyncDriverType;
  lipSyncSyncMode?: 'standard' | 'pro';
  lipSyncPreset?: 'dialogue' | 'speech' | 'emotion';
  lipSyncLipStrength?: number;
  lipSyncExpressionStrength?: number;
  lipSyncPreserveHeadMotion?: boolean;
  lipSyncDenoise?: boolean;
  lipSyncTrimSilence?: boolean;
  lipSyncTargetLufs?: number;
  lipSyncKeepOriginalBgm?: boolean;
}

// ============================================================================
// Generated Video Result
// ============================================================================

export type GeneratedVideoResource = Omit<VideoMediaResource, 'id'> & {
  id: EntityId;
  assetUuid?: string | null;
  primaryResourceUuid?: string | null;
  resourceViewUuid?: string | null;
};

export type GeneratedVideoCoverResource = Omit<ImageMediaResource, 'id'> & {
  id: EntityId;
  assetUuid?: string | null;
  primaryResourceUuid?: string | null;
  resourceViewUuid?: string | null;
};

export interface GeneratedVideoResult {
  id: EntityId;
  uuid: string;
  assetId?: string | null;
  assetUuid?: string | null;
  primaryResourceId?: string | null;
  primaryResourceUuid?: string | null;
  resourceViewId?: string | null;
  resourceViewUuid?: string | null;
  resource: GeneratedVideoResource;
  coverResource?: GeneratedVideoCoverResource;
  recipeUuid?: string | null;
  executionUuid?: string | null;
  artifactSetUuid?: string | null;
  artifactUuid?: string | null;
  executionId?: string | null;
  url?: string;
  mp4Url?: string;
  posterUrl?: string;
  modelId?: string;
}

export interface CreateGeneratedVideoResultInput
  extends Partial<
    Omit<
      GeneratedVideoResult,
      'id' | 'uuid' | 'resource' | 'coverResource' | 'url'
    >
  > {
  id?: EntityId;
  uuid?: string | null;
  url?: string;
  resource?: Partial<GeneratedVideoResource>;
  coverResource?: Partial<GeneratedVideoCoverResource>;
}

const normalizeOptionalString = (value: string | null | undefined): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const pickFirstString = (...values: Array<string | null | undefined>): string | null => {
  for (const value of values) {
    const normalized = normalizeOptionalString(value);
    if (normalized) {
      return normalized;
    }
  }

  return null;
};

const readMetadataString = (
  metadata: Record<string, unknown> | undefined,
  key: string
): string | null => {
  if (!metadata) {
    return null;
  }

  return normalizeOptionalString(metadata[key] as string | null | undefined);
};

type VideoResultResourceLike = {
  path?: string | null;
  url?: string | null;
  metadata?: Record<string, unknown>;
};

type VideoResultLike = {
  url?: string | null;
  mp4Url?: string | null;
  resource?: VideoResultResourceLike | null;
};

const resolveVideoResultPath = (
  input: VideoResultLike | null | undefined
): string | null => {
  if (!input) {
    return null;
  }

  return resolveInputResourcePath({
    url: pickFirstString(
      normalizeOptionalString(input.mp4Url),
      normalizeOptionalString(input.url)
    ),
    resource: input.resource
      ? {
          path: normalizeOptionalString(input.resource.path),
          url: normalizeOptionalString(input.resource.url),
        }
      : undefined,
    metadata: input.resource?.metadata,
  });
};

const resolveVideoResultUrl = (
  input: VideoResultLike | null | undefined
): string | null => {
  if (!input) {
    return null;
  }

  const resourcePath = normalizeOptionalString(input.resource?.path);
  const resourceUrl = normalizeOptionalString(input.resource?.url);
  const topLevelUrl = pickFirstString(
    normalizeOptionalString(input.mp4Url),
    normalizeOptionalString(input.url)
  );
  const metadataDeliveryUrl =
    readMetadataString(input.resource?.metadata, 'deliveryUrl') ||
    readMetadataString(input.resource?.metadata, 'primaryUrl');

  return pickFirstString(
    isRenderableInputResourceUrl(metadataDeliveryUrl) ? metadataDeliveryUrl : null,
    isRenderableInputResourceUrl(resourceUrl) ? resourceUrl : null,
    isRenderableInputResourceUrl(topLevelUrl) ? topLevelUrl : null,
    isRenderableInputResourceUrl(resourcePath) ? resourcePath : null
  );
};

export interface CreateVideoInputResourceRefInput
  extends Partial<Omit<VideoInputResourceRef, 'type' | 'resource'>> {
  type: VideoInputResourceType;
  resource?: Partial<VideoInputResource> | null;
}

type VideoInputResourceLike =
  | Partial<VideoInputResourceRef>
  | CreateVideoInputResourceRefInput;

export const resolveVideoInputResourceKey = (
  input: VideoInputResourceLike | null | undefined
): string | null => {
  if (!input) {
    return null;
  }

  return pickFirstString(
    input.resourceViewUuid,
    input.primaryResourceUuid,
    input.assetUuid,
    input.uuid,
    input.resourceViewId,
    input.primaryResourceId,
    input.assetId,
    input.id,
    input.resource?.uuid,
    input.resource?.id
  );
};

export const resolveVideoInputResourceUrl = (
  input: VideoInputResourceLike | null | undefined
): string | null => {
  return resolveInputResourceUrl(input);
};

export const resolveVideoInputResourcePath = (
  input: VideoInputResourceLike | null | undefined
): string | null => resolveInputResourcePath(input);

export const resolveVideoInputResourceReference = (
  input: VideoInputResourceLike | null | undefined
): string | null => resolveInputResourceReference(input);

export const hasVideoInputResourceReference = (
  input: VideoInputResourceLike | null | undefined
): boolean => hasInputResourceReference(input);

export const createVideoInputResourceRef = (
  input: CreateVideoInputResourceRefInput
): VideoInputResourceRef => {
  const resolvedUrl = resolveVideoInputResourceUrl(input);
  const resolvedPath = resolveVideoInputResourcePath(input);
  const identity = createClientEntityIdentity({
    id: normalizeOptionalString(input.id) ?? null,
    uuid:
      pickFirstString(
        input.uuid,
        input.resourceViewUuid,
        input.primaryResourceUuid,
        input.assetUuid,
        input.resource?.uuid
      ) ?? undefined,
    createdAt: input.createdAt,
    updatedAt: input.updatedAt,
    deletedAt: input.deletedAt,
  });

  return {
    ...identity,
    assetId: normalizeOptionalString(input.assetId) ?? null,
    assetUuid: normalizeOptionalString(input.assetUuid) ?? null,
    primaryResourceId: normalizeOptionalString(input.primaryResourceId) ?? null,
    primaryResourceUuid: normalizeOptionalString(input.primaryResourceUuid) ?? null,
    resourceViewId: normalizeOptionalString(input.resourceViewId) ?? null,
    resourceViewUuid: normalizeOptionalString(input.resourceViewUuid) ?? null,
    type: input.type,
    path: resolvedPath ?? undefined,
    url: resolvedUrl ?? undefined,
    name: normalizeOptionalString(input.name) || input.resource?.name || undefined,
    mimeType:
      normalizeOptionalString(input.mimeType) ||
      normalizeOptionalString(input.resource?.mimeType) ||
      undefined,
    resource: input.resource ? ({ ...input.resource } as VideoInputResource) : undefined,
    metadata: input.metadata ? { ...input.metadata } : undefined,
  };
};

const createGeneratedVideoResource = (
  input: Partial<GeneratedVideoResource> & {
    name: string;
  }
): GeneratedVideoResource => {
  const identity = createClientEntityIdentity({
    id: input.id ?? null,
    uuid: input.uuid ?? undefined,
    createdAt: input.createdAt,
    updatedAt: input.updatedAt,
  });

  return {
    ...identity,
    assetId: normalizeOptionalString(input.assetId) ?? null,
    assetUuid: normalizeOptionalString(input.assetUuid) ?? null,
    primaryResourceId: normalizeOptionalString(input.primaryResourceId) ?? null,
    primaryResourceUuid: normalizeOptionalString(input.primaryResourceUuid) ?? null,
    resourceViewId: normalizeOptionalString(input.resourceViewId) ?? null,
    resourceViewUuid: normalizeOptionalString(input.resourceViewUuid) ?? null,
    sourceRecipeId: normalizeOptionalString(input.sourceRecipeId) || undefined,
    sourceRecipeUuid: normalizeOptionalString(input.sourceRecipeUuid) || undefined,
    sourceExecutionId: normalizeOptionalString(input.sourceExecutionId) || undefined,
    sourceExecutionUuid: normalizeOptionalString(input.sourceExecutionUuid) || undefined,
    sourceArtifactId: normalizeOptionalString(input.sourceArtifactId) || undefined,
    sourceArtifactUuid: normalizeOptionalString(input.sourceArtifactUuid) || undefined,
    url: normalizeOptionalString(input.url) || undefined,
    type: input.type ?? MediaResourceType.VIDEO,
    name: normalizeOptionalString(input.name) || input.name,
    mimeType: normalizeOptionalString(input.mimeType) || undefined,
    size: input.size,
    extension: normalizeOptionalString(input.extension) || undefined,
    scene: input.scene,
    prompt: normalizeOptionalString(input.prompt) || undefined,
    metadata: input.metadata ? { ...input.metadata } : undefined,
    tags: input.tags,
    origin: input.origin,
    isFavorite: input.isFavorite,
    bytes: input.bytes,
    base64: normalizeOptionalString(input.base64) || undefined,
    path:
      resolveInputResourcePath({
        path: normalizeOptionalString(input.path),
        url: normalizeOptionalString(input.url),
        metadata: input.metadata,
      }) || undefined,
    localFile: input.localFile,
    duration: input.duration,
    width: input.width,
    height: input.height,
    fps: input.fps,
    resolution: normalizeOptionalString(input.resolution) || undefined,
    refAssets: input.refAssets,
  };
};

const createGeneratedVideoCoverResource = (
  input: Partial<GeneratedVideoCoverResource> & {
    url: string;
    name: string;
  }
): GeneratedVideoCoverResource => {
  const identity = createClientEntityIdentity({
    id: input.id ?? null,
    uuid: input.uuid ?? undefined,
    createdAt: input.createdAt,
    updatedAt: input.updatedAt,
  });

  return {
    ...identity,
    assetId: normalizeOptionalString(input.assetId) ?? null,
    assetUuid: normalizeOptionalString(input.assetUuid) ?? null,
    primaryResourceId: normalizeOptionalString(input.primaryResourceId) ?? null,
    primaryResourceUuid: normalizeOptionalString(input.primaryResourceUuid) ?? null,
    resourceViewId: normalizeOptionalString(input.resourceViewId) ?? null,
    resourceViewUuid: normalizeOptionalString(input.resourceViewUuid) ?? null,
    sourceRecipeId: normalizeOptionalString(input.sourceRecipeId) || undefined,
    sourceRecipeUuid: normalizeOptionalString(input.sourceRecipeUuid) || undefined,
    sourceExecutionId: normalizeOptionalString(input.sourceExecutionId) || undefined,
    sourceExecutionUuid: normalizeOptionalString(input.sourceExecutionUuid) || undefined,
    sourceArtifactId: normalizeOptionalString(input.sourceArtifactId) || undefined,
    sourceArtifactUuid: normalizeOptionalString(input.sourceArtifactUuid) || undefined,
    url: input.url,
    type: input.type ?? MediaResourceType.IMAGE,
    name: normalizeOptionalString(input.name) || input.name,
    mimeType: normalizeOptionalString(input.mimeType) || undefined,
    size: input.size,
    extension: normalizeOptionalString(input.extension) || undefined,
    scene: input.scene,
    prompt: normalizeOptionalString(input.prompt) || undefined,
    metadata: input.metadata ? { ...input.metadata } : undefined,
    tags: input.tags,
    origin: input.origin,
    isFavorite: input.isFavorite,
    bytes: input.bytes,
    base64: normalizeOptionalString(input.base64) || undefined,
    path:
      resolveInputResourcePath({
        path: normalizeOptionalString(input.path),
        url: normalizeOptionalString(input.url),
        metadata: input.metadata,
      }) || undefined,
    localFile: input.localFile,
    width: input.width,
    height: input.height,
    aspectRatio: normalizeOptionalString(input.aspectRatio) || undefined,
    splitImages: input.splitImages,
    refAssets: input.refAssets,
  };
};

export const createGeneratedVideoResult = (
  input: CreateGeneratedVideoResultInput
): GeneratedVideoResult => {
  const identity = createClientEntityIdentity({
    id: input.id ?? null,
    uuid: input.uuid ?? undefined,
  });
  const resourcePath = resolveVideoResultPath(input);
  const resourceUrl = resolveVideoResultUrl(input);
  if (!resourcePath && !resourceUrl) {
    throw new Error('Generated video result requires a canonical resource reference');
  }

  const resource = createGeneratedVideoResource({
    ...input.resource,
    id: input.resource?.id ?? input.primaryResourceId ?? null,
    uuid:
      input.resource?.uuid ??
      input.resourceViewUuid ??
      input.primaryResourceUuid ??
      input.assetUuid ??
      identity.uuid,
    assetId: input.resource?.assetId ?? input.assetId ?? null,
    assetUuid: input.resource?.assetUuid ?? input.assetUuid ?? null,
    primaryResourceId: input.resource?.primaryResourceId ?? input.primaryResourceId ?? null,
    primaryResourceUuid:
      input.resource?.primaryResourceUuid ?? input.primaryResourceUuid ?? null,
    resourceViewId: input.resource?.resourceViewId ?? input.resourceViewId ?? null,
    resourceViewUuid:
      input.resource?.resourceViewUuid ?? input.resourceViewUuid ?? null,
    url: resourceUrl || undefined,
    path: resourcePath || undefined,
    name:
      input.resource?.name ||
      `generated-video-${input.resource?.uuid || input.resourceViewUuid || identity.uuid}`,
  });
  const coverUrl = pickFirstString(input.coverResource?.url, input.posterUrl);
  const coverResource = coverUrl
    ? createGeneratedVideoCoverResource({
        ...input.coverResource,
        id: input.coverResource?.id ?? null,
        uuid: input.coverResource?.uuid ?? undefined,
        url: coverUrl,
        type: input.coverResource?.type ?? MediaResourceType.IMAGE,
        name:
          input.coverResource?.name ||
          `generated-video-cover-${input.coverResource?.uuid || identity.uuid}`,
      })
    : undefined;

  return {
    id: identity.id,
    uuid: identity.uuid,
    assetId: pickFirstString(input.assetId, resource.assetId) ?? null,
    assetUuid: pickFirstString(input.assetUuid, resource.assetUuid) ?? null,
    primaryResourceId:
      pickFirstString(input.primaryResourceId, resource.primaryResourceId, resource.id) ?? null,
    primaryResourceUuid:
      pickFirstString(
        input.primaryResourceUuid,
        resource.primaryResourceUuid,
        resource.uuid
      ) ?? null,
    resourceViewId: pickFirstString(input.resourceViewId, resource.resourceViewId) ?? null,
    resourceViewUuid:
      pickFirstString(input.resourceViewUuid, resource.resourceViewUuid) ?? null,
    resource,
    ...(coverResource ? { coverResource } : {}),
    recipeUuid: normalizeOptionalString(input.recipeUuid) ?? null,
    executionUuid: normalizeOptionalString(input.executionUuid) ?? null,
    artifactSetUuid: normalizeOptionalString(input.artifactSetUuid) ?? null,
    artifactUuid: normalizeOptionalString(input.artifactUuid) ?? null,
    executionId: normalizeOptionalString(input.executionId) ?? null,
    modelId: normalizeOptionalString(input.modelId) || undefined,
  };
};

export const resolveGeneratedVideoResultPath = (
  result: Partial<GeneratedVideoResult> | null | undefined
): string | null => {
  if (!result) {
    return null;
  }

  return resolveVideoResultPath(result);
};

export const resolveGeneratedVideoResultUrl = (
  result: Partial<GeneratedVideoResult> | null | undefined
): string | null => {
  if (!result) {
    return null;
  }

  return resolveVideoResultUrl(result);
};

export const resolveGeneratedVideoResultPosterUrl = (
  result: Partial<GeneratedVideoResult> | null | undefined
): string | null => {
  if (!result) {
    return null;
  }

  return pickFirstString(
    typeof result.coverResource?.url === 'string' ? result.coverResource.url : null,
    result.posterUrl
  );
};

// ============================================================================
// Video Task
// ============================================================================

export interface VideoTask extends Omit<BaseEntity, 'id'> {
  id: EntityId;
  config: VideoConfig;
  generationRequest?: UnifiedVideoGenerationRequest;
  recipe?: GenerationRecipe;
  execution?: GenerationExecution;
  artifactSet?: ArtifactSet;
  status: 'pending' | 'completed' | 'failed';
  results?: GeneratedVideoResult[];
  error?: string;
  progress?: number;
  isFavorite?: boolean;
  stage?: LipSyncStage;
  taskType?: VideoTaskType;
  provider?: string;
  remoteTaskId?: string;
}

export interface CreateVideoTaskInput
  extends Partial<Omit<VideoTask, 'id' | 'uuid' | 'createdAt' | 'updatedAt' | 'config' | 'status'>> {
  id?: EntityId;
  uuid?: string | null;
  createdAt?: VideoTask['createdAt'];
  updatedAt?: VideoTask['updatedAt'];
  config: VideoConfig;
  status: VideoTask['status'];
}

export const createVideoTask = (
  input: CreateVideoTaskInput
): VideoTask => {
  const identity = createClientEntityIdentity({
    id: input.id ?? null,
    uuid: input.uuid ?? undefined,
  });

  return {
    id: identity.id,
    uuid: identity.uuid,
    createdAt: input.createdAt ?? identity.createdAt,
    updatedAt: input.updatedAt ?? identity.updatedAt,
    config: input.config,
    generationRequest: input.generationRequest,
    recipe: input.recipe,
    execution: input.execution,
    artifactSet: input.artifactSet,
    status: input.status,
    results: input.results,
    error: input.error,
    progress: input.progress,
    isFavorite: input.isFavorite,
    stage: input.stage,
    taskType: input.taskType,
    provider: input.provider,
    remoteTaskId: input.remoteTaskId,
  };
};

// ============================================================================
// Video Project (Extended)
// ============================================================================

export interface VideoProject extends Omit<BaseEntity, 'id'> {
  id: EntityId;
  type: 'VIDEO_PROJECT';
  name: string;
  description?: string;
  tasks: VideoTask[];
  settings?: VideoProjectSettings;
}

export interface VideoProjectSettings {
  defaultAspectRatio?: VideoAspectRatio;
  defaultResolution?: VideoResolution;
  defaultDuration?: VideoDuration;
  defaultFps?: 24 | 30 | 60;
}

// ============================================================================
// Video Generation Status
// ============================================================================

export type VideoGenerationStatus =
  | 'idle'
  | 'preparing'
  | 'uploading'
  | 'generating'
  | 'downloading'
  | 'completed'
  | 'failed'
  | 'cancelled';

// ============================================================================
// Video Style
// ============================================================================

export interface VideoStyle {
  id: string;
  name: string;
  description?: string;
  previewUrl?: string;
  category?: string;
  tags?: string[];
}

// ============================================================================
// Video Preset
// ============================================================================

export interface VideoPreset {
  id: string;
  name: string;
  description?: string;
  config: Partial<VideoConfig>;
  thumbnailUrl?: string;
  category?: string;
}
