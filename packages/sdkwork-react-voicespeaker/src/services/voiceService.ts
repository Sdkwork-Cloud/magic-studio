import { VoiceConfig, GeneratedVoiceResult, VoiceProfile, VoiceTask } from '../entities';
import { PRESET_VOICES } from '../constants';
import { generateUUID } from '@sdkwork/react-commons';
import { hasSdkworkClient, sdk } from '@sdkwork/react-core';

interface ApiEnvelope<T> {
    data?: T;
}

interface SdkGenerationOutputLike {
    primaryUrl?: string;
    urls?: string[];
    resources?: Array<{ url?: string }>;
}

interface SdkGenerationTaskLike {
    taskId?: string | number;
    status?: string;
    outputResult?: SdkGenerationOutputLike;
    errorMessage?: string;
}

interface SdkAudioApiLike {
    textToSpeech?: (body: Record<string, unknown>) => Promise<unknown>;
    getTaskStatus?: (taskId: string | number) => Promise<unknown>;
}

interface SdkVoiceSpeakerApiLike {
    createGeneration?: (body: Record<string, unknown>) => Promise<unknown>;
    getTaskStatus?: (taskId: string | number) => Promise<unknown>;
}

const TASK_POLL_INTERVAL_MS = 1200;
const TASK_POLL_MAX_ATTEMPTS = 15;

const unwrapApiData = <T>(payload: T | ApiEnvelope<T> | undefined): T | undefined => {
    if (!payload) {
        return undefined;
    }
    if (typeof payload === 'object' && 'data' in (payload as ApiEnvelope<T>)) {
        const envelope = payload as ApiEnvelope<T>;
        if (envelope.data !== undefined) {
            return envelope.data;
        }
    }
    return payload as T;
};

const safeIdString = (value: unknown): string => {
    if (typeof value === 'string' && value.trim().length > 0) {
        return value.trim();
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
        return String(value);
    }
    return '';
};

const wait = async (ms: number): Promise<void> =>
    new Promise((resolve) => {
        setTimeout(resolve, ms);
    });

const isTerminalStatus = (status?: string): boolean => {
    const normalized = (status || '').toUpperCase();
    return normalized === 'SUCCESS' || normalized === 'FAILED' || normalized === 'CANCELLED';
};

const isSuccessStatus = (status?: string): boolean => (status || '').toUpperCase() === 'SUCCESS';

const collectOutputUrls = (task?: SdkGenerationTaskLike): string[] => {
    if (!task?.outputResult) {
        return [];
    }
    const urls = new Set<string>();
    const primaryUrl = task.outputResult.primaryUrl;
    if (typeof primaryUrl === 'string' && primaryUrl.trim().length > 0) {
        urls.add(primaryUrl.trim());
    }
    if (Array.isArray(task.outputResult.urls)) {
        task.outputResult.urls.forEach((url) => {
            if (typeof url === 'string' && url.trim().length > 0) {
                urls.add(url.trim());
            }
        });
    }
    if (Array.isArray(task.outputResult.resources)) {
        task.outputResult.resources.forEach((resource) => {
            if (typeof resource?.url === 'string' && resource.url.trim().length > 0) {
                urls.add(resource.url.trim());
            }
        });
    }
    return Array.from(urls);
};

const estimateDuration = (text: string): number => Math.min(text.length * 0.1, 60);

const buildGeneratedResults = (
    urls: string[],
    text: string,
    speakerName: string
): GeneratedVoiceResult[] =>
    urls.map((url) => ({
        id: generateUUID(),
        url,
        duration: estimateDuration(text),
        text,
        speakerName
    }));

const pollTaskById = async (
    taskId: string,
    getTaskStatus: ((taskId: string | number) => Promise<unknown>) | undefined
): Promise<SdkGenerationTaskLike | null> => {
    if (!getTaskStatus) {
        return null;
    }

    for (let attempt = 0; attempt < TASK_POLL_MAX_ATTEMPTS; attempt += 1) {
        const response = await getTaskStatus(taskId);
        const task = unwrapApiData<SdkGenerationTaskLike>(response as ApiEnvelope<SdkGenerationTaskLike> | SdkGenerationTaskLike);
        if (!task) {
            await wait(TASK_POLL_INTERVAL_MS);
            continue;
        }
        if (isTerminalStatus(task.status)) {
            return task;
        }
        await wait(TASK_POLL_INTERVAL_MS);
    }
    return null;
};

const generateSpeechViaSdk = async (
    config: VoiceConfig,
    speakerName: string
): Promise<GeneratedVoiceResult[]> => {
    if (!hasSdkworkClient()) {
        return [];
    }

    const sdkClient = sdk.client as unknown as {
        audio?: SdkAudioApiLike;
        voiceSpeaker?: SdkVoiceSpeakerApiLike;
    };
    const audioApi = sdkClient.audio;
    if (audioApi && typeof audioApi.textToSpeech === 'function') {
        try {
            const response = await audioApi.textToSpeech({
                prompt: (config.description || 'Generate speech from text').trim(),
                model: config.model,
                text: config.text,
                voice: config.voiceId,
                speed: config.speed,
                pitch: config.pitch,
                format: 'wav',
                async: true,
                type: 'VOICE_SPEAKER',
                referenceAssets: config.referenceAudio
                    ? [{ url: config.referenceAudio, type: 'AUDIO', name: 'reference-audio' }]
                    : undefined
            });
            const task = unwrapApiData<SdkGenerationTaskLike>(response as ApiEnvelope<SdkGenerationTaskLike> | SdkGenerationTaskLike);
            const directUrls = collectOutputUrls(task);
            if (directUrls.length > 0) {
                return buildGeneratedResults(directUrls, config.text, speakerName);
            }

            const taskId = safeIdString(task?.taskId);
            if (taskId) {
                const finalTask = await pollTaskById(taskId, audioApi.getTaskStatus);
                if (finalTask && isSuccessStatus(finalTask.status)) {
                    const taskUrls = collectOutputUrls(finalTask);
                    if (taskUrls.length > 0) {
                        return buildGeneratedResults(taskUrls, config.text, speakerName);
                    }
                }
            }
        } catch (error) {
            console.warn('SDK audio.textToSpeech failed, fallback to voice speaker generation', error);
        }
    }

    const voiceSpeakerApi = sdkClient.voiceSpeaker;
    if (voiceSpeakerApi && typeof voiceSpeakerApi.createGeneration === 'function') {
        try {
            const response = await voiceSpeakerApi.createGeneration({
                prompt: (config.description || 'Generate speech from text').trim(),
                model: config.model,
                text: config.text,
                speakerId: config.voiceId,
                speakerName,
                speed: config.speed,
                pitch: config.pitch,
                format: 'wav',
                type: 'VOICE_SPEAKER',
                referenceAssets: config.referenceAudio
                    ? [{ url: config.referenceAudio, type: 'AUDIO', name: 'reference-audio' }]
                    : undefined
            });
            const task = unwrapApiData<SdkGenerationTaskLike>(response as ApiEnvelope<SdkGenerationTaskLike> | SdkGenerationTaskLike);
            const directUrls = collectOutputUrls(task);
            if (directUrls.length > 0) {
                return buildGeneratedResults(directUrls, config.text, speakerName);
            }

            const taskId = safeIdString(task?.taskId);
            if (taskId) {
                const finalTask = await pollTaskById(taskId, voiceSpeakerApi.getTaskStatus);
                if (finalTask && isSuccessStatus(finalTask.status)) {
                    const taskUrls = collectOutputUrls(finalTask);
                    if (taskUrls.length > 0) {
                        return buildGeneratedResults(taskUrls, config.text, speakerName);
                    }
                }
            }
        } catch (error) {
            console.warn('SDK voiceSpeaker.createGeneration failed', error);
        }
    }

    return [];
};

export const voiceService = {
    getVoices: async (): Promise<VoiceProfile[]> => {
        return PRESET_VOICES;
    },

    generateSpeech: async (config: VoiceConfig): Promise<GeneratedVoiceResult[]> => {
        const speaker = PRESET_VOICES.find(v => v.id === config.voiceId);
        const selectedSpeakerName = config.name || speaker?.name || 'Custom Voice';

        const sdkResults = await generateSpeechViaSdk(config, selectedSpeakerName);
        if (sdkResults.length > 0) {
            return sdkResults;
        }

        await new Promise(resolve => setTimeout(resolve, 1500));
        const audioUrl = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3';

        return [
            {
                id: generateUUID(),
                url: audioUrl,
                duration: estimateDuration(config.text),
                text: config.text,
                speakerName: selectedSpeakerName
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
