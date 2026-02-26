
import { VoiceProfile, VoiceModelType } from './entities';
import { ModelProvider } from '@sdkwork/react-commons';
import React from 'react';
import { Mic, Sparkles, Globe } from 'lucide-react';

export const STORAGE_KEY_VOICE_HISTORY = 'open_studio_voice_history_v1';

export const VOICE_MODELS: { id: VoiceModelType; name: string; badge?: string }[] = [
    { id: 'gemini-tts', name: 'Gemini TTS', badge: 'FAST' },
    { id: 'openai-tts-1', name: 'OpenAI TTS HD', badge: 'HD' },
    { id: 'eleven-labs-v2', name: 'ElevenLabs v2', badge: 'PRO' },
];

export const VOICE_PROVIDERS: ModelProvider[] = [
    {
        id: 'google',
        name: 'Google',
        icon: React.createElement(Globe, { size: 14 }),
        color: 'text-green-500',
        models: [
            { id: 'gemini-tts', name: 'Gemini TTS', description: 'Fast text-to-speech', badge: 'FAST', badgeColor: 'bg-green-600' },
        ]
    },
    {
        id: 'openai',
        name: 'OpenAI',
        icon: React.createElement(Sparkles, { size: 14 }),
        color: 'text-blue-500',
        models: [
            { id: 'openai-tts-1', name: 'OpenAI TTS HD', description: 'High quality synthesis', badge: 'HD', badgeColor: 'bg-blue-600' },
        ]
    },
    {
        id: 'elevenlabs',
        name: 'ElevenLabs',
        icon: React.createElement(Mic, { size: 14 }),
        color: 'text-purple-500',
        models: [
            { id: 'eleven-labs-v2', name: 'ElevenLabs v2', description: 'Professional voice AI', badge: 'PRO', badgeColor: 'bg-purple-600' },
        ]
    },
];

export const PRESET_VOICES: VoiceProfile[] = [
    { id: 'Puck', name: 'Puck', gender: 'male', style: 'neutral', language: 'en-US' },
    { id: 'Charon', name: 'Charon', gender: 'male', style: 'news', language: 'en-US' },
    { id: 'Kore', name: 'Kore', gender: 'female', style: 'expressive', language: 'en-US' },
    { id: 'Fenrir', name: 'Fenrir', gender: 'male', style: 'story', language: 'en-US' },
    { id: 'Aoede', name: 'Aoede', gender: 'female', style: 'neutral', language: 'en-US' },
    { id: 'Zephyr', name: 'Zephyr', gender: 'female', style: 'whisper', language: 'en-US' },
];
