import { LocalStorageService } from '@sdkwork/react-core';
import { HistoryItem } from '../entities/browser.entity';
import { BaseEntity, generateUUID } from '@sdkwork/react-commons';

interface HistoryEntity extends HistoryItem, BaseEntity {}

const HISTORY_KEY = 'magic_studio_browser_history';
const LEGACY_HISTORY_KEYS = ['open_studio_browser_history'] as const;

class BrowserHistoryService extends LocalStorageService<HistoryEntity> {
    constructor() {
        super(HISTORY_KEY, LEGACY_HISTORY_KEYS);
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
