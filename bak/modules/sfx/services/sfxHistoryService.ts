
import { LocalStorageService } from '../../../services/base/LocalStorageService';
import { SfxTask } from '../entities/sfx.entity';
import { STORAGE_KEY_SFX_HISTORY } from '../constants';

class SfxHistoryService extends LocalStorageService<SfxTask> {
    constructor() {
        super(STORAGE_KEY_SFX_HISTORY);
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

export const sfxHistoryService = new SfxHistoryService();
