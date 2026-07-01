import { IAssetService } from './IAssetService';

class AssetServiceRegistry {
    private services: Map<string, IAssetService> = new Map();
    private aliases: Record<string, string> = {
        effect: 'effects',
        effects: 'effects',
        transition: 'transitions',
        transitions: 'transitions',
        voice: 'audio',
        voices: 'audio',
        speech: 'audio',
        character: 'character',
        characters: 'character'
    };

    constructor() {
        // Services will be registered externally
    }

    register(service: IAssetService) {
        const category = this.normalizeCategory(service.getCategory());
        this.services.set(category, service);
    }

    get(category: string): IAssetService {
        const normalized = this.normalizeCategory(category);
        const service = this.services.get(normalized);
        if (!service) {
            console.warn(`No service found for category: ${category}`);
            throw new Error(`No asset service registered for category: ${category}`);
        }
        return service;
    }

    getAllCategories(): string[] {
        return Array.from(this.services.keys());
    }

    has(category: string): boolean {
        return this.services.has(this.normalizeCategory(category));
    }

    private normalizeCategory(category: string): string {
        const key = (category || '').trim().toLowerCase();
        return this.aliases[key] || key;
    }
}

export const assetServiceRegistry = new AssetServiceRegistry();
