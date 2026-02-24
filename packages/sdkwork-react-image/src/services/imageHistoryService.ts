
import { LocalStorageService } from 'sdkwork-react-core';
import { ImageTask } from '../entities/image.entity';
import { STORAGE_KEY_HISTORY } from '../constants';

class ImageHistoryService extends LocalStorageService<ImageTask> {
    constructor() {
        super(STORAGE_KEY_HISTORY);
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

    async clear(): Promise<any> {
        if (this.cache) {
            this.cache = [];
        }
        return Promise.resolve({ success: true, data: undefined, timestamp: Date.now() });
    }
}

export const imageHistoryService = new ImageHistoryService();
