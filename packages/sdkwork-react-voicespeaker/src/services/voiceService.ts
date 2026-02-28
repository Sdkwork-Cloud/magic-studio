import { VoiceConfig, GeneratedVoiceResult, VoiceProfile, VoiceTask } from '../entities';
import { PRESET_VOICES } from '../constants';
import { generateUUID } from '@sdkwork/react-commons';

export const voiceService = {
    getVoices: async (): Promise<VoiceProfile[]> => {
        return PRESET_VOICES;
    },

    generateSpeech: async (config: VoiceConfig): Promise<GeneratedVoiceResult[]> => {
        await new Promise(resolve => setTimeout(resolve, 1500));

        let audioUrl = '';
        
        try {
            audioUrl = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3';
        } catch (e) {
            console.error("Voice generation failed", e);
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
    },

    isSupported: (): boolean => {
        return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    },

    getAudioDevices: async (): Promise<MediaDeviceInfo[]> => {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            return devices.filter((device) => device.kind === 'audioinput');
        } catch (error) {
            console.error('Failed to enumerate audio devices:', error);
            return [];
        }
    },

    createVoiceTask: (task: Partial<VoiceTask>): VoiceTask => {
        return {
            id: generateUUID(),
            createdAt: Date.now(),
            updatedAt: Date.now(),
            status: 'pending',
            ...task,
        } as VoiceTask;
    },

    audioToBlob: async (audioBuffer: AudioBuffer, format = 'audio/webm'): Promise<Blob> => {
        return new Blob([audioBuffer.getChannelData(0)], { type: format });
    }
};

export class VoiceService {
    private static instance: VoiceService;

    private constructor() {}

    static getInstance(): VoiceService {
        if (!VoiceService.instance) {
            VoiceService.instance = new VoiceService();
        }
        return VoiceService.instance;
    }

    isSupported(): boolean {
        return voiceService.isSupported();
    }

    async getAudioDevices(): Promise<MediaDeviceInfo[]> {
        return voiceService.getAudioDevices();
    }

    createVoiceTask(task: Partial<VoiceTask>): VoiceTask {
        return voiceService.createVoiceTask(task);
    }

    async audioToBlob(audioBuffer: AudioBuffer, format = 'audio/webm'): Promise<Blob> {
        return voiceService.audioToBlob(audioBuffer, format);
    }
}
