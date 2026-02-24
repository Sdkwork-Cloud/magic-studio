
import { IPlacementStrategy, DragInput, DragContext, PlacementResult } from '../types';
import { TrackFactory } from '../../../../services/TrackFactory';
import { AnyMediaResource, MediaResourceType } from 'sdkwork-react-commons';
import { ResourceTraitsFactory } from '../../../../domain/dnd/ResourceTraitsFactory';
import { TrackRulesFactory } from '../../../../domain/dnd/TrackRulesFactory';
import { DropValidationStatus } from '../../../../domain/dnd/ITrackRules';
;

/**
 * Strategy: Dragging a NEW resource from the sidebar onto the timeline.
 * Implements "Minimum Distance Field" algorithm for God-tier precision.
 */
export class ResourceDropStrategy implements IPlacementStrategy {
    private duration: number;

    constructor(
        private resource: AnyMediaResource,
        overrideDuration?: number
    ) {
        const traits = ResourceTraitsFactory.getTraits(this.resource.type);
        this.duration = overrideDuration || traits.getDefaultDuration(resource);
    }

    calculate(input: DragInput, context: DragContext): PlacementResult {
        const { clientX, clientY, containerRect, scrollLeft, scrollTop, pixelsPerSecond } = input;
        
        // 1. Calculate Time
        const relativeX = clientX - containerRect.left;
        const absoluteX = relativeX + scrollLeft;
        const rawStart = Math.max(0, absoluteX / pixelsPerSecond);
        
        // 2. Vertical Logic: Minimum Distance Field
        const relativeY = clientY - containerRect.top + scrollTop;
        const layouts = context.trackLayouts;
        
        let targetTrackId: string | null = null;
        let insertIndex: number | null = null;
        let hoverTrackType = null;
        
        const isEffect = this.resource.type === MediaResourceType.EFFECT || this.resource.type === MediaResourceType.TRANSITION;
        
        // Infer the preferred type for this resource (e.g., 'effect')
        const preferredTrackType = TrackFactory.inferTrackType(this.resource.type);

        // If timeline is empty, simple case
        if (layouts.length === 0) {
            insertIndex = 0;
        } else {
            // Collect all "Gravitational Points" (Hotspots)
            // We have:
            // - Gaps (Insert New Track): Top of T0, Bottom of T0/Top of T1, ... Bottom of Tn
            // - Centers (Drop Inside): Center of T0, Center of T1...
            
            let bestDistance = Infinity;
            let bestAction: { type: 'insert' | 'drop', id?: string, index?: number } | null = null;

            // Define gravity weights
            // Usually we prefer dropping INTO a track if compatible, so we give it a slight 'magnetic' boost (lower effective distance)
            const DROP_BIAS = isEffect ? 5 : 0; 
            
            // 1. Check Gaps (Insertion Points)
            // Gap 0 (Top of first track)
            const topGapY = layouts[0].top;
            const distTop = Math.abs(relativeY - topGapY);
            if (distTop < bestDistance) {
                bestDistance = distTop;
                bestAction = { type: 'insert', index: 0 };
            }

            for (let i = 0; i < layouts.length; i++) {
                const layout = layouts[i];
                const trackBottom = layout.top + layout.height;
                const trackCenter = layout.top + (layout.height / 2);

                // Check Drop Inside (Center of track)
                // We apply a "Box Check" first to ensure we are actually visually overlapping the track
                // before calculating center distance preference.
                if (relativeY >= layout.top && relativeY <= trackBottom) {
                     const distCenter = Math.abs(relativeY - trackCenter);
                     // If we are theoretically capable of dropping here, check strict distance
                     // Apply bias to make 'drop inside' feel stickier than 'insert between' when overlapping
                     if (distCenter - DROP_BIAS < bestDistance) {
                         bestDistance = distCenter - DROP_BIAS;
                         bestAction = { type: 'drop', id: layout.id, index: i }; // Store index for fallback
                     }
                }

                // Check Gap Below (Bottom of track)
                const distBottom = Math.abs(relativeY - trackBottom);
                if (distBottom < bestDistance) {
                    bestDistance = distBottom;
                    bestAction = { type: 'insert', index: i + 1 };
                }
            }
            
            // --- Resolution Phase ---
            if (bestAction) {
                if (bestAction.type === 'drop' && bestAction.id) {
                    // We WANT to drop into this track. But is it compatible?
                    const trackObj = context.tracks.find(t => t.id === bestAction.id);
                    if (trackObj) {
                        const rules = TrackRulesFactory.getRules(trackObj.type);
                        if (rules.isCompatible(this.resource.type)) {
                            // Compatible! Lock it in.
                            targetTrackId = bestAction.id;
                            hoverTrackType = trackObj.type;
                            insertIndex = null;
                        } else {
                            // Incompatible! (e.g. Effect dragged over Video Track)
                            // Smart Fallback: Determine if we are in the top half or bottom half of this incompatible track
                            // and snap the insertion line to the nearest edge instead.
                            // We do NOT allow 'drop' here.
                            
                            const layout = layouts[bestAction.index!];
                            const trackCenter = layout.top + (layout.height / 2);
                            
                            if (relativeY < trackCenter) {
                                // Closer to top edge -> Insert above
                                insertIndex = bestAction.index!;
                            } else {
                                // Closer to bottom edge -> Insert below
                                insertIndex = bestAction.index! + 1;
                            }
                            targetTrackId = null;
                        }
                    }
                } else if (bestAction.type === 'insert') {
                    insertIndex = bestAction.index;
                    targetTrackId = null;
                }
            }
            
            // Safety: If somehow far away (e.g. way below last track), default append
            if (targetTrackId === null && insertIndex === null) {
                const last = layouts[layouts.length - 1];
                if (relativeY > last.top + last.height) {
                    insertIndex = layouts.length;
                } else {
                    insertIndex = 0;
                }
            }
        }

        // 3. Final Validation & Snapping
        let isValid = true;
        let hasCollision = false;
        let finalTime = rawStart;
        let finalSnapLines: number[] = [];
        
        if (targetTrackId && hoverTrackType) {
            // Case A: Dropping onto existing compatible track
            const rules = TrackRulesFactory.getRules(hoverTrackType);
            const validation = rules.validatePlacement(targetTrackId, rawStart, this.duration, context);
            
            finalTime = validation.correctedTime;
            finalSnapLines = validation.snapLines;

            if (validation.status === DropValidationStatus.COLLISION || validation.status === DropValidationStatus.LOCKED) {
                hasCollision = true;
            }
        } else {
            // Case B: Inserting new track (or forced insert)
            // Snap to global grid
            const { time: snapped, lines } = context.calculateSnap(rawStart, this.duration, null);
            finalTime = snapped;
            finalSnapLines = lines;
        }

        return {
            time: finalTime,
            trackId: targetTrackId,
            insertIndex: insertIndex,
            isValid,
            hasCollision,
            snapLines: finalSnapLines,
            suggestedTrackType: preferredTrackType // Pass the inferred type for track creation
        };
    }
}

