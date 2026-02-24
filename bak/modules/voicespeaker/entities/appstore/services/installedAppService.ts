import { LocalStorageService } from '../../../../../services/base/LocalStorageService';
import { AppStoreItem } from '../entities/appstore.entity';
import { BaseEntity } from '../../../../../types/core';
import { generateUUID } from '../../../../../utils';

// Entity for local installation record
interface InstalledAppEntry extends BaseEntity {
    appId: string;
    version: string;
    installedAt: number;
}

const INSTALLED_APPS_KEY = 'open_studio_installed_apps_v1';

class InstalledAppService extends LocalStorageService<InstalledAppEntry> {
    constructor() {
        super(INSTALLED_APPS_KEY);
    }

    async isInstalled(appId: string): Promise<boolean> {
        await this.ensureInitialized();
        return this.cache?.some(a => a.appId === appId) || false;
    }

    async install(app: AppStoreItem): Promise<void> {
        await this.ensureInitialized();
        if (await this.isInstalled(app.id)) return;

        const entry: InstalledAppEntry = {
            id: app.id,
            uuid: generateUUID(),
            appId: app.id,
            version: app.version || '1.0.0',
            installedAt: Date.now(),
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        await this.save(entry);
    }

    async uninstall(appId: string): Promise<void> {
        await this.ensureInitialized();
        const entry = this.cache?.find(a => a.appId === appId);
        if (entry) {
            await this.delete(entry);
        }
    }
}

export const installedAppService = new InstalledAppService();