
import { LocalStorageService } from '../../../services/base/LocalStorageService';
import { VoiceTask } from '../entities/voice.entity';
import { STORAGE_KEY_VOICE_HISTORY } from '../constants';

class VoiceHistoryService extends LocalStorageService<VoiceTask> {
    constructor() {
        super(STORAGE_KEY_VOICE_HISTORY);
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
}

export const voiceHistoryService = new VoiceHistoryService();
