
import { CutClip } from '../../../../entities/magicCut.entity'
import { useCallback, useRef } from 'react';
import { useMagicCutStore } from '../../../../store/magicCutStore';
import { SnapIndex } from '../../../../domain/dnd/SnapIndex';
;

interface UseSnapPointsOptions {
    pixelsPerSecond: number;
    isSnappingEnabled: boolean;
}

interface SnapResult {
    time: number;
    lines: number[];
    isSnapping: boolean;
}

// Snapping "Gravity" Radius in pixels
const SNAP_THRESHOLD_PX = 16; 

export const useSnapPoints = ({
    pixelsPerSecond,
    isSnappingEnabled
}: UseSnapPointsOptions) => {
    const { store, activeTimeline } = useMagicCutStore();
    const snapIndexRef = useRef<SnapIndex | null>(null);

    // Correct Implementation:
    // We need to access the full state from the context to build the index.
    const { state } = useMagicCutStore();
    const stateRef = useRef(state);
    stateRef.current = state;

    /**
     * Builds the SnapIndex. Called when drag starts.
     * Gathers all relevant time points (Clip Start, Clip End, Markers, Playhead, 0).
     */
    const buildIndex = useCallback((ignoreClipId?: string | null) => {
        const points: number[] = [0]; // Always snap to 0
        
        // 1. Clips
        if (activeTimeline && activeTimeline.tracks) {
            activeTimeline.tracks.forEach(trackRef => {
                const track = stateRef.current.tracks[trackRef.id];
                if (!track || !track.visible) return;
                
                track.clips.forEach(clipRef => {
                    if (clipRef.id === ignoreClipId) return;
                    const clip = stateRef.current.clips[clipRef.id];
                    if (clip) {
                        points.push(clip.start);
                        points.push(clip.start + clip.duration);
                    }
                });
            });

            // 2. Markers
            if (activeTimeline.markers) {
                activeTimeline.markers.forEach(m => points.push(m.time));
            }
        }

        snapIndexRef.current = new SnapIndex(points);
    }, [activeTimeline]);

    const calculateSnap = useCallback((
        rawTime: number, 
        clipDuration: number, 
        ignoreClipId?: string | null
    ): SnapResult => {
        if (!isSnappingEnabled) return { time: rawTime, lines: [], isSnapping: false };
        if (!snapIndexRef.current) return { time: rawTime, lines: [], isSnapping: false };

        const threshold = SNAP_THRESHOLD_PX / pixelsPerSecond;
        const playheadTime = store.getState().currentTime;
        
        // Candidates from Index
        // 1. Start snaps to something
        const snapStart = snapIndexRef.current.getNearest(rawTime, threshold);
        
        // 2. End snaps to something
        const rawEndTime = rawTime + clipDuration;
        const snapEnd = snapIndexRef.current.getNearest(rawEndTime, threshold);
        
        // 3. Playhead Snap (Special dynamic case)
        let snapPlayheadStart: number | null = null;
        if (Math.abs(rawTime - playheadTime) < threshold) snapPlayheadStart = playheadTime;
        
        let snapPlayheadEnd: number | null = null;
        if (Math.abs(rawEndTime - playheadTime) < threshold) snapPlayheadEnd = playheadTime;

        // Determine Best
        // Deltas
        const d1 = snapStart !== null ? Math.abs(snapStart - rawTime) : Infinity;
        const d2 = snapEnd !== null ? Math.abs(snapEnd - rawEndTime) : Infinity;
        const d3 = snapPlayheadStart !== null ? Math.abs(snapPlayheadStart - rawTime) : Infinity;
        const d4 = snapPlayheadEnd !== null ? Math.abs(snapPlayheadEnd - rawEndTime) : Infinity;

        const minDelta = Math.min(d1, d2, d3, d4);

        if (minDelta === Infinity) {
            return { time: rawTime, lines: [], isSnapping: false };
        }

        let finalTime = rawTime;
        const lines: number[] = [];

        // Priority logic for multiple snaps
        if (d3 === minDelta && snapPlayheadStart !== null) {
            finalTime = snapPlayheadStart;
            lines.push(snapPlayheadStart);
        } else if (d4 === minDelta && snapPlayheadEnd !== null) {
            finalTime = snapPlayheadEnd - clipDuration;
            lines.push(snapPlayheadEnd);
        } else if (d1 === minDelta && snapStart !== null) {
            finalTime = snapStart;
            lines.push(snapStart);
        } else if (d2 === minDelta && snapEnd !== null) {
            finalTime = snapEnd - clipDuration;
            lines.push(snapEnd);
        }

        return {
            time: Math.max(0, finalTime),
            lines,
            isSnapping: true
        };

    }, [pixelsPerSecond, isSnappingEnabled, store]);

    return { 
        calculateSnap, 
        prepareSnapPoints: buildIndex
    };
};

export default useSnapPoints;

