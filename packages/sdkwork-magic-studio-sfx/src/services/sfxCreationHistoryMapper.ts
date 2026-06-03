import type {
  CanonicalCreationHistoryMapper,
} from '@sdkwork/magic-studio-generation-history';
import { MediaResourceType } from '@sdkwork/magic-studio-types/vocabulary';

import {
  createGeneratedSfxResult,
  createSfxTask,
  type GeneratedSfxResult,
  type SfxConfig,
  type SfxTask,
} from '../entities';
import { normalizeSfxModel } from '../utils/sfxModel';

const SFX_STANDARD_CONFIG_FIELDS = new Set([
  'prompt',
  'mediaType',
  'model',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0
    ? value.trim()
    : undefined;
}

function readNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function readTypedString<T extends string | undefined>(value: unknown): T {
  return readString(value) as T;
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

function toSfxTaskStatus(status: string): SfxTask['status'] {
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

function toMediaResourceType(value: unknown): MediaResourceType {
  return typeof value === 'string'
    && Object.values(MediaResourceType).includes(value as MediaResourceType)
    ? (value as MediaResourceType)
    : MediaResourceType.SFX;
}

function toCreationHistoryResource(
  resource: GeneratedSfxResult['resource'],
) {
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
      ...('duration' in resource && typeof resource.duration === 'number'
        ? { duration: resource.duration }
        : {}),
      ...('format' in resource && typeof resource.format !== 'undefined'
        ? { format: resource.format }
        : {}),
      ...('bitRate' in resource && typeof resource.bitRate !== 'undefined'
        ? { bitRate: resource.bitRate }
        : {}),
      ...('sampleRate' in resource && typeof resource.sampleRate !== 'undefined'
        ? { sampleRate: resource.sampleRate }
        : {}),
      ...('channels' in resource && typeof resource.channels !== 'undefined'
        ? { channels: resource.channels }
        : {}),
      ...('category' in resource && typeof resource.category !== 'undefined'
        ? { category: resource.category }
        : {}),
      ...('intensity' in resource && typeof resource.intensity !== 'undefined'
        ? { intensity: resource.intensity }
        : {}),
      ...('loopable' in resource && typeof resource.loopable !== 'undefined'
        ? { loopable: resource.loopable }
        : {}),
    },
  };
}

function toSfxResult(result: {
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
}) {
  const resourceMetadata = isRecord(result.resource?.metadata)
    ? result.resource?.metadata
    : undefined;
  const duration =
    result.duration
    ?? readNumber(resourceMetadata?.duration)
    ?? 0;

  return createGeneratedSfxResult({
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
    duration,
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
      url: result.resource?.url ?? result.url ?? result.path ?? 'about:blank',
      mimeType: result.resource?.mimeType ?? result.mimeType,
      name:
        result.resource?.name
        || `generated-sfx-${result.resource?.uuid || result.resourceViewUuid || result.uuid || 'result'}`,
      metadata: resourceMetadata,
      duration,
      format: readTypedString<GeneratedSfxResult['resource']['format']>(resourceMetadata?.format),
      bitRate: readString(resourceMetadata?.bitRate),
      sampleRate: readNumber(resourceMetadata?.sampleRate),
      channels: readNumber(resourceMetadata?.channels),
      category: readTypedString<GeneratedSfxResult['resource']['category']>(resourceMetadata?.category),
      intensity: readTypedString<GeneratedSfxResult['resource']['intensity']>(resourceMetadata?.intensity),
      loopable: typeof resourceMetadata?.loopable === 'boolean'
        ? resourceMetadata.loopable
        : undefined,
    },
  });
}

function toSfxConfigMetadata(task: SfxTask): Record<string, unknown> | undefined {
  const metadataEntries = Object.entries(task.config).filter(([key, value]) => (
    !SFX_STANDARD_CONFIG_FIELDS.has(key)
    && typeof value !== 'undefined'
    && value !== null
  ));

  const metadata: Record<string, unknown> = Object.fromEntries(metadataEntries);

  if (task.recipe) {
    metadata.recipe = task.recipe;
  }

  if (task.execution) {
    metadata.execution = task.execution;
  }

  if (task.artifactSet) {
    metadata.artifactSet = task.artifactSet;
  }

  return Object.keys(metadata).length > 0 ? metadata : undefined;
}

export const sfxCreationHistoryMapper: CanonicalCreationHistoryMapper<SfxTask> = {
  product: 'sfx',

  fromEntry(entry) {
    const rawMetadata = isRecord(entry.config.metadata) ? entry.config.metadata : {};

    return createSfxTask({
      id: entry.id,
      uuid: entry.uuid,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
      status: toSfxTaskStatus(entry.status),
      recipe: isRecord(rawMetadata.recipe)
        ? (rawMetadata.recipe as unknown as SfxTask['recipe'])
        : undefined,
      execution: isRecord(rawMetadata.execution)
        ? (rawMetadata.execution as unknown as SfxTask['execution'])
        : undefined,
      artifactSet: isRecord(rawMetadata.artifactSet)
        ? (rawMetadata.artifactSet as unknown as SfxTask['artifactSet'])
        : undefined,
      results: Array.isArray(entry.results)
        ? entry.results.map((result) => toSfxResult(result))
        : [],
      error: readString(entry.error),
      isFavorite: Boolean(entry.isFavorite),
      config: {
        prompt: entry.config.prompt ?? '',
        mediaType: 'sfx',
        model: normalizeSfxModel(entry.config.model),
        duration: readNumber(rawMetadata.duration) ?? 0,
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
      product: 'sfx',
      source: 'imported',
      status: task.status,
      error: task.error,
      isFavorite: task.isFavorite,
      config: {
        prompt: task.config.prompt,
        mediaType: 'sfx',
        model: task.config.model,
        metadata: toSfxConfigMetadata(task),
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
            duration: result.duration,
            resource: toCreationHistoryResource(result.resource),
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
