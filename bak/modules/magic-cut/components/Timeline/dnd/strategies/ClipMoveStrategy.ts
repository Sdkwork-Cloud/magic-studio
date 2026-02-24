
import { IPlacementStrategy, DragInput, DragContext, PlacementResult } from '../types';
import { TrackRulesFactory } from '../../../../domain/dnd/TrackRulesFactory';
import { DropValidationStatus } from '../../../../domain/dnd/ITrackRules';

/**
 * Strategy: Moving an EXISTING clip on the timeline.
 */
export class ClipMoveStrategy implements IPlacementStrategy {
    constructor(
        private clipId: string,
        private duration: number,
        private grabOffset: number
    ) {}

    calculate(input: DragInput, context: DragContext): PlacementResult {
        const { clientX, clientY, containerRect, scrollLeft, scrollTop, pixelsPerSecond } = input;
        const { clipsMap, getResource, tracks, trackLayouts } = context;

        // 1. Resolve Clip Resource
        const clip = clipsMap[this.clipId];
        const resource = clip ? getResource(clip.resource.id) : null;
        
        if (!clip || !resource) {
            return { time: 0, trackId: null, insertIndex: null, isValid: false, hasCollision: false, snapLines: [] };
        }

        // 2. Calculate Raw Time
        const relativeX = clientX - containerRect.left;
        const absoluteX = relativeX + scrollLeft;
        const mouseTime = Math.max(0, absoluteX / pixelsPerSecond);
        const rawStart = Math.max(0, mouseTime - this.grabOffset);

        // 3. Identify Target
        const relativeY = clientY - containerRect.top + scrollTop;
        let targetTrackId: string | null = null;
        let insertIndex: number | null = null;
        let hoverTrackType = null;
        let hoverTrackIndex = -1;

        if (trackLayouts.length === 0) {
            insertIndex = 0;
        } else {
            // Check boundaries first
            const firstTrack = trackLayouts[0];
            const lastLayout = trackLayouts[trackLayouts.length - 1];
            
            // Allow inserting at very bottom if dragged significantly below
            if (relativeY > lastLayout.top + lastLayout.height + 10) {
                insertIndex = trackLayouts.length;
            } else if (relativeY < firstTrack.top - 10) {
                insertIndex = 0;
            } else {
                // Internal check
                for (let i = 0; i < trackLayouts.length; i++) {
                    const layout = trackLayouts[i];
                    const trackBottom = layout.top + layout.height;

                    // CRITICAL FIX: Dynamic Edge Zone
                    // For thin tracks (Effect: 32px), a 20px edge zone consumes the entire track.
                    // We calculate zone as max(20% of height, but capped at 20px).
                    // This guarantees at least 60% of the track height is a "Safe Zone" for moving.
                    const dynamicEdgeZone = Math.min(20, layout.height * 0.2);

                    // Check if Strictly Inside Safe Zone (Middle of track)
                    // If mouse is within the safe center strip, we LOCK onto this track.
                    if (relativeY >= layout.top + dynamicEdgeZone && relativeY <= trackBottom - dynamicEdgeZone) {
                        targetTrackId = layout.id;
                        hoverTrackIndex = i;
                        const trackObj = tracks.find(t => t.id === layout.id);
                        if (trackObj) hoverTrackType = trackObj.type;
                        break; // Found target, stop looking
                    }
                    
                    // Gap Detection (If not in safe zone, check if we are in the gap/edge)
                    // We favor "Insert After" (i+1) when near the bottom edge
                    if (relativeY > trackBottom - dynamicEdgeZone && relativeY < trackBottom + dynamicEdgeZone) {
                        insertIndex = i + 1;
                        break;
                    }
                    
                    // Note: Top edge is handled by the previous iteration's bottom check
                    // or falling through if we are "just above" top track (handled by boundary check)
                    // But to be precise for the very first track top edge:
                    if (i === 0 && relativeY <= layout.top + dynamicEdgeZone) {
                        insertIndex = 0;
                        break;
                    }
                }
                
                // Fallback: If no track hit (mouse somehow in a void), default to append
                if (targetTrackId === null && insertIndex === null) {
                    insertIndex = trackLayouts.length; 
                }
            }
        }

        // 4. Validate & Snap
        let isValid = true;
        let hasCollision = false;
        let finalTime = rawStart;
        let finalSnapLines: number[] = [];

        if (targetTrackId && hoverTrackType) {
            // Rule Check
            const rules = TrackRulesFactory.getRules(hoverTrackType);
            
            if (!rules.isCompatible(resource.type)) {
                // Incompatible track for this clip type
                // Suggest Insert New Track below instead
                targetTrackId = null;
                insertIndex = hoverTrackIndex + 1;
            } else {
                // Validate Placement (Snapping + Collision)
                // Exclude self (clipId) from checks
                const validation = rules.validatePlacement(
                    targetTrackId, 
                    rawStart, 
                    this.duration, 
                    context, 
                    new Set([this.clipId])
                );

                finalTime = validation.correctedTime;
                finalSnapLines = validation.snapLines;

                if (validation.status === DropValidationStatus.COLLISION || validation.status === DropValidationStatus.LOCKED) {
                    hasCollision = true;
                }
            }
        } else if (insertIndex !== null) {
            // Insert Mode Snapping
            const { time, lines } = context.calculateSnap(rawStart, this.duration, this.clipId);
            finalTime = time;
            finalSnapLines = lines;
        }

        // Inherit current track type if creating new track via move (preserve track type)
        const currentTrack = tracks.find(t => t.id === clip.track.id);

        return {
            time: finalTime,
            trackId: targetTrackId,
            insertIndex,
            isValid,
            hasCollision,
            snapLines: finalSnapLines,
            suggestedTrackType: currentTrack?.type
        };
    }
}
