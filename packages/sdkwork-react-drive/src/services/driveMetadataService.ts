
import { LocalStorageService } from '@sdkwork/react-core';
import { DriveMetadata } from '../entities';
import { generateUUID } from '@sdkwork/react-commons';

const META_STORAGE_KEY = 'magic_studio_drive_meta_v2';
const LEGACY_META_STORAGE_KEYS = ['open_studio_drive_meta_v2'] as const;

class DriveMetadataService extends LocalStorageService<DriveMetadata> {
    constructor() {
        super(META_STORAGE_KEY, LEGACY_META_STORAGE_KEYS);
    }

    async getMeta(path: string): Promise<DriveMetadata | undefined> {
        await this.ensureInitialized();
        return this.cache?.find(m => m.id === path);
    }

    async updateMeta(path: string, update: Partial<Omit<DriveMetadata, 'id' | 'uuid' | 'createdAt' | 'updatedAt'>>) {
        await this.ensureInitialized();
        
        const existing = this.cache?.find(m => m.id === path);
        
        if (existing) {
            const merged = { ...existing, ...update };
            if (!merged.isStarred && !merged.trashedAt && !merged.accessedAt && (!merged.labels || merged.labels.length === 0)) {
                await this.deleteById(path);
            } else {
                await this.save(merged);
            }
        } else {
             const newItem: DriveMetadata = {
                id: path,
                uuid: generateUUID(),
                createdAt: Date.now(),
                updatedAt: Date.now(),
                ...update
            };
            await this.save(newItem);
        }
    }

    async getStarredPaths(): Promise<string[]> {
        await this.ensureInitialized();
        return this.cache
            ?.filter(m => m.isStarred && !m.trashedAt)
            .map(m => m.id) || [];
    }

    async getTrashedPaths(): Promise<string[]> {
        await this.ensureInitialized();
        return this.cache
            ?.filter(m => !!m.trashedAt)
            .map(m => m.id) || [];
    }

    async getRecentPaths(): Promise<string[]> {
        await this.ensureInitialized();
        return this.cache
            ?.filter(m => !!m.accessedAt && !m.trashedAt)
            .sort((a, b) => (b.accessedAt || 0) - (a.accessedAt || 0))
            .slice(0, 50)
            .map(m => m.id) || [];
    }
}

export const driveMetadataService = new DriveMetadataService();
