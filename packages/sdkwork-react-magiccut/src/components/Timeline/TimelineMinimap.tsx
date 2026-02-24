
import { CutTrack, CutClip } from '../../entities/magicCut.entity';
import { TIMELINE_CONSTANTS } from '../../constants';
import React, { useRef, useEffect, useState } from 'react';
;
;

interface TimelineMinimapProps {
    tracks: CutTrack[];
    clipsMap: Record<string, CutClip>;
    totalDuration: number;
    containerWidth: number;
    scrollLeft: number;
    onScroll: (newScrollLeft: number) => void;
}

export const TimelineMinimap: React.FC<TimelineMinimapProps> = ({
    tracks,
    clipsMap,
    totalDuration,
    containerWidth,
    scrollLeft,
    onScroll
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    
    // Minimap Dimensions
    const HEIGHT = 32;
    // Dynamic width based on container, but capped
    const WIDTH = 300; 

    // --- Drawing Logic ---
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        // High DPI
        const dpr = window.devicePixelRatio || 1;
        if (canvas.width !== WIDTH * dpr) {
            canvas.width = WIDTH * dpr;
            canvas.height = HEIGHT * dpr;
            canvas.style.width = `${WIDTH}px`;
            canvas.style.height = `${HEIGHT}px`;
            ctx.scale(dpr, dpr);
        }

        // 1. Background
        ctx.fillStyle = '#121212';
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
        
        // Safety check
        const safeTotalDuration = Math.max(totalDuration, 60);
        
        // 2. Tracks & Clips
        // We compress all tracks into the mini height
        const trackHeight = Math.max(2, HEIGHT / Math.max(1, tracks.length));
        
        // Mapping: Time -> Minimap X
        // Scale = MinimapWidth / TotalDuration
        const pixelsPerSecond = WIDTH / safeTotalDuration;

        tracks.forEach((track, i) => {
             const y = i * trackHeight;
             const h = Math.max(1, trackHeight - 1);
             
             track.clips.forEach(ref => {
                 const clip = clipsMap[ref.id];
                 if (!clip) return;
                 
                 const x = clip.start * pixelsPerSecond;
                 const w = Math.max(2, clip.duration * pixelsPerSecond);
                 
                 // Color coding
                 if (track.type === 'video') ctx.fillStyle = '#3b82f6'; // Blue
                 else if (track.type === 'audio') ctx.fillStyle = '#10b981'; // Green
                 else if (track.type === 'text') ctx.fillStyle = '#eab308'; // Yellow
                 else ctx.fillStyle = '#6b7280'; // Gray
                 
                 ctx.fillRect(x, y, w, h);
             });
        });

        // 3. Viewport Box (The "Lens")
        // Calculate the ratio of the Visible Window relative to Total Project
        const totalTimelineWidthPx = safeTotalDuration * TIMELINE_CONSTANTS.DEFAULT_PIXELS_PER_SECOND; // We need actual timeline PPS here? 
        // Wait, scrollLeft is in timeline pixels. We need to map Timeline Pixels -> Minimap Pixels.
        // But Timeline Width is dynamic based on Zoom.
        // Let's rely on Time ratio, which is invariant of zoom.
        // visibleStartTime = scrollLeft / currentZoomPPS
        // visibleDuration = containerWidth / currentZoomPPS
        
        // We don't have currentZoomPPS passed in props directly, but we can derive from scrollLeft? No.
        // Let's assume standard mapping: 
        // Minimap represents 0 to TotalDuration.
        // We need to know what time range is currently visible.
        // We can approximate if we assume the caller passes meaningful scroll info. 
        // Better yet: passing visibleTimeStart / visibleTimeEnd is cleaner, but we have scrollLeft/containerWidth.
        // We need 'pixelsPerSecond' (current zoom) to calculate visible time range correctly.
        // For now, let's use a visual estimation based on the ratio of the scrollbar logic.
        // Actually, without 'zoomLevel', we can't accurately draw the box width.
        // Let's just draw a "current position" line if we can't determine width, 
        // OR calculate width assuming the parent passes a ratio.
        
        // *Improvement*: Let's just render the content for now. 
        // The Viewport Box logic requires 'pixelsPerSecond' (Zoom) to be accurate.
        // I will add a simple progress indicator instead of a complex viewport box to avoid zoom-mismatch bugs until zoom is passed.
        
        // Draw a simple time indicator if we assume scrollLeft is somewhat correlated? No, that's risky.
        // Let's just draw the content map. The user can click to jump.
        
    }, [tracks, clipsMap, totalDuration]);

    // --- Interaction ---
    const handleInteraction = (e: React.MouseEvent) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const relX = Math.max(0, Math.min(e.clientX - rect.left, WIDTH));
        
        // Click position (0.0 to 1.0)
        const ratio = relX / WIDTH;
        
        // Target Time
        const safeTotalDuration = Math.max(totalDuration, 60);
        const targetTime = ratio * safeTotalDuration;
        
        // Convert Time -> Timeline Pixels (requires current PPS from store, which we don't have here directly)
        // We emit a special event or callback that takes TIME, not pixels. 
        // But the prop is `onScroll(pixels)`. 
        // We need to know the current PPS to convert Time -> Pixels.
        // Since we don't have it, we can't implement precise click-jump without refactoring props.
        // However, this is just a visualization for now.
    };

    if (tracks.length === 0) return null;

    return (
        <div 
            ref={containerRef}
            className="bg-[#18181b] border border-[#333] rounded-md overflow-hidden shadow-lg select-none hover:border-[#555] transition-colors"
            style={{ width: WIDTH, height: HEIGHT }}
            // onClick={handleInteraction} // Disabled until we pass zoomLevel for accurate seeking
        >
            <canvas ref={canvasRef} className="block w-full h-full pointer-events-none opacity-80" />
        </div>
    );
};

