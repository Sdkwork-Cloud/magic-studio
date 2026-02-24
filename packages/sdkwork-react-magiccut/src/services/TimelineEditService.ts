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
    
    static calculateRippleTrim(
        clip: CutClip,
        trimType: 'start' | 'end',
        newTime: number,
        state: NormalizedState
    ): EditOperationResult {
        const result: EditOperationResult = { clipsToUpdate: [] };
        
        const track = state.tracks[clip.track.id];
        if (!track) return result;
        
        const trackClips = track.clips
            .map(ref => state.clips[ref.id])
            .filter(Boolean)
            .sort((a, b) => a.start - b.start);
        
        const clipIndex = trackClips.findIndex(c => c.id === clip.id);
        if (clipIndex === -1) return result;
        
        const delta = trimType === 'start' 
            ? newTime - clip.start 
            : (clip.start + clip.duration) - newTime;
        
        if (trimType === 'start') {
            const newStart = Math.max(0, newTime);
            const newDuration = clip.duration + (clip.start - newStart);
            
            result.clipsToUpdate.push({
                id: clip.id,
                updates: { start: newStart, duration: newDuration, offset: (clip.offset || 0) + (clip.start - newStart) }
            });
            
            trackClips.slice(clipIndex + 1).forEach(c => {
                result.clipsToUpdate.push({
                    id: c.id,
                    updates: { start: c.start - delta }
                });
            });
        } else {
            const newDuration = newTime - clip.start;
            
            result.clipsToUpdate.push({
                id: clip.id,
                updates: { duration: newDuration }
            });
            
            trackClips.slice(clipIndex + 1).forEach(c => {
                result.clipsToUpdate.push({
                    id: c.id,
                    updates: { start: c.start - delta }
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
        
        const track = state.tracks[clip.track.id];
        if (!track) return result;
        
        const trackClips = track.clips
            .map(ref => state.clips[ref.id])
            .filter(Boolean)
            .sort((a, b) => a.start - b.start);
        
        const clipIndex = trackClips.findIndex(c => c.id === clip.id);
        if (clipIndex === -1) return result;
        
        if (trimType === 'start') {
            const prevClip = clipIndex > 0 ? trackClips[clipIndex - 1] : null;
            
            if (prevClip) {
                const newStart = Math.max(prevClip.start + 0.1, newTime);
                const newDuration = clip.duration + (clip.start - newStart);
                const prevNewDuration = newStart - prevClip.start;
                
                result.clipsToUpdate.push({
                    id: clip.id,
                    updates: { start: newStart, duration: newDuration, offset: (clip.offset || 0) + (clip.start - newStart) }
                });
                
                result.clipsToUpdate.push({
                    id: prevClip.id,
                    updates: { duration: prevNewDuration }
                });
            }
        } else {
            const nextClip = clipIndex < trackClips.length - 1 ? trackClips[clipIndex + 1] : null;
            
            if (nextClip) {
                const newDuration = newTime - clip.start;
                const nextNewStart = newTime;
                const nextNewDuration = (nextClip.start + nextClip.duration) - newTime;
                
                result.clipsToUpdate.push({
                    id: clip.id,
                    updates: { duration: newDuration }
                });
                
                result.clipsToUpdate.push({
                    id: nextClip.id,
                    updates: { start: nextNewStart, duration: nextNewDuration, offset: (nextClip.offset || 0) + (nextClip.start - nextNewStart) }
                });
            }
        }
        
        return result;
    }
    
    static calculateSlipTrim(
        clip: CutClip,
        trimType: 'start' | 'end',
        newTime: number,
        _state: NormalizedState
    ): EditOperationResult {
        const result: EditOperationResult = { clipsToUpdate: [] };
        
        const delta = trimType === 'start' 
            ? newTime - clip.start 
            : (clip.start + clip.duration) - newTime;
        
        const newOffset = (clip.offset || 0) + delta;
        
        if (newOffset < 0) {
            return result;
        }
        
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
        
        const track = state.tracks[clip.track.id];
        if (!track) return result;
        
        const trackClips = track.clips
            .map(ref => state.clips[ref.id])
            .filter(Boolean)
            .sort((a, b) => a.start - b.start);
        
        const clipIndex = trackClips.findIndex(c => c.id === clip.id);
        if (clipIndex === -1) return result;
        
        const delta = trimType === 'start' 
            ? newTime - clip.start 
            : newTime - (clip.start + clip.duration);
        
        if (trimType === 'start') {
            const prevClip = clipIndex > 0 ? trackClips[clipIndex - 1] : null;
            
            if (prevClip) {
                const newPrevDuration = prevClip.duration + delta;
                
                if (newPrevDuration > 0.1) {
                    result.clipsToUpdate.push({
                        id: prevClip.id,
                        updates: { duration: newPrevDuration }
                    });
                    
                    result.clipsToUpdate.push({
                        id: clip.id,
                        updates: { start: newTime }
                    });
                }
            }
        } else {
            const nextClip = clipIndex < trackClips.length - 1 ? trackClips[clipIndex + 1] : null;
            
            if (nextClip) {
                const newNextStart = newTime;
                const newNextDuration = (nextClip.start + nextClip.duration) - newTime;
                
                if (newNextDuration > 0.1) {
                    result.clipsToUpdate.push({
                        id: clip.id,
                        updates: { duration: newTime - clip.start }
                    });
                    
                    result.clipsToUpdate.push({
                        id: nextClip.id,
                        updates: { start: newNextStart, duration: newNextDuration, offset: (nextClip.offset || 0) + (nextClip.start - newNextStart) }
                    });
                }
            }
        }
        
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

