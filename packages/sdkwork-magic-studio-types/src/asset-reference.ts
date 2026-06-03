export const MAGIC_STUDIO_ASSET_PROTOCOL = 'assets://';
export const FILE_ASSET_PROTOCOL = 'file://';
export const DESKTOP_ASSET_PROTOCOL = 'desktop://';

const WINDOWS_ABSOLUTE_PATH = /^[a-zA-Z]:([\\/]|$)/;

export type MagicStudioAssetPath = `${typeof MAGIC_STUDIO_ASSET_PROTOCOL}${string}`;
export type FileAssetLocator = `${typeof FILE_ASSET_PROTOCOL}${string}`;
export type DesktopAssetLocator = `${typeof DESKTOP_ASSET_PROTOCOL}${string}`;
export type ExplicitLocalAssetLocator = FileAssetLocator | DesktopAssetLocator;
export type CanonicalMagicStudioAssetReference = MagicStudioAssetPath | ExplicitLocalAssetLocator;
export type RelativeFilePath = `./${string}` | `../${string}`;
export type RenderableAssetUrl =
  | `${'http' | 'https'}://${string}`
  | `${'data' | 'blob' | 'asset'}:${string}`;

const normalizeAssetReferenceCandidate = (value: unknown): string =>
  typeof value === 'string'
    ? value.trim()
    : '';

export const isMagicStudioAssetPath = (value: unknown): value is MagicStudioAssetPath => {
  const candidate = normalizeAssetReferenceCandidate(value);
  return candidate.startsWith(MAGIC_STUDIO_ASSET_PROTOCOL);
};

export const isFileAssetLocator = (value: unknown): value is FileAssetLocator => {
  const candidate = normalizeAssetReferenceCandidate(value);
  return candidate.startsWith(FILE_ASSET_PROTOCOL);
};

export const isDesktopAssetLocator = (value: unknown): value is DesktopAssetLocator => {
  const candidate = normalizeAssetReferenceCandidate(value);
  return candidate.startsWith(DESKTOP_ASSET_PROTOCOL);
};

export const isExplicitLocalAssetLocator = (value: unknown): value is ExplicitLocalAssetLocator =>
  isFileAssetLocator(value) || isDesktopAssetLocator(value);

export const isCanonicalMagicStudioAssetReference = (
  value: unknown
): value is CanonicalMagicStudioAssetReference =>
  isMagicStudioAssetPath(value) || isExplicitLocalAssetLocator(value);

export const isRelativeFilePath = (value: unknown): value is RelativeFilePath => {
  const candidate = normalizeAssetReferenceCandidate(value);
  return candidate.startsWith('./') || candidate.startsWith('../');
};

export const isAbsoluteFilePath = (value: unknown): boolean => {
  const candidate = normalizeAssetReferenceCandidate(value);
  return (
    candidate.startsWith('/') ||
    candidate.startsWith('\\\\') ||
    WINDOWS_ABSOLUTE_PATH.test(candidate)
  );
};

export const isLocalFilePath = (value: unknown): boolean =>
  isAbsoluteFilePath(value) || isRelativeFilePath(value);

export const isLocalFileAssetReference = (value: unknown): boolean =>
  isExplicitLocalAssetLocator(value) || isLocalFilePath(value);

export const isRenderableAssetUrl = (value: unknown): value is RenderableAssetUrl => {
  const candidate = normalizeAssetReferenceCandidate(value);
  return candidate.length > 0 && (
    candidate.startsWith('http:') ||
    candidate.startsWith('https:') ||
    candidate.startsWith('data:') ||
    candidate.startsWith('blob:') ||
    (candidate.startsWith('asset:') && !isMagicStudioAssetPath(candidate))
  );
};

export const stripExplicitLocalAssetLocatorProtocol = (value: string): string => {
  const candidate = normalizeAssetReferenceCandidate(value);

  if (isFileAssetLocator(candidate)) {
    return candidate.slice(FILE_ASSET_PROTOCOL.length);
  }

  if (isDesktopAssetLocator(candidate)) {
    return candidate.slice(DESKTOP_ASSET_PROTOCOL.length);
  }

  return candidate;
};

export const stripMagicStudioAssetProtocol = (value: string): string => {
  const candidate = normalizeAssetReferenceCandidate(value);
  return isMagicStudioAssetPath(candidate)
    ? candidate.slice(MAGIC_STUDIO_ASSET_PROTOCOL.length)
    : candidate;
};

export const normalizeMagicStudioAssetReference = (
  value: unknown
): string | null => {
  const candidate = normalizeAssetReferenceCandidate(value);
  if (!candidate) {
    return null;
  }

  if (isCanonicalMagicStudioAssetReference(candidate) || isRenderableAssetUrl(candidate)) {
    return candidate;
  }

  if (isAbsoluteFilePath(candidate)) {
    return `${FILE_ASSET_PROTOCOL}${candidate}`;
  }

  return null;
};

export const resolveMagicStudioAssetReferenceName = (
  value: string,
  fallback = 'asset'
): string => {
  const candidate = normalizeAssetReferenceCandidate(value);
  if (!candidate) {
    return fallback;
  }

  const withoutQuery = candidate.split('?')[0]?.split('#')[0] || candidate;
  const withoutProtocol = stripMagicStudioAssetProtocol(
    stripExplicitLocalAssetLocatorProtocol(withoutQuery)
  );
  const fileName = withoutProtocol.split(/[\\/]/).pop();

  return fileName && fileName.length > 0
    ? fileName
    : fallback;
};
