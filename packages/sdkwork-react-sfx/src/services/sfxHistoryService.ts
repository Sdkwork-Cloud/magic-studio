import { LocalStorageService } from 'sdkwork-react-core';
import { SfxTask } from '../entities/sfx.entity';
import { generateUUID as _generateUUID } from 'sdkwork-react-commons'; // eslint-disable-line @typescript-eslint/no-unused-vars
import { STORAGE_KEY_SFX_HISTORY } from '../constants';

class SfxHistoryService extends LocalStorageService<SfxTask & { uuid: string }> {
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

    async clear(): Promise<any> { // eslint-disable-line @typescript-eslint/no-unused-vars
        // Clear all SFX history
        const all = await this.findAll({ page: 0, size: 1000 });
        if (all.success && all.data) {
            for (const task of all.data.content) {
                await this.deleteById(task.id);
            }
        }
        return { success: true, data: undefined, timestamp: Date.now() };
    }
}

export const sfxHistoryService = new SfxHistoryService();