
import React, { useRef, useCallback, useEffect, useMemo, memo } from 'react';
;
import { AnyMediaResource } from 'sdkwork-react-commons';
import { CutTrack, CutClip } from '../../../entities/magicCut.entity';
import { useMagicCutStore } from '../../../store/magicCutStore';
import { useMagicCutBus } from '../../../providers/MagicCutEventProvider';
import { TimelineGrid } from './TimelineGrid';
import { TrackLayer } from './TrackLayer';
import { DragOverlay } from './DragOverlay';
import { InteractionLayer } from './InteractionLayer';
import { InOutPointOverlay } from '../InOutPointOverlay';
import { useAutoScroll } from './hooks/useAutoScroll';
import { useTimelineInteractions } from './hooks/useTimelineInteractions';
import { useSnapPoints } from './hooks/useSnapPoints';
import { useClipDrag } from './hooks/useClipDrag';
import { TimelineMenuLayer } from '../menu/TimelineMenuLayer';
import { MagicCutEvents } from '../../../events';

export interface TimelineCanvasProps {
    tracks: CutTrack[];
    trackLayouts: { id: string; top: number; height: number }[];
    clipsMap: Record<string, CutClip>;
    getResource: (id: string) => AnyMediaResource | undefined;
    pixelsPerSecond: number;
    selectedClipId: string | null;
    selectedClipIds: Set<string>;
    onClipSelect: (id: string | null, multi?: boolean) => void;
    visibleTimeStart: number;
    visibleTimeEnd: number;
    visibleTrackIndices: number[];
    containerRef: React.RefObject<HTMLDivElement>;
}

export const TimelineCanvas: React.FC<TimelineCanvasProps> = ({
    tracks,
    trackLayouts,
    clipsMap,
    getResource,
    pixelsPerSecond,
    selectedClipId,
    selectedClipIds,
    onClipSelect,
    visibleTimeStart,
    visibleTimeEnd,
    visibleTrackIndices,
    containerRef
}) => {
    const bus = useMagicCutBus();
    const { 
        playerController,
        useTransientState,
        store,
        selectTrack,
        selectClip,
        setInteraction,
        moveClip,
        trimClip,
        insertTrackAndMoveClip,
        validateTrackDrop,
        checkCollision,
        selectClipsInRegion,
        state,
        updateClip,
        updateClips,
        commitHistory
    } = useMagicCutStore();

    const dragOperation = useTransientState(s => s.dragOperation);
    const interaction = useTransientState(s => s.interaction);
    const scrollLeft = useTransientState(s => s.scrollLeft);

    const { autoScrollSpeed, startAutoScroll, stopAutoScroll } = useAutoScroll(containerRef, store);
    const { calculateSnap, prepareSnapPoints } = useSnapPoints({ pixelsPerSecond, isSnappingEnabled: true });

    const {
        handleBackgroundMouseDown,
        handleContainerMouseMove,
        handleContainerMouseLeave,
    } = useTimelineInteractions({
        containerRef,
        pixelsPerSecond,
        playerController,
        bus,
        interaction,
        dragOperation,
        trackLayouts,
        selectRegion: (startTime, endTime, trackIds) => {
            selectClipsInRegion(startTime, endTime, trackIds);
        },
        selectClip,
        state,
        applyEditResult: (result) => {
            if (result.clipsToUpdate) {
                updateClips(result.clipsToUpdate);
            }
        }
    });

    const containerDimensions = useMemo(() => ({
        width: Math.max(containerRef.current?.scrollWidth || 0, containerRef.current?.clientWidth || 0),
        height: containerRef.current?.clientHeight || 0
    }), [containerRef.current?.scrollWidth, containerRef.current?.clientWidth, containerRef.current?.clientHeight]);

    const { startDrag: startClipDrag } = useClipDrag({
        containerRef,
        pixelsPerSecond,
        tracks,
        trackLayouts,
        clipsMap,
        getResource,
        calculateSnap,
        prepareSnapPoints,
        validateTrackDrop,
        checkCollision,
        setInteraction,
        moveClip,
        insertTrackAndMoveClip,
        playerController,
        autoScrollSpeed
    });

    const isGhostVisible = !!(dragOperation || (interaction.type === 'move' && interaction.clipId));

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        const container = containerRef.current;
        if (!container) return;
        const rect = container.getBoundingClientRect();
        const relX = (e.clientX - rect.left) + container.scrollLeft;
        const time = Math.max(0, relX / pixelsPerSecond);

        bus.emit(MagicCutEvents.UI_CONTEXT_MENU, {
            x: e.clientX,
            y: e.clientY,
            type: 'timeline',
            time
        });
    };

    return (
        <>
            <div 
                className="relative w-full h-full min-h-full outline-none cursor-default"
                onMouseDown={handleBackgroundMouseDown}
                onMouseMove={handleContainerMouseMove}
                onMouseLeave={handleContainerMouseLeave}
                onContextMenu={handleContextMenu}
            >
                <TimelineGrid 
                    totalWidth={containerDimensions.width}
                    viewportHeight={containerDimensions.height}
                    pixelsPerSecond={pixelsPerSecond}
                    scrollLeft={scrollLeft}
                />

                <TrackLayer
                    tracks={tracks}
                    trackLayouts={trackLayouts}
                    clipsMap={clipsMap}
                    getResource={getResource}
                    pixelsPerSecond={pixelsPerSecond}
                    selectedClipId={selectedClipId}
                    selectedClipIds={selectedClipIds}
                    onClipSelect={onClipSelect}
                    visibleTimeStart={visibleTimeStart}
                    visibleTimeEnd={visibleTimeEnd}
                    visibleTrackIndices={visibleTrackIndices}
                    onTrackSelect={selectTrack}
                    onClipDragStart={startClipDrag}
                />

                <DragOverlay
                    isVisible={isGhostVisible}
                    dragOperation={dragOperation}
                    interaction={interaction}
                    clipsMap={clipsMap}
                    trackLayouts={trackLayouts}
                    getResource={getResource}
                    pixelsPerSecond={pixelsPerSecond}
                />

                <InteractionLayer
                    interaction={interaction}
                    containerRef={containerRef}
                    pixelsPerSecond={pixelsPerSecond}
                    trackLayouts={trackLayouts}
                    clipsMap={clipsMap}
                    getResource={getResource}
                    calculateSnap={calculateSnap}
                    prepareSnapPoints={prepareSnapPoints}
                    autoScrollSpeed={autoScrollSpeed}
                    stopAutoScroll={stopAutoScroll}
                    moveClip={moveClip}
                    trimClip={trimClip}
                    insertTrackAndMoveClip={insertTrackAndMoveClip}
                    setInteraction={setInteraction}
                    validateTrackDrop={validateTrackDrop}
                    checkCollision={checkCollision}
                    playerController={playerController}
                />
                
                <InOutPointOverlay />
            </div>
            
            <TimelineMenuLayer />
        </>
    );
};

export default TimelineCanvas;

