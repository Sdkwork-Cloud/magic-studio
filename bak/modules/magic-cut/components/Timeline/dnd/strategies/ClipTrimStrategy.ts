
import { DragInput, DragContext } from '../types';
import { CutClip } from '../../../../entities/magicCut.entity';
import { AnyMediaResource, MediaResourceType } from '../../../../../../types';

export type TrimMode = 'trim-start' | 'trim-end';

export interface TrimResult {
    time: number;
    snapLines: number[];
}

/**
 * Strategy: Trimming the start or end of a clip.
 * Handles constraints like:
 * - Minimum duration
 * - Resource bounds (cannot trim past 0 or resource duration)
 * - Timeline bounds (cannot trim before previous clip or 0)
 */
export class ClipTrimStrategy {
    constructor(
        private clip: CutClip,
        private resource: AnyMediaResource | undefined,
        private mode: TrimMode,
        private initialState: {
            startTime: number;
            duration: number;
            offset: number;
        }
    ) {}

    calculate(input: DragInput, context: DragContext): TrimResult {
        const { clientX, scrollLeft, pixelsPerSecond } = input;
        const { calculateSnap } = context;

        // 1. Calculate Mouse Time
        const absoluteX = clientX - input.containerRect.left + scrollLeft;
        const mouseTime = Math.max(0, absoluteX / pixelsPerSecond);

        // 2. Snap
        // We only care about snapping the specific edge we are moving
        const { time: snappedTime, lines } = calculateSnap(mouseTime, 0); // 0 duration for single edge snap

        let finalTime = snappedTime;
        const MIN_DURATION = 0.1;

        // 3. Apply Constraints
        if (this.mode === 'trim-start') {
            // Constraint A: Max Start (cannot cross End)
            const maxStart = this.initialState.startTime + this.initialState.duration - MIN_DURATION;
            if (finalTime > maxStart) finalTime = maxStart;

            // Constraint B: Resource Bounds (cannot trim before start of media)
            // Current Start Time = 5, Offset = 2. Means we are seeing from 2s to 2+Duration.
            // If we move Start to 4 (left), Offset becomes 1.
            // If we move Start to 2 (left), Offset becomes -1 (Invalid).
            // Formula: NewOffset = InitialOffset + (NewStart - InitialStart) * Speed
            // Constraint: NewOffset >= 0
            
            // Simplified for 1.0 speed. TODO: Factor in speed.
            const speed = this.clip.speed || 1.0;
            const delta = finalTime - this.initialState.startTime;
            const offsetDelta = delta * speed;
            const newOffset = this.initialState.offset + offsetDelta;

            if (this.isMediaLimited() && newOffset < 0) {
                 // Clamp to 0 offset
                 // 0 = InitOffset + (MaxDelta * Speed) -> MaxDelta = -InitOffset / Speed
                 const maxNegativeDelta = -this.initialState.offset / speed;
                 finalTime = this.initialState.startTime + maxNegativeDelta;
            } else {
                // For non-media (e.g. text), simply ensure time >= 0
                 if (finalTime < 0) finalTime = 0;
            }

        } else {
            // TRIM END
            // Constraint A: Min End (cannot cross Start)
            const minEnd = this.initialState.startTime + MIN_DURATION;
            if (finalTime < minEnd) finalTime = minEnd;

            // Constraint B: Resource Bounds (cannot trim past duration)
            if (this.isMediaLimited() && this.resource) {
                 const sourceDuration = ('duration' in this.resource) ? this.resource.duration : 0;
                 // NewDuration = NewEnd - Start
                 // NewEndOffset = Offset + (NewDuration * Speed)
                 // Constraint: NewEndOffset <= SourceDuration
                 
                 const speed = this.clip.speed || 1.0;
                 const newDuration = finalTime - this.initialState.startTime;
                 const requiredSourceDuration = this.initialState.offset + (newDuration * speed);
                 
                 if (requiredSourceDuration > sourceDuration) {
                     // Clamp
                     const maxDuration = (sourceDuration - this.initialState.offset) / speed;
                     finalTime = this.initialState.startTime + maxDuration;
                 }
            }
        }

        return {
            time: finalTime,
            snapLines: lines
        };
    }

    private isMediaLimited(): boolean {
        if (!this.resource) return false;
        // Images and Text are infinite loops essentially
        if (this.resource.type === MediaResourceType.IMAGE || this.resource.type === MediaResourceType.TEXT) return false;
        return true;
    }
}
