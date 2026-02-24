
import { useRef, useCallback, useEffect } from 'react';
import { InteractionState, EditTool } from '../../../../store/types';
import { TimelineEditService } from '../../../../services/TimelineEditService';
import { ClipLinkService } from '../../../../services/ClipLinkService';
import { CutClip, CutTrack } from '../../../../entities/magicCut.entity';
import { NormalizedState } from '../../../../store/magicCutStore';

interface ClipEditOptions {
    state: NormalizedState;
    interaction: InteractionState;
    editTool: EditTool;
    linkedSelectionEnabled: boolean;
    pixelsPerSecond: number;
    setInteraction: (interaction: InteractionState | ((prev: InteractionState) => InteractionState)) => void;
    updateClip: (clipId: string, updates: Partial<CutClip>) => void;
    updateClips: (updates: Array<{ clipId: string; updates: Partial<CutClip> }>) => void;
    commitHistory: () => void;
}

interface ClipEditResult {
    handleClipMouseDown: (clip: CutClip, e: React.MouseEvent, track: CutTrack) => void;
    handleClipMouseMove: (e: MouseEvent) => void;
    handleClipMouseUp: (e: MouseEvent) => void;
    getCursorForPosition: (clip: CutClip, time: number) => string;
}

const TRIM_THRESHOLD_SECONDS = 0.15;

export const useClipEditInteractions = ({
    state,
    interaction,
    editTool,
    linkedSelectionEnabled,
    pixelsPerSecond,
    setInteraction,
    updateClip,
    updateClips,
    commitHistory
}: ClipEditOptions): ClipEditResult => {
    
    const initialMousePos = useRef({ x: 0, y: 0 });
    const initialClipState = useRef<{
        start: number;
        duration: number;
        offset: number;
    } | null>(null);
    const rafId = useRef<number | null>(null);

    const getTimeFromX = useCallback((clientX: number, containerLeft: number, scrollLeft: number) => {
        const x = clientX - containerLeft + scrollLeft;
        return Math.max(0, x / pixelsPerSecond);
    }, [pixelsPerSecond]);

    const getCursorForPosition = useCallback((clip: CutClip, time: number): string => {
        const trimType = TimelineEditService.getTrimTypeFromPosition(clip, time, TRIM_THRESHOLD_SECONDS);
        
        if (editTool === 'ripple') {
            return trimType ? 'ew-resize' : 'default';
        }
        
        if (editTool === 'roll') {
            return trimType ? 'ew-resize' : 'default';
        }
        
        if (editTool === 'slip') {
            return 'grab';
        }
        
        if (editTool === 'slide') {
            return trimType ? 'ew-resize' : 'move';
        }
        
        if (editTool === 'razor') {
            return 'crosshair';
        }
        
        if (trimType === 'start') return 'w-resize';
        if (trimType === 'end') return 'e-resize';
        
        return 'default';
    }, [editTool]);

    const handleClipMouseDown = useCallback((clip: CutClip, e: React.MouseEvent, track: CutTrack) => {
        if (e.button !== 0) return;
        e.stopPropagation();
        
        const container = (e.target as HTMLElement).closest('.timeline-canvas-container');
        if (!container) return;
        
        const rect = container.getBoundingClientRect();
        const scrollLeft = container.scrollLeft;
        const time = getTimeFromX(e.clientX, rect.left, scrollLeft);
        
        initialMousePos.current = { x: e.clientX, y: e.clientY };
        initialClipState.current = {
            start: clip.start,
            duration: clip.duration,
            offset: clip.offset || 0
        };
        
        if (editTool === 'razor') {
            setInteraction({
                type: 'razor-cut',
                clipId: clip.id,
                initialX: e.clientX,
                initialY: e.clientY,
                initialStartTime: clip.start,
                initialDuration: clip.duration,
                initialTrackId: track.id,
                initialOffset: clip.offset || 0,
                currentTrackId: track.id,
                currentTime: time,
                isSnapping: true,
                snapLines: [],
                validDrop: true,
                hasCollision: false,
                insertTrackIndex: null,
                razorTime: time
            });
            return;
        }
        
        const trimType = TimelineEditService.getTrimTypeFromPosition(clip, time, TRIM_THRESHOLD_SECONDS);
        
        if (editTool === 'ripple' && trimType) {
            setInteraction({
                type: 'ripple-trim',
                clipId: clip.id,
                initialX: e.clientX,
                initialY: e.clientY,
                initialStartTime: clip.start,
                initialDuration: clip.duration,
                initialTrackId: track.id,
                initialOffset: clip.offset || 0,
                currentTrackId: track.id,
                currentTime: time,
                isSnapping: true,
                snapLines: [],
                validDrop: true,
                hasCollision: false,
                insertTrackIndex: null,
                editTool: 'ripple'
            });
            document.body.style.cursor = 'ew-resize';
            document.body.style.userSelect = 'none';
            return;
        }
        
        if (editTool === 'roll' && trimType) {
            setInteraction({
                type: 'roll-trim',
                clipId: clip.id,
                initialX: e.clientX,
                initialY: e.clientY,
                initialStartTime: clip.start,
                initialDuration: clip.duration,
                initialTrackId: track.id,
                initialOffset: clip.offset || 0,
                currentTrackId: track.id,
                currentTime: time,
                isSnapping: true,
                snapLines: [],
                validDrop: true,
                hasCollision: false,
                insertTrackIndex: null,
                editTool: 'roll'
            });
            document.body.style.cursor = 'ew-resize';
            document.body.style.userSelect = 'none';
            return;
        }
        
        if (editTool === 'slip') {
            setInteraction({
                type: 'slip-trim',
                clipId: clip.id,
                initialX: e.clientX,
                initialY: e.clientY,
                initialStartTime: clip.start,
                initialDuration: clip.duration,
                initialTrackId: track.id,
                initialOffset: clip.offset || 0,
                currentTrackId: track.id,
                currentTime: time,
                isSnapping: false,
                snapLines: [],
                validDrop: true,
                hasCollision: false,
                insertTrackIndex: null,
                editTool: 'slip'
            });
            document.body.style.cursor = 'grabbing';
            document.body.style.userSelect = 'none';
            return;
        }
        
        if (editTool === 'slide' && trimType) {
            setInteraction({
                type: 'slide-trim',
                clipId: clip.id,
                initialX: e.clientX,
                initialY: e.clientY,
                initialStartTime: clip.start,
                initialDuration: clip.duration,
                initialTrackId: track.id,
                initialOffset: clip.offset || 0,
                currentTrackId: track.id,
                currentTime: time,
                isSnapping: true,
                snapLines: [],
                validDrop: true,
                hasCollision: false,
                insertTrackIndex: null,
                editTool: 'slide'
            });
            document.body.style.cursor = 'ew-resize';
            document.body.style.userSelect = 'none';
            return;
        }
        
        if (trimType) {
            setInteraction({
                type: trimType === 'start' ? 'trim-start' : 'trim-end',
                clipId: clip.id,
                initialX: e.clientX,
                initialY: e.clientY,
                initialStartTime: clip.start,
                initialDuration: clip.duration,
                initialTrackId: track.id,
                initialOffset: clip.offset || 0,
                currentTrackId: track.id,
                currentTime: time,
                isSnapping: true,
                snapLines: [],
                validDrop: true,
                hasCollision: false,
                insertTrackIndex: null
            });
            document.body.style.cursor = trimType === 'start' ? 'w-resize' : 'e-resize';
            document.body.style.userSelect = 'none';
        } else {
            setInteraction({
                type: 'move',
                clipId: clip.id,
                initialX: e.clientX,
                initialY: e.clientY,
                initialStartTime: clip.start,
                initialDuration: clip.duration,
                initialTrackId: track.id,
                initialOffset: clip.offset || 0,
                currentTrackId: track.id,
                currentTime: clip.start,
                isSnapping: true,
                snapLines: [],
                validDrop: true,
                hasCollision: false,
                insertTrackIndex: null
            });
            document.body.style.cursor = 'grabbing';
            document.body.style.userSelect = 'none';
        }
    }, [editTool, getTimeFromX, setInteraction]);

    const handleClipMouseMove = useCallback((e: MouseEvent) => {
        if (interaction.type === 'idle' || !interaction.clipId || !initialClipState.current) return;
        
        if (rafId.current) {
            cancelAnimationFrame(rafId.current);
        }
        
        rafId.current = requestAnimationFrame(() => {
            const deltaX = e.clientX - initialMousePos.current.x;
            const deltaTime = deltaX / pixelsPerSecond;
            const clip = state.clips[interaction.clipId];
            if (!clip) return;
            
            switch (interaction.type) {
                case 'ripple-trim': {
                    const trimType = TimelineEditService.getTrimTypeFromPosition(
                        clip, 
                        interaction.currentTime, 
                        TRIM_THRESHOLD_SECONDS
                    );
                    if (trimType) {
                        const newTime = trimType === 'start' 
                            ? Math.max(0, initialClipState.current.start + deltaTime)
                            : initialClipState.current.start + initialClipState.current.duration + deltaTime;
                        
                        const result = TimelineEditService.calculateRippleTrim(
                            clip, trimType, newTime, state
                        );
                        
                        result.clipsToUpdate.forEach(({ id, updates }) => {
                            updateClip(id, updates);
                        });
                    }
                    break;
                }
                
                case 'roll-trim': {
                    const trimType = TimelineEditService.getTrimTypeFromPosition(
                        clip, 
                        interaction.currentTime, 
                        TRIM_THRESHOLD_SECONDS
                    );
                    if (trimType) {
                        const newTime = trimType === 'start' 
                            ? Math.max(0, initialClipState.current.start + deltaTime)
                            : initialClipState.current.start + initialClipState.current.duration + deltaTime;
                        
                        const result = TimelineEditService.calculateRollTrim(
                            clip, trimType, newTime, state
                        );
                        
                        result.clipsToUpdate.forEach(({ id, updates }) => {
                            updateClip(id, updates);
                        });
                    }
                    break;
                }
                
                case 'slip-trim': {
                    const newOffset = Math.max(0, initialClipState.current.offset - deltaTime);
                    updateClip(clip.id, { offset: newOffset });
                    break;
                }
                
                case 'slide-trim': {
                    const trimType = TimelineEditService.getTrimTypeFromPosition(
                        clip, 
                        interaction.currentTime, 
                        TRIM_THRESHOLD_SECONDS
                    );
                    if (trimType) {
                        const newTime = trimType === 'start' 
                            ? Math.max(0, initialClipState.current.start + deltaTime)
                            : initialClipState.current.start + initialClipState.current.duration + deltaTime;
                        
                        const result = TimelineEditService.calculateSlideTrim(
                            clip, trimType, newTime, state
                        );
                        
                        result.clipsToUpdate.forEach(({ id, updates }) => {
                            updateClip(id, updates);
                        });
                    }
                    break;
                }
                
                case 'trim-start': {
                    const newStart = Math.max(0, initialClipState.current.start + deltaTime);
                    const newDuration = initialClipState.current.duration - deltaTime;
                    const newOffset = initialClipState.current.offset + deltaTime;
                    
                    if (newDuration > 0.1 && newOffset >= 0) {
                        const linkedUpdates = ClipLinkService.calculateLinkedTrim(
                            clip.id, 'start', newStart, state, linkedSelectionEnabled
                        );
                        updateClips(linkedUpdates);
                    }
                    break;
                }
                
                case 'trim-end': {
                    const newDuration = initialClipState.current.duration + deltaTime;
                    if (newDuration > 0.1) {
                        updateClip(clip.id, { duration: newDuration });
                    }
                    break;
                }
                
                case 'move': {
                    const newStart = Math.max(0, initialClipState.current.start + deltaTime);
                    const linkedUpdates = ClipLinkService.calculateLinkedMovement(
                        clip.id, deltaTime, state, linkedSelectionEnabled
                    );
                    updateClips(linkedUpdates.map(u => ({
                        clipId: u.clipId,
                        updates: { start: u.newStart }
                    })));
                    break;
                }
            }
            
            rafId.current = null;
        });
    }, [interaction, state, pixelsPerSecond, updateClip, updateClips, linkedSelectionEnabled]);

    const handleClipMouseUp = useCallback((e: MouseEvent) => {
        if (interaction.type === 'idle') return;
        
        if (rafId.current) {
            cancelAnimationFrame(rafId.current);
            rafId.current = null;
        }
        
        commitHistory();
        
        setInteraction(prev => ({
            ...prev,
            type: 'idle',
            clipId: null
        }));
        
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        
        initialClipState.current = null;
    }, [interaction.type, commitHistory, setInteraction]);

    useEffect(() => {
        if (interaction.type !== 'idle') {
            window.addEventListener('mousemove', handleClipMouseMove);
            window.addEventListener('mouseup', handleClipMouseUp);
            
            return () => {
                window.removeEventListener('mousemove', handleClipMouseMove);
                window.removeEventListener('mouseup', handleClipMouseUp);
            };
        }
    }, [interaction.type, handleClipMouseMove, handleClipMouseUp]);

    return {
        handleClipMouseDown,
        handleClipMouseMove,
        handleClipMouseUp,
        getCursorForPosition
    };
};

export default useClipEditInteractions;
