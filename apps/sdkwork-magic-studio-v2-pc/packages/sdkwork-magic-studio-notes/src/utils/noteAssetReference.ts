import {
  readAssetRecordMetadataValue,
  resolveAssetRecordAssetUuid,
  resolveAssetRecordClientUuid,
  resolveAssetRecordId,
} from '@sdkwork/magic-studio-commons/utils/assetIdentity';
import type { Asset } from '@sdkwork/magic-studio-types/assets';

const normalizeOptionalString = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const mapOptionalFields = (
  entries: Array<[string, string | null]>
): Record<string, string> => {
  const mapped: Record<string, string> = {};

  entries.forEach(([key, value]) => {
    if (value) {
      mapped[key] = value;
    }
  });

  return mapped;
};

const readHtmlAttribute = (tag: string, name: string): string | null => {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = tag.match(new RegExp(`${escapedName}\\s*=\\s*["']([^"']+)["']`, 'i'));
  return normalizeOptionalString(match?.[1]);
};

export interface NoteImageAssetReference {
  url: string | null;
  assetId: string | null;
  assetUuid: string | null;
  primaryResourceId: string | null;
  primaryResourceUuid: string | null;
  resourceViewId: string | null;
  resourceViewUuid: string | null;
}

export interface ArticleCoverAssetFields {
  coverImage?: string;
  coverAssetId?: string | null;
  coverAssetUuid?: string | null;
  coverPrimaryResourceId?: string | null;
  coverPrimaryResourceUuid?: string | null;
  coverResourceViewId?: string | null;
  coverResourceViewUuid?: string | null;
}

export interface MiniProgramImageAssetFields {
  image?: string;
  imageAssetId?: string | null;
  imageAssetUuid?: string | null;
  imagePrimaryResourceId?: string | null;
  imagePrimaryResourceUuid?: string | null;
  imageResourceViewId?: string | null;
  imageResourceViewUuid?: string | null;
}

export const createEmptyNoteImageAssetReference = (): NoteImageAssetReference => ({
  url: null,
  assetId: null,
  assetUuid: null,
  primaryResourceId: null,
  primaryResourceUuid: null,
  resourceViewId: null,
  resourceViewUuid: null,
});

export const createNoteImageAssetReferenceFromAsset = (
  asset: Pick<Asset, 'id' | 'uuid' | 'path' | 'metadata'> & {
    url?: string | null;
    remoteUrl?: string | null;
  },
  resolvedUrl?: string | null
): NoteImageAssetReference => ({
  url:
    normalizeOptionalString(resolvedUrl) ||
    normalizeOptionalString(asset.url) ||
    normalizeOptionalString(asset.remoteUrl) ||
    normalizeOptionalString(asset.path),
  assetId: normalizeOptionalString(resolveAssetRecordId(asset)) || null,
  assetUuid: normalizeOptionalString(resolveAssetRecordAssetUuid(asset)) || null,
  primaryResourceId: normalizeOptionalString(readAssetRecordMetadataValue(asset, 'primaryResourceId')) || null,
  primaryResourceUuid: normalizeOptionalString(readAssetRecordMetadataValue(asset, 'primaryResourceUuid')) || null,
  resourceViewId: normalizeOptionalString(readAssetRecordMetadataValue(asset, 'resourceViewId')) || null,
  resourceViewUuid: normalizeOptionalString(readAssetRecordMetadataValue(asset, 'resourceViewUuid')) || null,
});

export const extractFirstHtmlImageAssetReference = (
  htmlContent: string
): NoteImageAssetReference | null => {
  const imageTag = htmlContent.match(/<img\b[^>]*>/i)?.[0];
  if (!imageTag) {
    return null;
  }

  const reference: NoteImageAssetReference = {
    url: readHtmlAttribute(imageTag, 'src'),
    assetId: readHtmlAttribute(imageTag, 'data-asset-id'),
    assetUuid: readHtmlAttribute(imageTag, 'data-asset-uuid'),
    primaryResourceId: readHtmlAttribute(imageTag, 'data-primary-resource-id'),
    primaryResourceUuid: readHtmlAttribute(imageTag, 'data-primary-resource-uuid'),
    resourceViewId: readHtmlAttribute(imageTag, 'data-resource-view-id'),
    resourceViewUuid: readHtmlAttribute(imageTag, 'data-resource-view-uuid'),
  };

  if (
    !reference.url &&
    !reference.assetId &&
    !reference.assetUuid &&
    !reference.primaryResourceId &&
    !reference.primaryResourceUuid &&
    !reference.resourceViewId &&
    !reference.resourceViewUuid
  ) {
    return null;
  }

  return reference;
};

export const toArticleCoverAssetFields = (
  reference: NoteImageAssetReference
): ArticleCoverAssetFields => ({
  coverImage: reference.url ?? undefined,
  coverAssetId: reference.assetId,
  coverAssetUuid: reference.assetUuid,
  coverPrimaryResourceId: reference.primaryResourceId,
  coverPrimaryResourceUuid: reference.primaryResourceUuid,
  coverResourceViewId: reference.resourceViewId,
  coverResourceViewUuid: reference.resourceViewUuid,
});

export const toMiniProgramImageAssetFields = (
  reference: NoteImageAssetReference
): MiniProgramImageAssetFields => ({
  image: reference.url ?? undefined,
  imageAssetId: reference.assetId,
  imageAssetUuid: reference.assetUuid,
  imagePrimaryResourceId: reference.primaryResourceId,
  imagePrimaryResourceUuid: reference.primaryResourceUuid,
  imageResourceViewId: reference.resourceViewId,
  imageResourceViewUuid: reference.resourceViewUuid,
});

export const toNoteImageChooseAssetValue = (
  reference: NoteImageAssetReference,
  name = 'Selected Image'
): Asset | string | null => {
  const id =
    reference.assetId ||
    reference.assetUuid ||
    reference.resourceViewId ||
    reference.primaryResourceId ||
    reference.url;
  if (!id) {
    return null;
  }

  const uuid =
    reference.assetUuid ||
    reference.resourceViewUuid ||
    reference.primaryResourceUuid ||
    normalizeOptionalString(resolveAssetRecordClientUuid({
      id,
      metadata: mapOptionalFields([
        ['assetId', reference.assetId],
        ['assetUuid', reference.assetUuid],
        ['primaryResourceId', reference.primaryResourceId],
        ['primaryResourceUuid', reference.primaryResourceUuid],
        ['resourceViewId', reference.resourceViewId],
        ['resourceViewUuid', reference.resourceViewUuid],
      ]),
    })) ||
    id;

  return {
    id,
    uuid,
    name,
    type: 'image',
    path: reference.url || '',
    size: 0,
    origin: 'upload',
    createdAt: 0,
    updatedAt: 0,
    metadata: mapOptionalFields([
      ['assetId', reference.assetId],
      ['assetUuid', reference.assetUuid],
      ['primaryResourceId', reference.primaryResourceId],
      ['primaryResourceUuid', reference.primaryResourceUuid],
      ['resourceViewId', reference.resourceViewId],
      ['resourceViewUuid', reference.resourceViewUuid],
    ]),
  };
};
