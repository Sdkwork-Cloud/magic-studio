
;
import { NormalizedState } from '../store/types';
import { CutClip } from '../entities/magicCut.entity';
import { generateUUID } from '@sdkwork/magic-studio-commons/utils/helpers';
import {
    resolveLinkedClipMovePlan,
    type LinkedMovePlan,
    type ResolveLinkedMovePlanOptions
} from '../domain/timeline/linkedMove';
import {
    matchesEntityKey,
    resolveEntityKey,
} from '@sdkwork/magic-studio-types/entity';
import { findMagicCutEntityByKey } from '@sdkwork/magic-studio-types/magiccut';

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
            .map(id => findMagicCutEntityByKey(state.clips, id))
            .filter((clip): clip is CutClip => Boolean(clip));
        
        if (validClips.length < 2) return [];
        
        validClips.forEach((clip, index) => {
            if (index === 0) return;
            
            updates.push({
                clipId: resolveEntityKey(clip),
                updates: {
                    linkedClipId: resolveEntityKey(validClips[0]),
                    linkGroupId
                }
            });
        });
        
        updates.push({
            clipId: resolveEntityKey(validClips[0]),
            updates: {
                linkedClipId: validClips[1] ? resolveEntityKey(validClips[1]) : undefined,
                linkGroupId
            }
        });
        
        return updates;
    }
    
    static unlinkClip(
        clipId: string,
        state: NormalizedState
    ): Array<{ clipId: string; updates: Partial<CutClip> }> {
        const clip = findMagicCutEntityByKey(state.clips, clipId);
        if (!clip || !clip.linkGroupId) return [];
        
        const updates: Array<{ clipId: string; updates: Partial<CutClip> }> = [];
        
        Object.values(state.clips).forEach(c => {
            if (c.linkGroupId === clip.linkGroupId) {
                updates.push({
                    clipId: resolveEntityKey(c),
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
        const clip = findMagicCutEntityByKey(state.clips, clipId);
        if (!clip) return [];
        
        const linkedClips: CutClip[] = [];
        
        if (clip.linkGroupId) {
            Object.values(state.clips).forEach(c => {
                if (c.linkGroupId === clip.linkGroupId && !matchesEntityKey(c, clipId)) {
                    linkedClips.push(c);
                }
            });
        }
        
        if (clip.linkedClipId) {
            const linked = findMagicCutEntityByKey(state.clips, clip.linkedClipId);
            if (linked && !linkedClips.find(c => matchesEntityKey(c, resolveEntityKey(linked)))) {
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
        
        const clip = findMagicCutEntityByKey(state.clips, clipId);
        if (!clip) return [clipId];
        
        const groupIds = new Set<string>([resolveEntityKey(clip)]);
        
        if (clip.linkGroupId) {
            Object.values(state.clips).forEach(c => {
                if (c.linkGroupId === clip.linkGroupId) {
                    groupIds.add(resolveEntityKey(c));
                }
            });
        }
        
        if (clip.linkedClipId) {
            groupIds.add(clip.linkedClipId);
            
            const linked = findMagicCutEntityByKey(state.clips, clip.linkedClipId);
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
            const clip = findMagicCutEntityByKey(state.clips, id);
            return {
                clipId: clip ? resolveEntityKey(clip) : id,
                newStart: Math.max(0, (clip?.start ?? 0) + deltaTime)
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
        const clip = findMagicCutEntityByKey(state.clips, clipId);
        if (!clip) return [];
        
        const results: Array<{ clipId: string; updates: Partial<CutClip> }> = [];
        
        const delta = trimType === 'start' 
            ? newTime - clip.start 
            : newTime - (clip.start + clip.duration);
        
        if (trimType === 'start') {
            results.push({
                clipId: resolveEntityKey(clip),
                updates: {
                    start: newTime,
                    duration: clip.duration - delta,
                    offset: (clip.offset || 0) + delta
                }
            });
        } else {
            results.push({
                clipId: resolveEntityKey(clip),
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
                    clipId: resolveEntityKey(linkedClip),
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
        const clip1 = findMagicCutEntityByKey(state.clips, clipId1);
        const clip2 = findMagicCutEntityByKey(state.clips, clipId2);
        
        if (!clip1 || !clip2) return false;
        
        if (clip1.linkGroupId && clip1.linkGroupId === clip2.linkGroupId) {
            return true;
        }
        
        if (matchesEntityKey(clip2, clip1.linkedClipId) || matchesEntityKey(clip1, clip2.linkedClipId)) {
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
            const clipKey = resolveEntityKey(clip);
            if (processed.has(clipKey)) return;
            if (!clip.linkGroupId && !clip.linkedClipId) return;
            
            const linkedClips = this.getLinkedClips(clipKey, state);
            if (linkedClips.length === 0) return;
            
            processed.add(clipKey);
            linkedClips.forEach(c => processed.add(resolveEntityKey(c)));
        });
        
        return updates;
    }
}

