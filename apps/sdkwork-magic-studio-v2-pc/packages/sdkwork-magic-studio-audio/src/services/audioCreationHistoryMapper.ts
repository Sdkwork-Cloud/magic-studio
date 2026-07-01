import type {
  CanonicalCreationHistoryMapper,
} from '@sdkwork/magic-studio-generation-history';
import { MediaResourceType } from '@sdkwork/magic-studio-types/vocabulary';

import {
  createAudioInputResourceRef,
  createAudioTask,
  createAudioTaskResult,
  resolveAudioTaskResultUrl,
  type AudioGenerationParams,
  type AudioTask,
} from '../entities';

const AUDIO_STANDARD_CONFIG_FIELDS = new Set([
  'prompt',
  'mediaType',
  'model',
]);

type AudioTaskResource = NonNullable<NonNullable<AudioTask['results']>[number]>['resource'];

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

function toIsoTimestamp(value: string | number | null | undefined): string | undefined {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return new Date(value).toISOString();
  }
  return undefined;
}

function toAudioTaskStatus(status: string): AudioTask['status'] {
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

function toMediaResourceType(
  value: unknown,
  fallback: MediaResourceType,
): MediaResourceType {
  return typeof value === 'string'
    && Object.values(MediaResourceType).includes(value as MediaResourceType)
    ? (value as MediaResourceType)
    : fallback;
}

function toAudioInputResource(value: unknown): AudioGenerationParams['sourceAudio'] {
  if (!isRecord(value)) {
    return undefined;
  }

  return createAudioInputResourceRef({
    ...value,
    type: value.type === 'voice' ? 'voice' : 'audio',
  });
}

function toCreationHistoryResource(resource: AudioTaskResource) {
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
    text: 'text' in resource ? resource.text : undefined,
    language: 'language' in resource ? resource.language : undefined,
    metadata: {
      ...(isRecord(resource.metadata) ? resource.metadata : {}),
      ...('segments' in resource && Array.isArray(resource.segments)
        ? { segments: resource.segments }
        : {}),
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
    },
  };
}

function toAudioResult(result: {
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
    text?: string;
    language?: string;
    metadata?: Record<string, unknown>;
  };
}) {
  const resourceMetadata = isRecord(result.resource?.metadata)
    ? result.resource?.metadata
    : undefined;
  const resourceType = toMediaResourceType(
    result.resource?.type,
    result.resource?.text ? MediaResourceType.TEXT : MediaResourceType.AUDIO,
  );

  return createAudioTaskResult({
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
    duration:
      result.duration
      ?? readNumber(resourceMetadata?.duration)
      ?? undefined,
    text:
      result.resource?.text
      ?? readString(resourceMetadata?.text)
      ?? undefined,
    language:
      result.resource?.language
      ?? readString(resourceMetadata?.language)
      ?? undefined,
    segments: Array.isArray(resourceMetadata?.segments)
      ? [...(resourceMetadata.segments as unknown[])]
      : null,
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
      type: resourceType,
      path: result.resource?.path ?? result.path,
      url: result.resource?.url ?? result.url ?? result.path ?? 'about:blank',
      mimeType:
        result.resource?.mimeType
        ?? result.mimeType
        ?? (resourceType === MediaResourceType.TEXT ? 'text/plain' : undefined),
      name:
        result.resource?.name
        || `generated-audio-${result.resource?.uuid || result.resourceViewUuid || result.uuid || 'result'}`,
      text: result.resource?.text ?? readString(resourceMetadata?.text) ?? undefined,
      language: result.resource?.language ?? readString(resourceMetadata?.language) ?? undefined,
      metadata: resourceMetadata,
      duration:
        result.duration
        ?? readNumber(resourceMetadata?.duration)
        ?? undefined,
    },
  });
}

function toAudioConfigMetadata(
  task: AudioTask,
): Record<string, unknown> | undefined {
  const metadataEntries = Object.entries(task.config).filter(([key, value]) => (
    !AUDIO_STANDARD_CONFIG_FIELDS.has(key)
    && typeof value !== 'undefined'
    && value !== null
  ));

  const metadata: Record<string, unknown> = Object.fromEntries(metadataEntries);

  if (typeof task.prompt === 'string' && task.prompt !== task.config.prompt) {
    metadata.taskPrompt = task.prompt;
  }

  if (typeof task.duration === 'number') {
    metadata.taskDuration = task.duration;
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

  return Object.keys(metadata).length > 0 ? metadata : undefined;
}

export const audioCreationHistoryMapper: CanonicalCreationHistoryMapper<AudioTask> = {
  product: 'audio',

  fromEntry(entry) {
    const rawMetadata = isRecord(entry.config.metadata) ? entry.config.metadata : {};
    const results = Array.isArray(entry.results)
      ? entry.results.map((result) => toAudioResult(result))
      : [];
    const duration =
      readNumber(rawMetadata.taskDuration)
      ?? results.find((result) => typeof result.duration === 'number')?.duration
      ?? readNumber(rawMetadata.duration)
      ?? undefined;
    const prompt =
      entry.config.prompt
      ?? readString(rawMetadata.taskPrompt)
      ?? readString(rawMetadata.prompt)
      ?? '';

    return createAudioTask({
      id: entry.id,
      uuid: entry.uuid,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
      status: toAudioTaskStatus(entry.status),
      prompt: readString(rawMetadata.taskPrompt) ?? prompt,
      duration,
      recipe: isRecord(rawMetadata.recipe)
        ? (rawMetadata.recipe as unknown as AudioTask['recipe'])
        : undefined,
      execution: isRecord(rawMetadata.execution)
        ? (rawMetadata.execution as unknown as AudioTask['execution'])
        : undefined,
      artifactSet: isRecord(rawMetadata.artifactSet)
        ? (rawMetadata.artifactSet as unknown as AudioTask['artifactSet'])
        : undefined,
      results,
      config: {
        prompt,
        mediaType: 'speech',
        model: entry.config.model as AudioGenerationParams['model'] | undefined,
        negativePrompt: readString(rawMetadata.negativePrompt),
        mode: (readString(rawMetadata.mode) as AudioGenerationParams['mode'] | undefined)
          ?? 'text-to-speech',
        voice: readString(rawMetadata.voice),
        duration: readNumber(rawMetadata.duration) ?? duration,
        seed: readNumber(rawMetadata.seed),
        sourceAudio: toAudioInputResource(rawMetadata.sourceAudio),
        language: readString(rawMetadata.language),
        sourceLanguage: readString(rawMetadata.sourceLanguage),
        targetLanguage: readString(rawMetadata.targetLanguage),
        format: readString(rawMetadata.format),
        idempotencyKey: readString(rawMetadata.idempotencyKey),
      },
      isFavorite: Boolean(entry.isFavorite),
      url: resolveAudioTaskResultUrl(results[0]) || undefined,
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
      product: 'audio',
      source: 'imported',
      status: task.status,
      isFavorite: task.isFavorite,
      config: {
        prompt: task.config.prompt || task.prompt,
        mediaType: 'speech',
        model: task.config.model,
        metadata: toAudioConfigMetadata(task),
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
