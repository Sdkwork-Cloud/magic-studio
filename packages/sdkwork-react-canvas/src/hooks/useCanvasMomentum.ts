import { useRef, useCallback } from 'react';
import { useCanvasStore } from '../store/canvasStore';

interface UseCanvasMomentumOptions {
    setViewport: (viewport: { x: number; y: number }) => void;
}

export function useCanvasMomentum(options: UseCanvasMomentumOptions) {
    const { setViewport } = options;
    
    const velocityRef = useRef({ x: 0, y: 0 });
    const lastMoveTimeRef = useRef(0);
    const momentumRafRef = useRef<number | null>(null);
    const lastPosRef = useRef({ x: 0, y: 0 });

    const startMomentum = useCallback(() => {
        let { x: vx, y: vy } = velocityRef.current;
        const FRICTION = 0.94;
        const STOP_THRESHOLD = 0.05;
        
        if (Math.abs(vx) < 1 && Math.abs(vy) < 1) return;
        
        const loop = () => {
            if (Math.abs(vx) < STOP_THRESHOLD && Math.abs(vy) < STOP_THRESHOLD) {
                momentumRafRef.current = null;
                return;
            }
            vx *= FRICTION;
            vy *= FRICTION;
            
            const current = useCanvasStore.getState().viewport;
            setViewport({ x: current.x + vx, y: current.y + vy });
            
            momentumRafRef.current = requestAnimationFrame(loop);
        };
        momentumRafRef.current = requestAnimationFrame(loop);
    }, [setViewport]);

    const stopMomentum = useCallback(() => {
        if (momentumRafRef.current) {
            cancelAnimationFrame(momentumRafRef.current);
            momentumRafRef.current = null;
        }
        velocityRef.current = { x: 0, y: 0 };
    }, []);

    const updateVelocity = useCallback((x: number, y: number) => {
        const now = performance.now();
        const dt = now - lastMoveTimeRef.current;
        
        if (dt > 10) {
            velocityRef.current = { 
                x: x - lastPosRef.current.x, 
                y: y - lastPosRef.current.y 
            };
            lastMoveTimeRef.current = now;
            lastPosRef.current = { x, y };
        }
    }, []);

    const initMomentum = useCallback((x: number, y: number) => {
        lastMoveTimeRef.current = performance.now();
        lastPosRef.current = { x, y };
        velocityRef.current = { x: 0, y: 0 };
    }, []);

    const shouldStartMomentum = useCallback(() => {
        const now = performance.now();
        return now - lastMoveTimeRef.current < 50;
    }, []);

    return {
        velocityRef,
        lastMoveTimeRef,
        momentumRafRef,
        lastPosRef,
        startMomentum,
        stopMomentum,
        updateVelocity,
        initMomentum,
        shouldStartMomentum
    };
}
