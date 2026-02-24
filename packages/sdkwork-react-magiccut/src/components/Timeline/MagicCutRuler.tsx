
import { TimelineMarker } from '../../entities/magicCut.entity';
import { TIMELINE_CONSTANTS } from '../../constants';
import { formatRulerLabel, determineTimeStep } from '../../utils/timeUtils';
import React, { useRef, useEffect } from 'react';
;
;
import { useMagicCutStore } from '../../store/magicCutStore';
;

interface MagicCutRulerProps {
    duration: number;
    pixelsPerSecond: number;
    width: number;
    height?: number;
    markers?: TimelineMarker[];
    previewRange?: { start: number; end: number } | null;
    scrollContainerRef: React.RefObject<HTMLElement>;
}

export const MagicCutRuler: React.FC<MagicCutRulerProps> = ({
    pixelsPerSecond,
    width,
    height = TIMELINE_CONSTANTS.RULER_HEIGHT,
    markers = [],
    previewRange,
    scrollContainerRef
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { project } = useMagicCutStore();
    const fps = project.settings.fps || 30;

    const draw = React.useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        if (width <= 0) return;

        const ctx = canvas.getContext('2d', { alpha: false }); // Disable alpha for perf where possible
        if (!ctx) return;

        const currentScrollLeft = scrollContainerRef.current?.scrollLeft || 0;

        const dpr = window.devicePixelRatio || 1;
        const targetW = width * dpr;
        const targetH = height * dpr;
        
        // Resize canvas only if needed to avoid flicker
        if (canvas.width !== targetW || canvas.height !== targetH) {
            canvas.width = targetW;
            canvas.height = targetH;
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;
        }
        
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0); 
        
        // 1. Background
        ctx.fillStyle = '#0a0a0a'; 
        ctx.fillRect(0, 0, width, height);
        
        // 2. Bottom Border
        ctx.strokeStyle = '#27272a';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, height - 0.5);
        ctx.lineTo(width, height - 0.5);
        ctx.stroke();

        ctx.font = '10px "JetBrains Mono", "Inter", monospace'; // Monospace for alignment
        ctx.textBaseline = 'top';

        // 3. Calculation
        // Add buffer to draw slightly outside viewport
        const startPixel = currentScrollLeft;
        const endPixel = currentScrollLeft + width;
        
        const minTickSpacing = 80; 
        const timeStep = determineTimeStep(pixelsPerSecond, minTickSpacing, fps);
        
        // Align start to the nearest step
        const startStepIndex = Math.floor(startPixel / (timeStep * pixelsPerSecond));
        const endStepIndex = Math.ceil(endPixel / (timeStep * pixelsPerSecond));

        let lastLabelRightX = -100; // Track last label end position for collision detection

        // 4. Draw Ticks
        for (let i = startStepIndex; i <= endStepIndex; i++) {
            const time = i * timeStep;
            
            // Exact Pixel Snapping: projectPos - scrollLeft
            const x = Math.floor(time * pixelsPerSecond) - currentScrollLeft + 0.5;
            
            // Optimization: Skip if way off screen
            if (x < -50 || x > width + 50) continue;

            // Major Tick
            ctx.strokeStyle = '#71717a';
            ctx.beginPath();
            ctx.moveTo(x, 0); 
            ctx.lineTo(x, 10); 
            ctx.stroke();

            // Label Collision Detection
            const label = formatRulerLabel(time + 0.0001, fps, timeStep); 
            const textWidth = ctx.measureText(label).width;
            const labelX = x + 4;
            
            // Only draw if it doesn't overlap the previous label
            if (labelX > lastLabelRightX + 10) {
                ctx.fillStyle = '#a1a1aa'; 
                ctx.fillText(label, labelX, 2);
                lastLabelRightX = labelX + textWidth;
            }

            // Minor Ticks (Subdivisions)
            const subPixelSpace = timeStep * pixelsPerSecond;
            let subDivisions = 0;
            
            // Determine subdivisions based on available space
            if (subPixelSpace > 200) subDivisions = 10;
            else if (subPixelSpace > 100) subDivisions = 5;
            else if (subPixelSpace > 40) subDivisions = 2;

            // If we are at frame level, don't subdivide into non-frames
            if (timeStep < 1/fps * 2) subDivisions = 0; 

            if (subDivisions > 0) {
                const subStepPx = subPixelSpace / subDivisions;
                ctx.strokeStyle = '#3f3f46';
                
                for (let j = 1; j < subDivisions; j++) {
                    const subOffset = j * subStepPx;
                    const subX = Math.floor(x + subOffset - 0.5) + 0.5;
                    
                    if (subX > width) break;
                    
                    const isMid = subDivisions === 10 && j === 5;
                    const tickH = isMid ? 6 : 4;
                    
                    ctx.beginPath();
                    ctx.moveTo(subX, height - tickH); 
                    ctx.lineTo(subX, height);
                    ctx.stroke();
                }
            }
        }

        // 5. Draw Markers
        if (markers && markers.length > 0) {
            for (const marker of markers) {
                const mx = Math.floor(marker.time * pixelsPerSecond) - currentScrollLeft + 0.5;
                if (mx >= -10 && mx <= width + 10) {
                    ctx.fillStyle = marker.color || '#f59e0b';
                    ctx.beginPath();
                    // Marker shape: Pentagon pointing down
                    ctx.moveTo(mx, 0);
                    ctx.lineTo(mx + 5, 0);
                    ctx.lineTo(mx + 5, 8);
                    ctx.lineTo(mx, 12);
                    ctx.lineTo(mx - 5, 8);
                    ctx.lineTo(mx - 5, 0);
                    ctx.fill();
                }
            }
        }

        // 6. Preview Range Highlight (Loop Region)
        if (previewRange) {
            const x1 = Math.floor(previewRange.start * pixelsPerSecond) - currentScrollLeft;
            const x2 = Math.floor(previewRange.end * pixelsPerSecond) - currentScrollLeft;
            
            // Fill
            ctx.fillStyle = 'rgba(59, 130, 246, 0.1)'; 
            ctx.fillRect(Math.max(0, x1), 0, Math.min(width, x2) - Math.max(0, x1), height);
            
            // Borders
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 1;
            ctx.beginPath();
            if (x1 >= 0 && x1 <= width) {
                ctx.moveTo(x1 + 0.5, 0); ctx.lineTo(x1 + 0.5, height);
            }
            if (x2 >= 0 && x2 <= width) {
                ctx.moveTo(x2 + 0.5, 0); ctx.lineTo(x2 + 0.5, height);
            }
            ctx.stroke();
        }

    }, [width, height, pixelsPerSecond, markers, previewRange, scrollContainerRef, fps]);

    useEffect(() => {
        let frameId: number;
        const loop = () => {
            draw();
            frameId = requestAnimationFrame(loop);
        };
        frameId = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(frameId);
    }, [draw]);

    return (
        <canvas
            ref={canvasRef}
            className="block pointer-events-none"
        />
    );
};

