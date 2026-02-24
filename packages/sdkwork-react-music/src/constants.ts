import { MusicStyle, MusicModelType } from './entities/music.entity';
import { ModelProvider } from 'sdkwork-react-commons';
import React from 'react';
import { Music, Mic, Radio } from 'lucide-react';

export const STORAGE_KEY_MUSIC_HISTORY = "open_studio_music_history_v1";

export const MUSIC_MODELS: {
    id: MusicModelType;
    name: string;
    badge?: string;
}[] = [
    { id: 'suno-v3', name: 'Suno V3', badge: 'Default' },
    { id: 'suno-v3.5', name: 'Suno V3.5' },
    { id: 'udio-v1', name: 'Udio V1' },
    { id: 'musicgen-large', name: 'MusicGen Large' }
];

export const MUSIC_PROVIDERS: ModelProvider[] = [
    {
        id: 'suno',
        name: 'Suno',
        icon: React.createElement(Mic, { size: 14 }),
        color: 'text-pink-500',
        models: [
            { id: 'suno-v3', name: 'Suno V3', description: 'Default music generation', badge: 'Default', badgeColor: 'bg-gray-600' },
            { id: 'suno-v3.5', name: 'Suno V3.5', description: 'Enhanced quality', badge: 'NEW', badgeColor: 'bg-pink-600' },
        ]
    },
    {
        id: 'udio',
        name: 'Udio',
        icon: React.createElement(Music, { size: 14 }),
        color: 'text-purple-500',
        models: [
            { id: 'udio-v1', name: 'Udio V1', description: 'Professional music AI', badge: 'PRO', badgeColor: 'bg-purple-600' },
        ]
    },
    {
        id: 'opensource',
        name: 'Open Source',
        icon: React.createElement(Radio, { size: 14 }),
        color: 'text-green-500',
        models: [
            { id: 'musicgen-large', name: 'MusicGen Large', description: 'Meta open source model', badge: 'OPEN', badgeColor: 'bg-green-600' },
        ]
    },
];

export const MUSIC_STYLES: MusicStyle[] = [
    { id: 'pop', label: 'Pop', value: 'pop', color: '#ec4899' },
    { id: 'rock', label: 'Rock', value: 'rock', color: '#ef4444' },
    { id: 'jazz', label: 'Jazz', value: 'jazz', color: '#f59e0b' },
    { id: 'classical', label: 'Classical', value: 'classical', color: '#8b5cf6' },
    { id: 'electronic', label: 'Electronic', value: 'electronic', color: '#06b6d4' },
    { id: 'hiphop', label: 'Hip Hop', value: 'hiphop', color: '#10b981' },
    { id: 'country', label: 'Country', value: 'country', color: '#84cc16' },
    { id: 'rnb', label: 'R&B', value: 'rnb', color: '#6366f1' }
];
