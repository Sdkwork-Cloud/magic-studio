import type { MusicModelType } from '../entities';

export const DEFAULT_MUSIC_MODEL: MusicModelType = 'suno-v3';

const MUSIC_MODELS = new Set<MusicModelType>([
  DEFAULT_MUSIC_MODEL,
  'suno-v3.5',
  'udio-v1',
  'musicgen-large',
]);

const MUSIC_MODEL_ALIASES: Readonly<Record<string, MusicModelType>> = {
  default: DEFAULT_MUSIC_MODEL,
  suno: DEFAULT_MUSIC_MODEL,
  udio: 'udio-v1',
  musicgen: 'musicgen-large',
};

function normalizeText(value: unknown): string {
  if (typeof value === 'string') {
    return value.trim();
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  return '';
}

export function resolveMusicModelType(value: unknown): MusicModelType | undefined {
  const normalized = normalizeText(value);
  if (!normalized) {
    return undefined;
  }

  if (MUSIC_MODELS.has(normalized as MusicModelType)) {
    return normalized as MusicModelType;
  }

  return MUSIC_MODEL_ALIASES[normalized];
}

export function isMusicModelType(value: unknown): value is MusicModelType {
  return resolveMusicModelType(value) !== undefined;
}

export function normalizeMusicModel(
  value: unknown,
  fallback: MusicModelType = DEFAULT_MUSIC_MODEL,
): MusicModelType {
  return resolveMusicModelType(value) ?? fallback;
}
