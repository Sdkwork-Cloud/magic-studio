
import { CutTrack, CutTimeline } from '../../entities/magicCut.entity';

/**
 * Render Sort Utils
 * Handles the logic for Painter's Algorithm (stacking order).
 */
export const RenderSortUtils = {
    /**
     * Sorts tracks for rendering.
     * In the UI: Track 0 is at the TOP.
     * In Rendering: Track 0 must be drawn LAST (on top of others).
     * 
     * Logic:
     * 1. Filter out invisible/non-renderable tracks (e.g. Audio).
     * 2. Sort by Order DESCENDING (Highest index drawn first/background -> Lowest index drawn last/foreground).
     */
    getRenderOrder: (
        timeline: CutTimeline, 
        trackMap: Record<string, CutTrack>
    ): CutTrack[] => {
        const tracks = timeline.tracks
            .map(ref => trackMap[ref.id])
            .filter(t => t && t.visible !== false && t.type !== 'audio');

        // Sort descending: e.g. [Track 3, Track 2, Track 1, Track 0]
        // This ensures Track 0 is rendered last, appearing on top of other tracks.
        // This matches the UI representation where Track 0 is at the top and should appear visually on top.
        return tracks.sort((a, b) => b.order - a.order);
    }
};
