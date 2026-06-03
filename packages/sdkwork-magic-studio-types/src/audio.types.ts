// Audio project type definitions
// All audio-related types are defined here to avoid circular dependencies

import type { BaseEntity, EntityId } from './base.types';
import { createClientEntityIdentity } from './base.types';
import type { ArtifactSet, GenerationExecution, GenerationRecipe, MediaInputRef } from './agi.types';
import { MediaResourceType } from './vocabulary.types.ts';
import {
  hasInputResourceReference,
  resolveInputResourceReference,
  resolveInputResourcePath,
  resolveInputResourceUrl,
} from './input-resource.utils';
import type { AudioMediaResource, TextMediaResource, VoiceMediaResource } from './media.types';

// ============================================================================
// Audio Model Types
// ============================================================================

export type AudioModelType =
  | 'whisper-1'
  | 'gemini-tts'
  | 'openai-tts-1'
  | 'eleven-labs-v2'
  | 'azure-tts';

export type AudioGenerationMode = 'text-to-speech' | 'transcription' | 'translation';

export type AudioInputResourceType = 'audio' | 'voice';

export type AudioInputResource = AudioMediaResource | VoiceMediaResource;

export interface AudioInputResourceRef extends Omit<MediaInputRef, 'role' | 'type' | 'resource'> {
  assetUuid?: string | null;
  primaryResourceUuid?: string | null;
  resourceViewUuid?: string | null;
  type: AudioInputResourceType;
  url?: string;
  name?: string;
  mimeType?: string;
  resource?: AudioInputResource | null;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Audio Generation Params
// ============================================================================

export interface AudioGenerationParams {
  prompt: string;
  negativePrompt?: string;
  mode?: AudioGenerationMode;
  model?: AudioModelType;
  voice?: string;
  duration?: number;
  seed?: number;
  mediaType?: 'speech';
  sourceAudio?: AudioInputResourceRef;
  language?: string;
  sourceLanguage?: string;
  targetLanguage?: string;
  format?: string;
  idempotencyKey?: string;
}

// ============================================================================
// Audio Input Resource
// ============================================================================

export interface CreateAudioInputResourceRefInput
  extends Partial<Omit<AudioInputResourceRef, 'type' | 'resource'>> {
  type?: AudioInputResourceType;
  resource?: Partial<AudioInputResource> | null;
}

type AudioInputResourceLike =
  | Partial<AudioInputResourceRef>
  | CreateAudioInputResourceRefInput;

// ============================================================================
// Audio Task Result
// ============================================================================

export type GeneratedAudioResource = Omit<AudioMediaResource, 'id'> & {
  id: EntityId;
  assetUuid?: string | null;
  primaryResourceUuid?: string | null;
  resourceViewUuid?: string | null;
};

export type GeneratedAudioTextResource = Omit<TextMediaResource, 'id'> & {
  id: EntityId;
  assetUuid?: string | null;
  primaryResourceUuid?: string | null;
  resourceViewUuid?: string | null;
};

export type GeneratedAudioTaskResource = GeneratedAudioResource | GeneratedAudioTextResource;

export interface AudioTaskResult {
  id: EntityId;
  uuid: string;
  assetId?: string | null;
  assetUuid?: string | null;
  primaryResourceId?: string | null;
  primaryResourceUuid?: string | null;
  resourceViewId?: string | null;
  resourceViewUuid?: string | null;
  resource: GeneratedAudioTaskResource;
  recipeUuid?: string | null;
  executionUuid?: string | null;
  artifactSetUuid?: string | null;
  artifactUuid?: string | null;
  executionId?: string | null;
  url?: string;
  duration?: number;
  text?: string;
  language?: string;
  segments?: unknown[] | null;
}

export interface CreateAudioTaskResultInput
  extends Partial<Omit<AudioTaskResult, 'id' | 'uuid' | 'resource' | 'url'>> {
  id?: EntityId;
  uuid?: string | null;
  url?: string;
  resource?: Partial<GeneratedAudioResource> & Partial<GeneratedAudioTextResource>;
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

export const resolveAudioInputResourceKey = (
  input: AudioInputResourceLike | null | undefined
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

export const resolveAudioInputResourceUrl = (
  input: AudioInputResourceLike | null | undefined
): string | null => {
  return resolveInputResourceUrl(input);
};

export const resolveAudioInputResourcePath = (
  input: AudioInputResourceLike | null | undefined
): string | null => resolveInputResourcePath(input);

export const resolveAudioInputResourceReference = (
  input: AudioInputResourceLike | null | undefined
): string | null => resolveInputResourceReference(input);

export const hasAudioInputResourceReference = (
  input: AudioInputResourceLike | null | undefined
): boolean => hasInputResourceReference(input);

export const createAudioInputResourceRef = (
  input: CreateAudioInputResourceRefInput = {}
): AudioInputResourceRef => {
  const resolvedUrl = resolveAudioInputResourceUrl(input);
  const resolvedPath = resolveAudioInputResourcePath(input);
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
    type: input.type ?? 'audio',
    path: resolvedPath ?? undefined,
    url: resolvedUrl ?? undefined,
    name: normalizeOptionalString(input.name) || input.resource?.name || undefined,
    mimeType:
      normalizeOptionalString(input.mimeType) ||
      normalizeOptionalString(input.resource?.mimeType) ||
      undefined,
    resource: input.resource ? ({ ...input.resource } as AudioInputResource) : undefined,
    metadata: input.metadata ? { ...input.metadata } : undefined,
  };
};

const createGeneratedAudioResource = (
  input: (Partial<GeneratedAudioResource> & Partial<GeneratedAudioTextResource>) & {
    url: string;
    name: string;
  }
): GeneratedAudioTaskResource => {
  const identity = createClientEntityIdentity({
    id: input.id ?? null,
    uuid: input.uuid ?? undefined,
    createdAt: input.createdAt,
    updatedAt: input.updatedAt,
  });
  const resourceType = input.type ?? MediaResourceType.AUDIO;
  const sharedResource = {
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
    type: resourceType,
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
  };

  if (resourceType === MediaResourceType.TEXT) {
    return {
      ...sharedResource,
      type: MediaResourceType.TEXT,
      text: normalizeOptionalString(input.text) || undefined,
      language: normalizeOptionalString(input.language) || undefined,
      fontFamily: normalizeOptionalString(input.fontFamily) || undefined,
      fontSize: input.fontSize,
    };
  }

  return {
    ...sharedResource,
    type: resourceType,
    format: input.format,
    bitRate: normalizeOptionalString(input.bitRate) || undefined,
    sampleRate: input.sampleRate,
    channels: input.channels,
    duration: input.duration,
  };
};

export const createAudioTaskResult = (
  input: CreateAudioTaskResultInput
): AudioTaskResult => {
  const identity = createClientEntityIdentity({
    id: input.id ?? null,
    uuid: input.uuid ?? undefined,
  });
  const resourceUrl = pickFirstString(input.resource?.url, input.url);
  if (!resourceUrl) {
    throw new Error('Audio task result requires a canonical resource url');
  }

  const resource = createGeneratedAudioResource({
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
    url: resourceUrl,
    duration: input.resource?.duration ?? input.duration,
    name:
      input.resource?.name ||
      `generated-audio-${input.resource?.uuid || input.resourceViewUuid || identity.uuid}`,
  });
  const resourceMetadata = resource.metadata as Record<string, unknown> | undefined;

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
    recipeUuid: normalizeOptionalString(input.recipeUuid) ?? null,
    executionUuid: normalizeOptionalString(input.executionUuid) ?? null,
    artifactSetUuid: normalizeOptionalString(input.artifactSetUuid) ?? null,
    artifactUuid: normalizeOptionalString(input.artifactUuid) ?? null,
    executionId: normalizeOptionalString(input.executionId) ?? null,
    duration: input.duration ?? ('duration' in resource ? resource.duration : undefined),
    text:
      normalizeOptionalString(input.text) ||
      ('text' in resource ? normalizeOptionalString(resource.text) : null) ||
      normalizeOptionalString(resourceMetadata?.text as string | undefined) ||
      undefined,
    language:
      normalizeOptionalString(input.language) ||
      ('language' in resource ? normalizeOptionalString(resource.language) : null) ||
      normalizeOptionalString(resourceMetadata?.language as string | undefined) ||
      undefined,
    segments: Array.isArray(input.segments)
      ? [...input.segments]
      : Array.isArray(resourceMetadata?.segments)
        ? ([...(resourceMetadata.segments as unknown[])] as unknown[])
        : null,
  };
};

export const resolveAudioTaskResultUrl = (
  result: Partial<AudioTaskResult> | null | undefined
): string | null => {
  if (!result) {
    return null;
  }

  return pickFirstString(
    typeof result.resource?.url === 'string' ? result.resource.url : null,
    result.url
  );
};

// ============================================================================
// Audio Task
// ============================================================================

export interface AudioTask extends Omit<BaseEntity, 'id'> {
  id: EntityId;
  url?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  prompt?: string;
  duration?: number;
  recipe?: GenerationRecipe;
  execution?: GenerationExecution;
  artifactSet?: ArtifactSet;
  results?: AudioTaskResult[];
  config: AudioGenerationParams;
  isFavorite?: boolean;
}

export interface CreateAudioTaskInput
  extends Partial<Omit<AudioTask, 'id' | 'uuid' | 'createdAt' | 'updatedAt' | 'config' | 'status'>> {
  id?: EntityId;
  uuid?: string | null;
  createdAt?: AudioTask['createdAt'];
  updatedAt?: AudioTask['updatedAt'];
  config: AudioGenerationParams;
  status: AudioTask['status'];
}

export const createAudioTask = (
  input: CreateAudioTaskInput
): AudioTask => {
  const identity = createClientEntityIdentity({
    id: input.id ?? null,
    uuid: input.uuid ?? undefined,
  });

  return {
    id: identity.id,
    uuid: identity.uuid,
    createdAt: input.createdAt ?? identity.createdAt,
    updatedAt: input.updatedAt ?? identity.updatedAt,
    url: input.url,
    status: input.status,
    prompt: input.prompt,
    duration: input.duration,
    recipe: input.recipe,
    execution: input.execution,
    artifactSet: input.artifactSet,
    results: input.results,
    config: input.config,
    isFavorite: input.isFavorite,
  };
};

// ============================================================================
// Audio Project
// ============================================================================

export interface AudioProject extends Omit<BaseEntity, 'id'> {
  id: EntityId;
  type: 'AUDIO_PROJECT';
  name: string;
  description?: string;
  tasks: AudioTask[];
}

// ============================================================================
// Audio Voice
// ============================================================================

export interface AudioVoice {
  id: string;
  name: string;
  language: string;
  gender: 'male' | 'female' | 'neutral';
  previewUrl?: string;
  provider: string;
}

// ============================================================================
// Audio Preset
// ============================================================================

export interface AudioPreset {
  id: string;
  name: string;
  description?: string;
  params: Partial<AudioGenerationParams>;
  category?: string;
}
