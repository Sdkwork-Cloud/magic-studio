
import { LocalStorageService } from '@sdkwork/react-core';
import { Result, type ServiceResult } from '@sdkwork/react-commons';
import { ImageTask } from '../entities';
import { STORAGE_KEY_HISTORY } from '../constants';

const LEGACY_STORAGE_KEYS_IMAGE_HISTORY = ['open_studio_image_history_v1'] as const;

class ImageHistoryService extends LocalStorageService<ImageTask> {
    constructor() {
        super(STORAGE_KEY_HISTORY, LEGACY_STORAGE_KEYS_IMAGE_HISTORY);
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
        if (this.cache) {
            this.cache = [];
        }
        return Result.success(undefined);
    }
}

export const imageHistoryService = new ImageHistoryService();
