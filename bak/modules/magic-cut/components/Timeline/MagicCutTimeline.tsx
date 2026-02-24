
import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useMagicCutStore } from '../../store/magicCutStore';
import { TimelineCanvas } from './canvas/TimelineCanvas';
import { TimelineEditAxis } from './TimelineEditAxis';
import { TimelinePreviewAxis } from './TimelinePreviewAxis';
import { MagicCutPlayhead } from './MagicCutPlayhead';
import { TimelineSkimmerLine } from './TimelineSkimmerLine';
import { MagicCutTimelineToolbar } from './MagicCutTimelineToolbar';
import { TimelineTabBar } from './TimelineTabBar';
import { useTimeline } from './hooks/useTimeline';
import { MagicCutTrackHeader } from './MagicCutTrackHeader';
import { InOutPointOverlay } from './InOutPointOverlay';
import { TIMELINE_CONSTANTS } from '../../constants';
import { Plus, Video, Mic, Type, Sparkles } from 'lucide-react';
import { CutTrackType } from '../../entities/magicCut.entity';
import { useMagicCutBus } from '../../providers/MagicCutEventProvider';
import { MagicCutEvents } from '../../events';
import { useShortcuts } from '../../hooks/useShortcuts';
import { MagicCutErrorBoundary } from '../ErrorBoundary/MagicCutErrorBoundary';

export interface MagicCutTimelineProps {
    className?: string;
    style?: React.CSSProperties;
}

export const MagicCutTimeline: React.FC<MagicCutTimelineProps> = ({ className, style }) => {
    const bus = useMagicCutBus();
    const {
        totalDuration,
        selectedClipId, selectClip, selectedClipIds,
        getResource,
        activeTimeline,
        updateTrack,
        selectTrack,
        addTrack,
        playerController,
        store,
        useTransientState,
        isSkimmingEnabled
    } = useMagicCutStore();

    useShortcuts();

    const scrollLeft = useTransientState(s => s.scrollLeft);
    const scrollTop = useTransientState(s => s.scrollTop);
    const zoomLevel = useTransientState(s => s.zoomLevel);
    const interaction = useTransientState(s => s.interaction);
    const dragOperation = useTransientState(s => s.dragOperation);
    const isPlaying = useTransientState(s => s.isPlaying);

    const tracksContainerRef = useRef<HTMLDivElement>(null);
    const headersContainerRef = useRef<HTMLDivElement>(null);
    const rulerContainerRef = useRef<HTMLDivElement>(null);
    const cornerRef = useRef<HTMLDivElement>(null);
    const timelineGridRef = useRef<HTMLDivElement>(null);
    const observerRef = useRef<ResizeObserver | null>(null);

    const [containerSize, setContainerSize] = React.useState({ width: 0, height: 0 });
    const [showTrackMenu, setShowTrackMenu] = useState(false);
    const [showCornerMenu, setShowCornerMenu] = useState(false);

    const trackMenuRef = useRef<HTMLDivElement>(null);
    const cornerMenuRef = useRef<HTMLDivElement>(null);

    const handleTimelineMouseMove = useCallback((e: React.MouseEvent) => {
        if (!isSkimmingEnabled || interaction.type !== 'idle' || dragOperation || isPlaying) {
            bus.emit(MagicCutEvents.TIMELINE_SKIM, { time: null });
            return;
        }

        if (tracksContainerRef.current) {
            const rect = tracksContainerRef.current.getBoundingClientRect();
            const relX = e.clientX - rect.left;

            if (relX < 0 || relX > rect.width) {
                bus.emit(MagicCutEvents.TIMELINE_SKIM, { time: null });
                return;
            }

            const pps = TIMELINE_CONSTANTS.DEFAULT_PIXELS_PER_SECOND * zoomLevel;
            const absoluteX = relX + scrollLeft;
            const time = Math.max(0, absoluteX / pps);

            bus.emit(MagicCutEvents.TIMELINE_SKIM, { time });
            playerController.skim(time);
        }
    }, [isSkimmingEnabled, interaction.type, dragOperation, isPlaying, zoomLevel, scrollLeft, bus, playerController]);

    const handleTimelineMouseLeave = useCallback(() => {
        bus.emit(MagicCutEvents.TIMELINE_SKIM, { time: null });
        playerController.skim(null);
    }, [bus, playerController]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (trackMenuRef.current && !trackMenuRef.current.contains(e.target as Node)) {
                setShowTrackMenu(false);
            }
            if (cornerMenuRef.current && !cornerMenuRef.current.contains(e.target as Node)) {
                setShowCornerMenu(false);
            }
        };
        if (showTrackMenu || showCornerMenu) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showTrackMenu, showCornerMenu]);

    const handleAddTrack = (type: CutTrackType) => {
        addTrack(type);
        setShowTrackMenu(false);
        setShowCornerMenu(false);
    };

    const setTracksRef = useCallback((node: HTMLDivElement | null) => {
        (tracksContainerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;

        if (observerRef.current) {
            observerRef.current.disconnect();
            observerRef.current = null;
        }

        if (node) {
            // Bind container to controller for auto-scroll
            playerController.setScrollContainerDOM(node);

            const observer = new ResizeObserver((entries) => {
                for (const entry of entries) {
                    const { width, height } = entry.contentRect;
                    setContainerSize(prev => {
                        if (Math.abs(prev.width - width) < 1 && Math.abs(prev.height - height) < 1) return prev;
                        return { width, height };
                    });
                    store.setState({ containerWidth: width, containerHeight: height });
                }
            });
            observer.observe(node);
            observerRef.current = observer;

            // Sync initial scroll
            const state = store.getState();
            if (node.scrollTop !== state.scrollTop) node.scrollTop = state.scrollTop;
            if (node.scrollLeft !== state.scrollLeft) node.scrollLeft = state.scrollLeft;
        } else {
            playerController.setScrollContainerDOM(null);
        }
    }, [playerController, store]);

    const {
        pixelsPerSecond,
        totalWidth,
        totalHeight,
        visibleTimeStart,
        visibleTimeEnd,
        timelineTracks,
        trackLayouts,
        visibleTrackIndices,
        clipsMap,
        handleMouseDown,
        handleMouseMove,
        handleMouseLeave,
        handleDragEnterEmpty,
        handleDragOverEmpty,
        handleDragLeaveEmpty,
        handleDropEmpty,
        handleHeaderDragOver,
        handleHeaderDrop
    } = useTimeline(containerSize.width, containerSize.height, tracksContainerRef);

    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        const target = e.currentTarget;
        const left = target.scrollLeft;
        const top = target.scrollTop;

        // Sync header vertical scroll
        if (headersContainerRef.current) {
            headersContainerRef.current.scrollTop = top;
        }

        // Sync player controller visual elements (ruler, playhead)
        playerController.syncScroll(left);
        store.setState({ scrollLeft: left, scrollTop: top });
    }, [store, playerController]);

    // Force sync scroll if store updates externally (e.g. Fit View)
    useEffect(() => {
        const tracks = tracksContainerRef.current;
        const headers = headersContainerRef.current;

        if (tracks) {
            if (Math.abs(tracks.scrollLeft - scrollLeft) > 1) tracks.scrollLeft = scrollLeft;
            if (Math.abs(tracks.scrollTop - scrollTop) > 1) tracks.scrollTop = scrollTop;
        }
        if (headers && Math.abs(headers.scrollTop - scrollTop) > 1) headers.scrollTop = scrollTop;

    }, [scrollLeft, scrollTop]);

    const HEADER_WIDTH = TIMELINE_CONSTANTS.HEADER_WIDTH;
    const RULER_HEIGHT = TIMELINE_CONSTANTS.RULER_HEIGHT;

    const finalScrollHeight = Math.max(totalHeight + 100, containerSize.height);
    const finalScrollWidth = Math.max(containerSize.width, totalWidth);

    return (
        <div className={`flex flex-col h-full bg-zinc-950 border-t border-white/5 select-none ${className || ''}`} style={style}>
            <TimelineTabBar />
            <MagicCutTimelineToolbar />

            {/* Main Grid Wrapper */}
            <MagicCutErrorBoundary componentName="MagicCut Timeline">
                <div
                    className="flex-1 min-h-0 relative grid"
                    style={{
                        gridTemplateColumns: `${HEADER_WIDTH}px 1fr`,
                        gridTemplateRows: `${RULER_HEIGHT}px 1fr`
                    }}
                    onMouseMove={handleTimelineMouseMove}
                    onMouseLeave={handleTimelineMouseLeave}
                    ref={timelineGridRef}
                >

                    {/* 3.1. Top Left Corner (Fixed) */}
                    <div
                        ref={cornerRef}
                        className={`border-b border-r border-zinc-800 z-50 flex items-center justify-between px-3 bg-zinc-950 relative shadow-sm`}
                    >
                        <span className="text-[10px] text-zinc-500 font-bold tracking-widest">TRACKS</span>
                        <div className="relative" ref={cornerMenuRef}>
                            <button
                                onClick={() => setShowCornerMenu(!showCornerMenu)}
                                className={`p-1 rounded-md hover:bg-zinc-800 transition-colors ${showCornerMenu ? 'text-white bg-zinc-800' : 'text-zinc-500 hover:text-white'}`}
                            >
                                <Plus size={14} />
                            </button>
                            {showCornerMenu && (
                                <div className="absolute top-full left-0 mt-1 w-32 bg-[#252526] border border-[#333] rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-75 flex flex-col p-1">
                                    <div className="px-2 py-1 text-[9px] font-bold text-gray-500 uppercase">Add Track</div>
                                    <TrackMenuItem onClick={() => handleAddTrack('video')} icon={<Video size={12} />} label="Video" />
                                    <TrackMenuItem onClick={() => handleAddTrack('audio')} icon={<Mic size={12} />} label="Audio" />
                                    <TrackMenuItem onClick={() => handleAddTrack('text')} icon={<Type size={12} />} label="Text" />
                                    <TrackMenuItem onClick={() => handleAddTrack('effect')} icon={<Sparkles size={12} />} label="Effect" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 3.2. Ruler Container */}
                    <div
                        ref={rulerContainerRef}
                        className={`border-b border-zinc-800 relative z-40 bg-zinc-950`}
                        style={{ overflow: 'visible', height: RULER_HEIGHT }}
                    >
                        <TimelineEditAxis
                            duration={totalDuration}
                            pixelsPerSecond={pixelsPerSecond}
                            containerWidth={Math.max(containerSize.width, 0)}
                            scrollContainerRef={tracksContainerRef}
                        />
                        <TimelinePreviewAxis
                            duration={totalDuration}
                            pixelsPerSecond={pixelsPerSecond}
                            containerWidth={Math.max(containerSize.width, 0)}
                            scrollContainerRef={tracksContainerRef}
                        />
                    </div>

                    {/* 3.3. Headers Container */}
                    <div
                        ref={headersContainerRef}
                        className={`overflow-hidden border-r border-zinc-800 relative z-30 bg-zinc-950 shadow-sm`}
                        onDragOver={handleHeaderDragOver}
                        onDrop={handleHeaderDrop}
                        onWheel={(e) => {
                            if (tracksContainerRef.current) {
                                tracksContainerRef.current.scrollTop += e.deltaY;
                            }
                        }}
                    >
                        <div className="relative w-full" style={{ height: Math.max(totalHeight, containerSize.height) }}>
                            {visibleTrackIndices.map((index) => {
                                const track = timelineTracks[index];
                                const layout = trackLayouts[index];
                                if (!track || !layout) return null;
                                return (
                                    <div key={track.id} style={{ position: 'absolute', top: layout.top, height: layout.height, width: '100%' }}>
                                        <MagicCutTrackHeader
                                            track={track}
                                            height={layout.height}
                                        />
                                    </div>
                                );
                            })}
                            <div
                                style={{
                                    position: 'absolute',
                                    top: totalHeight,
                                    width: '100%',
                                    padding: '8px'
                                }}
                            >
                                <div className="relative" ref={trackMenuRef}>
                                    <button
                                        onClick={() => setShowTrackMenu(!showTrackMenu)}
                                        className="w-full py-1.5 flex items-center justify-center gap-1.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-[10px] text-zinc-400 hover:text-white transition-colors"
                                    >
                                        <Plus size={12} /> Add Track
                                    </button>
                                    {showTrackMenu && (
                                        <div className="absolute top-full left-0 w-full mt-1 bg-[#252526] border border-[#333] rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-75 flex flex-col p-1">
                                            <TrackMenuItem onClick={() => handleAddTrack('video')} icon={<Video size={12} />} label="Video Track" />
                                            <TrackMenuItem onClick={() => handleAddTrack('audio')} icon={<Mic size={12} />} label="Audio Track" />
                                            <TrackMenuItem onClick={() => handleAddTrack('text')} icon={<Type size={12} />} label="Text Track" />
                                            <TrackMenuItem onClick={() => handleAddTrack('effect')} icon={<Sparkles size={12} />} label="Effect Track" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 3.4. Main Tracks Area */}
                    <div
                        ref={setTracksRef}
                        className={`overflow-scroll relative custom-scrollbar bg-zinc-950 outline-none z-10`}
                        onScroll={handleScroll}
                        onMouseDown={handleMouseDown}
                        onDragEnter={handleDragEnterEmpty}
                        onDragOver={handleDragOverEmpty}
                        onDragLeave={handleDragLeaveEmpty}
                        onDrop={handleDropEmpty}
                        tabIndex={-1}
                    >
                        <div className="relative" style={{ width: finalScrollWidth, height: finalScrollHeight }}>
                            <TimelineCanvas
                                tracks={timelineTracks}
                                trackLayouts={trackLayouts}
                                clipsMap={clipsMap}
                                getResource={getResource}
                                pixelsPerSecond={pixelsPerSecond}
                                selectedClipId={selectedClipId}
                                selectedClipIds={selectedClipIds}
                                onClipSelect={selectClip}
                                visibleTimeStart={visibleTimeStart}
                                visibleTimeEnd={visibleTimeEnd}
                                visibleTrackIndices={visibleTrackIndices}
                                containerRef={tracksContainerRef}
                            />

                            <MagicCutPlayhead
                                scrollContainerRef={tracksContainerRef}
                                containerHeight={finalScrollHeight}
                            />

                            <TimelineSkimmerLine
                                containerHeight={finalScrollHeight}
                            />
                        </div>
                    </div>
                </div>
            </MagicCutErrorBoundary>
        </div>
    );
};

const TrackMenuItem: React.FC<{ onClick: () => void, icon: React.ReactNode, label: string }> = ({ onClick, icon, label }) => (
    <button
        onMouseDown={(e) => {
            // Stop propagation to prevent document 'mousedown' listener from closing menu before action fires
            e.stopPropagation();
            e.preventDefault();
            onClick();
        }}
        className="flex items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:text-white hover:bg-[#094771] rounded-md transition-colors w-full text-left"
    >
        {icon} {label}
    </button>
);
