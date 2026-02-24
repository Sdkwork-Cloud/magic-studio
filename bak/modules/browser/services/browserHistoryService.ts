import { LocalStorageService } from '../../../services/base/LocalStorageService';
import { HistoryItem } from '../entities/browser.entity';
import { BaseEntity } from '../../../types/core';
import { generateUUID } from '../../../utils';

interface HistoryEntity extends HistoryItem, BaseEntity {}

const HISTORY_KEY = 'open_studio_browser_history';

class BrowserHistoryService extends LocalStorageService<HistoryEntity> {
    constructor() {
        super(HISTORY_KEY);
    }

    async addHistoryItem(url: string, title: string): Promise<void> {
        const item: HistoryEntity = {
            id: Date.now().toString(),
            uuid: generateUUID(),
            url,
            title: title || url,
            timestamp: Date.now(),
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        
        await this.ensureInitialized();
        await this.save(item);
    }

    async clearHistory(): Promise<void> {
        await this.clear();
    }
}

export const browserHistoryService = new BrowserHistoryService();