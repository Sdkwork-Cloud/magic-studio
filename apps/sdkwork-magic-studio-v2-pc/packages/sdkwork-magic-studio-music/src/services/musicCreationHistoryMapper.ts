import type {
  CanonicalCreationHistoryMapper,
} from '@sdkwork/magic-studio-generation-history';
import { MediaResourceType } from '@sdkwork/magic-studio-types/vocabulary';

import {
  createGeneratedMusicResult,
  createMusicTask,
  type GeneratedMusicResult,
  type MusicConfig,
  type MusicTask,
} from '../entities';
import {
  DEFAULT_MUSIC_MODEL,
  normalizeMusicModel,
} from '../utils/musicModel';

const MUSIC_STANDARD_CONFIG_FIELDS = new Set([
  'prompt',
  'mediaType',
  'model',
  'aspectRatio',
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

function readMusicResourceFormat(
  value: unknown,
): GeneratedMusicResult['resource']['format'] | undefined {
  return readString(value) as GeneratedMusicResult['resource']['format'] | undefined;
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

function toMusicTaskStatus(status: string): MusicTask['status'] {
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

function toMusicSourceResult(value: unknown): MusicConfig['sourceMusic'] {
  if (!isRecord(value)) {
    return null;
  }

  try {
    return createGeneratedMusicResult({
      ...value,
      id: value.id as string | null | undefined,
      uuid: value.uuid as string | undefined,
      title: readString(value.title) ?? 'Source Music',
      duration: readNumber(value.duration) ?? 0,
      resource: isRecord(value.resource)
        ? ({
            ...value.resource,
            id: value.resource.id as string | null | undefined,
            uuid: value.resource.uuid as string | undefined,
            url: readString(value.resource.url) ?? undefined,
            path: readString(value.resource.path) ?? undefined,
            name: readString(value.resource.name) ?? 'source-music',
            type: toMediaResourceType(value.resource.type, MediaResourceType.MUSIC),
            metadata: isRecord(value.resource.metadata)
              ? value.resource.metadata
              : undefined,
            duration: readNumber(value.resource.duration)
              ?? readNumber((value.resource.metadata as Record<string, unknown> | undefined)?.duration)
              ?? readNumber(value.duration),
            format: readMusicResourceFormat((value.resource as Record<string, unknown>).format),
            bitRate: readString((value.resource as Record<string, unknown>).bitRate),
            sampleRate: readNumber((value.resource as Record<string, unknown>).sampleRate),
            channels: readNumber((value.resource as Record<string, unknown>).channels),
            genre: readString((value.resource as Record<string, unknown>).genre),
            bpm: readNumber((value.resource as Record<string, unknown>).bpm),
            artist: readString((value.resource as Record<string, unknown>).artist),
          } as Partial<GeneratedMusicResult['resource']>)
        : undefined,
      coverResource: isRecord(value.coverResource)
        ? ({
            ...value.coverResource,
            id: value.coverResource.id as string | null | undefined,
            uuid: value.coverResource.uuid as string | undefined,
            url: readString(value.coverResource.url) ?? undefined,
            path: readString(value.coverResource.path) ?? undefined,
            name: readString(value.coverResource.name) ?? 'source-music-cover',
            type: toMediaResourceType(value.coverResource.type, MediaResourceType.IMAGE),
            metadata: isRecord(value.coverResource.metadata)
              ? value.coverResource.metadata
              : undefined,
          } as Partial<GeneratedMusicResult['coverResource']>)
        : undefined,
      assetId: value.assetId as string | null | undefined,
      assetUuid: value.assetUuid as string | null | undefined,
      primaryResourceId: value.primaryResourceId as string | null | undefined,
      primaryResourceUuid: value.primaryResourceUuid as string | null | undefined,
      resourceViewId: value.resourceViewId as string | null | undefined,
      resourceViewUuid: value.resourceViewUuid as string | null | undefined,
      recipeUuid: value.recipeUuid as string | null | undefined,
      executionUuid: value.executionUuid as string | null | undefined,
      artifactSetUuid: value.artifactSetUuid as string | null | undefined,
      artifactUuid: value.artifactUuid as string | null | undefined,
      executionId: value.executionId as string | null | undefined,
      lyrics: readString(value.lyrics),
      style: readString(value.style),
    });
  } catch {
    return null;
  }
}

function toCreationHistoryResource(
  resource: GeneratedMusicResult['resource'] | GeneratedMusicResult['coverResource'],
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
      ...('genre' in resource && typeof resource.genre !== 'undefined'
        ? { genre: resource.genre }
        : {}),
      ...('bpm' in resource && typeof resource.bpm !== 'undefined'
        ? { bpm: resource.bpm }
        : {}),
      ...('artist' in resource && typeof resource.artist !== 'undefined'
        ? { artist: resource.artist }
        : {}),
      ...('width' in resource && typeof resource.width !== 'undefined'
        ? { width: resource.width }
        : {}),
      ...('height' in resource && typeof resource.height !== 'undefined'
        ? { height: resource.height }
        : {}),
      ...('aspectRatio' in resource && typeof resource.aspectRatio !== 'undefined'
        ? { aspectRatio: resource.aspectRatio }
        : {}),
      ...('splitImages' in resource && typeof resource.splitImages !== 'undefined'
        ? { splitImages: resource.splitImages }
        : {}),
      ...('refAssets' in resource && typeof resource.refAssets !== 'undefined'
        ? { refAssets: resource.refAssets }
        : {}),
    },
  };
}

function toMusicResult(result: {
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
  const duration =
    result.duration
    ?? readNumber(resourceMetadata?.duration)
    ?? 0;

  return createGeneratedMusicResult({
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
    title:
      readString(resourceMetadata?.title)
      ?? readString(resourceMetadata?.name)
      ?? result.resource?.name
      ?? 'Generated Music',
    duration,
    lyrics: readString(resourceMetadata?.lyrics),
    style: readString(resourceMetadata?.style),
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
      type: toMediaResourceType(result.resource?.type, MediaResourceType.MUSIC),
      path: result.resource?.path ?? result.path,
      url: result.resource?.url ?? result.url,
      mimeType: result.resource?.mimeType ?? result.mimeType,
      name:
        result.resource?.name
        || `generated-music-${result.resource?.uuid || result.resourceViewUuid || result.uuid || 'result'}`,
      metadata: resourceMetadata,
      duration,
      format: readMusicResourceFormat(resourceMetadata?.format),
      bitRate: readString(resourceMetadata?.bitRate),
      sampleRate: readNumber(resourceMetadata?.sampleRate),
      channels: readNumber(resourceMetadata?.channels),
      genre: readString(resourceMetadata?.genre),
      bpm: readNumber(resourceMetadata?.bpm),
      artist: readString(resourceMetadata?.artist),
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
          name: result.coverResource.name || 'generated-music-cover',
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

function toMusicConfigMetadata(task: MusicTask): Record<string, unknown> | undefined {
  const metadataEntries = Object.entries(task.config).filter(([key, value]) => (
    !MUSIC_STANDARD_CONFIG_FIELDS.has(key)
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

export const musicCreationHistoryMapper: CanonicalCreationHistoryMapper<MusicTask> = {
  product: 'music',

  fromEntry(entry) {
    const rawMetadata = isRecord(entry.config.metadata) ? entry.config.metadata : {};

    return createMusicTask({
      id: entry.id,
      uuid: entry.uuid,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
      status: toMusicTaskStatus(entry.status),
      recipe: isRecord(rawMetadata.recipe)
        ? (rawMetadata.recipe as unknown as MusicTask['recipe'])
        : undefined,
      execution: isRecord(rawMetadata.execution)
        ? (rawMetadata.execution as unknown as MusicTask['execution'])
        : undefined,
      artifactSet: isRecord(rawMetadata.artifactSet)
        ? (rawMetadata.artifactSet as unknown as MusicTask['artifactSet'])
        : undefined,
      results: Array.isArray(entry.results)
        ? entry.results.map((result) => toMusicResult(result))
        : [],
      error: readString(entry.error),
      isFavorite: Boolean(entry.isFavorite),
      config: {
        prompt: entry.config.prompt ?? '',
        mediaType: 'music',
        model: normalizeMusicModel(
          entry.config.model as MusicConfig['model'] | undefined,
          DEFAULT_MUSIC_MODEL,
        ),
        aspectRatio: entry.config.aspectRatio,
        mode: (readString(rawMetadata.mode) as MusicConfig['mode'] | undefined) ?? 'generate',
        customMode: readBoolean(rawMetadata.customMode) ?? false,
        lyrics: readString(rawMetadata.lyrics) ?? '',
        style: readString(rawMetadata.style) ?? '',
        title: readString(rawMetadata.title) ?? '',
        instrumental: readBoolean(rawMetadata.instrumental) ?? false,
        duration: readNumber(rawMetadata.duration),
        extendDuration: readNumber(rawMetadata.extendDuration),
        sourceMusic: toMusicSourceResult(rawMetadata.sourceMusic),
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
      product: 'music',
      source: 'imported',
      status: task.status,
      error: task.error,
      isFavorite: task.isFavorite,
      config: {
        prompt: task.config.prompt,
        mediaType: 'music',
        model: task.config.model,
        aspectRatio: task.config.aspectRatio,
        metadata: toMusicConfigMetadata(task),
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
            posterUrl: result.coverResource?.url ?? result.coverUrl,
            duration: result.duration,
            resource: {
              ...toCreationHistoryResource(result.resource),
              metadata: {
                ...(toCreationHistoryResource(result.resource)?.metadata ?? {}),
                title: result.title,
                lyrics: result.lyrics,
                style: result.style,
              },
            },
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
