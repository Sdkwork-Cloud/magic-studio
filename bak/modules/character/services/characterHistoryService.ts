
import { LocalStorageService } from '../../../services/base/LocalStorageService';
import { CharacterTask } from '../entities/character.entity';
import { STORAGE_KEY_CHARACTER_HISTORY } from '../constants';

class CharacterHistoryService extends LocalStorageService<CharacterTask> {
    constructor() {
        super(STORAGE_KEY_CHARACTER_HISTORY);
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

export const characterHistoryService = new CharacterHistoryService();
