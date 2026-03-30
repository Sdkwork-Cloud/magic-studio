import { MusicConfig, GeneratedMusicResult } from '../entities';

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
                musicUrl = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
                coverUrl = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=400&auto=format&fit=crop';
                break;
            case 'rock':
                musicUrl = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3';
                coverUrl = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=400&auto=format&fit=crop';
                break;
            case 'electronic':
                musicUrl = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3';
                coverUrl = 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?q=80&w=400&auto=format&fit=crop';
                break;
            case 'classical':
                musicUrl = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3';
                coverUrl = 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?q=80&w=400&auto=format&fit=crop';
                break;
            case 'hip-hop':
                musicUrl = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3';
                coverUrl = 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=400&auto=format&fit=crop';
                break;
            default:
                musicUrl = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
                coverUrl = 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=400&auto=format&fit=crop';
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
