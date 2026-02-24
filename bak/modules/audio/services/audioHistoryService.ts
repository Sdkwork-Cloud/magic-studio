
import { LocalStorageService } from '../../../services/base/LocalStorageService';
import { AudioTask } from '../entities/audio.entity';
import { STORAGE_KEY_AUDIO_HISTORY } from '../constants';

class AudioHistoryService extends LocalStorageService<AudioTask> {
    constructor() {
        super(STORAGE_KEY_AUDIO_HISTORY);
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

export const audioHistoryService = new AudioHistoryService();
