
import { LocalStorageService } from '@sdkwork/react-core';
import { Bookmark } from '../entities/browser.entity';
import { BaseEntity, generateUUID } from '@sdkwork/react-commons';

interface BookmarkEntity extends Bookmark, BaseEntity {}

const BOOKMARKS_KEY = 'magic_studio_browser_bookmarks';
const LEGACY_BOOKMARKS_KEYS = ['open_studio_browser_bookmarks'] as const;

class BrowserBookmarkService extends LocalStorageService<BookmarkEntity> {
    constructor() {
        super(BOOKMARKS_KEY, LEGACY_BOOKMARKS_KEYS);
    }

    async toggleBookmark(url: string, title: string): Promise<boolean> {
        await this.ensureInitialized();
        
        const all = await this.findAll({ page: 0, size: 1000 });
        const existing = all.data?.content.find(b => b.url === url);

        if (existing) {
            await this.deleteById(existing.id);
            return false;
        } else {
            const newBookmark: BookmarkEntity = {
                id: Date.now().toString(),
                uuid: generateUUID(),
                url,
                title,
                createdAt: Date.now(),
                updatedAt: Date.now()
            };
            await this.save(newBookmark);
            return true;
        }
    }
}

export const browserBookmarkService = new BrowserBookmarkService();
