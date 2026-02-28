import { VideoConfig, GeneratedVideoResult } from '../entities';

// Mock video generation service for demonstration
export const videoService = {
    isConfigured: () => true,

    /**
     * Generate a video using configured models.
     */
    generateVideo: async (config: VideoConfig): Promise<GeneratedVideoResult> => {
        console.log('[VideoService] Generating video with config:', config);
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Mock video generation based on mode
        let videoUrl = '';
        let posterUrl = '';
        
        switch (config.mode) {
            case 'avatar':
                videoUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4';
                posterUrl = 'https://sample-videos.com/img/Sample-jpg-image-100kb.jpg';
                break;
            case 'lip-sync':
                videoUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4';
                posterUrl = 'https://sample-videos.com/img/Sample-jpg-image-50kb.jpg';
                break;
            case 'multi-image':
            case 'smart_multi':
                videoUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
                posterUrl = 'https://sample-videos.com/img/Sample-jpg-image-1mb.jpg';
                break;
            case 'image':
            case 'start_end':
            case 'smart_reference':
            case 'subject_ref':
                videoUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4';
                posterUrl = 'https://sample-videos.com/img/Sample-jpg-image-200kb.jpg';
                break;
            case 'text':
            default:
                videoUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4';
                posterUrl = 'https://sample-videos.com/img/Sample-jpg-image-300kb.jpg';
                break;
        }

        return {
            id: `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            url: videoUrl,
            mp4Url: videoUrl,
            posterUrl: posterUrl,
            modelId: config.model
        };
    },

    /**
     * Resolve media sources to usable format
     */
    resolveMediaSource: async (source: string): Promise<{ mimeType: string, data: string } | null> => {
        if (!source) return null;

        // Handle data URIs
        const matches = source.match(/^data:(.+);base64,(.+)$/);
        if (matches) {
            return { mimeType: matches[1], data: matches[2] };
        }

        // Handle file paths
        try {
            // For demo purposes, return mock data
            // In real implementation, this would read actual file data
            return {
                mimeType: source.endsWith('.mp4') ? 'video/mp4' : 'image/png',
                data: 'mock_base64_data'
            };
        } catch (e) {
            console.warn(`[VideoService] Failed to resolve source: ${source}`, e);
            return null;
        }
    }
};
