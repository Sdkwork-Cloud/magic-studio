
import { useRef, useCallback, useEffect, useState } from 'react';

interface PerformanceMetrics {
    fps: number;
    frameTime: number;
    droppedFrames: number;
    memoryUsage?: number;
}

interface UsePerformanceMonitorOptions {
    enabled?: boolean;
    sampleSize?: number;
    onLowFps?: (fps: number) => void;
    lowFpsThreshold?: number;
}

export function usePerformanceMonitor({
    enabled = true,
    sampleSize = 60,
    onLowFps,
    lowFpsThreshold = 30
}: UsePerformanceMonitorOptions = {}): PerformanceMetrics {
    const [metrics, setMetrics] = useState<PerformanceMetrics>({
        fps: 60,
        frameTime: 16.67,
        droppedFrames: 0
    });

    const frameTimesRef = useRef<number[]>([]);
    const lastTimeRef = useRef(performance.now());
    const rafRef = useRef<number | null>(null);
    const droppedFramesRef = useRef(0);

    useEffect(() => {
        if (!enabled) return;

        const measure = () => {
            const now = performance.now();
            const frameTime = now - lastTimeRef.current;
            lastTimeRef.current = now;

            frameTimesRef.current.push(frameTime);

            if (frameTimesRef.current.length > sampleSize) {
                frameTimesRef.current.shift();
            }

            if (frameTime > 33) {
                droppedFramesRef.current += Math.floor(frameTime / 16.67) - 1;
            }

            if (frameTimesRef.current.length === sampleSize) {
                const avgFrameTime = frameTimesRef.current.reduce((a, b) => a + b, 0) / sampleSize;
                const fps = Math.round(1000 / avgFrameTime);

                const memory = (performance as any).memory;
                
                setMetrics({
                    fps,
                    frameTime: Math.round(avgFrameTime * 100) / 100,
                    droppedFrames: droppedFramesRef.current,
                    memoryUsage: memory ? Math.round(memory.usedJSHeapSize / 1024 / 1024) : undefined
                });

                if (fps < lowFpsThreshold) {
                    onLowFps?.(fps);
                }
            }

            rafRef.current = requestAnimationFrame(measure);
        };

        rafRef.current = requestAnimationFrame(measure);

        return () => {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
            }
        };
    }, [enabled, sampleSize, lowFpsThreshold, onLowFps]);

    return metrics;
}

export function useRenderCount(componentName: string): number {
    const countRef = useRef(0);
    
    useEffect(() => {
        countRef.current += 1;
        if (process.env.NODE_ENV === 'development') {
            console.log(`[${componentName}] Render #${countRef.current}`);
        }
    });

    return countRef.current;
}

export function useWhyDidYouRender(componentName: string, props: Record<string, any>): void {
    const previousPropsRef = useRef<Record<string, any>>({});

    useEffect(() => {
        if (process.env.NODE_ENV !== 'development') return;

        const changedProps: string[] = [];
        const previousProps = previousPropsRef.current;

        for (const key in props) {
            if (props[key] !== previousProps[key]) {
                changedProps.push(key);
            }
        }

        if (changedProps.length > 0) {
            console.log(`[${componentName}] Re-rendered due to:`, changedProps);
        }

        previousPropsRef.current = { ...props };
    });
}

export function useMemoryLeakDetector(componentName: string): void {
    useEffect(() => {
        if (process.env.NODE_ENV !== 'development') return;

        const memory = (performance as any).memory;
        if (!memory) return;

        const initialMemory = memory.usedJSHeapSize;

        return () => {
            const finalMemory = memory.usedJSHeapSize;
            const leaked = finalMemory - initialMemory;

            if (leaked > 1024 * 1024) {
                console.warn(
                    `[${componentName}] Potential memory leak: ${(leaked / 1024 / 1024).toFixed(2)}MB`
                );
            }
        };
    }, [componentName]);
}

interface UseLazyLoadOptions {
    rootMargin?: string;
    threshold?: number;
    triggerOnce?: boolean;
}

export function useLazyLoad<T extends HTMLElement>(
    options: UseLazyLoadOptions = {}
): [React.RefObject<T>, boolean] {
    const { rootMargin = '100px', threshold = 0.1, triggerOnce = true } = options;
    const ref = useRef<T>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    if (triggerOnce) {
                        observer.unobserve(element);
                    }
                } else if (!triggerOnce) {
                    setIsVisible(false);
                }
            },
            { rootMargin, threshold }
        );

        observer.observe(element);

        return () => observer.disconnect();
    }, [rootMargin, threshold, triggerOnce]);

    return [ref as React.RefObject<T>, isVisible];
}

export function useRafCallback<T extends (...args: any[]) => void>(
    callback: T
): T {
    const rafRef = useRef<number | null>(null);
    const argsRef = useRef<Parameters<T> | null>(null);
    const callbackRef = useRef(callback);
    callbackRef.current = callback;

    const rafCallback = useCallback((...args: Parameters<T>) => {
        argsRef.current = args;

        if (rafRef.current === null) {
            rafRef.current = requestAnimationFrame(() => {
                if (argsRef.current) {
                    callbackRef.current(...argsRef.current);
                }
                rafRef.current = null;
            });
        }
    }, []) as T;

    useEffect(() => {
        return () => {
            if (rafRef.current !== null) {
                cancelAnimationFrame(rafRef.current);
            }
        };
    }, []);

    return rafCallback;
}

