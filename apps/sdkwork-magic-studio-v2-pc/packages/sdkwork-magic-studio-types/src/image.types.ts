// Image project type definitions
// All image-related types are defined here to avoid circular dependencies

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
import type { ImageMediaResource } from './media.types';

// ============================================================================
// Image Aspect Ratio
// ============================================================================

export type ImageAspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4' | '21:9' | 'custom';

// ============================================================================
// Image Style
// ============================================================================

export type ImageStyle = 'realistic' | 'anime' | 'painting' | 'sketch' | '3d' | 'abstract' | 'custom';

export interface ImageInputResourceRef extends Omit<MediaInputRef, 'role' | 'type' | 'resource'> {
  assetUuid?: string | null;
  primaryResourceUuid?: string | null;
  resourceViewUuid?: string | null;
  type: 'image';
  url?: string;
  name?: string;
  mimeType?: string;
  resource?: ImageMediaResource | null;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Image Generation Config
// ============================================================================

export interface ImageGenerationConfig {
  prompt: string;
  negativePrompt?: string;
  referenceImage?: ImageInputResourceRef;
  referenceImages?: ImageInputResourceRef[];
  width?: number;
  height?: number;
  aspectRatio?: ImageAspectRatio;
  steps?: number;
  guidance?: number;
  seed?: number;
  style?: ImageStyle;
  styleId?: string;
  model?: string;
  batchSize?: number;
  useMultiModel?: boolean;
  models?: string[];
  mediaType?: 'image';
  quality?: string;
  [key: string]: any;
}

// ============================================================================
// Generated Image Result
// ============================================================================

export type GeneratedImageResource = Omit<ImageMediaResource, 'id'> & {
  id: EntityId;
  assetUuid?: string | null;
  primaryResourceUuid?: string | null;
  resourceViewUuid?: string | null;
};

export interface GeneratedImageResult {
  id: EntityId;
  uuid: string;
  assetId?: string | null;
  assetUuid?: string | null;
  primaryResourceId?: string | null;
  primaryResourceUuid?: string | null;
  resourceViewId?: string | null;
  resourceViewUuid?: string | null;
  resource: GeneratedImageResource;
  coverResource?: GeneratedImageResource;
  recipeUuid?: string | null;
  executionUuid?: string | null;
  artifactSetUuid?: string | null;
  artifactUuid?: string | null;
  executionId?: string | null;
  url?: string;
  thumbnailUrl?: string;
  prompt?: string;
  negativePrompt?: string;
  seed?: number;
  width?: number;
  height?: number;
}

export interface CreateGeneratedImageResultInput
  extends Partial<
    Omit<
      GeneratedImageResult,
      'id' | 'uuid' | 'resource' | 'coverResource' | 'url'
    >
  > {
  id?: EntityId;
  uuid?: string | null;
  url?: string;
  resource?: Partial<GeneratedImageResource>;
  coverResource?: Partial<GeneratedImageResource>;
}

export type ImageEditMode = 'inpaint' | 'outpaint' | 'remove' | 'upscale';

export interface ImageEditRequest {
  source: GeneratedImageResult;
  mode: ImageEditMode;
  mask: string | null;
  prompt?: string;
}

export interface ImageGridCell {
  id: EntityId;
  uuid: string;
  source: GeneratedImageResult | null;
}

export interface CreateImageGridCellInput {
  id?: EntityId;
  uuid?: string | null;
  source?: CreateGeneratedImageResultInput | GeneratedImageResult | null;
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

type ImageResultResourceLike = {
  path?: string | null;
  url?: string | null;
  metadata?: Record<string, unknown>;
};

type ImageResultLike = {
  url?: string | null;
  resource?: ImageResultResourceLike | null;
};

const resolveImageResultPath = (
  input: ImageResultLike | null | undefined
): string | null => {
  if (!input) {
    return null;
  }

  return resolveInputResourcePath({
    url: normalizeOptionalString(input.url),
    resource: input.resource
      ? {
          path: normalizeOptionalString(input.resource.path),
          url: normalizeOptionalString(input.resource.url),
        }
      : undefined,
    metadata: input.resource?.metadata,
  });
};

const resolveImageResultUrl = (
  input: ImageResultLike | null | undefined
): string | null => {
  if (!input) {
    return null;
  }

  const resourcePath = normalizeOptionalString(input.resource?.path);
  const resourceUrl = normalizeOptionalString(input.resource?.url);
  const topLevelUrl = normalizeOptionalString(input.url);
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

export interface CreateImageInputResourceRefInput
  extends Partial<Omit<ImageInputResourceRef, 'type' | 'resource'>> {
  resource?: Partial<ImageMediaResource> | null;
}

type ImageInputResourceLike =
  | Partial<ImageInputResourceRef>
  | CreateImageInputResourceRefInput;

export const resolveImageInputResourceKey = (
  input: ImageInputResourceLike | null | undefined
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

export const resolveImageInputResourceUrl = (
  input: ImageInputResourceLike | null | undefined
): string | null => {
  return resolveInputResourceUrl(input);
};

export const resolveImageInputResourcePath = (
  input: ImageInputResourceLike | null | undefined
): string | null => resolveInputResourcePath(input);

export const resolveImageInputResourceReference = (
  input: ImageInputResourceLike | null | undefined
): string | null => resolveInputResourceReference(input);

export const hasImageInputResourceReference = (
  input: ImageInputResourceLike | null | undefined
): boolean => hasInputResourceReference(input);

export const createImageInputResourceRef = (
  input: CreateImageInputResourceRefInput = {}
): ImageInputResourceRef => {
  const resolvedUrl = resolveImageInputResourceUrl(input);
  const resolvedPath = resolveImageInputResourcePath(input);
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
    type: 'image',
    path: resolvedPath ?? undefined,
    url: resolvedUrl ?? undefined,
    name: normalizeOptionalString(input.name) || input.resource?.name || undefined,
    mimeType:
      normalizeOptionalString(input.mimeType) ||
      normalizeOptionalString(input.resource?.mimeType) ||
      undefined,
    resource: input.resource ? ({ ...input.resource } as ImageMediaResource) : undefined,
    metadata: input.metadata ? { ...input.metadata } : undefined,
  };
};

const createGeneratedImageResource = (
  input: Partial<GeneratedImageResource> & {
    name: string;
  }
): GeneratedImageResource => {
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

export const createGeneratedImageResult = (
  input: CreateGeneratedImageResultInput
): GeneratedImageResult => {
  const identity = createClientEntityIdentity({
    id: input.id ?? null,
    uuid: input.uuid ?? undefined,
  });
  const resourcePath = resolveImageResultPath(input);
  const resourceUrl = resolveImageResultUrl(input);
  if (!resourcePath && !resourceUrl) {
    throw new Error('Generated image result requires a canonical resource reference');
  }

  const resource = createGeneratedImageResource({
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
    width: input.resource?.width ?? input.width,
    height: input.resource?.height ?? input.height,
    prompt: input.resource?.prompt ?? input.prompt,
    name:
      input.resource?.name ||
      `generated-image-${input.resource?.uuid || input.resourceViewUuid || identity.uuid}`,
  });
  const coverUrl = pickFirstString(input.coverResource?.url, input.thumbnailUrl);
  const coverResource = coverUrl
    ? createGeneratedImageResource({
        ...input.coverResource,
        id: input.coverResource?.id ?? null,
        uuid: input.coverResource?.uuid ?? undefined,
        url: coverUrl,
        type: input.coverResource?.type ?? MediaResourceType.IMAGE,
        name:
          input.coverResource?.name ||
          `generated-image-cover-${input.coverResource?.uuid || identity.uuid}`,
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
    prompt: input.prompt,
    negativePrompt: input.negativePrompt,
    seed: input.seed,
    width: input.width ?? resource.width,
    height: input.height ?? resource.height,
  };
};

export const resolveGeneratedImageResultPath = (
  result: Partial<GeneratedImageResult> | null | undefined
): string | null => {
  if (!result) {
    return null;
  }

  return resolveImageResultPath(result);
};

export const resolveGeneratedImageResultUrl = (
  result: Partial<GeneratedImageResult> | null | undefined
): string | null => {
  if (!result) {
    return null;
  }

  return resolveImageResultUrl(result);
};

export const resolveGeneratedImageResultThumbnailUrl = (
  result: Partial<GeneratedImageResult> | null | undefined
): string | null => {
  if (!result) {
    return null;
  }

  return pickFirstString(
    typeof result.coverResource?.url === 'string' ? result.coverResource.url : null,
    result.thumbnailUrl
  );
};

export const createImageGridCell = (
  input: CreateImageGridCellInput = {}
): ImageGridCell => {
  const identity = createClientEntityIdentity({
    id: input.id ?? null,
    uuid: input.uuid ?? undefined,
  });

  return {
    id: identity.id,
    uuid: identity.uuid,
    source: input.source ? createGeneratedImageResult(input.source) : null,
  };
};

// ============================================================================
// Image Task
// ============================================================================

export interface ImageTask extends Omit<BaseEntity, 'id'> {
  id: EntityId;
  config: ImageGenerationConfig;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  recipe?: GenerationRecipe;
  execution?: GenerationExecution;
  artifactSet?: ArtifactSet;
  results?: GeneratedImageResult[];
  error?: string;
  progress?: number;
  isFavorite?: boolean;
}

// ============================================================================
// Image Project
// ============================================================================

export interface ImageProject extends Omit<BaseEntity, 'id'> {
  id: EntityId;
  type: 'IMAGE_PROJECT';
  name: string;
  description?: string;
  tasks: ImageTask[];
  settings?: ImageProjectSettings;
}

export interface ImageProjectSettings {
  defaultAspectRatio?: ImageAspectRatio;
  defaultWidth?: number;
  defaultHeight?: number;
  defaultModel?: string;
  defaultStyle?: ImageStyle;
}

export interface CreateImageTaskInput extends Partial<Omit<ImageTask, 'id' | 'uuid' | 'createdAt' | 'updatedAt'>> {
  id?: EntityId;
  uuid?: string | null;
  createdAt?: ImageTask['createdAt'];
  updatedAt?: ImageTask['updatedAt'];
  config: ImageGenerationConfig;
  status: ImageTask['status'];
}

export const createImageTask = (
  input: CreateImageTaskInput
): ImageTask => {
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
    status: input.status,
    recipe: input.recipe,
    execution: input.execution,
    artifactSet: input.artifactSet,
    results: input.results,
    error: input.error,
    progress: input.progress,
    isFavorite: input.isFavorite,
  };
};

// ============================================================================
// Image Model
// ============================================================================

export interface ImageModel {
  id: string;
  name: string;
  provider: string;
  description?: string;
  maxWidth?: number;
  maxHeight?: number;
  supportedAspectRatios?: ImageAspectRatio[];
  supportedStyles?: ImageStyle[];
}

// ============================================================================
// Image Preset
// ============================================================================

export interface ImagePreset {
  id: string;
  name: string;
  description?: string;
  config: Partial<ImageGenerationConfig>;
  thumbnailUrl?: string;
  category?: string;
}
