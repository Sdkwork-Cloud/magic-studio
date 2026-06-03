import {
  readAssetRecordMetadataValue,
  resolveAssetRecordAssetUuid,
  resolveAssetRecordId,
} from '@sdkwork/magic-studio-commons/utils/assetIdentity';
import type { Asset } from '@sdkwork/magic-studio-types/assets';
import {
  createCharacterAvatarInputResourceRef,
  resolveCharacterAvatarInputResourcePath,
  resolveCharacterAvatarInputResourceReference,
  type CharacterAvatarInputResourceRef,
} from '../entities';

export interface CharacterAvatarAssetFields {
  avatar?: CharacterAvatarInputResourceRef;
}

interface CreateCharacterAvatarAssetFieldsInput {
  avatar?: Partial<CharacterAvatarInputResourceRef> | null;
}

const normalizeOptionalString = (value: unknown): string | undefined => {
  return typeof value === 'string' && value.trim().length > 0 ? value : undefined;
};

const pickFirst = (...values: Array<string | null | undefined>): string | undefined => {
  for (const value of values) {
    const normalized = normalizeOptionalString(value);
    if (normalized) {
      return normalized;
    }
  }

  return undefined;
};

const resolveAvatarSemanticId = (
  avatar: CharacterAvatarInputResourceRef | undefined
): string | undefined => {
  return pickFirst(
    avatar?.assetId,
    avatar?.resourceViewId,
    avatar?.primaryResourceId,
    avatar?.assetUuid,
    avatar?.resourceViewUuid,
    avatar?.primaryResourceUuid
  );
};

const toAssetMetadata = (
  input: CharacterAvatarInputResourceRef
): Record<string, string> => {
  const metadataEntries = Object.entries({
    assetId: input.assetId,
    assetUuid: input.assetUuid,
    primaryResourceId: input.primaryResourceId,
    primaryResourceUuid: input.primaryResourceUuid,
    resourceViewId: input.resourceViewId,
    resourceViewUuid: input.resourceViewUuid,
  }).filter((entry): entry is [string, string] => typeof entry[1] === 'string' && entry[1].length > 0);

  return Object.fromEntries(metadataEntries);
};

export const createCharacterAvatarAssetFields = (
  input: CreateCharacterAvatarAssetFieldsInput = {}
): CharacterAvatarAssetFields => ({
  avatar: input.avatar ? createCharacterAvatarInputResourceRef(input.avatar) : undefined,
});

export const toCharacterAvatarAssetFields = (
  asset: Asset | null | undefined
): CharacterAvatarAssetFields => {
  if (!asset) {
    return createCharacterAvatarAssetFields();
  }

  return createCharacterAvatarAssetFields({
    avatar: createCharacterAvatarInputResourceRef({
      id: resolveAssetRecordId(asset) || undefined,
      uuid: normalizeOptionalString(asset.uuid),
      assetId: resolveAssetRecordId(asset) || undefined,
      assetUuid:
        resolveAssetRecordAssetUuid(asset) ?? normalizeOptionalString(asset.uuid),
      primaryResourceId: readAssetRecordMetadataValue(asset, 'primaryResourceId') || undefined,
      primaryResourceUuid:
        readAssetRecordMetadataValue(asset, 'primaryResourceUuid') || undefined,
      resourceViewId: readAssetRecordMetadataValue(asset, 'resourceViewId') || undefined,
      resourceViewUuid: readAssetRecordMetadataValue(asset, 'resourceViewUuid') || undefined,
      path: normalizeOptionalString(asset.path),
    }),
  });
};

export const toCharacterAvatarChooseAssetValue = (
  input: CreateCharacterAvatarAssetFieldsInput | null | undefined
): Asset | string | null => {
  const avatar = createCharacterAvatarAssetFields(input ?? {}).avatar;
  const runtimeId = resolveAvatarSemanticId(avatar);
  const runtimeUuid =
    pickFirst(
      avatar?.assetUuid,
      avatar?.resourceViewUuid,
      avatar?.primaryResourceUuid,
      runtimeId
    ) || runtimeId;

  if (!runtimeId) {
    return avatar ? resolveCharacterAvatarInputResourceReference(avatar) : null;
  }

  return {
    id: runtimeId,
    uuid: runtimeUuid || runtimeId,
    createdAt: 0,
    updatedAt: 0,
    name: runtimeId,
    type: 'image',
    path:
      (avatar && resolveCharacterAvatarInputResourcePath(avatar)) ||
      (avatar && resolveCharacterAvatarInputResourceReference(avatar)) ||
      '',
    size: 0,
    origin: 'upload',
    metadata: avatar ? toAssetMetadata(avatar) : {},
    isFavorite: false,
  };
};
