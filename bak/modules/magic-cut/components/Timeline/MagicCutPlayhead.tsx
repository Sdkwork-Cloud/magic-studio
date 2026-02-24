
import React, { useRef, useEffect } from 'react';
import { useMagicCutStore } from '../../store/magicCutStore';
import { TIMELINE_CONSTANTS } from '../../constants';

interface MagicCutPlayheadProps {
    scrollContainerRef: React.RefObject<HTMLElement>;
    containerHeight: number;
}

export const MagicCutPlayhead: React.FC<MagicCutPlayheadProps> = ({ scrollContainerRef, containerHeight }) => {
    const { useTransientState, playerController, store } = useMagicCutStore();
    const zoomLevel = useTransientState(s => s.zoomLevel);
    
    const containerRef = useRef<HTMLDivElement>(null);
    
    // Register DOM node with controller for high-frequency updates (60fps) without React re-renders
    useEffect(() => {
        playerController.setPlayheadDOM(containerRef.current);
        return () => playerController.setPlayheadDOM(null);
    }, [playerController]);

    // React only handles layout changes (Zoom / Initial Placement)
    // The animation loop in PlayerController handles the position updates during playback
    useEffect(() => {
        if (containerRef.current) {
            // Get current state directly from store to avoid subscription overhead in this effect
            const state = store.getState();
            const time = state.currentTime;
            
            const pixelsPerSecond = TIMELINE_CONSTANTS.DEFAULT_PIXELS_PER_SECOND * zoomLevel;
            const currentPos = time * pixelsPerSecond;
            
            // Initial placement
            containerRef.current.style.transform = `translate3d(${currentPos}px, 0, 0)`;
            containerRef.current.style.display = 'block';
        }
    }, [zoomLevel, store]); 

    return (
        <div className="absolute inset-0 z-50 pointer-events-none" style={{ height: containerHeight }}>
            {/* Playhead Line (Red) */}
            <div 
                ref={containerRef}
                className="absolute top-0 bottom-0 w-px bg-[#EF4444] z-50 pointer-events-none will-change-transform"
                style={{ 
                    transform: 'translate3d(0,0,0)',
                    boxShadow: '0 0 4px rgba(239, 68, 68, 0.4)' 
                }} 
            />
        </div>
    );
};
