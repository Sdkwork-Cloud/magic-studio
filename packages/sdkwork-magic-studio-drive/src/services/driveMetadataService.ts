
import { LocalStorageService } from '@sdkwork/magic-studio-core/services';
import { DriveMetadata } from '../entities';
import { generateUUID } from '@sdkwork/magic-studio-commons/utils/helpers';

const META_STORAGE_KEY = 'magic_studio_drive_meta_v2';
const LEGACY_META_STORAGE_KEYS = ['open_studio_drive_meta_v2'] as const;
const DRIVE_METADATA_PREFIX = 'drive-metadata:';

const buildDriveMetadataUuid = (path: string): string => `${DRIVE_METADATA_PREFIX}${path}`;

class DriveMetadataService extends LocalStorageService<DriveMetadata> {
    constructor() {
        super(META_STORAGE_KEY, LEGACY_META_STORAGE_KEYS);
    }

    private normalizePath(path: string): string {
        return path.trim();
    }

    private normalizeMetadataEntry(entry: DriveMetadata): DriveMetadata {
        const normalizedPath = entry.path?.trim()
            || (typeof entry.id === 'string' && entry.id.trim().length > 0 ? entry.id.trim() : '')
            || (entry.uuid.startsWith(DRIVE_METADATA_PREFIX) ? entry.uuid.slice(DRIVE_METADATA_PREFIX.length) : '');

        return {
            ...entry,
            id: entry.id && entry.id !== normalizedPath ? entry.id : null,
            uuid: normalizedPath ? buildDriveMetadataUuid(normalizedPath) : entry.uuid || generateUUID(),
            path: normalizedPath,
        };
    }

    private async ensureNormalizedCache(): Promise<void> {
        await this.ensureInitialized();
        this.cache = (this.cache || []).map((entry) => this.normalizeMetadataEntry(entry));
    }

    async getMeta(path: string): Promise<DriveMetadata | undefined> {
        await this.ensureNormalizedCache();
        const normalizedPath = this.normalizePath(path);
        return this.cache?.find(m => m.path === normalizedPath);
    }

    async updateMeta(path: string, update: Partial<Omit<DriveMetadata, 'id' | 'uuid' | 'createdAt' | 'updatedAt'>>) {
        await this.ensureNormalizedCache();
        const normalizedPath = this.normalizePath(path);
        
        const existing = this.cache?.find(m => m.path === normalizedPath);
        
        if (existing) {
            const merged = this.normalizeMetadataEntry({ ...existing, ...update, path: normalizedPath });
            if (!merged.isStarred && !merged.trashedAt && !merged.accessedAt && (!merged.labels || merged.labels.length === 0)) {
                await this.deleteById(merged.uuid);
            } else {
                await this.save(merged);
            }
        } else {
             const newItem: DriveMetadata = {
                id: null,
                uuid: buildDriveMetadataUuid(normalizedPath),
                path: normalizedPath,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                ...update
            };
            await this.save(newItem);
        }
    }

    async getStarredPaths(): Promise<string[]> {
        await this.ensureNormalizedCache();
        return this.cache
            ?.filter(m => m.isStarred && !m.trashedAt)
            .map(m => m.path) || [];
    }

    async getTrashedPaths(): Promise<string[]> {
        await this.ensureNormalizedCache();
        return this.cache
            ?.filter(m => !!m.trashedAt)
            .map(m => m.path) || [];
    }

    async getRecentPaths(): Promise<string[]> {
        await this.ensureNormalizedCache();
        return this.cache
            ?.filter(m => !!m.accessedAt && !m.trashedAt)
            .sort((a, b) => (b.accessedAt || 0) - (a.accessedAt || 0))
            .slice(0, 50)
            .map(m => m.path) || [];
    }
}

export const driveMetadataService = new DriveMetadataService();
