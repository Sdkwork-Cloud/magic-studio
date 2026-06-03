import type { MagicStudioCharacterGenerationRequest } from '@sdkwork/magic-studio-host-types';
import { isRenderableInputResourceUrl } from '@sdkwork/magic-studio-types/input-resource';
import {
  hasCharacterAvatarInputResourceReference,
  type CharacterConfig,
  resolveCharacterAvatarInputResourceReference,
  resolveCharacterAvatarInputResourceUrl,
} from '../entities';
import { safeString } from './characterService.shared';

export type CharacterCreateRequest = MagicStudioCharacterGenerationRequest;

const resolveRenderableAvatarInputUrl = (
  avatar: CharacterConfig['avatar']
): string | null => {
  const candidate = resolveCharacterAvatarInputResourceUrl(avatar);
  return typeof candidate === 'string' && isRenderableInputResourceUrl(candidate)
    ? candidate
    : null;
};

const buildCharacterAvatarInput = (
  config: CharacterConfig
): CharacterCreateRequest['avatar'] | undefined => {
  const avatar = config.avatar;
  if (!avatar || !hasCharacterAvatarInputResourceReference(avatar)) {
    return undefined;
  }

  const directUrl = resolveRenderableAvatarInputUrl(avatar);
  const avatarReference = resolveCharacterAvatarInputResourceReference(avatar);
  const avatarPath =
    typeof avatarReference === 'string' && !isRenderableInputResourceUrl(avatarReference)
      ? avatarReference
      : undefined;
  const metadata = Object.fromEntries(
    Object.entries({
      assetId: safeString(avatar.assetId),
      assetUuid: safeString(avatar.assetUuid),
      primaryResourceId: safeString(avatar.primaryResourceId),
      primaryResourceUuid: safeString(avatar.primaryResourceUuid),
      resourceViewId: safeString(avatar.resourceViewId),
      resourceViewUuid: safeString(avatar.resourceViewUuid),
      path: safeString(avatarPath),
    }).filter((entry): entry is [string, string] => entry[1].length > 0)
  );
  const mergedMetadata =
    avatar.metadata || Object.keys(metadata).length > 0
      ? {
          ...(avatar.metadata || {}),
          ...metadata,
        }
      : undefined;

  return {
    id: avatar.id,
    uuid: avatar.uuid,
    createdAt: avatar.createdAt,
    updatedAt: avatar.updatedAt,
    deletedAt: avatar.deletedAt,
    assetId: avatar.assetId ?? null,
    assetUuid: avatar.assetUuid ?? null,
    primaryResourceId: avatar.primaryResourceId ?? null,
    primaryResourceUuid: avatar.primaryResourceUuid ?? null,
    resourceViewId: avatar.resourceViewId ?? null,
    resourceViewUuid: avatar.resourceViewUuid ?? null,
    path: safeString(avatar.path) || avatarPath,
    url: directUrl || undefined,
    name: safeString(avatar.name) || undefined,
    mimeType: safeString(avatar.mimeType) || undefined,
    type: 'image',
    role: 'character-reference',
    resource: avatar.resource || null,
    metadata: mergedMetadata,
  };
};

export const buildCharacterCreateRequest = async (
  config: CharacterConfig
): Promise<CharacterCreateRequest> => {
  const prompt = safeString(config.prompt) || safeString(config.description);
  const avatar = buildCharacterAvatarInput(config);

  return {
    prompt,
    description: safeString(config.description) || prompt,
    model: safeString(config.model) || undefined,
    archetype: config.archetype,
    gender: config.gender,
    age: typeof config.age === 'number' ? config.age : undefined,
    outfit: safeString(config.outfit) || undefined,
    aspectRatio: safeString(config.aspectRatio) || undefined,
    voiceId: safeString(config.voiceId) || undefined,
    avatarMode: safeString(config.avatarMode) || undefined,
    hairstyle: safeString(config.hairstyle) || undefined,
    hairColor: safeString(config.hairColor) || undefined,
    eyeColor: safeString(config.eyeColor) || undefined,
    skinTone: safeString(config.skinTone) || undefined,
    accessories: safeString(config.accessories) || undefined,
    avatar: avatar || null,
  };
};
