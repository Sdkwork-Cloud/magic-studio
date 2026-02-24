import { IAssetService } from './IAssetService';

class AssetServiceRegistry {
    private services: Map<string, IAssetService> = new Map();

    constructor() {
        // Services will be registered externally
    }

    register(service: IAssetService) {
        this.services.set(service.getCategory(), service);
    }

    get(category: string): IAssetService {
        const service = this.services.get(category);
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
        return this.services.has(category);
    }
}

export const assetServiceRegistry = new AssetServiceRegistry();