
import { CutTrack } from '../../../entities/magicCut.entity';
import { TIMELINE_CONSTANTS } from '../../../constants';
import React, { useMemo, useCallback, useRef, useEffect } from 'react';
import { MediaResourceType } from '@sdkwork/react-commons';
import { useMagicCutStore } from '../../../store/magicCutStore';
import { InteractionState } from '../../../store/types';
import { useSnapPoints } from '../canvas/hooks/useSnapPoints';
import { ResourceDropStrategy } from '../dnd/strategies/ResourceDropStrategy';
import { DragInput, DragContext } from '../dnd/types';
import { findEffectTargetClip, findTransitionTarget } from '../../../domain/effects/effectPlacement';
import { resolveResourceDropPreview } from '../../../domain/dnd/dropPreview';
import { resolveImportedDropSequence } from '../../../domain/dnd/importDropSequence';

const RENDER_BUFFER_PX = 1000;
const ZOOM_MAX_FPS = 60;

const getTrackHeight = (track: CutTrack) => {
    if (track.height) return track.height;
    if (track.trackType === 'video') return TIMELINE_CONSTANTS.TRACK_HEIGHT_VIDEO;
    if (track.trackType === 'audio') return TIMELINE_CONSTANTS.TRACK_HEIGHT_AUDIO;
    if (track.trackType === 'text') return TIMELINE_CONSTANTS.TRACK_HEIGHT_TEXT;
    if (track.trackType === 'effect') return TIMELINE_CONSTANTS.TRACK_HEIGHT_EFFECT;
    return TIMELINE_CONSTANTS.TRACK_HEIGHT_DEFAULT;
};

export const useTimeline = (
    containerWidth: number, 
    containerHeight: number, 
    tracksContainerRef: React.RefObject<HTMLDivElement | null> 
) => {
    const { 
        activeTimeline, state, 
        selectClip,
        addClip, canSeek, totalDuration,
        validateTrackDrop, checkCollision,
        playerController, setSkimmingResource, setPreviewEffect,
        insertTrackAndAddClip, isSnappingEnabled,
        addEffectToClip, addTransitionToClip,
        useTransientState, store, seek,
        getResource,
        importFileObjects
    } = useMagicCutStore();
    
    // Transient State
    const scrollLeft = useTransientState(s => s.scrollLeft);
    const scrollTop = useTransientState(s => s.scrollTop);
    const zoomLevel = useTransientState(s => s.zoomLevel);
    const dragOperation = useTransientState(s => s.dragOperation);
    const interaction = useTransientState(s => s.interaction);
    const isDragOverTimeline = useTransientState(s => s.isDragOverTimeline);
    
    // Actions wrapper
    const setInteraction = useCallback((val: InteractionState | ((prev: InteractionState) => InteractionState)) => 
        store.setState((prev) => ({ interaction: typeof val === 'function' ? val(prev.interaction) : val })), [store]);
    const setDragOperation = useCallback((op: import('../../../store/magicCutStore').DragOperation | null) => store.setState({ dragOperation: op }), [store]);
    const setIsDragOverTimeline = useCallback((val: boolean) => store.setState({ isDragOverTimeline: val }), [store]);
    
    const { tracks: trackMap, clips: clipsMap } = state;
    const lastDragUpdate = useRef<number>(0);
    const dragCounter = useRef(0);
    const isDragOverTimelineRef = useRef(isDragOverTimeline);

    // Layout Metrics
    const pixelsPerSecond = TIMELINE_CONSTANTS.DEFAULT_PIXELS_PER_SECOND * zoomLevel;
    const screenDuration = containerWidth > 0 ? containerWidth / pixelsPerSecond : 30;
    
    let maxTime = totalDuration;
    if (interaction.type !== 'idle' || dragOperation) {
        const dragTime = interaction.currentTime || 0;
        maxTime = Math.max(maxTime, dragTime + (dragOperation?.duration || 0));
    }
    const displayDuration = Math.max(maxTime + screenDuration, 60); 
    const totalWidth = Math.max(displayDuration * pixelsPerSecond, containerWidth);

    const visibleTimeStart = Math.max(0, (scrollLeft - RENDER_BUFFER_PX) / pixelsPerSecond);
    const visibleTimeEnd = (scrollLeft + containerWidth + RENDER_BUFFER_PX) / pixelsPerSecond;

    const timelineTracks = useMemo(() => {
        if (!activeTimeline) return [];
        return activeTimeline.tracks.map(ref => trackMap[ref.id]).filter(Boolean);
    }, [activeTimeline, trackMap]);

    const trackLayouts = useMemo(() => {
        const TRACK_GAP = 1; 
        const MIN_TOP_PADDING = 0; 
        let currentTop = MIN_TOP_PADDING;
        return timelineTracks.map(track => {
            const height = getTrackHeight(track);
            const layout = { id: track.id, top: currentTop, height };
            currentTop += height + TRACK_GAP;
            return layout;
        });
    }, [timelineTracks]);

    const totalHeight = trackLayouts.length > 0 ? trackLayouts[trackLayouts.length - 1].top + trackLayouts[trackLayouts.length - 1].height + 300 : containerHeight;

    const visibleTrackIndices = useMemo(() => {
        const start = scrollTop;
        const end = scrollTop + containerHeight;
        const V_BUFFER = 200;
        return trackLayouts.map((layout, idx) => (layout.top + layout.height > start - V_BUFFER && layout.top < end + V_BUFFER) ? idx : -1).filter(idx => idx !== -1);
    }, [scrollTop, containerHeight, trackLayouts]);

    const { calculateSnap, prepareSnapPoints } = useSnapPoints({ pixelsPerSecond, isSnappingEnabled });

    // --- Strategy Context Builder ---
    const buildDragContext = useCallback((): DragContext => ({
        tracks: timelineTracks,
        trackLayouts,
        clipsMap,
        getResource,
        validateTrackDrop,
        checkCollision,
        calculateSnap
    }), [timelineTracks, trackLayouts, clipsMap, getResource, validateTrackDrop, checkCollision, calculateSnap]);

    const strategyRef = useRef<ResourceDropStrategy | null>(null);

    const getTrackIdFromClientY = useCallback((clientY: number) => {
        const container = tracksContainerRef.current;
        if (!container) return null;

        const rect = container.getBoundingClientRect();
        const relativeY = clientY - rect.top + container.scrollTop;
        const layout = trackLayouts.find(candidate => relativeY >= candidate.top && relativeY <= candidate.top + candidate.height);
        return layout?.id || null;
    }, [tracksContainerRef, trackLayouts]);

    // Update strategy when operation changes
    useEffect(() => {
        if (dragOperation) {
            strategyRef.current = new ResourceDropStrategy(dragOperation.payload, dragOperation.duration);
        } else {
            strategyRef.current = null;
        }
    }, [dragOperation]);

    // --- Handlers ---
    const handleDragEnterEmpty = useCallback((e: React.DragEvent) => {
        e.preventDefault(); e.stopPropagation();
        e.dataTransfer.dropEffect = 'copy';
        dragCounter.current += 1;
        if (dragCounter.current === 1) {
            setIsDragOverTimeline(true);
            // Calculate snap points for the entire timeline (passing null to exclude nothing)
            prepareSnapPoints(null);
        }
    }, [setIsDragOverTimeline, prepareSnapPoints]);

    const handleDragLeaveEmpty = useCallback((e: React.DragEvent) => {
        e.preventDefault(); e.stopPropagation();
        dragCounter.current -= 1;
        if (dragCounter.current <= 0) {
            dragCounter.current = 0;
            setIsDragOverTimeline(false);
            // FULL RESET of interaction state to prevent stale ghost overlays
            setInteraction((prev: any) => ({ ...prev, type: 'idle', snapLines: [], insertTrackIndex: null, currentTrackId: null, dropPreview: undefined }));
        }
    }, [setIsDragOverTimeline, setInteraction]);

    const handleDragOverEmpty = useCallback((e: React.DragEvent) => {
        e.preventDefault(); e.stopPropagation();
        e.dataTransfer.dropEffect = 'copy';
        if (!isDragOverTimelineRef.current) setIsDragOverTimeline(true);
        
        // If native file drag (no dragOperation yet), just show valid drop cursor
        if (!dragOperation) return;
        
        if (!tracksContainerRef.current || !strategyRef.current) return;

        const now = Date.now();
        if (now - lastDragUpdate.current < (1000 / ZOOM_MAX_FPS)) return;
        lastDragUpdate.current = now;

        const input: DragInput = {
            clientX: e.clientX,
            clientY: e.clientY,
            containerRect: tracksContainerRef.current.getBoundingClientRect(),
            scrollLeft: tracksContainerRef.current.scrollLeft,
            scrollTop: tracksContainerRef.current.scrollTop,
            pixelsPerSecond
        };

        const hoveredTrackId = getTrackIdFromClientY(e.clientY);
        const absoluteX = e.clientX - input.containerRect.left + input.scrollLeft;
        const rawTime = Math.max(0, absoluteX / pixelsPerSecond);

        if (dragOperation.payload.type === MediaResourceType.EFFECT || dragOperation.payload.type === MediaResourceType.TRANSITION) {
            const dropPreview = resolveResourceDropPreview({
                resourceType: dragOperation.payload.type,
                time: rawTime,
                preferredTrackId: hoveredTrackId,
                tracks: timelineTracks,
                clips: clipsMap,
                resources: state.resources
            });

            setInteraction((prev: any) => ({
                ...prev,
                type: 'move',
                currentTime: rawTime,
                currentTrackId: dropPreview?.trackId || hoveredTrackId,
                insertTrackIndex: null,
                validDrop: !!dropPreview,
                hasCollision: false,
                snapLines: [],
                initialDuration: dragOperation.duration,
                clipId: null,
                dropPreview
            }));
            return;
        }

        const result = strategyRef.current.calculate(input, buildDragContext());

        setInteraction((prev: any) => ({
            ...prev,
            type: 'move',
            currentTime: result.time,
            currentTrackId: result.trackId,
            insertTrackIndex: result.insertIndex,
            validDrop: result.isValid,
            hasCollision: result.hasCollision,
            snapLines: result.snapLines,
            initialDuration: dragOperation.duration,
            clipId: null,
            dropPreview: undefined
        }));
        
        playerController.previewFrame(result.time);
    }, [dragOperation, pixelsPerSecond, buildDragContext, setInteraction, playerController, setIsDragOverTimeline, getTrackIdFromClientY, timelineTracks, clipsMap, state.resources]);

    const handleDropEmpty = useCallback(async (e: React.DragEvent) => {
        e.preventDefault(); e.stopPropagation();
        dragCounter.current = 0;
        setIsDragOverTimeline(false);
        
        // 1. Handle Native File Drop
        if (!dragOperation && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            try {
                const files = Array.from(e.dataTransfer.files);
                const resources = await importFileObjects(files);
                
                // Determine drop location from the first imported resource, then sequence the rest
                if (tracksContainerRef.current && resources.length > 0) {
                     const resource = resources[0];
                     const tempStrategy = new ResourceDropStrategy(resource);
                     const input: DragInput = {
                        clientX: e.clientX,
                        clientY: e.clientY,
                        containerRect: tracksContainerRef.current.getBoundingClientRect(),
                        scrollLeft: tracksContainerRef.current.scrollLeft,
                        scrollTop: tracksContainerRef.current.scrollTop,
                        pixelsPerSecond
                     };
                     const result = tempStrategy.calculate(input, buildDragContext());
                    
                     if (result.isValid) {
                        const plans = resolveImportedDropSequence({
                            resources,
                            tracks: timelineTracks,
                            baseTime: result.time,
                            basePlacement: {
                                trackId: result.trackId && !result.hasCollision ? result.trackId : null,
                                insertIndex: result.trackId && !result.hasCollision ? null : result.insertIndex
                            }
                        });
                        const resourceMap = new Map(resources.map((item) => [item.id, item] as const));
                        const createdTrackIds = new Map<string, string>();

                        plans.forEach((plan) => {
                            const plannedResource = resourceMap.get(plan.resourceId);
                            if (!plannedResource) return;

                            if (plan.target.kind === 'existing-track') {
                                addClip(plan.target.trackId, plannedResource, plan.start, plan.duration);
                                return;
                            }

                            const existingTrackId = createdTrackIds.get(plan.target.groupId);
                            if (existingTrackId) {
                                addClip(existingTrackId, plannedResource, plan.start, plan.duration);
                                return;
                            }

                            const trackId = insertTrackAndAddClip(
                                plannedResource,
                                plan.target.insertIndex,
                                plan.start,
                                plan.duration,
                                plan.target.trackType
                            );
                            if (trackId) {
                                createdTrackIds.set(plan.target.groupId, trackId);
                            }
                        });
                    }
                }
            } catch (err) {
                console.error("Drop import failed", err);
            }
            return;
        }

        // 2. Handle Internal Resource Drag
        if (!dragOperation || !tracksContainerRef.current || !strategyRef.current) return;

        const input: DragInput = {
            clientX: e.clientX,
            clientY: e.clientY,
            containerRect: tracksContainerRef.current.getBoundingClientRect(),
            scrollLeft: tracksContainerRef.current.scrollLeft,
            scrollTop: tracksContainerRef.current.scrollTop,
            pixelsPerSecond
        };

        const hoveredTrackId = getTrackIdFromClientY(e.clientY);
        const absoluteX = e.clientX - input.containerRect.left + input.scrollLeft;
        const rawTime = Math.max(0, absoluteX / pixelsPerSecond);

        if (dragOperation.payload.type === MediaResourceType.EFFECT) {
            const targetClipId = findEffectTargetClip({
                time: rawTime,
                preferredTrackId: hoveredTrackId,
                tracks: timelineTracks,
                clips: clipsMap,
                resources: state.resources
            });

            if (targetClipId) {
                addEffectToClip(targetClipId, dragOperation.payload.id);
            }

            setDragOperation(null);
            setSkimmingResource(null);
            setInteraction((prev: any) => ({ ...prev, type: 'idle', clipId: null, snapLines: [], insertTrackIndex: null, currentTrackId: null, dropPreview: undefined }));
            playerController.skim(null);
            return;
        }

        if (dragOperation.payload.type === MediaResourceType.TRANSITION) {
            const targetTransition = findTransitionTarget({
                time: rawTime,
                preferredTrackId: hoveredTrackId,
                tracks: timelineTracks,
                clips: clipsMap,
                resources: state.resources
            });

            if (targetTransition) {
                addTransitionToClip(targetTransition.fromClipId, dragOperation.payload.id, dragOperation.duration);
            }

            setDragOperation(null);
            setSkimmingResource(null);
            setInteraction((prev: any) => ({ ...prev, type: 'idle', clipId: null, snapLines: [], insertTrackIndex: null, currentTrackId: null, dropPreview: undefined }));
            playerController.skim(null);
            return;
        }

        const result = strategyRef.current.calculate(input, buildDragContext());

        if (result.isValid) {
            if (result.trackId && !result.hasCollision) {
                addClip(result.trackId, dragOperation.payload, result.time, dragOperation.duration);
            } else if (result.insertIndex !== null) {
                insertTrackAndAddClip(dragOperation.payload, result.insertIndex, result.time, dragOperation.duration, result.suggestedTrackType);
            }
        }

        setDragOperation(null);
        setSkimmingResource(null);
        // FULL RESET
        setInteraction((prev: any) => ({ ...prev, type: 'idle', clipId: null, snapLines: [], insertTrackIndex: null, currentTrackId: null, dropPreview: undefined }));
        playerController.skim(null);

    }, [dragOperation, pixelsPerSecond, buildDragContext, addClip, insertTrackAndAddClip, setDragOperation, setSkimmingResource, setInteraction, playerController, setIsDragOverTimeline, importFileObjects, getTrackIdFromClientY, timelineTracks, clipsMap, state.resources, addEffectToClip, addTransitionToClip]);

    // For Header Drag Over (Insert at start)
    const handleHeaderDragOver = useCallback((e: React.DragEvent) => {
       e.preventDefault(); e.stopPropagation(); e.dataTransfer.dropEffect = 'copy';
    }, []);
    
    const handleHeaderDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault(); e.stopPropagation();
        // Header drop logic handled by main drop handler if necessary or implement specific logic here
    }, []);

    // ... Mouse Interaction (Seek/Scrub) Logic ...
    const handleMouseDown = (e: React.MouseEvent) => {
        if (!canSeek()) return;
        const target = e.target as HTMLElement;
        if (target.closest('[data-interactive="true"]')) return;
        if (playerController.getIsPlaying()) playerController.pause();
        setSkimmingResource(null);
        setPreviewEffect(null);
        playerController.skim(null);
        
        // Simple seek logic here, can be moved to controller later
        const container = tracksContainerRef.current;
        if(!container) return;
        const rect = container.getBoundingClientRect();
        const t = Math.max(0, (e.clientX - rect.left + container.scrollLeft) / pixelsPerSecond);
        seek(t);
        selectClip(null);
    };

    return {
        pixelsPerSecond, totalWidth, totalHeight, displayDuration, visibleTimeStart, visibleTimeEnd,
        timelineTracks, trackLayouts, visibleTrackIndices, clipsMap,
        handleMouseDown, handleMouseMove: () => {}, handleMouseLeave: () => {},
        handleDragEnterEmpty, handleDragOverEmpty, handleDragLeaveEmpty, handleDropEmpty,
        handleHeaderDragOver, handleHeaderDrop
    };
};
