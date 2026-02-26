
import React, { useRef, useEffect, useCallback } from 'react';
import { InteractionState } from '../../../store/types';
;
import { AnyMediaResource } from '@sdkwork/react-commons';
import { CutTrack, CutClip } from '../../../entities/magicCut.entity';
import { DragInput, DragContext } from '../dnd/types';
import { ClipTrimStrategy, TrimMode } from '../dnd/strategies/ClipTrimStrategy';

interface InteractionLayerProps {
    interaction: InteractionState;
    containerRef: React.RefObject<HTMLDivElement>;
    pixelsPerSecond: number;
    trackLayouts: { id: string; top: number; height: number }[];
    clipsMap: Record<string, CutClip>;
    getResource: (id: string) => AnyMediaResource | undefined;
    calculateSnap: (rawTime: number, duration: number, ignoreClipId?: string | null) => { time: number; lines: number[] };
    prepareSnapPoints: (ignoreClipId?: string | null) => void;
    autoScrollSpeed: React.MutableRefObject<number>;
    stopAutoScroll: () => void;
    moveClip: (clipId: string, targetTrackId: string, newStart: number) => void;
    trimClip: (clipId: string, start: number, duration: number, offset: number) => void;
    insertTrackAndMoveClip: (clipId: string, insertIndex: number, newStart: number) => void;
    setInteraction: (interaction: InteractionState | ((prev: InteractionState) => InteractionState)) => void;
    validateTrackDrop: (trackId: string, resourceType: string) => boolean;
    checkCollision: (trackId: string, start: number, duration: number, exclude: Set<string>) => boolean;
    playerController: any;
    tracks?: CutTrack[]; 
}

export const InteractionLayer: React.FC<InteractionLayerProps> = ({
    interaction,
    containerRef,
    pixelsPerSecond,
    trackLayouts,
    clipsMap,
    getResource,
    calculateSnap,
    prepareSnapPoints,
    autoScrollSpeed,
    stopAutoScroll,
    moveClip,
    trimClip,
    insertTrackAndMoveClip,
    setInteraction,
    validateTrackDrop,
    checkCollision,
    tracks = []
}) => {
    // Latest Props Ref Pattern to avoid stale closures in event listeners
    const latestPropsRef = useRef({
        interaction,
        containerRef,
        pixelsPerSecond,
        trackLayouts,
        clipsMap,
        getResource,
        calculateSnap,
        prepareSnapPoints,
        autoScrollSpeed,
        trimClip,
        setInteraction,
        tracks,
        validateTrackDrop,
        checkCollision
    });

    useEffect(() => {
        latestPropsRef.current = {
            interaction, containerRef, pixelsPerSecond, trackLayouts, clipsMap,
            getResource, calculateSnap, prepareSnapPoints, autoScrollSpeed, trimClip, setInteraction, tracks, validateTrackDrop, checkCollision
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

    // Handle TRIM Interactions
    useEffect(() => {
        const type = interaction.type;
        if ((type !== 'trim-start' && type !== 'trim-end') || !interaction.clipId) return;

        const props = latestPropsRef.current;
        props.prepareSnapPoints(interaction.clipId);

        // Init Strategy
        const clip = props.clipsMap[interaction.clipId];
        const resource = clip ? props.getResource(clip.resource.id) : undefined;
        
        // If clip missing (rare race condition), abort
        if (!clip) return;

        const strategy = new ClipTrimStrategy(
            clip, 
            resource, 
            type as TrimMode,
            {
                startTime: interaction.initialStartTime,
                duration: interaction.initialDuration,
                offset: interaction.initialOffset
            }
        );

        let rafId: number | null = null;
        let isActive = true;

        const processTrim = (clientX: number, clientY: number) => {
            if (!isActive || !props.containerRef.current) return;
            
            const rect = props.containerRef.current.getBoundingClientRect();
            const input: DragInput = {
                clientX,
                clientY,
                containerRect: rect,
                scrollLeft: props.containerRef.current.scrollLeft,
                scrollTop: props.containerRef.current.scrollTop,
                pixelsPerSecond: props.pixelsPerSecond
            };

            const result = strategy.calculate(input, getDragContext());

            props.setInteraction(prev => ({ 
                ...prev, 
                currentTime: result.time, 
                snapLines: result.snapLines 
            }));
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
            const current = latestPropsRef.current.interaction;
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
                }
            }

            props.setInteraction(prev => ({ ...prev, type: 'idle', clipId: null, snapLines: [] }));
            document.body.style.cursor = 'default';
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            isActive = false;
            if (rafId) cancelAnimationFrame(rafId);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };

    }, [interaction.type, interaction.clipId, getDragContext]);

    return null; // Logic layer only
};

