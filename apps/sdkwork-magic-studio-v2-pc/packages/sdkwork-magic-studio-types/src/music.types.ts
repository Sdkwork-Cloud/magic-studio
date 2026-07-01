// Music project type definitions
// All music-related types are defined here to avoid circular dependencies

import type { BaseEntity, EntityId } from './base.types';
import { createClientEntityIdentity } from './base.types';
import type { ArtifactSet, GenerationExecution, GenerationRecipe } from './agi.types';
import { MediaResourceType } from './vocabulary.types.ts';
import {
  isRenderableInputResourceUrl,
  resolveInputResourcePath,
  resolveInputResourceUrl,
} from './input-resource.utils';
import type { ImageMediaResource, MusicMediaResource } from './media.types';

// ============================================================================
// Music Model Types
// ============================================================================

export type MusicModelType = 'suno-v3' | 'suno-v3.5' | 'udio-v1' | 'musicgen-large';
export type MusicWorkflowMode = 'generate' | 'similar' | 'remix' | 'extend';

// ============================================================================
// Music Style
// ============================================================================

export interface MusicStyle {
  id: string;
  label: string;
  value: string;
  color: string;
}

// ============================================================================
// Music Config
// ============================================================================

export interface MusicConfig {
  mode?: MusicWorkflowMode;
  customMode: boolean;
  prompt: string;
  lyrics: string;
  style: string;
  title: string;
  instrumental: boolean;
  model: MusicModelType;
  duration?: number;
  extendDuration?: number;
  sourceMusic?: GeneratedMusicResult | null;
  mediaType: 'music';
  aspectRatio?: string;
}

// ============================================================================
// Generated Music Result
// ============================================================================

export type GeneratedMusicResource = Omit<MusicMediaResource, 'id'> & {
  id: EntityId;
  assetUuid?: string | null;
  primaryResourceUuid?: string | null;
  resourceViewUuid?: string | null;
};

export type GeneratedMusicCoverResource = Omit<ImageMediaResource, 'id'> & {
  id: EntityId;
  assetUuid?: string | null;
  primaryResourceUuid?: string | null;
  resourceViewUuid?: string | null;
};

export interface GeneratedMusicResult {
  id: EntityId;
  uuid: string;
  assetId?: string | null;
  assetUuid?: string | null;
  primaryResourceId?: string | null;
  primaryResourceUuid?: string | null;
  resourceViewId?: string | null;
  resourceViewUuid?: string | null;
  resource: GeneratedMusicResource;
  coverResource?: GeneratedMusicCoverResource;
  recipeUuid?: string | null;
  executionUuid?: string | null;
  artifactSetUuid?: string | null;
  artifactUuid?: string | null;
  executionId?: string | null;
  url?: string;
  coverUrl?: string;
  title: string;
  duration: number;
  lyrics?: string;
  style?: string;
}

export interface CreateGeneratedMusicResultInput
  extends Partial<
    Omit<
      GeneratedMusicResult,
      'id' | 'uuid' | 'resource' | 'coverResource' | 'url' | 'title' | 'duration'
    >
  > {
  id?: EntityId;
  uuid?: string | null;
  url?: string;
  resource?: Partial<GeneratedMusicResource>;
  coverResource?: Partial<GeneratedMusicCoverResource>;
  title: string;
  duration: number;
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

type MusicResultResourceLike = {
  path?: string | null;
  url?: string | null;
  metadata?: Record<string, unknown>;
};

type MusicResultLike = {
  url?: string | null;
  resource?: MusicResultResourceLike | null;
};

const resolveMusicResultPath = (
  input: MusicResultLike | null | undefined
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

const resolveMusicResultUrl = (
  input: MusicResultLike | null | undefined
): string | null => {
  if (!input) {
    return null;
  }

  const resolved = resolveInputResourceUrl({
    url: normalizeOptionalString(input.url),
    resource: input.resource
      ? {
          path: normalizeOptionalString(input.resource.path),
          url: normalizeOptionalString(input.resource.url),
        }
      : undefined,
    metadata: input.resource?.metadata,
  });

  return isRenderableInputResourceUrl(resolved) ? resolved : null;
};

const createGeneratedMusicResource = (
  input: Partial<GeneratedMusicResource> & {
    name: string;
  }
): GeneratedMusicResource => {
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
    type: input.type ?? MediaResourceType.MUSIC,
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
    format: input.format,
    bitRate: normalizeOptionalString(input.bitRate) || undefined,
    sampleRate: input.sampleRate,
    channels: input.channels,
    duration: input.duration,
    genre: normalizeOptionalString(input.genre) || undefined,
    bpm: input.bpm,
    artist: normalizeOptionalString(input.artist) || undefined,
  };
};

const createGeneratedMusicCoverResource = (
  input: Partial<GeneratedMusicCoverResource> & {
    url: string;
    name: string;
  }
): GeneratedMusicCoverResource => {
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

export const createGeneratedMusicResult = (
  input: CreateGeneratedMusicResultInput
): GeneratedMusicResult => {
  const identity = createClientEntityIdentity({
    id: input.id ?? null,
    uuid: input.uuid ?? undefined,
  });
  const resourcePath = resolveMusicResultPath(input);
  const resourceUrl = resolveMusicResultUrl(input);
  if (!resourcePath && !resourceUrl) {
    throw new Error('Generated music result requires a canonical resource reference');
  }

  const resource = createGeneratedMusicResource({
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
    duration: input.resource?.duration ?? input.duration,
    name:
      input.resource?.name ||
      `generated-music-${input.resource?.uuid || input.resourceViewUuid || identity.uuid}`,
  });
  const coverUrl = pickFirstString(input.coverResource?.url, input.coverUrl);
  const coverResource = coverUrl
    ? createGeneratedMusicCoverResource({
        ...input.coverResource,
        id: input.coverResource?.id ?? null,
        uuid: input.coverResource?.uuid ?? undefined,
        url: coverUrl,
        type: input.coverResource?.type ?? MediaResourceType.IMAGE,
        name:
          input.coverResource?.name ||
          `generated-music-cover-${input.coverResource?.uuid || identity.uuid}`,
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
    title: input.title,
    duration: input.duration,
    lyrics: input.lyrics,
    style: input.style,
  };
};

export const resolveGeneratedMusicResultPath = (
  result: Partial<GeneratedMusicResult> | null | undefined
): string | null => {
  if (!result) {
    return null;
  }

  return resolveMusicResultPath(result);
};

export const resolveGeneratedMusicResultUrl = (
  result: Partial<GeneratedMusicResult> | null | undefined
): string | null => {
  if (!result) {
    return null;
  }

  return resolveMusicResultUrl(result);
};

export const resolveGeneratedMusicResultCoverUrl = (
  result: Partial<GeneratedMusicResult> | null | undefined
): string | null => {
  if (!result) {
    return null;
  }

  return pickFirstString(
    typeof result.coverResource?.url === 'string' ? result.coverResource.url : null,
    result.coverUrl
  );
};

// ============================================================================
// Music Task
// ============================================================================

export interface MusicTask extends Omit<BaseEntity, 'id'> {
  id: EntityId;
  config: MusicConfig;
  recipe?: GenerationRecipe;
  execution?: GenerationExecution;
  artifactSet?: ArtifactSet;
  status: 'pending' | 'completed' | 'failed';
  results?: GeneratedMusicResult[];
  error?: string;
  isFavorite?: boolean;
}

export interface CreateMusicTaskInput
  extends Partial<Omit<MusicTask, 'id' | 'uuid' | 'createdAt' | 'updatedAt' | 'config' | 'status'>> {
  id?: EntityId;
  uuid?: string | null;
  createdAt?: MusicTask['createdAt'];
  updatedAt?: MusicTask['updatedAt'];
  config: MusicConfig;
  status: MusicTask['status'];
}

export const createMusicTask = (
  input: CreateMusicTaskInput
): MusicTask => {
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
    recipe: input.recipe,
    execution: input.execution,
    artifactSet: input.artifactSet,
    status: input.status,
    results: input.results,
    error: input.error,
    isFavorite: input.isFavorite,
  };
};

// ============================================================================
// Music Project
// ============================================================================

export interface MusicProject extends Omit<BaseEntity, 'id'> {
  id: EntityId;
  type: 'MUSIC_PROJECT';
  name: string;
  description?: string;
  tasks: MusicTask[];
  settings?: MusicProjectSettings;
}

export interface MusicProjectSettings {
  defaultModel?: MusicModelType;
  defaultDuration?: number;
  defaultInstrumental?: boolean;
}

// ============================================================================
// Music Genre
// ============================================================================

export interface MusicGenre {
  id: string;
  name: string;
  description?: string;
  tags?: string[];
}
