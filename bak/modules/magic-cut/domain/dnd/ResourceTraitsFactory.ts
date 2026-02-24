
import { IResourceTraits } from './IResourceTraits';
import { AnyMediaResource, MediaResourceType } from '../../../../types';
import { GhostFactory } from '../../components/Timeline/dnd/visuals/GhostFactory';
import { CutTrackType } from '../../entities/magicCut.entity';

// --- Abstract Base Trait ---
abstract class BaseResourceTraits implements IResourceTraits {
    abstract getDefaultDuration(resource: AnyMediaResource): number;
    abstract getPreferredTrackType(): CutTrackType;
    
    getGhostConfig(isValid: boolean, isInsert: boolean, trackHeight?: number) {
        return GhostFactory.getConfig(this.getResourceType(), isValid, isInsert, trackHeight);
    }

    abstract getResourceType(): MediaResourceType;

    getPreferredTrackTypes(): string[] {
        return [this.getPreferredTrackType()];
    }
}

// --- Concrete Traits ---

class VideoResourceTraits extends BaseResourceTraits {
    getResourceType() { return MediaResourceType.VIDEO; }
    getDefaultDuration(resource: AnyMediaResource): number {
        return ('duration' in resource) ? resource.duration : 5;
    }
    getPreferredTrackType(): CutTrackType { return 'video'; }
}

class AudioResourceTraits extends BaseResourceTraits {
    getResourceType() { return MediaResourceType.AUDIO; }
    getDefaultDuration(resource: AnyMediaResource): number {
        return ('duration' in resource) ? resource.duration : 10;
    }
    getPreferredTrackType(): CutTrackType { return 'audio'; }
}

class ImageResourceTraits extends BaseResourceTraits {
    getResourceType() { return MediaResourceType.IMAGE; }
    getDefaultDuration(): number {
        return 5; // Static images default to 5s
    }
    getPreferredTrackType(): CutTrackType { return 'video'; } // Images go on video tracks
}

class TextResourceTraits extends BaseResourceTraits {
    getResourceType() { return MediaResourceType.TEXT; }
    getDefaultDuration(): number {
        return 5;
    }
    getPreferredTrackType(): CutTrackType { return 'text'; }
}

class EffectResourceTraits extends BaseResourceTraits {
    getResourceType() { return MediaResourceType.EFFECT; }
    getDefaultDuration(): number {
        return 5;
    }
    getPreferredTrackType(): CutTrackType { return 'effect'; }
}

export class ResourceTraitsFactory {
    private static cache: Map<string, IResourceTraits> = new Map();

    static getTraits(resourceType: MediaResourceType): IResourceTraits {
        if (this.cache.has(resourceType)) {
            return this.cache.get(resourceType)!;
        }

        let traits: IResourceTraits;

        switch (resourceType) {
            case MediaResourceType.VIDEO:
                traits = new VideoResourceTraits();
                break;
            case MediaResourceType.AUDIO:
            case MediaResourceType.MUSIC:
            case MediaResourceType.VOICE:
            case MediaResourceType.SPEECH:
                traits = new AudioResourceTraits();
                break;
            case MediaResourceType.IMAGE:
                traits = new ImageResourceTraits();
                break;
            case MediaResourceType.TEXT:
            case MediaResourceType.SUBTITLE:
                traits = new TextResourceTraits();
                break;
            case MediaResourceType.EFFECT:
            case MediaResourceType.TRANSITION:
                traits = new EffectResourceTraits();
                break;
            default:
                traits = new VideoResourceTraits(); // Fallback
        }

        this.cache.set(resourceType, traits);
        return traits;
    }
}
