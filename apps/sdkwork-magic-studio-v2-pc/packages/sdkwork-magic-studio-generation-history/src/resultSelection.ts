import { resolveEntityKey } from '@sdkwork/magic-studio-types/entity';
import {
  MediaResourceType,
  type MediaType,
} from '@sdkwork/magic-studio-types/vocabulary';

export interface GenerationResultResourceRecord {
  id?: string | null;
  uuid?: string;
  assetId?: string | null;
  assetUuid?: string | null;
  primaryResourceId?: string | null;
  primaryResourceUuid?: string | null;
  resourceViewId?: string | null;
  resourceViewUuid?: string | null;
  type?: MediaResourceType;
  path?: string;
  url?: string;
  mimeType?: string;
  name?: string;
  text?: string;
  language?: string;
  metadata?: Record<string, unknown>;
}

export interface GenerationResultRecord {
  id?: string | null;
  uuid?: string;
  assetId?: string | null;
  assetUuid?: string | null;
  primaryResourceId?: string | null;
  primaryResourceUuid?: string | null;
  resourceViewId?: string | null;
  resourceViewUuid?: string | null;
  artifactUuid?: string | null;
  executionId?: string | null;
  path?: string;
  url?: string;
  mimeType?: string;
  posterUrl?: string;
  resource?: GenerationResultResourceRecord;
  coverResource?: GenerationResultResourceRecord;
  modelId?: string;
  duration?: number;
}

export interface GenerationTaskConfigRecord {
  prompt?: string;
  text?: string;
  previewText?: string;
  mediaType?: MediaType;
  aspectRatio?: string;
  model?: string;
  useMultiModel?: boolean;
}

export interface GenerationTaskRecord {
  id: string | null;
  uuid?: string;
  createdAt: string | number;
  updatedAt: string | number;
  status: string;
  error?: string;
  config: GenerationTaskConfigRecord;
  results?: GenerationResultRecord[];
}

export interface GenerationResultSelection extends GenerationResultRecord {
  key: string;
  type: MediaType;
  taskKey: string;
  taskId: string | null;
  taskUuid?: string;
  resultIndex: number;
  createdAt: string | number;
}

export type GenerationResultRenderKind = 'image' | 'video' | 'audio' | 'text';

const normalizeValue = (value: string | null | undefined): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const pickFirstString = (...values: Array<string | null | undefined>): string | null => {
  for (const value of values) {
    const normalized = normalizeValue(value);
    if (normalized) {
      return normalized;
    }
  }

  return null;
};

const isRenderableLocator = (value: string | null | undefined): boolean => {
  const normalized = normalizeValue(value)?.toLowerCase();
  if (!normalized) {
    return false;
  }

  return (
    normalized.startsWith('http://') ||
    normalized.startsWith('https://') ||
    normalized.startsWith('blob:') ||
    normalized.startsWith('data:') ||
    normalized.startsWith('asset:')
  );
};

const VIDEO_URL_PATTERN = /\.(mp4|mov|webm|m4v|avi)(?:[?#].*)?$/i;
const AUDIO_URL_PATTERN = /\.(mp3|wav|m4a|aac|ogg|flac|opus)(?:[?#].*)?$/i;
const IMAGE_URL_PATTERN = /\.(png|jpe?g|gif|webp|bmp|svg|avif)(?:[?#].*)?$/i;
const TEXT_URL_PATTERN = /\.(txt|md|json|srt|vtt)(?:[?#].*)?$/i;

const mapResourceTypeToRenderKind = (
  type: MediaResourceType | undefined
): GenerationResultRenderKind | null => {
  switch (type) {
    case MediaResourceType.VIDEO:
      return 'video';
    case MediaResourceType.AUDIO:
    case MediaResourceType.MUSIC:
    case MediaResourceType.SFX:
    case MediaResourceType.VOICE:
    case MediaResourceType.SPEECH:
      return 'audio';
    case MediaResourceType.TEXT:
    case MediaResourceType.SUBTITLE:
      return 'text';
    case MediaResourceType.IMAGE:
    case MediaResourceType.CHARACTER:
      return 'image';
    default:
      return null;
  }
};

const mapMediaTypeToRenderKind = (
  type: MediaType | null | undefined
): GenerationResultRenderKind => {
  switch (type) {
    case 'video':
      return 'video';
    case 'audio':
    case 'voice':
    case 'music':
    case 'speech':
    case 'sfx':
      return 'audio';
    case 'character':
      return 'image';
    default:
      return 'image';
  }
};

const inferRenderKindFromMimeType = (
  mimeType: string | null | undefined
): GenerationResultRenderKind | null => {
  const normalized = normalizeValue(mimeType)?.toLowerCase();
  if (!normalized) {
    return null;
  }

  if (normalized.startsWith('video/')) {
    return 'video';
  }

  if (normalized.startsWith('audio/')) {
    return 'audio';
  }

  if (normalized.startsWith('image/')) {
    return 'image';
  }

  if (normalized.startsWith('text/')) {
    return 'text';
  }

  return null;
};

const inferRenderKindFromUrl = (
  url: string | null | undefined
): GenerationResultRenderKind | null => {
  const normalized = normalizeValue(url)?.toLowerCase();
  if (!normalized) {
    return null;
  }

  if (normalized.startsWith('data:video')) {
    return 'video';
  }

  if (normalized.startsWith('data:audio')) {
    return 'audio';
  }

  if (normalized.startsWith('data:image')) {
    return 'image';
  }

  if (normalized.startsWith('data:text')) {
    return 'text';
  }

  if (VIDEO_URL_PATTERN.test(normalized)) {
    return 'video';
  }

  if (AUDIO_URL_PATTERN.test(normalized)) {
    return 'audio';
  }

  if (IMAGE_URL_PATTERN.test(normalized)) {
    return 'image';
  }

  if (TEXT_URL_PATTERN.test(normalized)) {
    return 'text';
  }

  return null;
};

const decodeTextDataUrl = (url: string | null | undefined): string => {
  const normalized = normalizeValue(url);
  if (!normalized || !normalized.startsWith('data:text')) {
    return '';
  }

  const commaIndex = normalized.indexOf(',');
  if (commaIndex < 0) {
    return '';
  }

  const header = normalized.slice(0, commaIndex).toLowerCase();
  const payload = normalized.slice(commaIndex + 1);

  try {
    if (header.includes(';base64')) {
      if (typeof atob !== 'function') {
        return '';
      }
      return atob(payload);
    }
    return decodeURIComponent(payload);
  } catch {
    return '';
  }
};

export const resolveGenerationResultSelectionKey = (
  result: GenerationResultRecord
): string => {
  const candidates = [
    result.resourceViewUuid,
    result.primaryResourceUuid,
    result.assetUuid,
    result.artifactUuid,
    result.uuid,
    result.resourceViewId,
    result.primaryResourceId,
    result.assetId,
    result.id,
  ];

  for (const candidate of candidates) {
    const normalized = normalizeValue(candidate);
    if (normalized) {
      return normalized;
    }
  }

  throw new Error('Generation result key missing');
};

export const resolveGenerationResultDeliveryUrl = (
  result: GenerationResultRecord | null | undefined
): string => pickFirstString(
  result?.resource?.url,
  result?.url,
  isRenderableLocator(result?.resource?.path) ? result?.resource?.path : null,
  isRenderableLocator(result?.path) ? result?.path : null
) || '';

export const resolveGenerationResultPosterUrl = (
  result: GenerationResultRecord | null | undefined
): string => pickFirstString(
  result?.coverResource?.url,
  result?.posterUrl,
  isRenderableLocator(result?.coverResource?.path) ? result?.coverResource?.path : null
) || '';

export const resolveGenerationResultRenderKind = (
  result: GenerationResultRecord | null | undefined,
  fallbackType: MediaType = 'image'
): GenerationResultRenderKind => (
  mapResourceTypeToRenderKind(result?.resource?.type) ||
  inferRenderKindFromMimeType(result?.resource?.mimeType) ||
  inferRenderKindFromMimeType(result?.mimeType) ||
  inferRenderKindFromUrl(result?.resource?.url) ||
  inferRenderKindFromUrl(result?.url) ||
  mapMediaTypeToRenderKind(fallbackType)
);

export const resolveGenerationResultTextContent = (
  result: GenerationResultRecord | null | undefined
): string => (
  normalizeValue(result?.resource?.text) ||
  normalizeValue(result?.resource?.metadata?.text as string | undefined) ||
  normalizeValue(result?.resource?.metadata?.transcript as string | undefined) ||
  normalizeValue(result?.resource?.metadata?.transcription as string | undefined) ||
  normalizeValue(result?.resource?.metadata?.translatedText as string | undefined) ||
  normalizeValue(result?.resource?.metadata?.content as string | undefined) ||
  decodeTextDataUrl(result?.resource?.url) ||
  decodeTextDataUrl(result?.url) ||
  ''
);

export const resolveGenerationResultPreviewThumbnailUrl = (
  result: GenerationResultRecord | null | undefined,
  fallbackType: MediaType = 'image'
): string => {
  const deliveryUrl = resolveGenerationResultDeliveryUrl(result);
  const posterUrl = resolveGenerationResultPosterUrl(result);
  const renderKind = resolveGenerationResultRenderKind(result, fallbackType);

  if (renderKind === 'video') {
    return pickFirstString(posterUrl, deliveryUrl) || '';
  }

  if (renderKind === 'text') {
    return '';
  }

  return pickFirstString(deliveryUrl, posterUrl) || '';
};

export const resolveGenerationTaskKey = (
  task: Pick<GenerationTaskRecord, 'id' | 'uuid'>
): string => resolveEntityKey(task);

export const resolveGenerationTaskPrompt = (
  task: Pick<GenerationTaskRecord, 'config'>
): string => (
  normalizeValue(task.config.prompt) ||
  normalizeValue(task.config.text) ||
  normalizeValue(task.config.previewText) ||
  ''
);

export const toGenerationResultSelection = (
  task: GenerationTaskRecord,
  result: GenerationResultRecord,
  resultIndex: number
): GenerationResultSelection => {
  const { url: legacyUrl, posterUrl: legacyPosterUrl, ...resultWithoutLegacyLocators } = result;
  const resourceDeliveryUrl = normalizeValue(result.resource?.url);
  const resourcePosterUrl = normalizeValue(result.coverResource?.url);
  const normalizedLegacyUrl = normalizeValue(legacyUrl);
  const normalizedLegacyPosterUrl = normalizeValue(legacyPosterUrl);

  return {
    ...resultWithoutLegacyLocators,
    ...(resourceDeliveryUrl ? {} : normalizedLegacyUrl ? { url: normalizedLegacyUrl } : {}),
    ...(resourcePosterUrl ? {} : normalizedLegacyPosterUrl ? { posterUrl: normalizedLegacyPosterUrl } : {}),
    key: resolveGenerationResultSelectionKey(result),
    type: task.config.mediaType || 'image',
    taskKey: resolveGenerationTaskKey(task),
    taskId: task.id,
    taskUuid: task.uuid,
    resultIndex,
    createdAt: task.createdAt,
  };
};
