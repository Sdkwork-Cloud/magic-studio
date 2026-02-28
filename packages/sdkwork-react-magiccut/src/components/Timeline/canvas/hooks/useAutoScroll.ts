
import React, { useRef, useEffect, useCallback } from 'react';
import { TimelineStore } from '../../../../store/transientStore';

interface UseAutoScrollReturn {
    autoScrollSpeed: React.MutableRefObject<number>;
    startAutoScroll: (speed: number) => void;
    stopAutoScroll: () => void;
}

/**
 * useAutoScroll - 自动滚动 Hook
 * 
 * 职责：管理拖拽时的边缘自动滚�? * 优化：使�?RAF 循环实现平滑滚动，并同步 Zustand Transient Store
 */
export const useAutoScroll = (
    containerRef: React.RefObject<HTMLDivElement | null>,
    store: TimelineStore
): UseAutoScrollReturn => {
    const autoScrollSpeed = useRef<number>(0);
    const autoScrollRaf = useRef<number | null>(null);

    const startAutoScroll = useCallback((speed: number) => {
        autoScrollSpeed.current = speed;
    }, []);

    const stopAutoScroll = useCallback(() => {
        autoScrollSpeed.current = 0;
    }, []);

    useEffect(() => {
        const loop = () => {
            if (autoScrollSpeed.current !== 0 && containerRef.current) {
                // Mutate DOM directly for performance
                containerRef.current.scrollLeft += autoScrollSpeed.current;
                
                // Sync store to ensure Grid/Ruler updates
                // We use setState directly on the store instance to avoid React batching/re-render lag
                store.setState({ scrollLeft: containerRef.current.scrollLeft });
            }
            autoScrollRaf.current = requestAnimationFrame(loop);
        };

        autoScrollRaf.current = requestAnimationFrame(loop);

        return () => {
            if (autoScrollRaf.current) {
                cancelAnimationFrame(autoScrollRaf.current);
            }
        };
    }, [containerRef, store]);

    return {
        autoScrollSpeed,
        startAutoScroll,
        stopAutoScroll
    };
};

export default useAutoScroll;

