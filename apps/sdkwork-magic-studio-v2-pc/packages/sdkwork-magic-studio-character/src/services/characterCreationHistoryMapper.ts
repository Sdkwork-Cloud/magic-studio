import type {
  CanonicalCreationHistoryMapper,
} from '@sdkwork/magic-studio-generation-history';
import { MediaResourceType } from '@sdkwork/magic-studio-types/vocabulary';

import {
  createCharacter,
  createCharacterAvatarInputResourceRef,
  hasCharacterAvatarInputResourceReference,
  type Character,
  type CharacterConfig,
  type CharacterTask,
} from '../entities';

const CHARACTER_STANDARD_CONFIG_FIELDS = new Set([
  'prompt',
  'mediaType',
  'aspectRatio',
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

function toIsoTimestamp(value: string | number | null | undefined): string | undefined {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return new Date(value).toISOString();
  }
  return undefined;
}

function toCharacterTaskStatus(status: string): CharacterTask['status'] {
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

function toCharacterAvatar(value: unknown): CharacterConfig['avatar'] {
  if (!isRecord(value)) {
    return undefined;
  }

  const avatar = createCharacterAvatarInputResourceRef({
    ...value,
  });

  return hasCharacterAvatarInputResourceReference(avatar) ? avatar : undefined;
}

function toCreationHistoryResource(character: Character) {
  const resource = character.resource;

  return {
    id: typeof resource?.id === 'string' ? resource.id : undefined,
    uuid: resource?.uuid ?? character.uuid,
    assetId: resource?.assetId,
    assetUuid: resource?.assetUuid,
    primaryResourceId: resource?.primaryResourceId,
    primaryResourceUuid: resource?.primaryResourceUuid,
    resourceViewId: resource?.resourceViewId,
    resourceViewUuid: resource?.resourceViewUuid,
    type: resource?.type ?? MediaResourceType.IMAGE,
    path: resource?.path,
    url: resource?.url ?? character.url ?? character.avatarUrl,
    mimeType: resource?.mimeType,
    name: resource?.name ?? character.name,
    metadata: {
      ...(isRecord(resource?.metadata) ? resource?.metadata : {}),
      name: character.name,
      description: character.description,
      avatarUrl: character.avatarUrl ?? character.url ?? resource?.url ?? null,
      config: character.config ?? null,
    },
  };
}

function toCharacterResult(result: {
  id?: string | null;
  uuid?: string;
  assetId?: string | null;
  assetUuid?: string | null;
  primaryResourceId?: string | null;
  primaryResourceUuid?: string | null;
  resourceViewId?: string | null;
  resourceViewUuid?: string | null;
  path?: string;
  url?: string;
  mimeType?: string;
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
}): Character {
  const resourceMetadata = isRecord(result.resource?.metadata)
    ? result.resource.metadata
    : undefined;
  const characterConfig = isRecord(resourceMetadata?.config)
    ? (resourceMetadata.config as unknown as CharacterConfig)
    : undefined;

  return createCharacter({
    id: result.id ?? result.resource?.id ?? result.primaryResourceId ?? null,
    uuid: result.uuid ?? result.resource?.uuid ?? undefined,
    name:
      readString(resourceMetadata?.name)
      ?? result.resource?.name
      ?? 'Generated Character',
    description: readString(resourceMetadata?.description) ?? '',
    avatarUrl:
      readString(resourceMetadata?.avatarUrl)
      ?? result.resource?.url
      ?? result.url
      ?? result.path
      ?? undefined,
    url: result.resource?.url ?? result.url ?? result.path ?? undefined,
    resource: {
      id: result.resource?.id ?? result.primaryResourceId ?? result.id ?? null,
      uuid: result.resource?.uuid ?? result.primaryResourceUuid ?? result.uuid ?? undefined,
      assetId: result.resource?.assetId ?? result.assetId ?? null,
      assetUuid: result.resource?.assetUuid ?? result.assetUuid ?? null,
      primaryResourceId:
        result.resource?.primaryResourceId ?? result.primaryResourceId ?? result.id ?? null,
      primaryResourceUuid:
        result.resource?.primaryResourceUuid ?? result.primaryResourceUuid ?? result.uuid ?? null,
      resourceViewId: result.resource?.resourceViewId ?? result.resourceViewId ?? null,
      resourceViewUuid: result.resource?.resourceViewUuid ?? result.resourceViewUuid ?? null,
      path: result.resource?.path ?? result.path ?? undefined,
      url: result.resource?.url ?? result.url ?? result.path ?? undefined,
      mimeType: result.resource?.mimeType ?? result.mimeType ?? undefined,
      name:
        result.resource?.name
        ?? readString(resourceMetadata?.name)
        ?? 'Generated Character',
      type: MediaResourceType.IMAGE,
      metadata: resourceMetadata,
    },
    config: characterConfig,
  });
}

function toCharacterConfigMetadata(task: CharacterTask): Record<string, unknown> | undefined {
  const metadataEntries = Object.entries(task.config).filter(([key, value]) => (
    !CHARACTER_STANDARD_CONFIG_FIELDS.has(key)
    && typeof value !== 'undefined'
    && value !== null
  ));

  return metadataEntries.length > 0
    ? Object.fromEntries(metadataEntries)
    : undefined;
}

export const characterCreationHistoryMapper: CanonicalCreationHistoryMapper<CharacterTask> = {
  product: 'character',

  fromEntry(entry) {
    const rawMetadata = isRecord(entry.config.metadata) ? entry.config.metadata : {};

    return {
      id: entry.id,
      uuid: entry.uuid,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
      status: toCharacterTaskStatus(entry.status),
      config: {
        prompt: entry.config.prompt ?? '',
        description: readString(rawMetadata.description),
        name: readString(rawMetadata.name),
        model: entry.config.model ?? undefined,
        archetype: readString(rawMetadata.archetype) as CharacterConfig['archetype'] | undefined,
        gender: readString(rawMetadata.gender) as CharacterConfig['gender'] | undefined,
        mediaType: 'character',
        age: readNumber(rawMetadata.age),
        outfit: readString(rawMetadata.outfit),
        hairstyle: readString(rawMetadata.hairstyle),
        hairColor: readString(rawMetadata.hairColor),
        eyeColor: readString(rawMetadata.eyeColor),
        skinTone: readString(rawMetadata.skinTone),
        accessories: readString(rawMetadata.accessories),
        aspectRatio: entry.config.aspectRatio ?? undefined,
        voiceId: readString(rawMetadata.voiceId),
        avatarMode: readString(rawMetadata.avatarMode),
        avatar: toCharacterAvatar(rawMetadata.avatar),
      },
      results: Array.isArray(entry.results)
        ? entry.results.map((result) => toCharacterResult(result))
        : undefined,
      error: readString(entry.error),
      isFavorite: Boolean(entry.isFavorite),
      deletedAt: null,
    };
  },

  toUpsertRequest(task) {
    const completedAt =
      task.status === 'completed'
        ? toIsoTimestamp(task.updatedAt) || toIsoTimestamp(task.createdAt)
        : undefined;

    return {
      id: task.id,
      uuid: task.uuid,
      product: 'character',
      source: 'imported',
      status: task.status,
      error: task.error,
      isFavorite: task.isFavorite,
      config: {
        prompt: task.config.prompt,
        mediaType: 'character',
        aspectRatio: task.config.aspectRatio,
        model: task.config.model,
        metadata: toCharacterConfigMetadata(task),
      },
      results: Array.isArray(task.results)
        ? task.results.map((result) => ({
            id: result.id,
            uuid: result.uuid,
            assetId: result.resource?.assetId ?? null,
            assetUuid: result.resource?.assetUuid ?? null,
            primaryResourceId: result.resource?.primaryResourceId ?? null,
            primaryResourceUuid: result.resource?.primaryResourceUuid ?? null,
            resourceViewId: result.resource?.resourceViewId ?? null,
            resourceViewUuid: result.resource?.resourceViewUuid ?? null,
            path: result.resource?.path,
            url: result.resource?.url ?? result.url ?? result.avatarUrl,
            mimeType: result.resource?.mimeType,
            resource: toCreationHistoryResource(result),
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
