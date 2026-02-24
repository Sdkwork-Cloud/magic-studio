
import { IAssetService } from './IAssetService';
import { VideoAssetService } from './impl/VideoAssetService';
import { ImageAssetService } from './impl/ImageAssetService';
import { AudioAssetService } from './impl/AudioAssetService';
import { TextAssetService } from './impl/TextAssetService';
import { EffectAssetService } from './impl/EffectAssetService';
import { TransitionAssetService } from './impl/TransitionAssetService';
import { MediaAssetService } from './impl/MediaAssetService';
import { MusicAssetService } from './impl/MusicAssetService';

class AssetServiceRegistry {
    private services: Map<string, IAssetService> = new Map();

    constructor() {
        this.register(new MediaAssetService());
        this.register(new VideoAssetService());
        this.register(new ImageAssetService());
        this.register(new AudioAssetService());
        this.register(new MusicAssetService());
        this.register(new TextAssetService());
        this.register(new EffectAssetService());
        this.register(new TransitionAssetService());
    }

    register(service: IAssetService) {
        this.services.set(service.getCategory(), service);
    }

    get(category: string): IAssetService {
        const service = this.services.get(category);
        if (!service) {
            console.warn(`No service found for category: ${category}, falling back to media`);
            return this.services.get('media')!;
        }
        return service;
    }
}

export const assetServiceRegistry = new AssetServiceRegistry();
