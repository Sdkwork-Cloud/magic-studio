
import { NormalizedState } from '../store/types';
import { CutClip, CutTrack, CutTrackType } from '../entities/magicCut.entity';
import { generateUUID } from '../../../utils';
import { MediaResourceType } from '../../../types';
import { TrackIntervalIndex } from '../../../utils/algorithms/IntervalIndex';

export interface DetachResult {
    updatedVideoClip: Partial<CutClip>;
    newAudioClip: CutClip;
    targetTrackId: string;
    shouldCreateNewTrack: boolean;
}

/**
 * Service for complex timeline operations that require analyzing state, 
 * collision detection, and track management logic.
 * Pure logic, no side effects.
 */
class TimelineOperationService {

    /**
     * Calculates the result of detaching audio from a video clip.
     * Finds the best available audio track below the video or suggests creating a new one.
     */
    public calculateDetachAudio(
        state: NormalizedState, 
        videoClipId: string, 
        audioResourceId: string
    ): DetachResult | null {
        const videoClip = state.clips[videoClipId];
        if (!videoClip) return null;

        const timelineId = Object.values(state.timelines).find(tl => tl.tracks.some(t => t.id === videoClip.track.id))?.id;
        if (!timelineId) return null;
        
        const timeline = state.timelines[timelineId];
        
        // 1. Prepare New Audio Clip Object
        const newAudioClip: CutClip = {
            id: generateUUID(),
            uuid: generateUUID(),
            resource: { id: audioResourceId, uuid: generateUUID(), type: 'MediaResource' },
            track: { id: '', uuid: '', type: 'CutTrack' }, // Will be set by store
            start: videoClip.start,
            duration: videoClip.duration,
            offset: videoClip.offset,
            speed: videoClip.speed,
            volume: 1.0,
            layers: [],
            createdAt: Date.now(),
            updatedAt: Date.now()
        };

        // 2. Find Target Track
        // We look for the first compatible AUDIO track BELOW the video track that has space.
        
        // Get sorted tracks
        const tracks = timeline.tracks.map(ref => state.tracks[ref.id]).filter(Boolean).sort((a, b) => a.order - b.order);
        const currentTrackIndex = tracks.findIndex(t => t.id === videoClip.track.id);
        
        let targetTrackId = '';
        let shouldCreateNewTrack = true;

        const start = videoClip.start;
        const end = videoClip.start + videoClip.duration;

        // Search below
        for (let i = currentTrackIndex + 1; i < tracks.length; i++) {
            const track = tracks[i];
            
            // We only want to place on Audio tracks
            if (track.type === 'audio') {
                // Check Collision
                // Build a temp index for this check (or use existing if exposed, but for single op linear is fast enough)
                const hasCollision = this.checkCollisionInTrack(state, track, start, end);
                
                if (!hasCollision) {
                    targetTrackId = track.id;
                    shouldCreateNewTrack = false;
                    break;
                }
            }
        }

        return {
            updatedVideoClip: { muted: true },
            newAudioClip,
            targetTrackId,
            shouldCreateNewTrack
        };
    }

    private checkCollisionInTrack(state: NormalizedState, track: CutTrack, start: number, end: number): boolean {
        const EPSILON = 0.001;
        for (const clipRef of track.clips) {
            const clip = state.clips[clipRef.id];
            if (!clip) continue;
            
            const cStart = clip.start;
            const cEnd = clip.start + clip.duration;
            
            // Check overlap: (StartA < EndB) and (EndA > StartB)
            if ((start + EPSILON) < cEnd && (end - EPSILON) > cStart) {
                return true;
            }
        }
        return false;
    }
}

export const timelineOperationService = new TimelineOperationService();