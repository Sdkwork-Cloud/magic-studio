import type { AssetBusinessDomain } from '@sdkwork/react-types';
import type { AssetOrigin, AssetType } from '../entities';

const FILTER_STORAGE_PREFIX = 'sdkwork.asset-center.filters.v1';
const SIDEBAR_SECTION_STORAGE_PREFIX = 'sdkwork.asset-center.sidebar.sections.v1';

export interface PersistedAssetFilters {
    type?: AssetType | 'all';
    origin?: AssetOrigin | 'all';
}

class AssetUiStateService {
    readStorageValue(key: string): string | null {
        if (typeof window === 'undefined') {
            return null;
        }
        try {
            return window.localStorage.getItem(key);
        } catch (error) {
            console.warn(`[AssetUiStateService] Failed to read localStorage key "${key}"`, error);
            return null;
        }
    }

    writeStorageValue(key: string, value: string): void {
        if (typeof window === 'undefined') {
            return;
        }
        try {
            window.localStorage.setItem(key, value);
        } catch (error) {
            console.warn(`[AssetUiStateService] Failed to persist localStorage key "${key}"`, error);
        }
    }

    removeStorageValue(key: string): void {
        if (typeof window === 'undefined') {
            return;
        }
        try {
            window.localStorage.removeItem(key);
        } catch (error) {
            console.warn(`[AssetUiStateService] Failed to remove localStorage key "${key}"`, error);
        }
    }

    private readJson<T>(key: string): T | null {
        const raw = this.readStorageValue(key);
        if (!raw) {
            return null;
        }
        try {
            return JSON.parse(raw) as T;
        } catch (error) {
            console.warn(`[AssetUiStateService] Failed to parse localStorage key "${key}"`, error);
            return null;
        }
    }

    private writeJson<T>(key: string, value: T): void {
        this.writeStorageValue(key, JSON.stringify(value));
    }

    readFilters(domain: AssetBusinessDomain): PersistedAssetFilters | null {
        return this.readJson<PersistedAssetFilters>(`${FILTER_STORAGE_PREFIX}:${domain}`);
    }

    writeFilters(domain: AssetBusinessDomain, filters: PersistedAssetFilters): void {
        this.writeJson(`${FILTER_STORAGE_PREFIX}:${domain}`, filters);
    }

    readSidebarSections(domain: string): unknown {
        return this.readJson<unknown>(`${SIDEBAR_SECTION_STORAGE_PREFIX}:${domain}`);
    }

    writeSidebarSections(domain: string, state: unknown): void {
        this.writeJson(`${SIDEBAR_SECTION_STORAGE_PREFIX}:${domain}`, state);
    }
}

export const assetUiStateService = new AssetUiStateService();
