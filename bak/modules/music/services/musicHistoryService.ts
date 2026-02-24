
import { LocalStorageService } from '../../../services/base/LocalStorageService';
import { MusicTask } from '../entities/music.entity';
import { STORAGE_KEY_MUSIC_HISTORY } from '../constants';

class MusicHistoryService extends LocalStorageService<MusicTask> {
    constructor() {
        super(STORAGE_KEY_MUSIC_HISTORY);
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

export const musicHistoryService = new MusicHistoryService();
