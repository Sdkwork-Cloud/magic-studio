import { SfxModelType } from './entities/sfx.entity';
import { ModelProvider } from 'sdkwork-react-commons';
import React from 'react';
import { Waves, Volume2, Music } from 'lucide-react';

export const STORAGE_KEY_SFX_HISTORY = 'open_studio_sfx_history_v1';

export const SFX_MODELS: { id: SfxModelType; name: string; badge?: string }[] = [
    { id: 'eleven-labs-sfx', name: 'ElevenLabs SFX', badge: 'PRO' },
    { id: 'audioldm-2', name: 'AudioLDM 2', badge: 'FAST' },
    { id: 'tango', name: 'Tango', badge: 'OPEN' },
];

export const SFX_PROVIDERS: ModelProvider[] = [
    {
        id: 'elevenlabs',
        name: 'ElevenLabs',
        icon: React.createElement(Waves, { size: 14 }),
        color: 'text-purple-500',
        models: [
            { id: 'eleven-labs-sfx', name: 'ElevenLabs SFX', description: 'Professional sound effects', badge: 'PRO', badgeColor: 'bg-purple-600' },
        ]
    },
    {
        id: 'opensource',
        name: 'Open Source',
        icon: React.createElement(Volume2, { size: 14 }),
        color: 'text-green-500',
        models: [
            { id: 'audioldm-2', name: 'AudioLDM 2', description: 'Fast audio generation', badge: 'FAST', badgeColor: 'bg-blue-600' },
            { id: 'tango', name: 'Tango', description: 'Open source model', badge: 'OPEN', badgeColor: 'bg-green-600' },
        ]
    },
];
