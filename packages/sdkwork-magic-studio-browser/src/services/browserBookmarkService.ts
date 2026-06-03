
import { LocalStorageService } from '@sdkwork/magic-studio-core/services';
import { Bookmark } from '../entities/browser.entity';
import { generateUUID } from '@sdkwork/magic-studio-commons/utils/helpers';
import { resolveEntityKey } from '@sdkwork/magic-studio-types/entity';

type BookmarkEntity = Bookmark & {
    createdAt: number;
    updatedAt: number;
};

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
            await this.deleteById(resolveEntityKey(existing));
            return false;
        } else {
            const bookmarkUuid = generateUUID();
            const newBookmark: BookmarkEntity = {
                id: null,
                uuid: bookmarkUuid,
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
