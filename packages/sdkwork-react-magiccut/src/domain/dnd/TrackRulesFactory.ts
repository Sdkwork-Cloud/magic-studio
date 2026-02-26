import { ITrackRules, DropValidationResult, DropValidationStatus } from './ITrackRules';
import { DragContext, MediaResourceType } from '@sdkwork/react-commons';
import { CutTrackType } from '../../entities/magicCut.entity';

/**
 * Base Rule Class: Implements common logic for snapping and collision.
 */
export abstract class BaseTrackRules implements ITrackRules {
    abstract isCompatible(resourceType: MediaResourceType): boolean;
    abstract supportsRipple(): boolean;

    validatePlacement(
        trackId: string,
        rawTime: number,
        duration: number,
        context: DragContext,
        excludeClipIds?: Set<string>
    ): DropValidationResult {
        const { calculateSnap, checkCollision, tracks } = context;

        // 1. Check if track is locked
        const track = tracks.find(t => t.id === trackId);
        if (track && track.locked) {
            return {
                status: DropValidationStatus.LOCKED,
                snapLines: [],
                correctedTime: rawTime,
                message: "Track is locked"
            };
        }

        // 2. Calculate Snapping (Magnetic Alignment)
        const ignoreId = excludeClipIds && excludeClipIds.size === 1 ? Array.from(excludeClipIds)[0] : null;
        const { time: snappedTime, lines } = calculateSnap(rawTime, duration, ignoreId);

        // 3. Collision Detection
        const hasCollision = checkCollision(trackId, snappedTime, duration, excludeClipIds || new Set());

        if (hasCollision) {
            return {
                status: DropValidationStatus.COLLISION,
                snapLines: lines,
                correctedTime: snappedTime,
                message: "Collision detected"
            };
        }

        return {
            status: DropValidationStatus.VALID,
            snapLines: lines,
            correctedTime: snappedTime
        };
    }
}

/**
 * Video Track Rules
 * STRICTER: Removed EFFECT/TRANSITION compatibility. 
 * Effects should be dropped ONTO clips (layers) or into dedicated Effect Tracks.
 */
class VideoTrackRules extends BaseTrackRules {
    isCompatible(resourceType: MediaResourceType): boolean {
        return [
            MediaResourceType.VIDEO,
            MediaResourceType.IMAGE
        ].includes(resourceType);
    }
    
    supportsRipple(): boolean {
        return true; 
    }
}

/**
 * Audio Track Rules
 */
class AudioTrackRules extends BaseTrackRules {
    isCompatible(resourceType: MediaResourceType): boolean {
        return [
            MediaResourceType.AUDIO,
            MediaResourceType.MUSIC,
            MediaResourceType.VOICE,
            MediaResourceType.SPEECH
        ].includes(resourceType);
    }

    supportsRipple(): boolean {
        return false;
    }
}

/**
 * Text/Subtitle Track Rules
 */
class TextTrackRules extends BaseTrackRules {
    isCompatible(resourceType: MediaResourceType): boolean {
        return [
            MediaResourceType.TEXT,
            MediaResourceType.SUBTITLE
        ].includes(resourceType);
    }

    supportsRipple(): boolean {
        return false;
    }
}

/**
 * Effect Track Rules
 */
class EffectTrackRules extends BaseTrackRules {
    isCompatible(resourceType: MediaResourceType): boolean {
        return [
            MediaResourceType.EFFECT,
            MediaResourceType.TRANSITION
        ].includes(resourceType);
    }

    supportsRipple(): boolean {
        return false;
    }
}

/**
 * Registry for Track Rules
 */
class TrackRulesRegistry {
    private rules = new Map<string, ITrackRules>();

    constructor() {
        this.register('video', new VideoTrackRules());
        this.register('audio', new AudioTrackRules());
        this.register('text', new TextTrackRules());
        this.register('effect', new EffectTrackRules());
    }

    public register(type: string, rule: ITrackRules) {
        this.rules.set(type, rule);
    }

    public getRules(trackType: CutTrackType | string): ITrackRules {
        return this.rules.get(trackType) || this.rules.get('video')!;
    }
}

export const trackRulesRegistry = new TrackRulesRegistry();

export class TrackRulesFactory {
    static getRules(trackType: CutTrackType): ITrackRules {
        return trackRulesRegistry.getRules(trackType);
    }
}
