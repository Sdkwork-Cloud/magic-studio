import type { AudioModelType } from '../entities';

export const DEFAULT_AUDIO_TTS_MODEL: AudioModelType = 'gemini-tts';
export const TRANSCRIPTION_AUDIO_MODEL: AudioModelType = 'whisper-1';

const AUDIO_MODEL_ALIASES: Readonly<Record<string, AudioModelType>> = {
  'gemini-2.5-flash-tts': 'gemini-tts',
  'eleven-labs-turbo': 'eleven-labs-v2',
  'azure-speech': 'azure-tts',
  tts: 'gemini-tts',
  voice: 'gemini-tts',
};

const AUDIO_MODELS = new Set<AudioModelType>([
  TRANSCRIPTION_AUDIO_MODEL,
  DEFAULT_AUDIO_TTS_MODEL,
  'openai-tts-1',
  'eleven-labs-v2',
  'azure-tts',
]);

const AUDIO_TTS_MODELS = new Set<AudioModelType>([
  DEFAULT_AUDIO_TTS_MODEL,
  'openai-tts-1',
  'eleven-labs-v2',
  'azure-tts',
]);

function normalizeText(value: unknown): string {
  if (typeof value === 'string') {
    return value.trim();
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return '';
}

export function resolveAudioModelType(value: unknown): AudioModelType | undefined {
  const normalized = normalizeText(value);
  if (!normalized) {
    return undefined;
  }

  if (AUDIO_MODELS.has(normalized as AudioModelType)) {
    return normalized as AudioModelType;
  }

  return AUDIO_MODEL_ALIASES[normalized];
}

export function isAudioModelType(value: unknown): value is AudioModelType {
  return resolveAudioModelType(value) !== undefined;
}

export function normalizeAudioModel(
  value: unknown,
  fallback: AudioModelType = DEFAULT_AUDIO_TTS_MODEL,
): AudioModelType {
  return resolveAudioModelType(value) ?? fallback;
}

export function normalizeAudioTtsModel(value: unknown): AudioModelType {
  const resolved = resolveAudioModelType(value);
  if (resolved && AUDIO_TTS_MODELS.has(resolved)) {
    return resolved;
  }
  return DEFAULT_AUDIO_TTS_MODEL;
}

export function normalizeAudioTextModel(value: unknown): AudioModelType {
  return resolveAudioModelType(value) === TRANSCRIPTION_AUDIO_MODEL
    ? TRANSCRIPTION_AUDIO_MODEL
    : TRANSCRIPTION_AUDIO_MODEL;
}
