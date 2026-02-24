
import { AudioConfig, GeneratedAudioResult } from '../entities/audio.entity';
import { genAIService } from '../../notes/services/genAIService';
import { generateUUID } from '../../../utils';

export const audioService = {
    generateSpeech: async (config: AudioConfig): Promise<GeneratedAudioResult[]> => {
        await new Promise(resolve => setTimeout(resolve, 1200));

        let audioUrl = '';
        
        try {
            audioUrl = await genAIService.generateSpeech(config.text, config.voice);
        } catch (e) {
            console.error("AI generation failed", e);
            throw e;
        }

        return [
            {
                id: generateUUID(),
                url: audioUrl,
                duration: Math.min(config.text.length * 0.1, 60),
                text: config.text
            }
        ];
    }
};
