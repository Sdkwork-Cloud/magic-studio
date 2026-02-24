
import { VoiceConfig, GeneratedVoiceResult, VoiceProfile } from '../entities/voice.entity';
import { genAIService } from '../../notes/services/genAIService';
import { PRESET_VOICES } from '../constants';
import { generateUUID } from '../../../utils';

export const voiceService = {
    getVoices: async (): Promise<VoiceProfile[]> => {
        return PRESET_VOICES;
    },

    generateSpeech: async (config: VoiceConfig): Promise<GeneratedVoiceResult[]> => {
        await new Promise(resolve => setTimeout(resolve, 1500));

        let audioUrl = '';
        
        try {
            audioUrl = await genAIService.generateSpeech(config.text, config.voiceId);
        } catch (e) {
            console.error("AI generation failed, using fallback logic or mock", e);
            throw e;
        }

        const speaker = PRESET_VOICES.find(v => v.id === config.voiceId);

        return [
            {
                id: generateUUID(),
                url: audioUrl,
                duration: Math.min(config.text.length * 0.1, 60),
                text: config.text,
                speakerName: speaker?.name || 'Custom Voice'
            }
        ];
    }
};
