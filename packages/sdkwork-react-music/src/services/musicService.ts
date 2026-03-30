import { MusicConfig, GeneratedMusicResult } from '../entities';
import { OFFLINE_DEMO_AUDIO_URL, createOfflineArtwork } from '@sdkwork/react-core';

const createMusicCover = (title: string, accent: string): string =>
    createOfflineArtwork({
        title,
        subtitle: 'Offline bundled cover art',
        eyebrow: 'Magic Studio Music',
        accent,
        width: 512,
        height: 512,
    });

// Mock music generation service for demonstration
export const musicService = {
    isConfigured: () => true,

    /**
     * Generate music using configured models.
     */
    generateMusic: async (config: MusicConfig): Promise<GeneratedMusicResult> => {
        console.log('[MusicService] Generating music with config:', config);
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Mock music generation based on style
        let musicUrl = '';
        let coverUrl = '';
        
        switch (config.style.toLowerCase()) {
            case 'pop':
                musicUrl = OFFLINE_DEMO_AUDIO_URL;
                coverUrl = createMusicCover('Pop Pulse', '#ec4899');
                break;
            case 'rock':
                musicUrl = OFFLINE_DEMO_AUDIO_URL;
                coverUrl = createMusicCover('Rock Drive', '#f97316');
                break;
            case 'electronic':
                musicUrl = OFFLINE_DEMO_AUDIO_URL;
                coverUrl = createMusicCover('Electronic Bloom', '#5b8cff');
                break;
            case 'classical':
                musicUrl = OFFLINE_DEMO_AUDIO_URL;
                coverUrl = createMusicCover('Classical Flow', '#c084fc');
                break;
            case 'hip-hop':
                musicUrl = OFFLINE_DEMO_AUDIO_URL;
                coverUrl = createMusicCover('Hip Hop Grid', '#14b8a6');
                break;
            default:
                musicUrl = OFFLINE_DEMO_AUDIO_URL;
                coverUrl = createMusicCover('Generated Music', '#64748b');
                break;
        }

        return {
            id: `music_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            url: musicUrl,
            coverUrl: coverUrl,
            title: config.title || 'Generated Music',
            duration: config.duration || 180,
            lyrics: config.lyrics,
            style: config.style
        };
    }
};
