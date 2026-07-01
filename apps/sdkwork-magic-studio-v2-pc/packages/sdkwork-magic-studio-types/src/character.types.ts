// Character type definitions
// All character-related types are defined here to avoid circular dependencies

import type { BaseEntity, EntityId } from './base.types';
import { createClientEntityIdentity } from './base.types';
import { MediaResourceType } from './vocabulary.types.ts';
import type {
  CreateImageInputResourceRefInput,
  ImageInputResourceRef,
} from './image.types';
import {
  createImageInputResourceRef,
  hasImageInputResourceReference,
  resolveImageInputResourceKey,
  resolveImageInputResourcePath,
  resolveImageInputResourceReference,
  resolveImageInputResourceUrl,
} from './image.types';
import {
  isRenderableInputResourceUrl,
  resolveInputResourcePath,
  resolveInputResourceUrl,
} from './input-resource.utils';
import type { CharacterMediaResource } from './media.types';

// ============================================================================
// Character Archetype and Gender
// ============================================================================

export type CharacterArchetype = 'hero' | 'villain' | 'npc' | 'fantasy' | 'cyberpunk' | 'anime' | 'mascot';

export type CharacterGender = 'male' | 'female' | 'neutral';

// ============================================================================
// Character Config
// ============================================================================

export type CharacterAvatarInputResourceRef = ImageInputResourceRef;
export type CreateCharacterAvatarInputResourceRefInput = CreateImageInputResourceRefInput;

type CharacterAvatarInputResourceLike =
  | Partial<CharacterAvatarInputResourceRef>
  | CreateCharacterAvatarInputResourceRefInput;

export const resolveCharacterAvatarInputResourceKey = (
  input: CharacterAvatarInputResourceLike | null | undefined
): string | null => resolveImageInputResourceKey(input);

export const resolveCharacterAvatarInputResourceUrl = (
  input: CharacterAvatarInputResourceLike | null | undefined
): string | null => resolveImageInputResourceUrl(input);

export const resolveCharacterAvatarInputResourcePath = (
  input: CharacterAvatarInputResourceLike | null | undefined
): string | null => resolveImageInputResourcePath(input);

export const resolveCharacterAvatarInputResourceReference = (
  input: CharacterAvatarInputResourceLike | null | undefined
): string | null => resolveImageInputResourceReference(input);

export const hasCharacterAvatarInputResourceReference = (
  input: CharacterAvatarInputResourceLike | null | undefined
): boolean => hasImageInputResourceReference(input);

export const createCharacterAvatarInputResourceRef = (
  input: CreateCharacterAvatarInputResourceRefInput = {}
): CharacterAvatarInputResourceRef => createImageInputResourceRef(input);

export interface CharacterConfig {
  prompt: string;
  name?: string;
  description?: string;
  model?: string;
  archetype?: CharacterArchetype;
  gender?: CharacterGender;
  mediaType: 'character';
  age?: number;
  outfit?: string;
  hairstyle?: string;
  hairColor?: string;
  eyeColor?: string;
  skinTone?: string;
  accessories?: string;
  aspectRatio?: string;
  voiceId?: string;
  avatarMode?: string;
  avatar?: CharacterAvatarInputResourceRef;
}

// ============================================================================
// Character
// ============================================================================

export type CharacterResultResource = Omit<CharacterMediaResource, 'id'> & {
  id: EntityId;
  assetUuid?: string | null;
  primaryResourceUuid?: string | null;
  resourceViewUuid?: string | null;
};

export interface Character extends Omit<BaseEntity, 'id'> {
  id: EntityId;
  name: string;
  description: string;
  avatarUrl?: string;
  url?: string;
  resource?: CharacterResultResource;
  config?: CharacterConfig;
}

export interface CreateCharacterInput
  extends Partial<Omit<Character, 'id' | 'uuid' | 'createdAt' | 'updatedAt' | 'name' | 'description' | 'resource'>> {
  id?: EntityId;
  uuid?: string | null;
  createdAt?: Character['createdAt'];
  updatedAt?: Character['updatedAt'];
  deletedAt?: Character['deletedAt'];
  name: string;
  description: string;
  resource?: Partial<CharacterResultResource> | null;
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

type CharacterResourceLike = {
  path?: string | null;
  url?: string | null;
  metadata?: Record<string, unknown>;
};

type CharacterLike = {
  avatarUrl?: string | null;
  url?: string | null;
  resource?: CharacterResourceLike | null;
};

export const resolveCharacterResourcePath = (
  input: CharacterLike | null | undefined
): string | null => {
  if (!input) {
    return null;
  }

  return resolveInputResourcePath({
    url: pickFirstString(
      normalizeOptionalString(input.url),
      normalizeOptionalString(input.avatarUrl)
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

export const resolveCharacterResourceUrl = (
  input: CharacterLike | null | undefined
): string | null => {
  if (!input) {
    return null;
  }

  const resolved = resolveInputResourceUrl({
    url: pickFirstString(
      normalizeOptionalString(input.url),
      normalizeOptionalString(input.avatarUrl)
    ),
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

export const createCharacter = (
  input: CreateCharacterInput
): Character => {
  const identity = createClientEntityIdentity({
    id: input.id ?? null,
    uuid: input.uuid ?? undefined,
    createdAt: input.createdAt,
    updatedAt: input.updatedAt,
    deletedAt: input.deletedAt,
  });
  const resourcePath = resolveCharacterResourcePath(input);
  const resourceUrl = resolveCharacterResourceUrl(input);
  const hasResourceReference = !!input.resource || !!resourcePath || !!resourceUrl;
  const resource = hasResourceReference
    ? (() => {
        const resourceIdentity = createClientEntityIdentity({
          id: input.resource?.id ?? null,
          uuid: input.resource?.uuid ?? identity.uuid,
          createdAt: input.resource?.createdAt,
          updatedAt: input.resource?.updatedAt,
          deletedAt: input.resource?.deletedAt,
        });

        return {
          ...resourceIdentity,
          assetId: normalizeOptionalString(input.resource?.assetId) ?? null,
          assetUuid: normalizeOptionalString(input.resource?.assetUuid) ?? null,
          primaryResourceId: normalizeOptionalString(input.resource?.primaryResourceId) ?? null,
          primaryResourceUuid:
            normalizeOptionalString(input.resource?.primaryResourceUuid) ?? null,
          resourceViewId: normalizeOptionalString(input.resource?.resourceViewId) ?? null,
          resourceViewUuid:
            normalizeOptionalString(input.resource?.resourceViewUuid) ?? null,
          sourceRecipeId: normalizeOptionalString(input.resource?.sourceRecipeId) || undefined,
          sourceRecipeUuid: normalizeOptionalString(input.resource?.sourceRecipeUuid) || undefined,
          sourceExecutionId:
            normalizeOptionalString(input.resource?.sourceExecutionId) || undefined,
          sourceExecutionUuid:
            normalizeOptionalString(input.resource?.sourceExecutionUuid) || undefined,
          sourceArtifactId: normalizeOptionalString(input.resource?.sourceArtifactId) || undefined,
          sourceArtifactUuid:
            normalizeOptionalString(input.resource?.sourceArtifactUuid) || undefined,
          url: resourceUrl || undefined,
          path: resourcePath || undefined,
          localFile: input.resource?.localFile,
          type: input.resource?.type ?? MediaResourceType.IMAGE,
          mimeType: normalizeOptionalString(input.resource?.mimeType) || undefined,
          size: input.resource?.size,
          name:
            normalizeOptionalString(input.resource?.name) ||
            normalizeOptionalString(input.name) ||
            `character-${identity.uuid}`,
          extension: normalizeOptionalString(input.resource?.extension) || undefined,
          scene: input.resource?.scene,
          prompt:
            normalizeOptionalString(input.resource?.prompt) ||
            normalizeOptionalString(input.description) ||
            undefined,
          metadata: input.resource?.metadata ? { ...input.resource.metadata } : undefined,
          tags: input.resource?.tags,
          origin: input.resource?.origin,
          isFavorite: input.resource?.isFavorite,
          bytes: input.resource?.bytes,
          base64: normalizeOptionalString(input.resource?.base64) || undefined,
          characterType: normalizeOptionalString(input.resource?.characterType) || undefined,
          gender: normalizeOptionalString(input.resource?.gender) || undefined,
          ageGroup: normalizeOptionalString(input.resource?.ageGroup) || undefined,
          avatarUrl: resourceUrl || undefined,
          avatarVideoUrl: normalizeOptionalString(input.resource?.avatarVideoUrl) || undefined,
          speakerId: normalizeOptionalString(input.resource?.speakerId) || undefined,
          appearanceParams: input.resource?.appearanceParams,
          animationParams: input.resource?.animationParams,
          refAssets: input.resource?.refAssets,
        } satisfies CharacterResultResource;
      })()
    : undefined;

  return {
    ...identity,
    name: input.name,
    description: input.description,
    avatarUrl: resourceUrl || undefined,
    url: resourceUrl || undefined,
    resource,
    config: input.config,
  };
};

// ============================================================================
// Character Task
// ============================================================================

export interface CharacterTask extends BaseEntity {
  config: CharacterConfig;
  status: 'pending' | 'completed' | 'failed';
  results?: Character[];
  error?: string;
  isFavorite?: boolean;
}

// ============================================================================
// Character Style/Preset
// ============================================================================

export interface CharacterStyle {
  id: string;
  name: string;
  description?: string;
  previewUrl?: string;
  category?: string;
}

// ============================================================================
// Character Conversation
// ============================================================================

export interface CharacterMessage {
  id: string;
  role: 'user' | 'character';
  content: string;
  timestamp: string; // ISO 8601 format: yyyy-MM-dd HH:mm:ss
  emotion?: string;
}

export interface CharacterConversation extends BaseEntity {
  characterId: string;
  messages: CharacterMessage[];
  title?: string;
}
