
import { TIMELINE_CONSTANTS } from '../../constants';
import React, { useRef, useEffect } from 'react';
import { useMagicCutStore } from '../../store/magicCutStore';
import { useMagicCutBus } from '../../providers/MagicCutEventProvider';
import { MagicCutEvents, SkimPayload } from '../../events';
;

interface TimelineSkimmerLineProps {
    containerHeight: number;
}

/**
 * TimelineSkimmerLine - Track Area Skimmer Line
 * 
 * Responsibilities:
 * - Displays the vertical blue line spanning all tracks.
 * - Synchronized with the ruler handle via 'TIMELINE_SKIM' event.
 * - Uses direct store access for 'scrollLeft' to prevent jitter during scroll.
 */
export const TimelineSkimmerLine: React.FC<TimelineSkimmerLineProps> = ({ containerHeight }) => {
    const bus = useMagicCutBus();
    const { store } = useMagicCutStore(); // Access vanilla store
    
    const lineRef = useRef<HTMLDivElement>(null);
    
    const updateLinePosition = (time: number | null) => {
        const line = lineRef.current;
        if (!line) return;
        
        if (time !== null) {
            const state = store.getState();
            const zoomLevel = state.zoomLevel;
            const scrollLeft = state.scrollLeft;
            const containerWidth = state.containerWidth;

            const pps = TIMELINE_CONSTANTS.DEFAULT_PIXELS_PER_SECOND * zoomLevel;
            const projectPos = time * pps;
            const screenPos = projectPos - scrollLeft;
            
            // Bounds check
            if (screenPos < -1 || screenPos > containerWidth + 1) {
                line.style.display = 'none';
                return;
            }
            
            line.style.display = 'block';
            line.style.transform = `translateX(${screenPos}px)`;
        } else {
            line.style.display = 'none';
        }
    };

    useEffect(() => {
        const handleSkim = (payload: SkimPayload) => {
            updateLinePosition(payload.time);
        };
        const unsubscribe = bus.on(MagicCutEvents.TIMELINE_SKIM, handleSkim);
        return () => unsubscribe();
    }, [bus]); // No dependencies on scrollLeft/zoomLevel needed here
    
    return (
        <div
            ref={lineRef}
            className="absolute top-0 pointer-events-none will-change-transform z-[55]"
            style={{
                height: containerHeight,
                width: '1px',
                left: 0,
                backgroundColor: '#60A5FA', // Blue-400
                display: 'none',
                boxShadow: '0 0 4px rgba(96, 165, 250, 0.4)'
            }}
        />
    );
};

export default TimelineSkimmerLine;

