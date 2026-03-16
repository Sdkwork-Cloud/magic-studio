import { CutClip } from '../entities/magicCut.entity'
import { NormalizedState } from '../store/types';

export interface TrimOperation {
    type: 'ripple' | 'roll' | 'slip' | 'slide' | 'standard';
    clipId: string;
    newStart?: number;
    newDuration?: number;
    newOffset?: number;
    affectedClips?: Array<{
        clipId: string;
        deltaStart: number;
        deltaDuration?: number;
    }>;
}

export interface EditOperationResult {
    clipsToUpdate: Array<{
        id: string;
        updates: Partial<CutClip>;
    }>;
    clipsToDelete?: string[];
}

export class TimelineEditService {
    private static readonly MIN_CLIP_DURATION = 0.1;

    private static getSpeed(clip: CutClip): number {
        return Math.max(clip.speed || 1, 0.01);
    }

    private static getTrackClips(clip: CutClip, state: NormalizedState): CutClip[] {
        const track = state.tracks[clip.track.id];
        if (!track) return [];

        return track.clips
            .map(ref => state.clips[ref.id])
            .filter(Boolean)
            .sort((a, b) => a.start - b.start);
    }

    private static getSourceDuration(clip: CutClip, state: NormalizedState): number | null {
        const resource = state.resources[clip.resource.id] as { duration?: number; metadata?: { duration?: number } } | undefined;
        const duration = resource?.duration ?? resource?.metadata?.duration;
        return typeof duration === 'number' && Number.isFinite(duration) ? duration : null;
    }

    private static getClipEnd(clip: CutClip): number {
        return clip.start + clip.duration;
    }

    private static getOffset(clip: CutClip): number {
        return clip.offset || 0;
    }

    private static clamp(value: number, min: number, max: number): number {
        return Math.min(max, Math.max(min, value));
    }

    private static getTrimStartDelta(
        clip: CutClip,
        desiredDelta: number,
        state: NormalizedState
    ): number {
        const maxForward = clip.duration - this.MIN_CLIP_DURATION;
        const maxBackward = this.getOffset(clip) / this.getSpeed(clip);
        return this.clamp(desiredDelta, -maxBackward, maxForward);
    }

    private static getTrimEndDelta(
        clip: CutClip,
        desiredDelta: number,
        state: NormalizedState
    ): number {
        const maxBackward = clip.duration - this.MIN_CLIP_DURATION;
        const speed = this.getSpeed(clip);
        const sourceDuration = this.getSourceDuration(clip, state);
        const usedSourceDuration = this.getOffset(clip) + (clip.duration * speed);
        const remainingTail = sourceDuration === null
            ? Number.POSITIVE_INFINITY
            : Math.max(0, sourceDuration - usedSourceDuration) / speed;

        return this.clamp(desiredDelta, -maxBackward, remainingTail);
    }

    private static getRippleStartUpdates(
        clip: CutClip,
        delta: number
    ): Partial<CutClip> {
        const speed = this.getSpeed(clip);
        return {
            start: clip.start,
            duration: clip.duration - delta,
            offset: this.getOffset(clip) + (delta * speed)
        };
    }
    
    static calculateRippleTrim(
        clip: CutClip,
        trimType: 'start' | 'end',
        newTime: number,
        state: NormalizedState
    ): EditOperationResult {
        const result: EditOperationResult = { clipsToUpdate: [] };
        const trackClips = this.getTrackClips(clip, state);
        if (trackClips.length === 0) return result;
        
        const clipIndex = trackClips.findIndex(c => c.id === clip.id);
        if (clipIndex === -1) return result;

        if (trimType === 'start') {
            const delta = this.getTrimStartDelta(clip, newTime - clip.start, state);
            result.clipsToUpdate.push({
                id: clip.id,
                updates: this.getRippleStartUpdates(clip, delta)
            });
            
            trackClips.slice(clipIndex + 1).forEach(c => {
                result.clipsToUpdate.push({
                    id: c.id,
                    updates: { start: c.start - delta }
                });
            });
        } else {
            const delta = this.getTrimEndDelta(clip, newTime - this.getClipEnd(clip), state);
            result.clipsToUpdate.push({
                id: clip.id,
                updates: { duration: clip.duration + delta }
            });
            
            trackClips.slice(clipIndex + 1).forEach(c => {
                result.clipsToUpdate.push({
                    id: c.id,
                    updates: { start: c.start + delta }
                });
            });
        }
        
        return result;
    }
    
    static calculateRollTrim(
        clip: CutClip,
        trimType: 'start' | 'end',
        newTime: number,
        state: NormalizedState
    ): EditOperationResult {
        const result: EditOperationResult = { clipsToUpdate: [] };
        const trackClips = this.getTrackClips(clip, state);
        if (trackClips.length === 0) return result;
        
        const clipIndex = trackClips.findIndex(c => c.id === clip.id);
        if (clipIndex === -1) return result;
        
        if (trimType === 'start') {
            const prevClip = clipIndex > 0 ? trackClips[clipIndex - 1] : null;
            
            if (prevClip) {
                const desiredDelta = newTime - clip.start;
                const minDelta = Math.max(
                    this.MIN_CLIP_DURATION - prevClip.duration,
                    -(this.getOffset(clip) / this.getSpeed(clip))
                );
                const maxDelta = clip.duration - this.MIN_CLIP_DURATION;
                const delta = this.clamp(desiredDelta, minDelta, maxDelta);
                
                result.clipsToUpdate.push({
                    id: clip.id,
                    updates: {
                        start: clip.start + delta,
                        duration: clip.duration - delta,
                        offset: this.getOffset(clip) + (delta * this.getSpeed(clip))
                    }
                });
                
                result.clipsToUpdate.push({
                    id: prevClip.id,
                    updates: { duration: prevClip.duration + delta }
                });
            }
        } else {
            const nextClip = clipIndex < trackClips.length - 1 ? trackClips[clipIndex + 1] : null;
            
            if (nextClip) {
                const desiredDelta = newTime - this.getClipEnd(clip);
                const currentTailDelta = this.getTrimEndDelta(clip, desiredDelta, state);
                const minDelta = Math.max(
                    this.MIN_CLIP_DURATION - clip.duration,
                    -(this.getOffset(nextClip) / this.getSpeed(nextClip))
                );
                const maxDelta = nextClip.duration - this.MIN_CLIP_DURATION;
                const delta = this.clamp(currentTailDelta, minDelta, maxDelta);
                
                result.clipsToUpdate.push({
                    id: clip.id,
                    updates: { duration: clip.duration + delta }
                });
                
                result.clipsToUpdate.push({
                    id: nextClip.id,
                    updates: {
                        start: nextClip.start + delta,
                        duration: nextClip.duration - delta,
                        offset: this.getOffset(nextClip) + (delta * this.getSpeed(nextClip))
                    }
                });
            }
        }
        
        return result;
    }
    
    static calculateSlipTrim(
        clip: CutClip,
        trimType: 'start' | 'end',
        newTime: number,
        state: NormalizedState
    ): EditOperationResult {
        const result: EditOperationResult = { clipsToUpdate: [] };
        const desiredDelta = trimType === 'start'
            ? newTime - clip.start
            : newTime - this.getClipEnd(clip);
        const speed = this.getSpeed(clip);
        const sourceDuration = this.getSourceDuration(clip, state);
        const maxOffset = sourceDuration === null
            ? Number.POSITIVE_INFINITY
            : Math.max(0, sourceDuration - (clip.duration * speed));
        const currentOffset = this.getOffset(clip);
        const minDelta = Number.isFinite(maxOffset)
            ? (currentOffset - maxOffset) / speed
            : Number.NEGATIVE_INFINITY;
        const maxDelta = currentOffset / speed;
        const delta = this.clamp(desiredDelta, minDelta, maxDelta);
        const newOffset = currentOffset - (delta * speed);
        
        result.clipsToUpdate.push({
            id: clip.id,
            updates: { offset: newOffset }
        });
        
        return result;
    }
    
    static calculateSlideTrim(
        clip: CutClip,
        trimType: 'start' | 'end',
        newTime: number,
        state: NormalizedState
    ): EditOperationResult {
        const result: EditOperationResult = { clipsToUpdate: [] };
        const trackClips = this.getTrackClips(clip, state);
        if (trackClips.length === 0) return result;
        
        const clipIndex = trackClips.findIndex(c => c.id === clip.id);
        if (clipIndex === -1) return result;
        const prevClip = clipIndex > 0 ? trackClips[clipIndex - 1] : null;
        const nextClip = clipIndex < trackClips.length - 1 ? trackClips[clipIndex + 1] : null;
        if (!prevClip || !nextClip) return result;

        const desiredDelta = trimType === 'start'
            ? newTime - clip.start
            : newTime - this.getClipEnd(clip);
        const minDelta = this.MIN_CLIP_DURATION - prevClip.duration;
        const maxDelta = nextClip.duration - this.MIN_CLIP_DURATION;
        const delta = this.clamp(desiredDelta, minDelta, maxDelta);

        result.clipsToUpdate.push({
            id: prevClip.id,
            updates: { duration: prevClip.duration + delta }
        });

        result.clipsToUpdate.push({
            id: clip.id,
            updates: { start: clip.start + delta, duration: clip.duration }
        });

        result.clipsToUpdate.push({
            id: nextClip.id,
            updates: { start: nextClip.start + delta, duration: nextClip.duration - delta }
        });
        
        return result;
    }
    
    static calculateRippleDelete(
        clip: CutClip,
        state: NormalizedState
    ): EditOperationResult {
        const result: EditOperationResult = { clipsToUpdate: [], clipsToDelete: [clip.id] };
        
        const track = state.tracks[clip.track.id];
        if (!track) return result;
        
        const trackClips = track.clips
            .map(ref => state.clips[ref.id])
            .filter(Boolean)
            .sort((a, b) => a.start - b.start);
        
        const clipIndex = trackClips.findIndex(c => c.id === clip.id);
        if (clipIndex === -1) return result;
        
        trackClips.slice(clipIndex + 1).forEach(c => {
            result.clipsToUpdate.push({
                id: c.id,
                updates: { start: c.start - clip.duration }
            });
        });
        
        return result;
    }
    
    static calculateInsert(
        clip: CutClip,
        insertTime: number,
        state: NormalizedState
    ): EditOperationResult {
        const result: EditOperationResult = { clipsToUpdate: [] };
        
        const track = state.tracks[clip.track.id];
        if (!track) return result;
        
        const trackClips = track.clips
            .map(ref => state.clips[ref.id])
            .filter(Boolean)
            .sort((a, b) => a.start - b.start);
        
        trackClips.forEach(c => {
            if (c.start >= insertTime) {
                result.clipsToUpdate.push({
                    id: c.id,
                    updates: { start: c.start + clip.duration }
                });
            }
        });
        
        return result;
    }
    
    static findClipAtTime(
        trackId: string,
        time: number,
        state: NormalizedState
    ): CutClip | null {
        const track = state.tracks[trackId];
        if (!track) return null;
        
        for (const ref of track.clips) {
            const clip = state.clips[ref.id];
            if (!clip) continue;
            
            const clipEnd = clip.start + clip.duration;
            if (time >= clip.start && time < clipEnd) {
                return clip;
            }
        }
        
        return null;
    }
    
    static findClipsInTimeRange(
        trackId: string,
        startTime: number,
        endTime: number,
        state: NormalizedState
    ): CutClip[] {
        const track = state.tracks[trackId];
        if (!track) return [];
        
        const results: CutClip[] = [];
        
        for (const ref of track.clips) {
            const clip = state.clips[ref.id];
            if (!clip) continue;
            
            const clipEnd = clip.start + clip.duration;
            if (clip.start < endTime && clipEnd > startTime) {
                results.push(clip);
            }
        }
        
        return results;
    }
    
    static getTrimTypeFromPosition(
        clip: CutClip,
        time: number,
        threshold: number = 0.1
    ): 'start' | 'end' | null {
        if (Math.abs(time - clip.start) < threshold) {
            return 'start';
        }
        
        const clipEnd = clip.start + clip.duration;
        if (Math.abs(time - clipEnd) < threshold) {
            return 'end';
        }
        
        return null;
    }
}

