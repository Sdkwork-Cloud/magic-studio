
import { MusicConfig, GeneratedMusicResult } from '../entities/music.entity';
import { genAIService } from '../../notes/services/genAIService';
import { generateUUID } from '../../../utils';

const COVERS = [
    'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=500&q=80',
    'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&q=80',
    'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=500&q=80',
    'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=500&q=80'
];

export const musicService = {
    generateMusic: async (config: MusicConfig): Promise<GeneratedMusicResult[]> => {
        await new Promise(resolve => setTimeout(resolve, 2000));

        let audioUrl = '';
        
        try {
            const prompt = config.customMode ? config.lyrics || config.style : config.prompt;
            audioUrl = await genAIService.generateSpeech(prompt.slice(0, 200) || "Music generation preview");
        } catch (e) {
            console.warn("AI generation failed, using mock", e);
            audioUrl = ''; 
        }

        return [
            {
                id: generateUUID(),
                title: config.title || 'Untitled Track',
                url: audioUrl,
                duration: 120,
                coverUrl: COVERS[Math.floor(Math.random() * COVERS.length)],
                style: config.customMode ? config.style : config.prompt,
                lyrics: config.customMode ? config.lyrics : undefined
            },
            {
                id: generateUUID(),
                title: (config.title || 'Untitled Track') + ' (Ver 2)',
                url: audioUrl,
                duration: 120,
                coverUrl: COVERS[Math.floor(Math.random() * COVERS.length)],
                style: config.customMode ? config.style : config.prompt,
                lyrics: config.customMode ? config.lyrics : undefined
            }
        ];
    }
};
