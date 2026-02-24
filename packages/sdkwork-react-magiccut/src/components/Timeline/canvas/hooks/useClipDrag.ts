
import React, { useRef, useCallback } from 'react';
import { InteractionState } from '../../../../store/magicCutStore';
;
import { AnyMediaResource, TrackIntervalIndex } from 'sdkwork-react-commons';
import { CutTrack, CutClip, CutTrackType } from '../../../../entities/magicCut.entity';
import { DragContext, DragInput, IPlacementStrategy } from '../../dnd/types';
import { ClipMoveStrategy } from '../../dnd/strategies/ClipMoveStrategy';

interface UseClipDragOptions {
    containerRef: React.RefObject<HTMLDivElement>;
    pixelsPerSecond: number;
    tracks: CutTrack[];
    trackLayouts: { id: string; top: number; height: number }[];
    clipsMap: Record<string, CutClip>;
    getResource: (id: string) => AnyMediaResource | undefined;
    calculateSnap: (rawTime: number, duration: number, ignoreClipId?: string | null) => { time: number; lines: number[] };
    prepareSnapPoints: (ignoreClipId?: string | null) => void;
    validateTrackDrop: (trackId: string, resourceType: string) => boolean;
    checkCollision: (trackId: string, start: number, duration: number, exclude: Set<string>) => boolean;
    setInteraction: (interaction: InteractionState | ((prev: InteractionState) => InteractionState)) => void;
    moveClip: (clipId: string, newTrackId: string, newStart: number) => void;
    insertTrackAndMoveClip: (clipId: string, insertIndex: number, newStart: number, trackType?: CutTrackType) => void;
    playerController: any;
    autoScrollSpeed: React.MutableRefObject<number>;
}

const AUTO_SCROLL_ZONE_PX = 80;
const AUTO_SCROLL_SPEED_MAX = 30;
const DRAG_THRESHOLD_PX = 5; 

export const useClipDrag = (options: UseClipDragOptions) => {
    const {
        containerRef, pixelsPerSecond, trackLayouts, clipsMap,
        getResource, calculateSnap, validateTrackDrop, checkCollision, // Fallback collision
        setInteraction, moveClip, insertTrackAndMoveClip, autoScrollSpeed,
        prepareSnapPoints
    } = options;

    const strategyRef = useRef<IPlacementStrategy | null>(null);
    const rafRef = useRef<number | null>(null);
    const dragStateRef = useRef<{
        isDragging: boolean;
        startX: number;
        startY: number;
        clipId: string | null;
        initialScrollLeft: number;
    }>({ isDragging: false, startX: 0, startY: 0, clipId: null, initialScrollLeft: 0 });

    // Optimization: Track Indices for O(logN) collision checks
    const indicesRef = useRef<Map<string, TrackIntervalIndex>>(new Map());

    // Build optimized context with interval trees
    const buildContext = useCallback((): DragContext => {
        // Optimized Collision Check using indices
        const optimizedCheckCollision = (trackId: string, start: number, duration: number, excludeIds: Set<string>) => {
            const index = indicesRef.current.get(trackId);
            if (index) {
                // Interval tree check O(log N)
                return index.checkCollision(start, start + duration, excludeIds) !== null;
            }
            // Fallback to linear scan
            return checkCollision(trackId, start, duration, excludeIds);
        };

        return {
            tracks: options.tracks,
            trackLayouts,
            clipsMap,
            getResource,
            validateTrackDrop,
            checkCollision: optimizedCheckCollision,
            calculateSnap
        };
    }, [options.tracks, trackLayouts, clipsMap, getResource, validateTrackDrop, checkCollision, calculateSnap]);

    // Build Indices once at start of drag
    const buildIndices = () => {
        indicesRef.current.clear();
        options.tracks.forEach(track => {
            const index = new TrackIntervalIndex();
            track.clips.forEach(ref => {
                const c = clipsMap[ref.id];
                if (c) {
                    index.insert({ id: c.id, start: c.start, end: c.start + c.duration });
                }
            });
            indicesRef.current.set(track.id, index);
        });
    };

    const processDragFrame = useCallback((clientX: number, clientY: number) => {
        if (!containerRef.current || !strategyRef.current) return;

        const container = containerRef.current;
        const rect = container.getBoundingClientRect();
        
        // Auto Scroll
        const mouseRelX = clientX - rect.left;
        let speed = 0;
        if (mouseRelX < AUTO_SCROLL_ZONE_PX) {
            const factor = 1 - (Math.max(0, mouseRelX) / AUTO_SCROLL_ZONE_PX);
            speed = -Math.pow(factor, 2) * AUTO_SCROLL_SPEED_MAX;
        } else if (mouseRelX > rect.width - AUTO_SCROLL_ZONE_PX) {
            const dist = rect.width - mouseRelX;
            const factor = 1 - (Math.max(0, dist) / AUTO_SCROLL_ZONE_PX);
            speed = Math.pow(factor, 2) * AUTO_SCROLL_SPEED_MAX;
        }
        autoScrollSpeed.current = speed;

        const input: DragInput = {
            clientX,
            clientY,
            containerRect: rect,
            scrollLeft: container.scrollLeft,
            scrollTop: container.scrollTop,
            pixelsPerSecond
        };

        const result = strategyRef.current.calculate(input, buildContext());

        setInteraction(prev => ({
            ...prev,
            type: 'move',
            currentTime: result.time,
            currentTrackId: result.trackId,
            insertTrackIndex: result.insertIndex,
            validDrop: result.isValid,
            hasCollision: result.hasCollision,
            snapLines: result.snapLines
        }));

        if (!rafRef.current) {
            rafRef.current = requestAnimationFrame(() => {
                rafRef.current = null;
            });
        }
    }, [containerRef, pixelsPerSecond, autoScrollSpeed, buildContext, setInteraction]);

    const startDrag = useCallback((clipId: string, clientX: number, clientY: number) => {
        const clip = clipsMap[clipId];
        if (!clip || !containerRef.current) return;

        dragStateRef.current = {
            isDragging: false,
            startX: clientX,
            startY: clientY,
            clipId: clipId,
            initialScrollLeft: containerRef.current.scrollLeft
        };

        prepareSnapPoints(clipId);
        buildIndices(); // Build acceleration structures

        const handleMouseMove = (e: MouseEvent) => {
            const state = dragStateRef.current;
            if (!state.clipId) return;

            if (!state.isDragging) {
                const dx = Math.abs(e.clientX - state.startX);
                const dy = Math.abs(e.clientY - state.startY);
                
                if (dx > DRAG_THRESHOLD_PX || dy > DRAG_THRESHOLD_PX) {
                    state.isDragging = true;
                    
                    const rect = containerRef.current!.getBoundingClientRect();
                    const mouseRelX = state.startX - rect.left + state.initialScrollLeft;
                    const mouseTime = mouseRelX / pixelsPerSecond;
                    const grabOffset = mouseTime - clip.start;

                    strategyRef.current = new ClipMoveStrategy(clipId, clip.duration, grabOffset);

                    setInteraction({
                        type: 'move',
                        clipId: clipId,
                        currentTime: clip.start,
                        currentTrackId: clip.track.id,
                        insertTrackIndex: null,
                        validDrop: true,
                        hasCollision: false,
                        snapLines: [],
                        initialDuration: clip.duration,
                        initialX: state.startX,
                        initialY: state.startY,
                        initialStartTime: clip.start,
                        initialTrackId: clip.track.id,
                        initialOffset: clip.offset || 0,
                        isSnapping: false
                    });
                }
            }

            if (state.isDragging) {
                if (!rafRef.current) {
                    rafRef.current = requestAnimationFrame(() => {
                        rafRef.current = null;
                        processDragFrame(e.clientX, e.clientY);
                    });
                }
            }
        };

        const handleMouseUp = (e: MouseEvent) => {
            autoScrollSpeed.current = 0;
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            rafRef.current = null;

            if (dragStateRef.current.isDragging) {
                if (strategyRef.current && containerRef.current) {
                     const rect = containerRef.current.getBoundingClientRect();
                     const input: DragInput = {
                        clientX: e.clientX,
                        clientY: e.clientY,
                        containerRect: rect,
                        scrollLeft: containerRef.current.scrollLeft,
                        scrollTop: containerRef.current.scrollTop,
                        pixelsPerSecond
                    };
                    
                    const result = strategyRef.current.calculate(input, buildContext());
                    const cId = dragStateRef.current.clipId!;

                    if (result.trackId && !result.hasCollision && result.isValid) {
                         moveClip(cId, result.trackId, result.time);
                    } else if (result.insertIndex !== null) {
                         insertTrackAndMoveClip(cId, result.insertIndex, result.time, result.suggestedTrackType);
                    }
                }
                
                setInteraction(prev => ({ ...prev, type: 'idle', clipId: null, snapLines: [] }));
            }

            strategyRef.current = null;
            indicesRef.current.clear(); // Free memory
            dragStateRef.current = { isDragging: false, startX: 0, startY: 0, clipId: null, initialScrollLeft: 0 };
            
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    }, [clipsMap, containerRef, pixelsPerSecond, prepareSnapPoints, setInteraction, processDragFrame, moveClip, insertTrackAndMoveClip, buildContext, autoScrollSpeed]);

    return { startDrag };
};

export default useClipDrag;

