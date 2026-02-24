export type AudioModelType = 'tts' | 'music' | 'sfx' | 'voice' | 'gemini-2.5-flash-tts' | 'eleven-labs-turbo' | 'azure-speech';

export interface AudioTaskResult {
    url: string;
    duration?: number;
}

export interface AudioTask {
    id: string;
    uuid?: string;
    url?: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    prompt?: string;
    duration?: number;
    results?: AudioTaskResult[];
    config?: AudioGenerationParams;
    isFavorite?: boolean;
    createdAt: number;
    updatedAt: number;
}

export interface AudioGenerationParams {
    prompt: string;
    negativePrompt?: string;
    model?: AudioModelType;
    voice?: string;
    duration?: number;
    seed?: number;
}
