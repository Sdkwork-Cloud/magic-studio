import type { ArtifactSet, GenerationExecution, GenerationRecipe, MediaInputRef } from './agi.types';
import type { BaseEntity, EntityId } from './base.types';
import { createClientEntityIdentity } from './base.types';
import { MediaResourceType } from './vocabulary.types.ts';
import {
  isRenderableInputResourceUrl,
  resolveInputResourcePath,
  resolveInputResourceUrl,
} from './input-resource.utils';
import type { AudioMediaResource, VoiceMediaResource } from './media.types';

export type VoiceGender = 'male' | 'female' | 'neutral';
export type VoiceStyle = 'neutral' | 'expressive' | 'news' | 'story' | 'whisper';
export type VoiceProvider =
  | 'gemini-tts'
  | 'eleven-labs-v2'
  | 'openai-tts-1'
  | 'azure-tts'
  | 'custom';
export type VoiceGenerationMode = 'design' | 'clone';
export type VoiceReferenceInputMethod = 'upload' | 'mic';
export type VoiceInputResourceType = 'audio' | 'voice';
export type VoiceInputResource = AudioMediaResource | VoiceMediaResource;

export interface VoiceInputResourceRef extends Omit<MediaInputRef, 'role' | 'type' | 'resource'> {
  assetUuid?: string | null;
  primaryResourceUuid?: string | null;
  resourceViewUuid?: string | null;
  type: VoiceInputResourceType;
  url?: string;
  name?: string;
  mimeType?: string;
  resource?: VoiceInputResource | null;
  metadata?: Record<string, unknown>;
}

export interface VoiceSpeaker extends BaseEntity {
  type: 'VOICE_SPEAKER';
  name: string;
  gender: VoiceGender;
  style: VoiceStyle;
  language: string;
  provider: VoiceProvider;
  providerVoiceId?: string;
  previewUrl?: string;
  avatarUrl?: string;
  description?: string;
  tags: string[];
  isFavorite?: boolean;
  config?: {
    speed?: number;
    pitch?: number;
    stability?: number;
    similarityBoost?: number;
  };
}

export interface VoiceTask extends Omit<BaseEntity, 'id'> {
  id: EntityId;
  type: 'VOICE_TASK';
  speakerId: string;
  text: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  config: VoiceConfig;
  recipe?: GenerationRecipe;
  execution?: GenerationExecution;
  artifactSet?: ArtifactSet;
  result?: GeneratedVoiceResult;
  results?: GeneratedVoiceResult[];
  isFavorite?: boolean;
  error?: string;
}

export interface CreateVoiceTaskInput
  extends Partial<Omit<VoiceTask, 'id' | 'uuid' | 'createdAt' | 'updatedAt' | 'type' | 'speakerId' | 'text'>> {
  id?: EntityId;
  uuid?: string | null;
  createdAt?: VoiceTask['createdAt'];
  updatedAt?: VoiceTask['updatedAt'];
  type?: VoiceTask['type'];
  speakerId: string;
  text: string;
}

const createDefaultVoiceTaskConfig = (
  input: Pick<CreateVoiceTaskInput, 'speakerId' | 'text'>
): VoiceConfig => ({
  text: input.text,
  previewText: input.text,
  mode: 'design',
  inputMethod: 'upload',
  voiceId: input.speakerId,
  model: 'gemini-tts',
  speed: 1,
  pitch: 1,
  mediaType: 'voice',
});

export const createVoiceTask = (
  input: CreateVoiceTaskInput
): VoiceTask => {
  const identity = createClientEntityIdentity({
    id: input.id ?? null,
    uuid: input.uuid ?? undefined,
  });

  return {
    id: identity.id,
    uuid: identity.uuid,
    createdAt: input.createdAt ?? identity.createdAt,
    updatedAt: input.updatedAt ?? identity.updatedAt,
    type: input.type ?? 'VOICE_TASK',
    speakerId: input.speakerId,
    text: input.text,
    status: input.status ?? 'pending',
    config: input.config ?? createDefaultVoiceTaskConfig(input),
    recipe: input.recipe,
    execution: input.execution,
    artifactSet: input.artifactSet,
    result: input.result,
    results: input.results,
    isFavorite: input.isFavorite,
    error: input.error,
  };
};

export type VoiceModelType = VoiceProvider;

export interface VoiceProfile extends BaseEntity {
  name: string;
  gender: VoiceGender;
  style: VoiceStyle;
  language: string;
  previewUrl?: string;
}

export interface VoiceConfig {
  text: string;
  voiceId: string;
  name?: string;
  avatarUrl?: string;
  previewText?: string;
  mode?: VoiceGenerationMode;
  inputMethod?: VoiceReferenceInputMethod;
  model: VoiceModelType;
  speed: number;
  pitch: number;
  stability?: number;
  similarityBoost?: number;
  referenceAudio?: VoiceInputResourceRef;
  description?: string;
  mediaType: 'voice';
}

export interface GeneratedVoiceResult {
  id: EntityId;
  uuid: string;
  assetId?: string | null;
  assetUuid?: string | null;
  primaryResourceId?: string | null;
  primaryResourceUuid?: string | null;
  resourceViewId?: string | null;
  resourceViewUuid?: string | null;
  recipeUuid?: string | null;
  executionUuid?: string | null;
  artifactSetUuid?: string | null;
  artifactUuid?: string | null;
  executionId?: string | null;
  resource: VoiceMediaResource;
  url?: string;
  duration: number;
  text: string;
  speakerId: string;
  avatarUrl?: string;
  modelId?: string;
}

export interface CreateGeneratedVoiceResultInput
  extends Partial<Omit<GeneratedVoiceResult, 'id' | 'uuid' | 'resource' | 'duration' | 'text' | 'speakerId'>> {
  id?: EntityId;
  uuid?: string | null;
  url?: string;
  duration: number;
  text: string;
  speakerId: string;
  resource?: Partial<VoiceMediaResource>;
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

type VoiceResultResourceLike = {
  path?: string | null;
  url?: string | null;
  metadata?: Record<string, unknown>;
};

type VoiceResultLike = {
  url?: string | null;
  resource?: VoiceResultResourceLike | null;
};

const resolveVoiceResultPath = (
  input: VoiceResultLike | null | undefined
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

const resolveVoiceResultUrl = (
  input: VoiceResultLike | null | undefined
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

export interface CreateVoiceInputResourceRefInput
  extends Partial<Omit<VoiceInputResourceRef, 'type' | 'resource'>> {
  type?: VoiceInputResourceType;
  resource?: Partial<VoiceInputResource> | null;
}

type VoiceInputResourceLike =
  | Partial<VoiceInputResourceRef>
  | CreateVoiceInputResourceRefInput;

export const resolveVoiceInputResourceKey = (
  input: VoiceInputResourceLike | null | undefined
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

export const resolveVoiceInputResourceUrl = (
  input: VoiceInputResourceLike | null | undefined
): string | null => {
  return resolveInputResourceUrl(input);
};

export const resolveVoiceInputResourcePath = (
  input: VoiceInputResourceLike | null | undefined
): string | null => resolveInputResourcePath(input);

export const createVoiceInputResourceRef = (
  input: CreateVoiceInputResourceRefInput = {}
): VoiceInputResourceRef => {
  const resolvedUrl = resolveVoiceInputResourceUrl(input);
  const resolvedPath = resolveVoiceInputResourcePath(input);
  const identity = createClientEntityIdentity({
    id:
      pickFirstString(
        input.id,
        input.resourceViewId,
        input.primaryResourceId,
        input.assetId,
        input.resource?.id
      ) ?? null,
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
    resource: input.resource ? ({ ...input.resource } as VoiceInputResource) : undefined,
    metadata: input.metadata ? { ...input.metadata } : undefined,
  };
};

export const createGeneratedVoiceResult = (
  input: CreateGeneratedVoiceResultInput
): GeneratedVoiceResult => {
  const identity = createClientEntityIdentity({
    id: input.id ?? null,
    uuid: input.uuid ?? undefined,
  });
  const resourcePath = resolveVoiceResultPath(input);
  const resourceUrl = resolveVoiceResultUrl(input);
  if (!resourcePath && !resourceUrl) {
    throw new Error('Generated voice result requires a canonical resource reference');
  }

  const resourceId =
    pickFirstString(
      input.resource?.id,
      input.primaryResourceId,
      input.resourceViewId,
      input.assetId,
      identity.uuid
    ) || identity.uuid;
  const resourceUuid =
    pickFirstString(
      input.resource?.uuid,
      input.resourceViewUuid,
      input.primaryResourceUuid,
      input.assetUuid,
      identity.uuid
    ) || identity.uuid;

  const resourceIdentity = createClientEntityIdentity({
    id: resourceId,
    uuid: resourceUuid,
    createdAt: input.resource?.createdAt,
    updatedAt: input.resource?.updatedAt,
  });

  const resource: VoiceMediaResource = {
    id: resourceId,
    uuid: resourceUuid,
    createdAt: resourceIdentity.createdAt,
    updatedAt: resourceIdentity.updatedAt,
    assetId: normalizeOptionalString(input.resource?.assetId) ?? normalizeOptionalString(input.assetId) ?? null,
    primaryResourceId:
      normalizeOptionalString(input.resource?.primaryResourceId) ??
      normalizeOptionalString(input.primaryResourceId) ??
      null,
    resourceViewId:
      normalizeOptionalString(input.resource?.resourceViewId) ??
      normalizeOptionalString(input.resourceViewId) ??
      null,
    type: input.resource?.type ?? MediaResourceType.VOICE,
    name:
      normalizeOptionalString(input.resource?.name) ||
      `generated-voice-${input.resource?.uuid || input.resourceViewUuid || identity.uuid}`,
    url: resourceUrl || undefined,
    path: resourcePath || undefined,
    mimeType: normalizeOptionalString(input.resource?.mimeType) || undefined,
    extension: normalizeOptionalString(input.resource?.extension) || undefined,
    size: input.resource?.size,
    duration: input.resource?.duration ?? input.duration,
    speakerId:
      normalizeOptionalString(input.resource?.speakerId) ||
      normalizeOptionalString(input.speakerId) ||
      undefined,
    language: normalizeOptionalString(input.resource?.language) || undefined,
    gender: normalizeOptionalString(input.resource?.gender) || undefined,
    emotion: normalizeOptionalString(input.resource?.emotion) || undefined,
    metadata: {
      ...(input.resource?.metadata ? { ...input.resource.metadata } : {}),
      assetUuid: pickFirstString(input.assetUuid) || undefined,
      primaryResourceUuid:
        pickFirstString(input.primaryResourceUuid, input.resource?.uuid) || undefined,
      resourceViewUuid: pickFirstString(input.resourceViewUuid) || undefined,
    },
    tags: input.resource?.tags,
    origin: input.resource?.origin,
    isFavorite: input.resource?.isFavorite,
    bytes: input.resource?.bytes,
    base64: normalizeOptionalString(input.resource?.base64) || undefined,
    localFile: input.resource?.localFile,
    format: input.resource?.format,
    bitRate: normalizeOptionalString(input.resource?.bitRate) || undefined,
    sampleRate: input.resource?.sampleRate,
    channels: input.resource?.channels,
    scene: input.resource?.scene,
  };

  return {
    id: identity.id,
    uuid: identity.uuid,
    assetId: pickFirstString(input.assetId, resource.assetId) ?? null,
    assetUuid: pickFirstString(input.assetUuid) ?? null,
    primaryResourceId:
      pickFirstString(input.primaryResourceId, resource.primaryResourceId, resource.id) ?? null,
    primaryResourceUuid:
      pickFirstString(input.primaryResourceUuid, resource.uuid) ?? null,
    resourceViewId: pickFirstString(input.resourceViewId, resource.resourceViewId) ?? null,
    resourceViewUuid: pickFirstString(input.resourceViewUuid) ?? null,
    recipeUuid: normalizeOptionalString(input.recipeUuid) ?? null,
    executionUuid: normalizeOptionalString(input.executionUuid) ?? null,
    artifactSetUuid: normalizeOptionalString(input.artifactSetUuid) ?? null,
    artifactUuid: normalizeOptionalString(input.artifactUuid) ?? null,
    executionId: normalizeOptionalString(input.executionId) ?? null,
    resource,
    duration: input.duration,
    text: input.text,
    speakerId: normalizeOptionalString(input.speakerId) || resource.speakerId || '',
    avatarUrl: normalizeOptionalString(input.avatarUrl) || undefined,
    modelId: normalizeOptionalString(input.modelId) || undefined,
  };
};

export const resolveGeneratedVoiceResultPath = (
  result: Partial<GeneratedVoiceResult> | null | undefined
): string | null => {
  if (!result) {
    return null;
  }

  return resolveVoiceResultPath(result);
};

export const resolveGeneratedVoiceResultUrl = (
  result: Partial<GeneratedVoiceResult> | null | undefined
): string | null => {
  if (!result) {
    return null;
  }

  return resolveVoiceResultUrl(result);
};
