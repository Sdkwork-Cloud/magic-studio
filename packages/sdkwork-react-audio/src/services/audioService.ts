import { AudioTask, AudioGenerationParams } from '../entities';
import { genAIService } from '@sdkwork/react-core';
import { generateUUID } from '@sdkwork/react-commons';

class AudioService {
    async generateAudio(params: AudioGenerationParams): Promise<AudioTask> {
        const task: AudioTask = {
            id: generateUUID(),
            uuid: generateUUID(),
            status: 'pending',
            prompt: params.prompt,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };

        try {
            const result = await (genAIService as any).generateAudio(params.prompt);
            if (result?.url) {
                task.url = result.url;
                task.status = 'completed';
                task.duration = result.duration;
            } else {
                task.status = 'failed';
            }
        } catch (error) {
            task.status = 'failed';
        }
        
        task.updatedAt = Date.now();
        return task;
    }
}

export const audioService = new AudioService();
