
import { VoiceProfile, VoiceModelType } from './entities/voice.entity';

export const STORAGE_KEY_VOICE_HISTORY = 'open_studio_voice_history_v1';

export const VOICE_MODELS: { id: VoiceModelType; name: string; badge?: string }[] = [
    { id: 'gemini-tts', name: 'Gemini TTS', badge: 'FAST' },
    { id: 'openai-tts-1', name: 'OpenAI TTS HD', badge: 'HD' },
    { id: 'eleven-labs-v2', name: 'ElevenLabs v2', badge: 'PRO' },
];

// Predefined voices (can be fetched from API in real implementation)
export const PRESET_VOICES: VoiceProfile[] = [
    { id: 'Puck', name: 'Puck', gender: 'male', style: 'neutral', language: 'en-US' },
    { id: 'Charon', name: 'Charon', gender: 'male', style: 'news', language: 'en-US' },
    { id: 'Kore', name: 'Kore', gender: 'female', style: 'expressive', language: 'en-US' },
    { id: 'Fenrir', name: 'Fenrir', gender: 'male', style: 'story', language: 'en-US' },
    { id: 'Aoede', name: 'Aoede', gender: 'female', style: 'neutral', language: 'en-US' },
    { id: 'Zephyr', name: 'Zephyr', gender: 'female', style: 'whisper', language: 'en-US' },
];
