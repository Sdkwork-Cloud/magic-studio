import type {
  VoiceGender,
  VoiceGenerationMode,
  VoiceModelType,
  VoiceReferenceInputMethod,
} from '../entities';

const VOICE_MODELS = new Set<VoiceModelType>([
  'gemini-tts',
  'eleven-labs-v2',
  'openai-tts-1',
  'azure-tts',
  'custom',
]);

export const safeString = (value: unknown, fallback = ''): string => {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }

  return fallback;
};

export const safeIdString = (value: unknown, fallback = ''): string => {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  return fallback;
};

export const safeTimestamp = (
  value: unknown
): string | number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  const normalized = safeString(value);
  return normalized || undefined;
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

export const safeBoolean = (value: unknown): boolean | undefined => {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    if (value === 'true') {
      return true;
    }
    if (value === 'false') {
      return false;
    }
  }

  return undefined;
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

export const readRecordString = (
  record: Record<string, unknown> | undefined,
  key: string
): string | undefined => {
  if (!record) {
    return undefined;
  }

  return safeString(record[key]) || undefined;
};

export const readRecordNumber = (
  record: Record<string, unknown> | undefined,
  key: string
): number | undefined => {
  if (!record) {
    return undefined;
  }

  return safeNumber(record[key]);
};

export const readRecordBoolean = (
  record: Record<string, unknown> | undefined,
  key: string
): boolean | undefined => {
  if (!record) {
    return undefined;
  }

  return safeBoolean(record[key]);
};

export const normalizeVoiceGender = (value: unknown): VoiceGender => {
  const normalized = safeString(value, 'neutral').toLowerCase();
  if (normalized === 'male' || normalized === 'female') {
    return normalized;
  }

  return 'neutral';
};

export const normalizeVoiceMode = (value: unknown): VoiceGenerationMode => {
  return safeString(value) === 'clone' ? 'clone' : 'design';
};

export const normalizeVoiceInputMethod = (
  value: unknown
): VoiceReferenceInputMethod => {
  return safeString(value) === 'mic' ? 'mic' : 'upload';
};

export const normalizeVoiceModel = (value: unknown): VoiceModelType => {
  const normalized = safeString(value);
  if (VOICE_MODELS.has(normalized as VoiceModelType)) {
    return normalized as VoiceModelType;
  }

  return 'custom';
};

export const estimateDuration = (text: string): number =>
  Math.min(Math.max(text.length * 0.1, 1), 60);
