
import React, { useRef, useEffect } from 'react';
import { useMagicCutStore } from '../../store/magicCutStore';
import { determineTimeStep } from '../../utils/timeUtils';

interface TimelineGridProps {
    totalWidth: number;
    viewportHeight: number;
    pixelsPerSecond: number;
    scrollLeft: number;
}

export const TimelineGrid: React.FC<TimelineGridProps> = ({
    totalWidth,
    viewportHeight,
    pixelsPerSecond,
    scrollLeft
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { project } = useMagicCutStore();
    const fps = project.settings.fps || 30;

    const draw = React.useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const width = canvas.clientWidth || totalWidth;
        const height = viewportHeight;

        if (width <= 0 || height <= 0) return;

        const ctx = canvas.getContext('2d', { alpha: true });
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        const targetW = Math.ceil(width * dpr);
        const targetH = Math.ceil(height * dpr);

        if (canvas.width !== targetW || canvas.height !== targetH) {
            canvas.width = targetW;
            canvas.height = targetH;
        } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        
        ctx.resetTransform();
        ctx.scale(dpr, dpr);
        
        // --- Visual Styling ---
        const minTickSpacing = 80; 
        const timeStep = determineTimeStep(pixelsPerSecond, minTickSpacing, fps);
        
        const startPixel = scrollLeft;
        const endPixel = scrollLeft + width;
        
        const startStepIndex = Math.floor(startPixel / (timeStep * pixelsPerSecond));
        const endStepIndex = Math.ceil(endPixel / (timeStep * pixelsPerSecond));

        ctx.lineWidth = 1;

        for (let i = startStepIndex; i <= endStepIndex; i++) {
            const time = i * timeStep;
            // Align x exactly with ruler logic
            const x = Math.floor(time * pixelsPerSecond) - scrollLeft + 0.5;
            
            if (x < -1 || x > width + 1) continue;

            // Major Line
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)'; 
            ctx.stroke();

            // Sub Divisions
            let subDivisions = 0;
            const subPixelSpace = timeStep * pixelsPerSecond;
            if (subPixelSpace > 200) subDivisions = 10;
            else if (subPixelSpace > 100) subDivisions = 5;
            else if (subPixelSpace > 40) subDivisions = 2;
            
            if (timeStep < 1/fps * 2) subDivisions = 0; 

            if (subDivisions > 0) {
                const subStepPx = subPixelSpace / subDivisions;
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
                
                for (let j = 1; j < subDivisions; j++) {
                    const subX = Math.floor(x + (j * subStepPx) - 0.5) + 0.5;
                    if (subX > width) break;
                    
                    ctx.beginPath();
                    ctx.moveTo(subX, 0);
                    ctx.lineTo(subX, height);
                    ctx.stroke();
                }
            }
        }

    }, [totalWidth, viewportHeight, pixelsPerSecond, scrollLeft, fps]);

    useEffect(() => {
        let handle: number;
        const loop = () => {
            draw();
            handle = requestAnimationFrame(loop);
        }
        loop();
        return () => cancelAnimationFrame(handle);
    }, [draw]);

    return (
        <div 
            className="absolute left-0 top-0 w-full h-full pointer-events-none z-0"
            style={{ 
                position: 'sticky', 
                left: 0,
                width: '100%',
                height: viewportHeight 
            }}
        >
            <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
        </div>
    );
};
