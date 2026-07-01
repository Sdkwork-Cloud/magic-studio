import { NormalizedState } from '../store/types';
import { CutClip, CutTrack } from '../entities/magicCut.entity';
import { generateUUID } from '@sdkwork/magic-studio-commons/utils/helpers';
import {
  entityKeysEqual,
  resolveEntityKey,
} from '@sdkwork/magic-studio-types/entity';
import {
  findMagicCutEntityByKey,
  resolveMagicCutRecordKey,
} from '@sdkwork/magic-studio-types/magiccut';
import type { AnyMediaResource } from '@sdkwork/magic-studio-types/media';
import { buildMagicCutAssetRef } from '../domain/assets/magicCutAssetState';

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
        audioResource: AnyMediaResource
    ): DetachResult | null {
        const videoClipRecordKey = resolveMagicCutRecordKey(state.clips, videoClipId);
        if (!videoClipRecordKey) return null;

        const videoClip = findMagicCutEntityByKey(state.clips, videoClipRecordKey);
        if (!videoClip) return null;

        const timelineEntry = Object.entries(state.timelines).find(([, timeline]) =>
            timeline.tracks.some((trackRef) => entityKeysEqual(trackRef, videoClip.track))
        );
        if (!timelineEntry) return null;

        const [, timeline] = timelineEntry;
        const linkGroupId = generateUUID();
        const audioClipKey = generateUUID();
        
        // 1. Prepare New Audio Clip Object
        const newAudioClip: CutClip = {
            id: null,
            uuid: audioClipKey,
            type: 'CutClip',
            resource: buildMagicCutAssetRef(audioResource),
            track: { id: '', uuid: '', type: 'CutTrack' },
            start: videoClip.start,
            duration: videoClip.duration,
            offset: videoClip.offset,
            speed: videoClip.speed,
            volume: 1.0,
            layers: [],
            linkedClipId: resolveEntityKey(videoClip),
            linkGroupId,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };

        // 2. Find Target Track
        // We look for the first compatible AUDIO track BELOW the video track that has space.
        
        // Get sorted tracks
        const tracks = timeline.tracks
            .map((ref) => {
                const recordKey = resolveMagicCutRecordKey(state.tracks, ref);
                return recordKey ? { recordKey, track: state.tracks[recordKey] } : null;
            })
            .filter((entry): entry is { recordKey: string; track: CutTrack } => Boolean(entry))
            .sort((left, right) => left.track.order - right.track.order);
        const currentTrackIndex = tracks.findIndex(({ track }) => entityKeysEqual(track, videoClip.track));
        
        let targetTrackId = '';
        let shouldCreateNewTrack = true;

        const start = videoClip.start;
        const end = videoClip.start + videoClip.duration;

        // Search below
        for (let i = currentTrackIndex + 1; i < tracks.length; i++) {
            const { recordKey, track } = tracks[i];
            
            // We only want to place on Audio tracks
            if (track.trackType === 'audio') {
                // Check Collision
                // Build a temp index for this check (or use existing if exposed, but for single op linear is fast enough)
                const hasCollision = this.checkCollisionInTrack(state, track, start, end);
                
                if (!hasCollision) {
                    targetTrackId = recordKey;
                    shouldCreateNewTrack = false;
                    break;
                }
            }
        }

        return {
            updatedVideoClip: {
                muted: true,
                linkedClipId: resolveEntityKey(newAudioClip),
                linkGroupId
            },
            newAudioClip,
            targetTrackId,
            shouldCreateNewTrack
        };
    }

    private checkCollisionInTrack(state: NormalizedState, track: CutTrack, start: number, end: number): boolean {
        const EPSILON = 0.001;
        for (const clipRef of track.clips) {
            const clipRecordKey = resolveMagicCutRecordKey(state.clips, clipRef);
            const clip = clipRecordKey ? state.clips[clipRecordKey] : null;
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
