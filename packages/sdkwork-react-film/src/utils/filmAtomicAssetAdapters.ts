import {
  generateUUID,
  MediaScene,
  MediaResourceType,
  type AssetAtomicMediaResource
} from '@sdkwork/react-commons';
import type { FilmAssetMediaResource } from '../entities/film.entity';
import { getFilmDirectLocatorCandidates } from './filmAssetUrlResolver';

const normalizeResourceType = (value: unknown): MediaResourceType | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }
  if (Object.values(MediaResourceType).includes(value as MediaResourceType)) {
    return value as MediaResourceType;
  }
  switch (value.toUpperCase()) {
    case 'IMAGE':
      return MediaResourceType.IMAGE;
    case 'VIDEO':
      return MediaResourceType.VIDEO;
    case 'AUDIO':
      return MediaResourceType.AUDIO;
    case 'MUSIC':
      return MediaResourceType.MUSIC;
    case 'VOICE':
      return MediaResourceType.VOICE;
    case 'TEXT':
    case 'SUBTITLE':
      return MediaResourceType.TEXT;
    default:
      return undefined;
  }
};

const hasLegacySlot = (asset: Partial<AssetAtomicMediaResource>, key: string): boolean => {
  const source = asset as Record<string, unknown>;
  return !!source[key];
};

const toPrimaryKey = (type: MediaResourceType): AssetAtomicMediaResource['primary'] => {
  if (type === MediaResourceType.VIDEO) {
    return 'video';
  }
  if (type === MediaResourceType.AUDIO || type === MediaResourceType.MUSIC || type === MediaResourceType.VOICE) {
    return 'audio';
  }
  return 'image';
};

const toFilmAssetType = (type: MediaResourceType): FilmAssetMediaResource['type'] => {
  if (type === MediaResourceType.VIDEO) {
    return 'video';
  }
  if (
    type === MediaResourceType.AUDIO ||
    type === MediaResourceType.MUSIC ||
    type === MediaResourceType.VOICE ||
    type === MediaResourceType.SPEECH
  ) {
    return 'audio';
  }
  return 'image';
};

export const resolveAtomicAssetResourceType = (
  asset: Partial<AssetAtomicMediaResource> | undefined
): MediaResourceType => {
  if (!asset) {
    return MediaResourceType.IMAGE;
  }
  const normalized = normalizeResourceType(asset.type);
  if (normalized) {
    return normalized;
  }
  if (hasLegacySlot(asset, 'video')) {
    return MediaResourceType.VIDEO;
  }
  if (hasLegacySlot(asset, 'audio') || hasLegacySlot(asset, 'music') || hasLegacySlot(asset, 'voice')) {
    return MediaResourceType.AUDIO;
  }
  return MediaResourceType.IMAGE;
};

export const resolveAtomicAssetResourceUrl = (
  asset: Partial<AssetAtomicMediaResource> | undefined
): string | undefined => {
  if (!asset) {
    return undefined;
  }
  return getFilmDirectLocatorCandidates(asset)[0];
};

export const toFilmImportTypeFromResourceType = (
  type: MediaResourceType
): 'image' | 'video' | 'audio' => {
  if (type === MediaResourceType.VIDEO) {
    return 'video';
  }
  if (type === MediaResourceType.AUDIO || type === MediaResourceType.MUSIC || type === MediaResourceType.VOICE) {
    return 'audio';
  }
  return 'image';
};

export const buildAtomicAssetResource = ({
  assetId,
  url,
  name,
  type,
  scene,
  metadata
}: {
  assetId?: string;
  url: string;
  name: string;
  type: MediaResourceType;
  scene?: MediaScene;
  metadata?: Record<string, unknown>;
}): AssetAtomicMediaResource => {
  const stableId = assetId || generateUUID();
  const now = Date.now();
  return {
    id: stableId,
    uuid: stableId,
    type,
    url,
    name,
    scene: scene || MediaScene.REFERENCE,
    primary: toPrimaryKey(type),
    metadata: {
      ...(metadata || {}),
      assetId: stableId
    },
    createdAt: now,
    updatedAt: now
  };
};

export const toFilmShotAssetResource = (
  asset: AssetAtomicMediaResource
): FilmAssetMediaResource => {
  const resolvedType = resolveAtomicAssetResourceType(asset);
  const resolvedUrl = resolveAtomicAssetResourceUrl(asset) || asset.url || '';
  const metadataAssetId =
    asset.metadata && typeof asset.metadata.assetId === 'string'
      ? asset.metadata.assetId
      : undefined;
  return {
    id: asset.id,
    uuid: asset.uuid,
    url: resolvedUrl,
    createdAt: asset.createdAt,
    updatedAt: asset.updatedAt,
    type: toFilmAssetType(resolvedType),
    assetId: metadataAssetId || asset.id,
    scene: typeof asset.scene === 'string' ? asset.scene : undefined,
    fileId: metadataAssetId,
    fileName: asset.name
  };
};
