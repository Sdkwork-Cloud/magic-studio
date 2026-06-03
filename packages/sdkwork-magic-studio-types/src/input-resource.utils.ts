import {
  isCanonicalMagicStudioAssetReference,
  isRenderableAssetUrl,
} from './asset-reference.ts';

type InputResourceMetadataLike = Record<string, unknown> | undefined;

type InputResourceLike = {
  path?: string | null;
  url?: string | null;
  metadata?: InputResourceMetadataLike;
  resource?: {
    path?: string | null;
    url?: string | null;
  } | null;
};

const normalizeOptionalString = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const pickFirstString = (...values: Array<string | null | undefined>): string | null => {
  for (const value of values) {
    const normalized = normalizeOptionalString(value);
    if (normalized) {
      return normalized;
    }
  }

  return null;
};

const readMetadataString = (
  metadata: InputResourceMetadataLike,
  key: string
): string | null => {
  if (!metadata) {
    return null;
  }

  return normalizeOptionalString(metadata[key]);
};

export const isStableInputResourceLocator = (value: unknown): boolean => {
  const candidate = normalizeOptionalString(value);
  return !!candidate && isCanonicalMagicStudioAssetReference(candidate);
};

export const isRenderableInputResourceUrl = (value: unknown): boolean => {
  const candidate = normalizeOptionalString(value);
  return !!candidate && isRenderableAssetUrl(candidate);
};

export const resolveInputResourcePath = (
  input: InputResourceLike | null | undefined
): string | null => {
  if (!input) {
    return null;
  }

  const metadata = input.metadata;
  return pickFirstString(
    input.path,
    input.resource?.path,
    readMetadataString(metadata, 'canonicalPath'),
    readMetadataString(metadata, 'sourcePath'),
    isStableInputResourceLocator(input.url) ? input.url : null,
    isStableInputResourceLocator(input.resource?.url) ? input.resource?.url : null,
    input.url,
    input.resource?.url
  );
};

export const resolveInputResourceUrl = (
  input: InputResourceLike | null | undefined
): string | null => {
  if (!input) {
    return null;
  }

  const metadata = input.metadata;
  const metadataDeliveryUrl =
    readMetadataString(metadata, 'deliveryUrl') ||
    readMetadataString(metadata, 'primaryUrl');

  return pickFirstString(
    isRenderableInputResourceUrl(metadataDeliveryUrl) ? metadataDeliveryUrl : null,
    isRenderableInputResourceUrl(input.url) ? input.url : null,
    isRenderableInputResourceUrl(input.resource?.url) ? input.resource?.url : null,
    isRenderableInputResourceUrl(input.path) ? input.path : null,
    isRenderableInputResourceUrl(input.resource?.path) ? input.resource?.path : null,
    metadataDeliveryUrl,
    resolveInputResourcePath(input)
  );
};

export const resolveInputResourceReference = (
  input: InputResourceLike | null | undefined
): string | null => {
  return resolveInputResourcePath(input) || resolveInputResourceUrl(input);
};

export const hasInputResourceReference = (
  input: InputResourceLike | null | undefined
): boolean => {
  return !!resolveInputResourceReference(input);
};
