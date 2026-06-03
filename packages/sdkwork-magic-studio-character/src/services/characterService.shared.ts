import type { CharacterArchetype, CharacterGender } from '../entities';

export interface CharacterResourceRecordLike {
  id?: string | number | null;
  uuid?: string | number | null;
  url?: unknown;
  mimeType?: unknown;
  name?: unknown;
  type?: unknown;
  metadata?: Record<string, unknown> | null;
}

export interface CharacterOutputRecordLike {
  primaryUrl?: unknown;
  resources?: Array<CharacterResourceRecordLike | null | undefined> | null;
}

export interface CharacterTaskRecordLike {
  taskId?: string | number | null;
  model?: unknown;
  status?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
  completedAt?: unknown;
  errorMessage?: unknown;
  inputParams?: Record<string, unknown> | null;
  outputResult?: CharacterOutputRecordLike | null;
}

export const safeString = (value: unknown): string => {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }
  return '';
};

export const safeIdString = (value: unknown): string => {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return '';
};

export const safeTimestamp = (value: unknown): string | number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  const normalized = safeString(value);
  return normalized || undefined;
};

export const readMetadataString = (
  metadata: unknown,
  key: string
): string | undefined => {
  if (!metadata || typeof metadata !== 'object') {
    return undefined;
  }

  return safeString((metadata as Record<string, unknown>)[key]) || undefined;
};

export const safeNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
};

export const normalizeArchetype = (value: string): CharacterArchetype | undefined => {
  switch (value) {
    case 'hero':
    case 'villain':
    case 'npc':
    case 'fantasy':
    case 'cyberpunk':
    case 'anime':
    case 'mascot':
      return value;
    default:
      return undefined;
  }
};

export const normalizeGender = (value: string): CharacterGender | undefined => {
  switch (value) {
    case 'male':
    case 'female':
    case 'neutral':
      return value;
    default:
      return undefined;
  }
};

export const deriveDimensions = (aspectRatio?: string): { width?: number; height?: number } => {
  switch (safeString(aspectRatio)) {
    case '9:16':
      return { width: 720, height: 1280 };
    case '16:9':
      return { width: 1280, height: 720 };
    case '4:5':
      return { width: 864, height: 1080 };
    case '1:1':
      return { width: 1024, height: 1024 };
    default:
      return {};
  }
};

export const deriveAspectRatio = (width?: number, height?: number): string | undefined => {
  if (!width || !height) {
    return undefined;
  }

  if (width === height) {
    return '1:1';
  }
  if (width * 16 === height * 9) {
    return '9:16';
  }
  if (width * 9 === height * 16) {
    return '16:9';
  }
  if (width * 5 === height * 4) {
    return '4:5';
  }
  return `${width}:${height}`;
};
