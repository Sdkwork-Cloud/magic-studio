import { PackageI18nConfig, I18nRegistry, SupportedLocale } from './packageTypes';

class PackageI18nRegistry {
    private registry: I18nRegistry = new Map();
    private listeners: Set<() => void> = new Set();

    register(config: PackageI18nConfig): void {
        if (this.registry.has(config.namespace)) {
            console.warn(`[i18n] Namespace "${config.namespace}" is already registered. Overwriting.`);
        }
        this.registry.set(config.namespace, config);
        this._notifyListeners();
    }

    unregister(namespace: string): void {
        this.registry.delete(namespace);
        this._notifyListeners();
    }

    getNamespaceConfig(namespace: string): PackageI18nConfig | undefined {
        return this.registry.get(namespace);
    }

    getAllConfigs(): PackageI18nConfig[] {
        return Array.from(this.registry.values());
    }

    getMergedResources(locale: SupportedLocale): Record<string, any> {
        const merged: Record<string, any> = {};
        
        this.registry.forEach((config, namespace) => {
            const resources = config.resources[locale] || config.resources[config.fallbackLocale || 'en-US'];
            if (resources) {
                merged[namespace] = resources;
            }
        });
        
        return merged;
    }

    subscribe(listener: () => void): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    private _notifyListeners(): void {
        this.listeners.forEach(fn => fn());
    }
}

// Singleton instance
export const packageI18nRegistry = new PackageI18nRegistry();

export function registerPackageI18n(config: PackageI18nConfig): void {
    packageI18nRegistry.register(config);
}

export function getPackageI18nConfig(namespace: string): PackageI18nConfig | undefined {
    return packageI18nRegistry.getNamespaceConfig(namespace);
}
