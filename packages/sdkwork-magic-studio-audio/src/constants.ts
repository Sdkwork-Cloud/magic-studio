import { AudioModelType } from './entities';
import { ModelProvider } from '@sdkwork/magic-studio-types/infrastructure';
import React from 'react';
import { Volume2, Zap, Globe, Sparkles } from 'lucide-react';

export const STORAGE_KEY_AUDIO_HISTORY = 'magic_studio_audio_history_v1';

export const AUDIO_MODELS: { id: AudioModelType; name: string; badge?: string }[] = [
    { id: 'gemini-tts', name: 'Gemini TTS', badge: 'FAST' },
    { id: 'openai-tts-1', name: 'OpenAI TTS HD', badge: 'HD' },
    { id: 'eleven-labs-v2', name: 'ElevenLabs v2', badge: 'PRO' },
    { id: 'azure-tts', name: 'Azure Speech', badge: 'STD' },
];

export const AUDIO_PROVIDERS: ModelProvider[] = [
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
        color: 'text-sky-500',
        models: [
            { id: 'openai-tts-1', name: 'OpenAI TTS HD', description: 'High quality speech synthesis', badge: 'HD', badgeColor: 'bg-sky-600' },
        ]
    },
    {
        id: 'elevenlabs',
        name: 'ElevenLabs',
        icon: React.createElement(Volume2, { size: 14 }),
        color: 'text-purple-500',
        models: [
            { id: 'eleven-labs-v2', name: 'ElevenLabs v2', description: 'Professional voice synthesis', badge: 'PRO', badgeColor: 'bg-purple-600' },
        ]
    },
    {
        id: 'azure',
        name: 'Azure',
        icon: React.createElement(Zap, { size: 14 }),
        color: 'text-blue-500',
        models: [
            { id: 'azure-tts', name: 'Azure Speech', description: 'Microsoft Azure TTS', badge: 'STD', badgeColor: 'bg-blue-600' },
        ]
    },
];

export const AUDIO_VOICES = [
    { id: 'Kore', name: 'Kore', gender: 'Female' },
    { id: 'Puck', name: 'Puck', gender: 'Male' },
    { id: 'Charon', name: 'Charon', gender: 'Male' },
    { id: 'Fenrir', name: 'Fenrir', gender: 'Male' },
    { id: 'Aoede', name: 'Aoede', gender: 'Female' },
    { id: 'Zephyr', name: 'Zephyr', gender: 'Female' },
];
