
import {
    VoiceProfile,
    VoiceModelType,
    type VoiceModelApiProfile,
    type VoiceModelPolicy,
    type VoiceProviderApiProfile
} from './entities';
import { ModelProvider } from '@sdkwork/react-commons';
import React from 'react';
import { Mic, Sparkles, Globe } from 'lucide-react';

export const STORAGE_KEY_VOICE_HISTORY = 'magic_studio_voice_history_v1';

export const VOICE_MODELS: { id: VoiceModelType; name: string; badge?: string }[] = [
    { id: 'gemini-tts', name: 'Gemini TTS', badge: 'FAST' },
    { id: 'openai-tts-1', name: 'OpenAI TTS HD', badge: 'HD' },
    { id: 'eleven-labs-v2', name: 'ElevenLabs v2', badge: 'PRO' },
];

export const VOICE_MODEL_POLICIES: Partial<Record<VoiceModelType, VoiceModelPolicy>> = {
    'gemini-tts': {
        model: 'gemini-tts',
        supportedModes: ['design', 'clone'],
        speedRange: [0.7, 1.4],
        pitchRange: [0.8, 1.2],
        defaultSpeed: 1,
        defaultPitch: 1
    },
    'openai-tts-1': {
        model: 'openai-tts-1',
        supportedModes: ['design'],
        speedRange: [0.75, 1.35],
        pitchRange: [0.85, 1.15],
        defaultSpeed: 1,
        defaultPitch: 1
    },
    'eleven-labs-v2': {
        model: 'eleven-labs-v2',
        supportedModes: ['design', 'clone'],
        speedRange: [0.6, 1.5],
        pitchRange: [0.75, 1.25],
        defaultSpeed: 1,
        defaultPitch: 1
    }
};

export const getVoiceModelPolicy = (model: VoiceModelType): VoiceModelPolicy => {
    return VOICE_MODEL_POLICIES[model] || VOICE_MODEL_POLICIES['gemini-tts']!;
};

export const VOICE_MODEL_API_PROFILES: Partial<Record<VoiceModelType, VoiceModelApiProfile>> = {
    'gemini-tts': {
        ...getVoiceModelPolicy('gemini-tts'),
        provider: 'google',
        displayName: 'Google Gemini TTS',
        maxTextLength: 5000,
        defaultLanguage: 'en-US'
    },
    'openai-tts-1': {
        ...getVoiceModelPolicy('openai-tts-1'),
        provider: 'openai',
        displayName: 'OpenAI TTS',
        maxTextLength: 4096,
        defaultLanguage: 'en-US'
    },
    'eleven-labs-v2': {
        ...getVoiceModelPolicy('eleven-labs-v2'),
        provider: 'elevenlabs',
        displayName: 'ElevenLabs',
        maxTextLength: 5000,
        defaultLanguage: 'en-US'
    }
};

const resolveFallbackVoiceModelApiProfile = (
    model: VoiceModelType
): VoiceModelApiProfile => {
    const policy = getVoiceModelPolicy(model);
    return {
        ...policy,
        provider: 'google',
        displayName: policy.model,
        maxTextLength: 5000,
        defaultLanguage: 'en-US'
    };
};

export const getVoiceModelApiProfile = (
    model: VoiceModelType
): VoiceModelApiProfile => {
    return VOICE_MODEL_API_PROFILES[model] || resolveFallbackVoiceModelApiProfile(model);
};

export const VOICE_PROVIDER_API_PROFILES: Record<
    VoiceModelApiProfile['provider'],
    VoiceProviderApiProfile
> = {
    google: {
        provider: 'google',
        displayName: 'Google AI Studio / Gemini',
        docs: [
            {
                title: 'Gemini TTS Guide',
                url: 'https://ai.google.dev/gemini-api/docs/speech-generation',
                official: true,
                summary: 'Text-to-speech synthesis with voice options and audio output formats.'
            }
        ],
        featureSpec: {
            supportsClone: true,
            supportsReferenceAudio: true,
            supportsStylePrompt: true,
            supportsSpeedControl: true,
            supportsPitchControl: true,
            supportsStabilityControl: false,
            supportsSimilarityControl: false
        }
    },
    openai: {
        provider: 'openai',
        displayName: 'OpenAI Audio API',
        docs: [
            {
                title: 'Text to Speech',
                url: 'https://platform.openai.com/docs/guides/text-to-speech',
                official: true,
                summary: 'Speech synthesis endpoint with voices and speed settings.'
            }
        ],
        featureSpec: {
            supportsClone: false,
            supportsReferenceAudio: false,
            supportsStylePrompt: true,
            supportsSpeedControl: true,
            supportsPitchControl: true,
            supportsStabilityControl: false,
            supportsSimilarityControl: false
        }
    },
    elevenlabs: {
        provider: 'elevenlabs',
        displayName: 'ElevenLabs Voice AI',
        docs: [
            {
                title: 'Text to Speech API',
                url: 'https://elevenlabs.io/docs/api-reference/text-to-speech',
                official: true,
                summary: 'TTS with voice settings, style, and cloning workflows.'
            },
            {
                title: 'Voice Cloning API',
                url: 'https://elevenlabs.io/docs/api-reference/voices',
                official: true,
                summary: 'Create and manage cloned voices with reference audio.'
            }
        ],
        featureSpec: {
            supportsClone: true,
            supportsReferenceAudio: true,
            supportsStylePrompt: true,
            supportsSpeedControl: true,
            supportsPitchControl: true,
            supportsStabilityControl: true,
            supportsSimilarityControl: true
        }
    },
    azure: {
        provider: 'azure',
        displayName: 'Azure AI Speech',
        docs: [
            {
                title: 'Speech Synthesis Overview',
                url: 'https://learn.microsoft.com/azure/ai-services/speech-service/text-to-speech',
                official: true,
                summary: 'Azure text-to-speech, custom voices, and style controls.'
            }
        ],
        featureSpec: {
            supportsClone: true,
            supportsReferenceAudio: true,
            supportsStylePrompt: true,
            supportsSpeedControl: true,
            supportsPitchControl: true,
            supportsStabilityControl: false,
            supportsSimilarityControl: false
        }
    }
};

export const getVoiceProviderApiProfileByModel = (
    model: VoiceModelType
): VoiceProviderApiProfile => {
    const modelProfile = getVoiceModelApiProfile(model);
    return VOICE_PROVIDER_API_PROFILES[modelProfile.provider];
};

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
