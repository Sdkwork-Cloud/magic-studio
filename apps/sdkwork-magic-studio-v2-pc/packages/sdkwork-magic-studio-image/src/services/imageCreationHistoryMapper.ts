import type {
  CanonicalCreationHistoryMapper,
} from '@sdkwork/magic-studio-generation-history';
import { MediaResourceType } from '@sdkwork/magic-studio-types/vocabulary';

import {
  createGeneratedImageResult,
  createImageTask,
  type GeneratedImageResult,
  type ImageGenerationConfig,
  type ImageTask,
} from '../entities';

const IMAGE_STANDARD_CONFIG_FIELDS = new Set([
  'prompt',
  'text',
  'previewText',
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

function toIsoTimestamp(value: string | number | null | undefined): string | undefined {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return new Date(value).toISOString();
  }
  return undefined;
}

function toImageTaskStatus(status: string): ImageTask['status'] {
  switch (status) {
    case 'processing':
      return 'processing';
    case 'completed':
      return 'completed';
    case 'failed':
    case 'cancelled':
      return 'failed';
    case 'draft':
    case 'pending':
    default:
      return 'pending';
  }
}

function toMediaResourceType(value: unknown): MediaResourceType {
  return typeof value === 'string'
    && Object.values(MediaResourceType).includes(value as MediaResourceType)
    ? (value as MediaResourceType)
    : MediaResourceType.IMAGE;
}

function toImageConfigMetadata(
  config: ImageGenerationConfig,
): Record<string, unknown> | undefined {
  const metadataEntries = Object.entries(config).filter(([key, value]) => (
    !IMAGE_STANDARD_CONFIG_FIELDS.has(key)
    && typeof value !== 'undefined'
    && value !== null
  ));

  if (metadataEntries.length === 0) {
    return undefined;
  }

  return Object.fromEntries(metadataEntries);
}

function toCreationHistoryResource(
  resource: GeneratedImageResult['resource'] | GeneratedImageResult['coverResource'],
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
    metadata: resource.metadata,
  };
}

function toImageResult(result: {
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
}): GeneratedImageResult {
  return createGeneratedImageResult({
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
    url: result.resource?.url || result.url || result.resource?.path || result.path,
    thumbnailUrl:
      result.coverResource?.url
      || result.posterUrl
      || result.coverResource?.path
      || undefined,
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
      type: toMediaResourceType(result.resource?.type),
      path: result.resource?.path ?? result.path,
      url: result.resource?.url ?? result.url,
      mimeType: result.resource?.mimeType ?? result.mimeType,
      name:
        result.resource?.name
        || `generated-image-${result.resource?.uuid || result.resourceViewUuid || result.uuid || 'result'}`,
      metadata: result.resource?.metadata,
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
          type: toMediaResourceType(result.coverResource.type),
          path: result.coverResource.path,
          url: result.coverResource.url ?? result.posterUrl,
          mimeType: result.coverResource.mimeType,
          name: result.coverResource.name || 'generated-image-cover',
          metadata: result.coverResource.metadata,
        }
      : undefined,
  });
}

export const imageCreationHistoryMapper: CanonicalCreationHistoryMapper<ImageTask> = {
  product: 'image',

  fromEntry(entry) {
    const rawMetadata = isRecord(entry.config.metadata) ? entry.config.metadata : {};
    const metadata = { ...rawMetadata } as Partial<ImageGenerationConfig>;
    const models = readStringArray(rawMetadata.models);
    const batchSize =
      readNumber(rawMetadata.batchSize)
      ?? (Array.isArray(entry.results) && entry.results.length > 0 ? entry.results.length : 1);

    return createImageTask({
      id: entry.id,
      uuid: entry.uuid,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
      status: toImageTaskStatus(entry.status),
      error: readString(entry.error),
      isFavorite: Boolean(entry.isFavorite),
      config: {
        ...metadata,
        prompt: entry.config.prompt ?? readString(rawMetadata.prompt) ?? '',
        aspectRatio:
          (entry.config.aspectRatio as ImageGenerationConfig['aspectRatio'] | undefined)
          ?? (readString(rawMetadata.aspectRatio) as ImageGenerationConfig['aspectRatio'] | undefined)
          ?? '1:1',
        model: entry.config.model ?? readString(rawMetadata.model),
        useMultiModel:
          entry.config.useMultiModel
          ?? readBoolean(rawMetadata.useMultiModel)
          ?? Boolean(models && models.length > 1),
        mediaType: 'image',
        batchSize,
        styleId: readString(rawMetadata.styleId) ?? 'none',
        models,
      },
      results: Array.isArray(entry.results)
        ? entry.results.map((result) => toImageResult(result))
        : [],
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
      product: 'image',
      source: 'imported',
      status: task.status,
      error: task.error,
      isFavorite: task.isFavorite,
      config: {
        prompt: task.config.prompt,
        mediaType: 'image',
        aspectRatio: task.config.aspectRatio,
        model: task.config.model,
        useMultiModel: task.config.useMultiModel,
        metadata: toImageConfigMetadata(task.config),
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
            posterUrl: result.coverResource?.url ?? result.thumbnailUrl,
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
