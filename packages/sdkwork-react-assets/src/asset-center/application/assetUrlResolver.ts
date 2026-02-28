import { assetCenterService } from '../assetCenter';

type SourceObject = {
  id?: unknown;
  assetId?: unknown;
  path?: unknown;
  url?: unknown;
  src?: unknown;
  uri?: unknown;
  href?: unknown;
  metadata?: Record<string, unknown>;
  image?: unknown;
  video?: unknown;
  audio?: unknown;
  music?: unknown;
  voice?: unknown;
  text?: unknown;
  character?: unknown;
  digitalHuman?: unknown;
  model3d?: unknown;
  lottie?: unknown;
  file?: unknown;
  effect?: unknown;
  transition?: unknown;
  subtitle?: unknown;
  sfx?: unknown;
  assets?: unknown[];
};

const SLOT_KEYS: Array<keyof SourceObject> = [
  'image',
  'video',
  'audio',
  'music',
  'voice',
  'text',
  'character',
  'digitalHuman',
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
    value.startsWith('http://') ||
    value.startsWith('https://') ||
    value.startsWith('assets://') ||
    value.startsWith('asset:') ||
    value.startsWith('file://') ||
    value.startsWith('blob:') ||
    value.startsWith('data:') ||
    value.startsWith('/') ||
    value.startsWith('./') ||
    value.startsWith('../') ||
    /^[a-zA-Z]:\\/.test(value)
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

export const getAssetIdCandidates = (source: AssetUrlResolveSource): string[] => {
  if (!source) {
    return [];
  }
  if (typeof source === 'string') {
    return unique([asNonLocatorAssetId(source)]);
  }
  const metadataAssetId =
    source.metadata && typeof source.metadata.assetId === 'string'
      ? asNonLocatorAssetId(source.metadata.assetId)
      : undefined;
  return unique([
    metadataAssetId,
    asNonLocatorAssetId(source.assetId),
    asNonLocatorAssetId(source.id)
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

  const rawCandidates: unknown[] = [
    source.url,
    source.path,
    source.id,
    source.src,
    source.uri,
    source.href
  ];

  for (const slot of SLOT_KEYS) {
    appendObjectLocatorCandidates(rawCandidates, source[slot]);
  }

  if (Array.isArray(source.assets)) {
    for (const item of source.assets) {
      appendObjectLocatorCandidates(rawCandidates, item);
    }
  }

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
      const resolved = await assetCenterService.resolvePrimaryUrl(assetId);
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
    directLocator.startsWith('assets://') ||
    directLocator.startsWith('/') ||
    directLocator.startsWith('./') ||
    directLocator.startsWith('../') ||
    /^[a-zA-Z]:\\/.test(directLocator)
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
