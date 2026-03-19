import { AudioModelType } from './entities';
import { ModelProvider } from '@sdkwork/react-commons';
import React from 'react';
import { Volume2, Zap, Globe } from 'lucide-react';

export const STORAGE_KEY_AUDIO_HISTORY = 'magic_studio_audio_history_v1';

export const AUDIO_MODELS: { id: AudioModelType; name: string; badge?: string }[] = [
    { id: 'gemini-2.5-flash-tts', name: 'Gemini Flash TTS', badge: 'FAST' },
    { id: 'eleven-labs-turbo', name: 'ElevenLabs Turbo', badge: 'PRO' },
    { id: 'azure-speech', name: 'Azure Speech', badge: 'STD' },
];

export const AUDIO_PROVIDERS: ModelProvider[] = [
    {
        id: 'google',
        name: 'Google',
        icon: React.createElement(Globe, { size: 14 }),
        color: 'text-green-500',
        models: [
            { id: 'gemini-2.5-flash-tts', name: 'Gemini Flash TTS', description: 'Fast text-to-speech', badge: 'FAST', badgeColor: 'bg-green-600' },
        ]
    },
    {
        id: 'elevenlabs',
        name: 'ElevenLabs',
        icon: React.createElement(Volume2, { size: 14 }),
        color: 'text-purple-500',
        models: [
            { id: 'eleven-labs-turbo', name: 'ElevenLabs Turbo', description: 'Professional voice synthesis', badge: 'PRO', badgeColor: 'bg-purple-600' },
        ]
    },
    {
        id: 'azure',
        name: 'Azure',
        icon: React.createElement(Zap, { size: 14 }),
        color: 'text-blue-500',
        models: [
            { id: 'azure-speech', name: 'Azure Speech', description: 'Microsoft Azure TTS', badge: 'STD', badgeColor: 'bg-blue-600' },
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
