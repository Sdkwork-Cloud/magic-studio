import { useMemo, useCallback } from 'react';
import { Viewport } from '../entities/canvas.entity';

interface UseCanvasViewportOptions {
    viewport: Viewport;
    containerSize: { width: number; height: number };
    containerRef: React.RefObject<HTMLDivElement>;
}

export function useCanvasViewport(options: UseCanvasViewportOptions) {
    const { viewport, containerSize, containerRef } = options;

    const screenToWorld = useCallback((clientX: number, clientY: number) => {
        if (!containerRef.current) return { x: 0, y: 0 };
        const rect = containerRef.current.getBoundingClientRect();
        return {
            x: (clientX - rect.left - viewport.x) / viewport.zoom,
            y: (clientY - rect.top - viewport.y) / viewport.zoom
        };
    }, [viewport, containerRef]);

    const worldToScreen = useCallback((worldX: number, worldY: number) => {
        if (!containerRef.current) return { x: 0, y: 0 };
        const rect = containerRef.current.getBoundingClientRect();
        return {
            x: worldX * viewport.zoom + viewport.x + rect.left,
            y: worldY * viewport.zoom + viewport.y + rect.top
        };
    }, [viewport, containerRef]);

    const visibleBounds = useMemo(() => {
        if (!containerSize.width) return null;
        
        return {
            x: -viewport.x / viewport.zoom,
            y: -viewport.y / viewport.zoom,
            width: containerSize.width / viewport.zoom,
            height: containerSize.height / viewport.zoom
        };
    }, [viewport, containerSize]);

    const isVisible = useCallback((x: number, y: number, width: number, height: number, buffer = 0) => {
        if (!visibleBounds) return false;
        
        return (
            x + width + buffer > visibleBounds.x &&
            x - buffer < visibleBounds.x + visibleBounds.width &&
            y + height + buffer > visibleBounds.y &&
            y - buffer < visibleBounds.y + visibleBounds.height
        );
    }, [visibleBounds]);

    return {
        screenToWorld,
        worldToScreen,
        visibleBounds,
        isVisible
    };
}
