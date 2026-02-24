
import { LocalStorageService } from '../../../services/base/LocalStorageService';
import { ImageTask } from '../entities/image.entity';
import { STORAGE_KEY_HISTORY } from '../constants';

class ImageHistoryService extends LocalStorageService<ImageTask> {
    constructor() {
        super(STORAGE_KEY_HISTORY);
    }

    /**
     * Domain specific method: Toggle Favorite
     */
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

export const imageHistoryService = new ImageHistoryService();
