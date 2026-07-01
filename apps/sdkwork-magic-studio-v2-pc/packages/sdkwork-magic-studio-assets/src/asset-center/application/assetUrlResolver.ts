import { assetCenterService } from '../assetCenter';
import { assetBusinessService } from '../../services/assetBusinessService';
import {
  isExplicitLocalAssetLocator,
  isLocalFilePath,
  isManagedAssetLocator,
  isRenderableAssetUrl,
} from '../domain/assetLocator';

type SourceObject = {
  id?: unknown;
  assetId?: unknown;
  path?: unknown;
  url?: unknown;
  src?: unknown;
  uri?: unknown;
  href?: unknown;
  metadata?: Record<string, unknown>;
  resource?: unknown;
  payload?: unknown;
  primaryArtifact?: unknown;
  delivery?: unknown;
  preview?: unknown;
  thumbnail?: unknown;
  cover?: unknown;
  poster?: unknown;
  image?: unknown;
  video?: unknown;
  audio?: unknown;
  music?: unknown;
  voice?: unknown;
  text?: unknown;
  character?: unknown;
  model3d?: unknown;
  lottie?: unknown;
  file?: unknown;
  effect?: unknown;
  transition?: unknown;
  subtitle?: unknown;
  sfx?: unknown;
  assets?: unknown[];
};

const NESTED_SOURCE_KEYS: Array<keyof SourceObject> = [
  'resource',
  'payload',
  'primaryArtifact',
  'delivery',
  'preview',
  'thumbnail',
  'cover',
  'poster'
];

const SLOT_KEYS: Array<keyof SourceObject> = [
  'image',
  'video',
  'audio',
  'music',
  'voice',
  'text',
  'character',
  'model3d',
  'lottie',
  'file',
  'effect',
  'transition',
  'subtitle',
  'sfx'
];

export type AssetUrlResolveSource = string | SourceObject | null | undefined;

export const isAssetLocatorLike = (value: unknown): value is string => {
  if (typeof value !== 'string' || value.length === 0) {
    return false;
  }
  return (
    isManagedAssetLocator(value) ||
    isExplicitLocalAssetLocator(value) ||
    isLocalFilePath(value) ||
    isRenderableAssetUrl(value)
  );
};

const asNonLocatorAssetId = (value: unknown): string | undefined => {
  if (typeof value !== 'string' || value.length === 0 || isAssetLocatorLike(value)) {
    return undefined;
  }
  return value;
};

const unique = (values: (string | undefined)[]): string[] => {
  return Array.from(new Set(values.filter((item): item is string => !!item)));
};

const appendObjectLocatorCandidates = (
  candidates: unknown[],
  source: unknown
): void => {
  if (!source || typeof source !== 'object') {
    return;
  }
  const item = source as Record<string, unknown>;
  candidates.push(
    item.url,
    item.path,
    item.src,
    item.uri,
    item.href,
    item.id
  );
};

const collectSourceObjects = (
  source: SourceObject
): Array<Record<string, unknown>> => {
  const queue: unknown[] = [source];
  const seen = new Set<object>();
  const collected: Array<Record<string, unknown>> = [];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || typeof current !== 'object') {
      continue;
    }

    if (seen.has(current)) {
      continue;
    }
    seen.add(current);

    const item = current as Record<string, unknown>;
    collected.push(item);

    for (const key of NESTED_SOURCE_KEYS) {
      queue.push(item[key]);
    }

    for (const slot of SLOT_KEYS) {
      queue.push(item[slot]);
    }

    if (Array.isArray(item.assets)) {
      item.assets.forEach((asset) => {
        queue.push(asset);
      });
    }
  }

  return collected;
};

const readMetadataAssetId = (
  source: Record<string, unknown>
): string | undefined => {
  const metadata = source.metadata;
  if (!metadata || typeof metadata !== 'object') {
    return undefined;
  }

  return asNonLocatorAssetId((metadata as Record<string, unknown>).assetId);
};

export const getAssetIdCandidates = (source: AssetUrlResolveSource): string[] => {
  if (!source) {
    return [];
  }
  if (typeof source === 'string') {
    return unique([asNonLocatorAssetId(source)]);
  }

  const sourceObjects = collectSourceObjects(source);
  const primarySource = sourceObjects[0];
  const nestedSources = sourceObjects.slice(1);

  return unique([
    readMetadataAssetId(primarySource),
    asNonLocatorAssetId(primarySource.assetId),
    asNonLocatorAssetId(primarySource.id),
    ...nestedSources.flatMap((item) => [
      readMetadataAssetId(item),
      asNonLocatorAssetId(item.assetId)
    ])
  ]);
};

export const getPrimaryAssetIdCandidate = (
  source: AssetUrlResolveSource
): string | undefined => {
  return getAssetIdCandidates(source)[0];
};

export const getDirectLocatorCandidates = (
  source: AssetUrlResolveSource
): string[] => {
  if (!source) {
    return [];
  }
  if (typeof source === 'string') {
    return isAssetLocatorLike(source) ? [source] : [];
  }

  const rawCandidates: unknown[] = [];
  collectSourceObjects(source).forEach((item) => {
    appendObjectLocatorCandidates(rawCandidates, item);
  });

  return Array.from(
    new Set(rawCandidates.filter((item): item is string => isAssetLocatorLike(item)))
  );
};

const pickDirectLocator = (source: AssetUrlResolveSource): string | null => {
  return getDirectLocatorCandidates(source)[0] ?? null;
};

export const hasResolvableAssetReference = (
  source: AssetUrlResolveSource
): boolean => {
  if (!source) {
    return false;
  }
  if (getAssetIdCandidates(source).length > 0) {
    return true;
  }
  return getDirectLocatorCandidates(source).length > 0;
};

export const resolveAssetUrlByAssetIdFirst = async (
  source: AssetUrlResolveSource
): Promise<string | null> => {
  if (!source) {
    return null;
  }

  const candidates = getAssetIdCandidates(source);
  for (const assetId of candidates) {
    try {
      const resolved = await assetBusinessService.resolveAssetPrimaryUrlBySdk(assetId);
      if (resolved) {
        return resolved;
      }
    } catch {
      // Continue trying next candidate.
    }
  }

  const directLocator = pickDirectLocator(source);
  if (!directLocator) {
    return null;
  }

  if (
    isManagedAssetLocator(directLocator) ||
    isExplicitLocalAssetLocator(directLocator) ||
    isLocalFilePath(directLocator)
  ) {
    try {
      const resolved = await assetCenterService.resolveLocatorUrl(directLocator);
      if (resolved) {
        return resolved;
      }
    } catch {
      // Fallback to direct locator if resolver fails.
    }
  }

  return directLocator;
};
