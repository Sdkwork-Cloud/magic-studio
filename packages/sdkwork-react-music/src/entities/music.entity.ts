import { BaseEntity } from 'sdkwork-react-commons';

export type MusicModelType = 'suno-v3' | 'suno-v3.5' | 'udio-v1' | 'musicgen-large';

export interface MusicStyle {
    id: string;
    label: string;
    value: string;
    color: string;
}

export interface MusicConfig {
    customMode: boolean;
    prompt: string;
    lyrics: string;
    style: string;
    title: string;
    instrumental: boolean;
    model: MusicModelType;
    duration?: number;
    mediaType: 'music';
    aspectRatio?: string;
}

export interface GeneratedMusicResult {
    id: string;
    url: string;
    coverUrl?: string;
    title: string;
    duration: number;
    lyrics?: string;
    style?: string;
}

export interface MusicTask extends BaseEntity {
    config: MusicConfig;
    status: 'pending' | 'completed' | 'failed';
    results?: GeneratedMusicResult[];
    error?: string;
    isFavorite?: boolean;
}
