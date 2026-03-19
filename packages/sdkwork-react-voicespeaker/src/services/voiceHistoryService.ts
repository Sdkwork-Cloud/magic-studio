import { LocalStorageService } from '@sdkwork/react-core';
import { VoiceTask } from '../entities';
import { ServiceResult } from '@sdkwork/react-commons';
import { STORAGE_KEY_VOICE_HISTORY } from '../constants';

const LEGACY_STORAGE_KEYS_VOICE_HISTORY = ['open_studio_voice_history_v1'] as const;

class VoiceHistoryService extends LocalStorageService<VoiceTask> {
    constructor() {
        super(STORAGE_KEY_VOICE_HISTORY, LEGACY_STORAGE_KEYS_VOICE_HISTORY);
    }

    async toggleFavorite(id: string): Promise<void> {
        const taskRes = await this.findById(id);
        if (taskRes.success && taskRes.data) {
            await this.save({ 
                id, 
                isFavorite: !taskRes.data.isFavorite 
            });
        }
    }

    async clear(): Promise<ServiceResult<void>> {
        // Clear all voice history
        const all = await this.findAll({ page: 0, size: 1000 });
        if (all.success && all.data) {
            for (const task of all.data.content) {
                await this.deleteById(task.id);
            }
        }
        return { success: true, data: undefined, timestamp: new Date().toISOString() };
    }
}

export const voiceHistoryService = new VoiceHistoryService();
