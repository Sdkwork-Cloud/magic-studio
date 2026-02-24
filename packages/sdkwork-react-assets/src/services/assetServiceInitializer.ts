import { assetServiceRegistry } from './AssetServiceRegistry';
import { 
    MediaAssetService,
    VideoAssetService,
    ImageAssetService,
    AudioAssetService,
    TextAssetService,
    EffectAssetService,
    TransitionAssetService,
    MusicAssetService,
    DigitalHumanAssetService,
    SfxAssetService
} from './impl';

/**
 * Initializes all asset services and registers them with the service registry
 * This ensures all services are available when the asset center is used
 */
export function initializeAssetServices(): void {
    // Register all asset services
    assetServiceRegistry.register(new MediaAssetService());
    assetServiceRegistry.register(new VideoAssetService());
    assetServiceRegistry.register(new ImageAssetService());
    assetServiceRegistry.register(new AudioAssetService());
    assetServiceRegistry.register(new TextAssetService());
    assetServiceRegistry.register(new EffectAssetService());
    assetServiceRegistry.register(new TransitionAssetService());
    assetServiceRegistry.register(new MusicAssetService());
    assetServiceRegistry.register(new DigitalHumanAssetService());
    assetServiceRegistry.register(new SfxAssetService());
    
    console.log('[AssetCenter] All asset services initialized and registered');
}

/**
 * Gets a service for a specific asset category
 * @param category The asset category
 * @returns The appropriate asset service
 */
export function getAssetService(category: string) {
    return assetServiceRegistry.get(category);
}

/**
 * Checks if a service exists for a given category
 * @param category The asset category
 * @returns True if service exists, false otherwise
 */
export function hasAssetService(category: string): boolean {
    return assetServiceRegistry.has(category);
}

/**
 * Gets all registered asset service categories
 * @returns Array of category strings
 */
export function getRegisteredCategories(): string[] {
    return assetServiceRegistry.getAllCategories();
}