import {
  getDirectLocatorCandidates,
  hasResolvableAssetReference,
  resolveAssetUrlByAssetIdFirst
} from '@sdkwork/react-assets';

type ResolverSource = string | Record<string, unknown> | null | undefined;
export interface FilmAssetUrlSource extends Record<string, unknown> {
  id: string;
  path: string;
  url?: string;
  remoteUrl?: string;
  type?: string;
}

export type FilmUseAssetSource = string | FilmAssetUrlSource | null | undefined;

const normalizeResolverSource = (source: unknown): ResolverSource => {
  if (source == null) {
    return source;
  }
  if (typeof source === 'string') {
    return source;
  }
  if (typeof source === 'object') {
    return source as Record<string, unknown>;
  }
  return undefined;
};

const readStringField = (
  source: Record<string, unknown>,
  key: string
): string | undefined => {
  const value = source[key];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
};

const readMetadataAssetId = (
  source: Record<string, unknown>
): string | undefined => {
  const metadata = source.metadata;
  if (!metadata || typeof metadata !== 'object') {
    return undefined;
  }
  const assetId = (metadata as Record<string, unknown>).assetId;
  return typeof assetId === 'string' && assetId.length > 0 ? assetId : undefined;
};

export const toFilmUseAssetSource = (source: unknown): FilmUseAssetSource => {
  if (source == null) {
    return source;
  }
  if (typeof source === 'string') {
    return source;
  }
  if (typeof source !== 'object') {
    return undefined;
  }

  const record = source as Record<string, unknown>;
  const id =
    readStringField(record, 'id') ||
    readStringField(record, 'uuid') ||
    readStringField(record, 'assetId') ||
    readMetadataAssetId(record) ||
    '';
  const url =
    readStringField(record, 'url') || readStringField(record, 'remoteUrl');
  const path = readStringField(record, 'path') || url || '';
  const remoteUrl = readStringField(record, 'remoteUrl');
  const type = readStringField(record, 'type');

  return {
    ...record,
    id,
    path,
    ...(url ? { url } : {}),
    ...(remoteUrl ? { remoteUrl } : {}),
    ...(type ? { type } : {})
  };
};

export const resolveFilmAssetUrlByAssetIdFirst = async (
  source: unknown
): Promise<string | null> => {
  return resolveAssetUrlByAssetIdFirst(normalizeResolverSource(source));
};

export const hasFilmAssetReference = (source: unknown): boolean => {
  return hasResolvableAssetReference(normalizeResolverSource(source));
};

export const getFilmDirectLocatorCandidates = (source: unknown): string[] => {
  return getDirectLocatorCandidates(normalizeResolverSource(source));
};
