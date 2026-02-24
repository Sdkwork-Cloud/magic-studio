
import { SfxConfig, GeneratedSfxResult } from '../entities/sfx.entity';
import { genAIService } from '../../notes/services/genAIService';
import { generateUUID } from '../../../utils';

export const sfxService = {
    generateSfx: async (config: SfxConfig): Promise<GeneratedSfxResult[]> => {
        await new Promise(resolve => setTimeout(resolve, 2000));

        let audioUrl = '';
        
        try {
            audioUrl = await genAIService.generateSpeech(config.prompt.slice(0, 100));
        } catch (e) {
            console.warn("AI generation failed, using mock", e);
            audioUrl = ''; 
        }

        return [
            {
                id: generateUUID(),
                url: audioUrl,
                duration: config.duration
            }
        ];
    }
};
