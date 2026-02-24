
;
import { AnyMediaResource } from 'sdkwork-react-commons';
import { CutTrack, CutClip, CutTrackType } from '../../../entities/magicCut.entity';

export interface DragContext {
    // State of the world
    tracks: CutTrack[];
    trackLayouts: { id: string; top: number; height: number }[];
    clipsMap: Record<string, CutClip>;
    
    // Helpers
    getResource: (id: string) => AnyMediaResource | undefined;
    validateTrackDrop: (trackId: string, resourceType: string) => boolean;
    checkCollision: (trackId: string, start: number, duration: number, exclude: Set<string>) => boolean;
    calculateSnap: (rawTime: number, duration: number, ignoreClipId?: string | null) => { time: number; lines: number[] };
}

export interface DragInput {
    clientX: number;
    clientY: number;
    containerRect: DOMRect;
    scrollLeft: number;
    scrollTop: number;
    pixelsPerSecond: number;
}

export interface PlacementResult {
    time: number;
    trackId: string | null;
    insertIndex: number | null;
    isValid: boolean;
    hasCollision: boolean;
    snapLines: number[];
    suggestedTrackType?: CutTrackType; // New: Hint for creation
}

export interface IPlacementStrategy {
    calculate(input: DragInput, context: DragContext): PlacementResult;
}

