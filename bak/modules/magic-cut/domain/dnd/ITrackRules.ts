
import { MediaResourceType } from '../../../../types';
import { DragContext } from '../../components/Timeline/dnd/types';

export enum DropValidationStatus {
    VALID = 'VALID',
    INVALID_TYPE = 'INVALID_TYPE',
    COLLISION = 'COLLISION',
    LOCKED = 'LOCKED'
}

export interface DropValidationResult {
    status: DropValidationStatus;
    snapLines: number[];
    correctedTime: number; // The time after snapping/correction
    message?: string;
}

export interface ITrackRules {
    /**
     * Determine if a specific resource type belongs on this track.
     */
    isCompatible(resourceType: MediaResourceType): boolean;

    /**
     * Calculate strict validation for a placement attempt.
     * Handles Snapping, Collision Detection, and Gap Analysis.
     */
    validatePlacement(
        trackId: string,
        rawTime: number,
        duration: number,
        context: DragContext,
        excludeClipIds?: Set<string>
    ): DropValidationResult;

    /**
     * Defines if this track supports "Ripple" insertion or only "Overwrite/Block".
     */
    supportsRipple(): boolean;
}
