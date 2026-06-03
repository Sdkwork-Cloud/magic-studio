// SFX (Sound Effects) project type definitions
// All sfx-related types are defined here to avoid circular dependencies

import type { BaseEntity, EntityId } from './base.types';
import { createClientEntityIdentity } from './base.types';
import type { ArtifactSet, GenerationExecution, GenerationRecipe } from './agi.types';
import { MediaResourceType } from './vocabulary.types.ts';
import { resolveInputResourcePath } from './input-resource.utils';
import type { SfxMediaResource } from './media.types';

// ============================================================================
// SFX Model Types
// ============================================================================

export type SfxModelType = 'eleven-labs-sfx' | 'audioldm-2' | 'tango';

// ============================================================================
// SFX Config
// ============================================================================

export interface SfxConfig {
  prompt: string;
  duration: number; // in seconds
  model: SfxModelType;
  mediaType: 'sfx';
}

// ============================================================================
// Generated SFX Result
// ============================================================================

export type GeneratedSfxResource = Omit<SfxMediaResource, 'id'> & {
  id: EntityId;
  assetUuid?: string | null;
  primaryResourceUuid?: string | null;
  resourceViewUuid?: string | null;
};

export interface GeneratedSfxResult {
  id: EntityId;
  uuid: string;
  assetId?: string | null;
  assetUuid?: string | null;
  primaryResourceId?: string | null;
  primaryResourceUuid?: string | null;
  resourceViewId?: string | null;
  resourceViewUuid?: string | null;
  resource: GeneratedSfxResource;
  recipeUuid?: string | null;
  executionUuid?: string | null;
  artifactSetUuid?: string | null;
  artifactUuid?: string | null;
  executionId?: string | null;
  url?: string;
  duration: number;
}

export interface CreateGeneratedSfxResultInput
  extends Partial<Omit<GeneratedSfxResult, 'id' | 'uuid' | 'resource' | 'url' | 'duration'>> {
  id?: EntityId;
  uuid?: string | null;
  url?: string;
  duration?: number;
  resource?: Partial<GeneratedSfxResource>;
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

const createGeneratedSfxResource = (
  input: Partial<GeneratedSfxResource> & {
    url: string;
    name: string;
  }
): GeneratedSfxResource => {
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
    type: input.type ?? MediaResourceType.SFX,
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
    category: input.category,
    intensity: input.intensity,
    loopable: input.loopable,
  };
};

export const createGeneratedSfxResult = (
  input: CreateGeneratedSfxResultInput
): GeneratedSfxResult => {
  const identity = createClientEntityIdentity({
    id: input.id ?? null,
    uuid: input.uuid ?? undefined,
  });
  const resourceUrl = pickFirstString(input.resource?.url, input.url);
  if (!resourceUrl) {
    throw new Error('Generated sfx result requires a canonical resource url');
  }
  const resourceDuration = input.resource?.duration ?? input.duration;
  const resource = createGeneratedSfxResource({
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
    duration: resourceDuration,
    name:
      input.resource?.name ||
      `generated-sfx-${input.resource?.uuid || input.resourceViewUuid || identity.uuid}`,
  });

  return {
    id: identity.id,
    uuid: identity.uuid,
    assetId: pickFirstString(input.assetId, resource.assetId) ?? null,
    assetUuid: pickFirstString(input.assetUuid, resource.assetUuid) ?? null,
    primaryResourceId:
      pickFirstString(input.primaryResourceId, resource.primaryResourceId, resource.id) ?? null,
    primaryResourceUuid:
      pickFirstString(input.primaryResourceUuid, resource.primaryResourceUuid, resource.uuid) ?? null,
    resourceViewId: pickFirstString(input.resourceViewId, resource.resourceViewId) ?? null,
    resourceViewUuid:
      pickFirstString(input.resourceViewUuid, resource.resourceViewUuid) ?? null,
    resource,
    recipeUuid: normalizeOptionalString(input.recipeUuid) ?? null,
    executionUuid: normalizeOptionalString(input.executionUuid) ?? null,
    artifactSetUuid: normalizeOptionalString(input.artifactSetUuid) ?? null,
    artifactUuid: normalizeOptionalString(input.artifactUuid) ?? null,
    executionId: normalizeOptionalString(input.executionId) ?? null,
    duration: resourceDuration ?? 0,
  };
};

export const resolveGeneratedSfxResultUrl = (
  result: Partial<GeneratedSfxResult> | null | undefined
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
// SFX Task
// ============================================================================

export interface SfxTask extends Omit<BaseEntity, 'id'> {
  id: EntityId;
  config: SfxConfig;
  recipe?: GenerationRecipe;
  execution?: GenerationExecution;
  artifactSet?: ArtifactSet;
  status: 'pending' | 'completed' | 'failed';
  results?: GeneratedSfxResult[];
  error?: string;
  isFavorite?: boolean;
}

export interface CreateSfxTaskInput
  extends Partial<Omit<SfxTask, 'id' | 'uuid' | 'createdAt' | 'updatedAt' | 'config' | 'status'>> {
  id?: EntityId;
  uuid?: string | null;
  createdAt?: SfxTask['createdAt'];
  updatedAt?: SfxTask['updatedAt'];
  config: SfxConfig;
  status: SfxTask['status'];
}

export const createSfxTask = (
  input: CreateSfxTaskInput
): SfxTask => {
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
// SFX Project
// ============================================================================

export interface SfxProject extends Omit<BaseEntity, 'id'> {
  id: EntityId;
  type: 'SFX_PROJECT';
  name: string;
  description?: string;
  tasks: SfxTask[];
  settings?: SfxProjectSettings;
}

export interface SfxProjectSettings {
  defaultModel?: SfxModelType;
  defaultDuration?: number;
}

// ============================================================================
// SFX Category
// ============================================================================

export interface SfxCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
}

// ============================================================================
// SFX Preset
// ============================================================================

export interface SfxPreset {
  id: string;
  name: string;
  description?: string;
  prompt: string;
  duration: number;
  category?: string;
}
