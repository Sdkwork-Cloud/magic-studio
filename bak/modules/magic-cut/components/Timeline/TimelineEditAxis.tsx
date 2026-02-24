
import React, { useRef, useCallback, useEffect, useState } from 'react';
import { useMagicCutStore } from '../../store/magicCutStore';
import { MagicCutRuler } from './MagicCutRuler';
import { TIMELINE_CONSTANTS } from '../../constants';

interface TimelineEditAxisProps {
    duration: number;
    pixelsPerSecond: number;
    containerWidth: number;
    scrollContainerRef: React.RefObject<HTMLElement>;
}

/**
 * TimelineEditAxis - Edit Axis (Ruler + Playhead)
 * 
 * Responsibilities:
 * - Displays the time ruler.
 * - Handles Playhead (Red) dragging and clicking.
 * - Ensures precise seeking.
 */
export const TimelineEditAxis: React.FC<TimelineEditAxisProps> = ({
    duration,
    pixelsPerSecond,
    containerWidth,
    scrollContainerRef
}) => {
    const { 
        seek, 
        state, 
        activeTimelineId, 
        previewRange,
        playerController,
        store
    } = useMagicCutStore();

    const timeline = activeTimelineId ? state.timelines[activeTimelineId] : null;
    const containerRef = useRef<HTMLDivElement>(null);
    const handleRef = useRef<HTMLDivElement>(null);
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [isDragging, setIsDragging] = useState(false);
    
    // Calculate time from mouse X
    const getTimeAtMouse = useCallback((clientX: number) => {
        if (!containerRef.current || !scrollContainerRef.current) return 0;
        const rect = containerRef.current.getBoundingClientRect();
        const relativeX = clientX - rect.left;
        const scrollLeft = scrollContainerRef.current.scrollLeft;
        const absoluteX = relativeX + scrollLeft;
        return Math.max(0, Math.min(duration, absoluteX / pixelsPerSecond));
    }, [pixelsPerSecond, scrollContainerRef, duration]);

    // Playhead Drag Handling
    const handlePlayheadMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (playerController.getIsPlaying()) {
            playerController.pause();
        }

        setIsDragging(true);
        document.body.style.cursor = 'ew-resize';

        const handleWindowMouseMove = (ev: MouseEvent) => {
            ev.preventDefault();
            const t = getTimeAtMouse(ev.clientX);
            playerController.scrub(t);
        };
        
        const handleWindowMouseUp = (ev: MouseEvent) => {
            ev.preventDefault();
            setIsDragging(false);
            document.body.style.cursor = 'default';
            window.removeEventListener('mousemove', handleWindowMouseMove);
            window.removeEventListener('mouseup', handleWindowMouseUp);
            const t = getTimeAtMouse(ev.clientX);
            seek(t);
        };

        window.addEventListener('mousemove', handleWindowMouseMove);
        window.addEventListener('mouseup', handleWindowMouseUp);
    }, [playerController, seek, getTimeAtMouse]);

    // Click on Ruler to Jump
    const handleContainerMouseDown = useCallback((e: React.MouseEvent) => {
        if (e.button !== 0 || (e.target as HTMLElement).closest('.playhead-handle')) return;
        
        if (playerController.getIsPlaying()) {
            playerController.pause();
        }

        const t = getTimeAtMouse(e.clientX);
        seek(t);
    }, [playerController, seek, getTimeAtMouse]);

    // Register Handle DOM to Controller for high-freq updates
    useEffect(() => {
        playerController.setRulerHandleDOM(handleRef.current);
        return () => {
            playerController.setRulerHandleDOM(null);
        };
    }, [playerController]);

    // Initial position sync logic (fallback) is handled by PlayerController update loop,
    // but we ensure visibility here on mount/resize
    useEffect(() => {
        if (handleRef.current && scrollContainerRef.current) {
            const time = playerController.getCurrentTime();
            const pos = time * pixelsPerSecond;
            const scrollLeft = scrollContainerRef.current.scrollLeft;
            const relativePos = pos - scrollLeft;
            
            handleRef.current.style.transform = `translate3d(${relativePos}px, 0, 0) translateX(-50%)`;
            
            if (relativePos >= -20 && relativePos <= containerWidth + 20) {
                 handleRef.current.style.display = 'block';
            } else {
                 handleRef.current.style.display = 'none';
            }
        }
    }, [pixelsPerSecond, containerWidth, playerController, scrollContainerRef]);

    return (
        <div 
            ref={containerRef}
            className="h-full relative bg-[#0a0a0a] select-none w-full border-b border-[#27272a]"
            onMouseDown={handleContainerMouseDown}
        >
            {/* 1. Ruler Canvas */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <MagicCutRuler 
                    duration={duration}
                    pixelsPerSecond={pixelsPerSecond}
                    width={containerWidth}
                    height={TIMELINE_CONSTANTS.RULER_HEIGHT}
                    markers={timeline?.markers || []}
                    previewRange={previewRange}
                    scrollContainerRef={scrollContainerRef}
                />
            </div>

            {/* 2. Playhead Handle (Red) */}
            <div 
                ref={handleRef}
                className="playhead-handle absolute top-0 bottom-0 z-[60] cursor-ew-resize group"
                style={{ left: 0, willChange: 'transform' }} 
                onMouseDown={handlePlayheadMouseDown}
            >
                <div className="relative flex flex-col items-center h-full">
                    {/* Pentagon Head */}
                    <div className="relative filter drop-shadow-sm transition-transform group-hover:scale-110">
                         <svg width="13" height="14" viewBox="0 0 13 14" fill="none">
                            <path d="M0 0H13V8L6.5 14L0 8V0Z" fill="#EF4444" />
                        </svg>
                    </div>
                    {/* Vertical line hint inside ruler */}
                    <div className="w-px bg-red-500/50 flex-1 mt-[-1px]"></div>

                    {/* Invisible Hit Area expansion */}
                    <div className="absolute -top-2 -bottom-2 -left-3 -right-3 bg-transparent cursor-ew-resize" />
                </div>
            </div>
        </div>
    );
};

export default TimelineEditAxis;
