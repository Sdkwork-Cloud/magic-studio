
import { LocalStorageService } from '../../../services/base/LocalStorageService';
import { DriveMetadata } from '../entities/driveMetadata.entity';
import { generateUUID } from '../../../utils';

const META_STORAGE_KEY = 'open_studio_drive_meta_v2';

class DriveMetadataService extends LocalStorageService<DriveMetadata> {
    constructor() {
        super(META_STORAGE_KEY);
    }

    // --- Override/Extend Methods ---

    async getMeta(path: string): Promise<DriveMetadata | undefined> {
        await this.ensureInitialized();
        return this.cache?.find(m => m.id === path);
    }

    async updateMeta(path: string, update: Partial<Omit<DriveMetadata, 'id' | 'uuid' | 'createdAt' | 'updatedAt'>>) {
        await this.ensureInitialized();
        
        const existing = this.cache?.find(m => m.id === path);
        
        if (existing) {
            // Clean up if all flags are false/null to save space
            const merged = { ...existing, ...update };
            if (!merged.isStarred && !merged.trashedAt && !merged.accessedAt && (!merged.labels || merged.labels.length === 0)) {
                await this.deleteById(path);
            } else {
                await this.save(merged);
            }
        } else {
            // Create new
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

    // --- Optimized Queries using protected cache ---

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
