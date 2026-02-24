
import { formatFrameTime } from '../../utils/timeUtils';
import { TIMELINE_CONSTANTS } from '../../constants';
import React, { useRef, useEffect } from 'react';
import { useMagicCutStore } from '../../store/magicCutStore';
;
;
import { useMagicCutBus } from '../../providers/MagicCutEventProvider';
import { MagicCutEvents, SkimPayload } from '../../events';

interface TimelinePreviewAxisProps {
    duration: number;
    pixelsPerSecond: number;
    containerWidth: number;
    scrollContainerRef: React.RefObject<HTMLElement>;
}

/**
 * TimelinePreviewAxis - Preview Axis Ruler (Skimmer)
 * 
 * Responsibilities:
 * - Displays the blue skimmer handle and timecode tooltip.
 * - Listens to 'TIMELINE_SKIM' events.
 * - Uses direct store access for 'scrollLeft' to prevent jitter during scroll.
 */
export const TimelinePreviewAxis: React.FC<TimelinePreviewAxisProps> = ({
    duration,
    pixelsPerSecond,
    containerWidth,
    scrollContainerRef
}) => {
    const { store } = useMagicCutStore(); // Access vanilla store for direct reading
    const bus = useMagicCutBus();
    const rulerHandleRef = useRef<HTMLDivElement>(null);
    const timecodeRef = useRef<HTMLDivElement>(null);
    
    // Update position logic
    const updatePosition = (time: number | null) => {
        const rulerHandle = rulerHandleRef.current;
        const timecode = timecodeRef.current;
        
        if (!rulerHandle || !timecode) return;

        if (time !== null) {
            // Read latest scroll position directly to avoid stale closure or re-render
            const scrollLeft = store.getState().scrollLeft;
            
            // Project Space -> Screen Space
            const projectX = time * pixelsPerSecond;
            const screenX = projectX - scrollLeft;
            
            // Bounds check (allow slight overhang for handle visibility)
            // Note: We use the store's containerWidth if available, else fallback to prop
            const width = store.getState().containerWidth || containerWidth;
            
            if (screenX < -10 || screenX > width + 10) {
                 rulerHandle.style.opacity = '0';
                 timecode.style.opacity = '0';
                 return;
            }

            const transform = `translateX(${screenX}px) translateX(-50%)`;
            
            rulerHandle.style.display = 'block';
            rulerHandle.style.opacity = '1';
            rulerHandle.style.transform = transform;
            
            timecode.style.opacity = '1';
            timecode.style.transform = transform;
            timecode.textContent = formatFrameTime(time);
        } else {
            rulerHandle.style.opacity = '0';
            timecode.style.opacity = '0';
        }
    };

    // Event Listener
    useEffect(() => {
        const handleSkim = (payload: SkimPayload) => {
            updatePosition(payload.time);
        };
        
        // Subscribe
        const unsubscribe = bus.on(MagicCutEvents.TIMELINE_SKIM, handleSkim);
        
        return () => {
            unsubscribe();
        };
    }, [bus, pixelsPerSecond, containerWidth]); // Removed scrollLeft from dependency

    return (
        <div 
            className="absolute inset-0 pointer-events-none z-[80]"
            style={{ height: TIMELINE_CONSTANTS.RULER_HEIGHT }}
        >
            {/* Skimmer Handle - Blue Triangle */}
            <div 
                ref={rulerHandleRef}
                className="absolute top-0 will-change-transform transition-opacity duration-75"
                style={{ 
                    left: 0,
                    opacity: 0,
                    transform: 'translateX(0) translateX(-50%)',
                    height: '100%'
                }}
            >
                <div className="relative flex flex-col items-center h-full">
                    {/* Triangle Head */}
                    <svg width="11" height="12" viewBox="0 0 11 12" fill="none" style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.3))' }}>
                        <path d="M0 0H11V6L5.5 11L0 6V0Z" fill="#60A5FA" />
                    </svg>
                    {/* Vertical Line extension in ruler */}
                    <div className="w-px bg-blue-400/50 flex-1 mt-[-1px]"></div>
                </div>
            </div>

            {/* Timecode Tooltip - Floating above */}
            <div 
                ref={timecodeRef}
                className="absolute -top-8 will-change-transform transition-opacity duration-75 px-2 py-1 rounded-md text-[10px] font-mono font-medium text-white border border-white/10"
                style={{ 
                    left: 0,
                    opacity: 0,
                    transform: 'translateX(0) translateX(-50%)',
                    background: '#1f2937', // Gray-800
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)',
                    whiteSpace: 'nowrap',
                    zIndex: 90
                }}
            >
                00:00:00:00
            </div>
        </div>
    );
};

export default TimelinePreviewAxis;

