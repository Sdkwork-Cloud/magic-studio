
import { AudioModelType } from './entities/audio.entity';

export const STORAGE_KEY_AUDIO_HISTORY = 'open_studio_audio_history_v1';

export const AUDIO_MODELS: { id: AudioModelType; name: string; badge?: string }[] = [
    { id: 'gemini-2.5-flash-tts', name: 'Gemini Flash TTS', badge: 'FAST' },
    { id: 'eleven-labs-turbo', name: 'ElevenLabs Turbo', badge: 'PRO' },
    { id: 'azure-speech', name: 'Azure Speech', badge: 'STD' },
];

export const AUDIO_VOICES = [
    { id: 'Kore', name: 'Kore', gender: 'Female' },
    { id: 'Puck', name: 'Puck', gender: 'Male' },
    { id: 'Charon', name: 'Charon', gender: 'Male' },
    { id: 'Fenrir', name: 'Fenrir', gender: 'Male' },
    { id: 'Aoede', name: 'Aoede', gender: 'Female' },
    { id: 'Zephyr', name: 'Zephyr', gender: 'Female' },
];
