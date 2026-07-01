import { LocalStorageService } from '@sdkwork/magic-studio-core/services';
import { HistoryItem } from '../entities/browser.entity';
import { generateUUID } from '@sdkwork/magic-studio-commons/utils/helpers';

type HistoryEntity = HistoryItem & {
    createdAt: number;
    updatedAt: number;
};

const HISTORY_KEY = 'magic_studio_browser_history';
const LEGACY_HISTORY_KEYS = ['open_studio_browser_history'] as const;

class BrowserHistoryService extends LocalStorageService<HistoryEntity> {
    constructor() {
        super(HISTORY_KEY, LEGACY_HISTORY_KEYS);
    }

    async addHistoryItem(url: string, title: string): Promise<void> {
        const historyItemUuid = generateUUID();
        const item: HistoryEntity = {
            id: null,
            uuid: historyItemUuid,
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
