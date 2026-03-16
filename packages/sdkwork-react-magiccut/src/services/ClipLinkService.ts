
;
import { NormalizedState } from '../store/types';
import { CutClip } from '../entities/magicCut.entity';
import { generateUUID } from '@sdkwork/react-commons';
import {
    resolveLinkedClipMovePlan,
    type LinkedMovePlan,
    type ResolveLinkedMovePlanOptions
} from '../domain/timeline/linkedMove';

export interface ClipLinkGroup {
    id: string;
    clipIds: Set<string>;
    linkType: 'video-audio' | 'multi';
    locked: boolean;
}

export class ClipLinkService {
    
    static linkClips(
        clipIds: string[],
        state: NormalizedState
    ): Array<{ clipId: string; updates: Partial<CutClip> }> {
        if (clipIds.length < 2) return [];
        
        const linkGroupId = generateUUID();
        const updates: Array<{ clipId: string; updates: Partial<CutClip> }> = [];
        
        const validClips = clipIds
            .map(id => state.clips[id])
            .filter(Boolean);
        
        if (validClips.length < 2) return [];
        
        validClips.forEach((clip, index) => {
            if (index === 0) return;
            
            updates.push({
                clipId: clip.id,
                updates: {
                    linkedClipId: validClips[0].id,
                    linkGroupId
                }
            });
        });
        
        updates.push({
            clipId: validClips[0].id,
            updates: {
                linkedClipId: validClips[1]?.id,
                linkGroupId
            }
        });
        
        return updates;
    }
    
    static unlinkClip(
        clipId: string,
        state: NormalizedState
    ): Array<{ clipId: string; updates: Partial<CutClip> }> {
        const clip = state.clips[clipId];
        if (!clip || !clip.linkGroupId) return [];
        
        const updates: Array<{ clipId: string; updates: Partial<CutClip> }> = [];
        
        Object.values(state.clips).forEach(c => {
            if (c.linkGroupId === clip.linkGroupId) {
                updates.push({
                    clipId: c.id,
                    updates: {
                        linkedClipId: undefined,
                        linkGroupId: undefined
                    }
                });
            }
        });
        
        return updates;
    }
    
    static getLinkedClips(
        clipId: string,
        state: NormalizedState
    ): CutClip[] {
        const clip = state.clips[clipId];
        if (!clip) return [];
        
        const linkedClips: CutClip[] = [];
        
        if (clip.linkGroupId) {
            Object.values(state.clips).forEach(c => {
                if (c.linkGroupId === clip.linkGroupId && c.id !== clipId) {
                    linkedClips.push(c);
                }
            });
        }
        
        if (clip.linkedClipId) {
            const linked = state.clips[clip.linkedClipId];
            if (linked && !linkedClips.find(c => c.id === linked.id)) {
                linkedClips.push(linked);
            }
        }
        
        return linkedClips;
    }
    
    static getClipMovementGroup(
        clipId: string,
        state: NormalizedState,
        linkedSelectionEnabled: boolean = true
    ): string[] {
        if (!linkedSelectionEnabled) return [clipId];
        
        const clip = state.clips[clipId];
        if (!clip) return [clipId];
        
        const groupIds = new Set<string>([clipId]);
        
        if (clip.linkGroupId) {
            Object.values(state.clips).forEach(c => {
                if (c.linkGroupId === clip.linkGroupId) {
                    groupIds.add(c.id);
                }
            });
        }
        
        if (clip.linkedClipId) {
            groupIds.add(clip.linkedClipId);
            
            const linked = state.clips[clip.linkedClipId];
            if (linked?.linkedClipId) {
                groupIds.add(linked.linkedClipId);
            }
        }
        
        return Array.from(groupIds);
    }
    
    static calculateLinkedMovement(
        clipId: string,
        deltaTime: number,
        state: NormalizedState,
        linkedSelectionEnabled: boolean = true
    ): Array<{ clipId: string; newStart: number }> {
        const movementGroup = this.getClipMovementGroup(clipId, state, linkedSelectionEnabled);
        
        return movementGroup.map(id => {
            const clip = state.clips[id];
            return {
                clipId: id,
                newStart: Math.max(0, clip.start + deltaTime)
            };
        });
    }

    static resolveLinkedMovePlan(
        options: ResolveLinkedMovePlanOptions
    ): LinkedMovePlan {
        return resolveLinkedClipMovePlan(options);
    }
    
    static calculateLinkedTrim(
        clipId: string,
        trimType: 'start' | 'end',
        newTime: number,
        state: NormalizedState,
        linkedSelectionEnabled: boolean = true
    ): Array<{ clipId: string; updates: Partial<CutClip> }> {
        const clip = state.clips[clipId];
        if (!clip) return [];
        
        const results: Array<{ clipId: string; updates: Partial<CutClip> }> = [];
        
        const delta = trimType === 'start' 
            ? newTime - clip.start 
            : newTime - (clip.start + clip.duration);
        
        if (trimType === 'start') {
            results.push({
                clipId: clip.id,
                updates: {
                    start: newTime,
                    duration: clip.duration - delta,
                    offset: (clip.offset || 0) + delta
                }
            });
        } else {
            results.push({
                clipId: clip.id,
                updates: {
                    duration: newTime - clip.start
                }
            });
        }
        
        if (!linkedSelectionEnabled) return results;
        
        const linkedClips = this.getLinkedClips(clipId, state);
        
        linkedClips.forEach(linkedClip => {
            if (trimType === 'start') {
                results.push({
                    clipId: linkedClip.id,
                    updates: {
                        start: linkedClip.start + delta
                    }
                });
            }
        });
        
        return results;
    }
    
    static areClipsLinked(
        clipId1: string,
        clipId2: string,
        state: NormalizedState
    ): boolean {
        const clip1 = state.clips[clipId1];
        const clip2 = state.clips[clipId2];
        
        if (!clip1 || !clip2) return false;
        
        if (clip1.linkGroupId && clip1.linkGroupId === clip2.linkGroupId) {
            return true;
        }
        
        if (clip1.linkedClipId === clipId2 || clip2.linkedClipId === clipId1) {
            return true;
        }
        
        return false;
    }
    
    static syncLinkedClipPositions(
        state: NormalizedState
    ): Array<{ clipId: string; updates: Partial<CutClip> }> {
        const updates: Array<{ clipId: string; updates: Partial<CutClip> }> = [];
        const processed = new Set<string>();
        
        Object.values(state.clips).forEach(clip => {
            if (processed.has(clip.id)) return;
            if (!clip.linkGroupId && !clip.linkedClipId) return;
            
            const linkedClips = this.getLinkedClips(clip.id, state);
            if (linkedClips.length === 0) return;
            
            processed.add(clip.id);
            linkedClips.forEach(c => processed.add(c.id));
        });
        
        return updates;
    }
}

