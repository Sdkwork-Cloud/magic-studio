import { MediaScene } from '@sdkwork/magic-studio-types/vocabulary';
import { generateUUID } from '@sdkwork/magic-studio-commons/utils/helpers';
import type {
  FilmAssetMediaResource,
  FilmImageMediaResource
} from '../entities/film.entity';

interface FilmAssetBaseInput {
  assetId?: string;
  uuid?: string;
  assetUuid?: string;
  url: string;
  fileName?: string;
  createdAt?: number;
  updatedAt?: number;
}

const resolveTemporal = (
  createdAt?: number,
  updatedAt?: number
): { createdAt: number; updatedAt: number } => {
  const now = Date.now();
  return {
    createdAt: createdAt ?? now,
    updatedAt: updatedAt ?? now
  };
};

export const createFilmImageMediaResource = ({
  assetId,
  uuid,
  assetUuid,
  url,
  fileName,
  createdAt,
  updatedAt
}: FilmAssetBaseInput): FilmImageMediaResource => {
  const stableUuid = uuid || assetUuid || assetId || generateUUID();
  const stableId = assetId || stableUuid;
  const time = resolveTemporal(createdAt, updatedAt);
  return {
    id: stableId,
    uuid: stableUuid,
    type: 'image',
    url,
    fileId: assetId,
    fileName,
    createdAt: time.createdAt,
    updatedAt: time.updatedAt
  };
};

export const createFilmAssetMediaResource = ({
  assetId,
  uuid,
  assetUuid,
  type,
  scene,
  url,
  fileName,
  createdAt,
  updatedAt
}: FilmAssetBaseInput & {
  type: 'image' | 'video' | 'audio';
  scene?: MediaScene;
}): FilmAssetMediaResource => {
  const stableUuid = uuid || assetUuid || assetId || generateUUID();
  const stableId = assetId || stableUuid;
  const time = resolveTemporal(createdAt, updatedAt);
  return {
    id: stableId,
    uuid: stableUuid,
    type,
    scene,
    url,
    assetId,
    fileId: assetId,
    fileName,
    createdAt: time.createdAt,
    updatedAt: time.updatedAt
  };
};

export const upsertFilmRefAssetByScene = (
  current: FilmAssetMediaResource[] | undefined,
  asset: FilmAssetMediaResource
): FilmAssetMediaResource[] => {
  const existing = current || [];
  const withoutDuplicates = existing.filter((item) => {
    if (asset.scene && item.scene === asset.scene) {
      return false;
    }
    const currentAssetId = typeof item.assetId === 'string' ? item.assetId : item.id;
    const incomingAssetId = typeof asset.assetId === 'string' ? asset.assetId : asset.id;
    return currentAssetId !== incomingAssetId;
  });
  return [...withoutDuplicates, asset];
};
