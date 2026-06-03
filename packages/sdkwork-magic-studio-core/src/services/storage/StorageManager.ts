import type { IStorageProvider, StorageProviderConfig } from './types';
import { S3Provider } from './providers/S3Provider';

class StorageManager {
    private providers = new Map<string, IStorageProvider>();
    private defaultProviderId: string | null = null;
    private initialized = false;

    constructor() {
        this.initialize();
    }

    /**
     * Initializes providers from persisted settings.
     * Note: This is a stub implementation - full implementation requires @sdkwork/magic-studio-settings
     */
    async initialize() {
        if (this.initialized) return;

        try {
            // Stub: Use empty config until settings service is available
            const storageConfigs = {};

            // Clear existing
            this.providers.clear();
            this.defaultProviderId = null;

            // Hydrate
            Object.values(storageConfigs).forEach(config => {
                const storageConfig = config as StorageProviderConfig;
                if (storageConfig && (storageConfig as any).enabled) {
                    this.registerProvider(storageConfig);
                }
            });

            this.initialized = true;
        } catch (e) {
            console.error('[StorageManager] Initialization failed', e);
        }
    }

    private registerProvider(config: StorageProviderConfig) {
        let provider: IStorageProvider | null = null;

        try {
            provider = new S3Provider(config);
        } catch (e) {
            console.error(`[StorageManager] Failed to create provider ${config.name || 'unknown'}`, e);
        }

        if (provider) {
            const configId = config.id || config.name || 'unknown';
            this.providers.set(configId, provider);
            if (config.isDefault) {
                this.defaultProviderId = configId;
            }
        }
    }

    /**
     * Re-reads settings and rebuilds providers.
     * Call this when settings change.
     */
    async reload() {
        this.initialized = false;
        await this.initialize();
    }

    /**
     * Get the active storage provider.
     * @param id Optional ID. If omitted, returns the default provider.
     */
    getProvider(id?: string): IStorageProvider | null {
        if (id) {
            return this.providers.get(id) || null;
        }
        if (this.defaultProviderId) {
            return this.providers.get(this.defaultProviderId) || null;
        }
        // Fallback: return first available if any
        if (this.providers.size > 0) {
            const first = this.providers.values().next().value as IStorageProvider | undefined;
            return first || null;
        }
        return null;
    }

    /**
     * Helper to get a ready-to-use URL for a resource.
     * Handles signing if necessary.
     */
    async getResourceUrl(storageId: string, key: string): Promise<string> {
        const provider = this.getProvider(storageId);
        if (!provider) return '';

        // Try public URL first if configured
        const publicUrl = provider.getPublicUrl(key) || '';
        if (publicUrl) return publicUrl;

        // Fallback to signed URL
        return await provider.getSignedUrl(key);
    }
}

export const storageManager = new StorageManager();
