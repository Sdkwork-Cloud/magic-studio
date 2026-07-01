
import React from 'react';

interface CanvasBackgroundProps {
    viewport: { x: number; y: number; zoom: number };
}

export const CanvasBackground: React.FC<CanvasBackgroundProps> = React.memo(({ viewport }) => {
    // LOD Calculation
    // Base size 20px at zoom 1.
    // Large grid is 5x base (100px).
    
    const gridSize = 20 * viewport.zoom;
    const largeGridSize = 100 * viewport.zoom;
    
    // Calculate opacity for sub-grid (fade out when zooming out to reduce noise)
    // Visible from zoom 0.4 upwards. Fully visible at 0.8.
    const subGridOpacity = Math.max(0, Math.min(0.2, (viewport.zoom - 0.4) * 0.5));
    // Large grid always visible but subtle
    const largeGridOpacity = 0.3;

    return (
        <div className="absolute inset-0 pointer-events-none z-0 bg-[#09090b] overflow-hidden">
            {/* Background Vignette for focus */}
            <div 
                className="absolute inset-0"
                style={{
                    background: 'radial-gradient(circle at 50% 50%, transparent 0%, rgba(0,0,0,0.4) 100%)'
                }}
            />

            {/* Level 2: Detail Grid (Small Dots) - Dynamic Opacity */}
            <div 
                className="absolute inset-0 transition-opacity duration-300 will-change-[background-position]"
                style={{
                    backgroundImage: 'radial-gradient(circle, #52525b 1px, transparent 1px)',
                    backgroundSize: `${gridSize}px ${gridSize}px`,
                    backgroundPosition: `${viewport.x}px ${viewport.y}px`,
                    opacity: subGridOpacity
                }}
            />

            {/* Level 1: Macro Grid (Large Dots) - Constant Anchors */}
            <div 
                className="absolute inset-0 will-change-[background-position]"
                style={{
                    backgroundImage: 'radial-gradient(circle, #71717a 1.5px, transparent 1.5px)',
                    backgroundSize: `${largeGridSize}px ${largeGridSize}px`,
                    backgroundPosition: `${viewport.x}px ${viewport.y}px`,
                    opacity: largeGridOpacity
                }}
            />
        </div>
    );
});
