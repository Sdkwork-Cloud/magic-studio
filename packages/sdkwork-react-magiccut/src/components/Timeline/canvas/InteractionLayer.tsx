
import React, { useRef, useEffect, useCallback } from 'react';
import { InteractionState, NormalizedState } from '../../../store/types';
import { AnyMediaResource } from '@sdkwork/react-commons';
import { CutTrack, CutClip } from '../../../entities/magicCut.entity';
import { DragInput, DragContext } from '../dnd/types';
import { ClipTrimStrategy, TrimMode } from '../dnd/strategies/ClipTrimStrategy';
import { TimelineEditService } from '../../../services/TimelineEditService';

interface InteractionLayerProps {
    interaction: InteractionState;
    state: NormalizedState;
    containerRef: React.RefObject<HTMLDivElement | null>;
    pixelsPerSecond: number;
    trackLayouts: { id: string; top: number; height: number }[];
    clipsMap: Record<string, CutClip>;
    getResource: (id: string) => AnyMediaResource | undefined;
    calculateSnap: (rawTime: number, duration: number, ignoreClipId?: string | null) => { time: number; lines: number[] };
    prepareSnapPoints: (ignoreClipId?: string | null) => void;
    autoScrollSpeed: React.MutableRefObject<number>;
    trimClip: (clipId: string, start: number, duration: number, offset: number) => void;
    splitClipAt: (clipId: string, time: number) => void;
    applyTimelineEditResult: (result: import('../../../services/TimelineEditService').EditOperationResult) => void;
    setInteraction: (interaction: InteractionState | ((prev: InteractionState) => InteractionState)) => void;
    validateTrackDrop: (trackId: string, resourceType: string) => boolean;
    checkCollision: (trackId: string, start: number, duration: number, exclude: Set<string>) => boolean;
    playerController: { previewFrame?: (time: number | null) => void };
    tracks?: CutTrack[]; 
}

export const InteractionLayer: React.FC<InteractionLayerProps> = ({
    interaction,
    state,
    containerRef,
    pixelsPerSecond,
    trackLayouts,
    clipsMap,
    getResource,
    calculateSnap,
    prepareSnapPoints,
    autoScrollSpeed,
    trimClip,
    splitClipAt,
    applyTimelineEditResult,
    setInteraction,
    validateTrackDrop,
    checkCollision,
    playerController,
    tracks = []
}) => {
    // Latest Props Ref Pattern to avoid stale closures in event listeners
    const latestPropsRef = useRef({
        interaction,
        state,
        containerRef,
        pixelsPerSecond,
        trackLayouts,
        clipsMap,
        getResource,
        calculateSnap,
        prepareSnapPoints,
        autoScrollSpeed,
        trimClip,
        splitClipAt,
        applyTimelineEditResult,
        setInteraction,
        tracks,
        validateTrackDrop,
        checkCollision,
        playerController
    });

    useEffect(() => {
        latestPropsRef.current = {
            interaction, state, containerRef, pixelsPerSecond, trackLayouts, clipsMap,
            getResource, calculateSnap, prepareSnapPoints, autoScrollSpeed, trimClip, splitClipAt, applyTimelineEditResult, setInteraction, tracks, validateTrackDrop, checkCollision, playerController
        };
    });

    // Build Context Helper
    const getDragContext = useCallback((): DragContext => ({
        tracks: latestPropsRef.current.tracks,
        trackLayouts: latestPropsRef.current.trackLayouts,
        clipsMap: latestPropsRef.current.clipsMap,
        getResource: latestPropsRef.current.getResource,
        validateTrackDrop: latestPropsRef.current.validateTrackDrop,
        checkCollision: latestPropsRef.current.checkCollision,
        calculateSnap: latestPropsRef.current.calculateSnap
    }), []);

    const getCursorForInteraction = useCallback((type: InteractionState['type']) => {
        if (type === 'slip-trim') return 'grabbing';
        if (type === 'razor-cut') return 'crosshair';
        return 'ew-resize';
    }, []);

    const clampTimeToClip = useCallback((clip: CutClip, time: number) => {
        const minTime = clip.start + 0.001;
        const maxTime = clip.start + clip.duration - 0.001;
        return Math.min(maxTime, Math.max(minTime, time));
    }, []);

    // Handle trim/edit interactions
    useEffect(() => {
        const type = interaction.type;
        if (
            (
                type !== 'trim-start' &&
                type !== 'trim-end' &&
                type !== 'ripple-trim' &&
                type !== 'roll-trim' &&
                type !== 'slip-trim' &&
                type !== 'slide-trim' &&
                type !== 'razor-cut'
            ) ||
            !interaction.clipId
        ) {
            return;
        }

        const props = latestPropsRef.current;
        props.prepareSnapPoints(interaction.clipId);

        // Init Strategy
        const clip = props.clipsMap[interaction.clipId];
        const resource = clip ? props.getResource(clip.resource.id) : undefined;
        
        // If clip missing (rare race condition), abort
        if (!clip) return;

        const shouldUseEdgeStrategy =
            type === 'trim-start' ||
            type === 'trim-end' ||
            type === 'ripple-trim' ||
            type === 'roll-trim' ||
            (type === 'slide-trim' && !!interaction.trimEdge);

        const trimMode: TrimMode =
            interaction.trimEdge === 'end' || type === 'trim-end'
                ? 'trim-end'
                : 'trim-start';

        const strategy = shouldUseEdgeStrategy
            ? new ClipTrimStrategy(
                clip,
                resource,
                trimMode,
                {
                    startTime: interaction.initialStartTime,
                    duration: interaction.initialDuration,
                    offset: interaction.initialOffset
                }
            )
            : null;

        let rafId: number | null = null;
        let isActive = true;
        let currentInteraction = interaction;

        const updateInteractionState = (updater: InteractionState | ((prev: InteractionState) => InteractionState)) => {
            currentInteraction = typeof updater === 'function' ? updater(currentInteraction) : updater;
            props.setInteraction(currentInteraction);
        };

        const processTrim = (clientX: number, clientY: number) => {
            if (!isActive || !props.containerRef.current) return;
            
            const container = props.containerRef.current;
            const rect = container.getBoundingClientRect();

            if (type === 'slip-trim') {
                const deltaTime = (clientX - currentInteraction.initialX) / props.pixelsPerSecond;
                const currentTime = currentInteraction.initialStartTime + deltaTime;

                updateInteractionState(prev => ({
                    ...prev,
                    currentTime,
                    snapLines: []
                }));
                props.playerController.previewFrame?.(currentTime);
                return;
            }

            if (type === 'slide-trim' && !currentInteraction.trimEdge) {
                const deltaTime = (clientX - currentInteraction.initialX) / props.pixelsPerSecond;
                const rawStartTime = currentInteraction.initialStartTime + deltaTime;
                const snap = props.calculateSnap(rawStartTime, clip.duration, clip.id);

                updateInteractionState(prev => ({
                    ...prev,
                    currentTime: snap.time,
                    snapLines: snap.lines
                }));
                props.playerController.previewFrame?.(snap.time);
                return;
            }

            if (type === 'razor-cut') {
                const absoluteX = clientX - rect.left + container.scrollLeft;
                const rawTime = Math.max(0, absoluteX / props.pixelsPerSecond);
                const currentTime = clampTimeToClip(clip, rawTime);

                updateInteractionState(prev => ({
                    ...prev,
                    currentTime,
                    razorTime: currentTime,
                    snapLines: []
                }));
                props.playerController.previewFrame?.(currentTime);
                return;
            }

            if (!strategy) {
                return;
            }

            const input: DragInput = {
                clientX,
                clientY,
                containerRect: rect,
                scrollLeft: container.scrollLeft,
                scrollTop: container.scrollTop,
                pixelsPerSecond: props.pixelsPerSecond
            };

            const result = strategy.calculate(input, getDragContext());

            updateInteractionState(prev => ({ 
                ...prev, 
                currentTime: result.time, 
                snapLines: result.snapLines 
            }));
            props.playerController.previewFrame?.(result.time);
        };

        const handleMouseMove = (e: MouseEvent) => {
             if (!rafId) {
                rafId = requestAnimationFrame(() => {
                    rafId = null;
                    processTrim(e.clientX, e.clientY);
                });
            }
        };

        const handleMouseUp = () => {
            isActive = false;
            if (rafId) cancelAnimationFrame(rafId);
            
            // Commit Trim
            const current = currentInteraction;
            const clipSpeed = clip.speed || 1.0;

            if (current.clipId) {
                if (current.type === 'trim-start') {
                    const newStart = current.currentTime;
                    const delta = newStart - current.initialStartTime;
                    const newDur = current.initialDuration - delta;
                    const newOff = current.initialOffset + (delta * clipSpeed);
                    props.trimClip(current.clipId, newStart, newDur, newOff);
                } else if (current.type === 'trim-end') {
                    const newEnd = current.currentTime;
                    const newDur = newEnd - current.initialStartTime;
                    props.trimClip(current.clipId, current.initialStartTime, newDur, current.initialOffset);
                } else if (current.type === 'ripple-trim') {
                    props.applyTimelineEditResult(
                        TimelineEditService.calculateRippleTrim(
                            clip,
                            current.trimEdge || 'start',
                            current.currentTime,
                            props.state
                        )
                    );
                } else if (current.type === 'roll-trim') {
                    props.applyTimelineEditResult(
                        TimelineEditService.calculateRollTrim(
                            clip,
                            current.trimEdge || 'start',
                            current.currentTime,
                            props.state
                        )
                    );
                } else if (current.type === 'slide-trim') {
                    props.applyTimelineEditResult(
                        TimelineEditService.calculateSlideTrim(
                            clip,
                            current.trimEdge || 'start',
                            current.currentTime,
                            props.state
                        )
                    );
                } else if (current.type === 'slip-trim') {
                    props.applyTimelineEditResult(
                        TimelineEditService.calculateSlipTrim(
                            clip,
                            'start',
                            current.currentTime,
                            props.state
                        )
                    );
                } else if (current.type === 'razor-cut') {
                    props.splitClipAt(current.clipId, current.currentTime);
                }
            }

            props.setInteraction(prev => ({ ...prev, type: 'idle', clipId: null, snapLines: [] }));
            document.body.style.cursor = 'default';
            document.body.style.userSelect = '';
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };

        document.body.style.cursor = getCursorForInteraction(type);
        document.body.style.userSelect = 'none';
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            isActive = false;
            if (rafId) cancelAnimationFrame(rafId);
            document.body.style.cursor = 'default';
            document.body.style.userSelect = '';
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };

    }, [interaction.type, interaction.clipId, interaction.trimEdge, getDragContext, getCursorForInteraction, clampTimeToClip]);

    return null; // Logic layer only
};

