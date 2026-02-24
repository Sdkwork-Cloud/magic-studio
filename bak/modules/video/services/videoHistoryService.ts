
import { LocalStorageService } from '../../../services/base/LocalStorageService';
import { VideoTask } from '../entities/video.entity';
import { STORAGE_KEY_VIDEO_HISTORY } from '../constants';

class VideoHistoryService extends LocalStorageService<VideoTask> {
    constructor() {
        super(STORAGE_KEY_VIDEO_HISTORY);
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

export const videoHistoryService = new VideoHistoryService();
