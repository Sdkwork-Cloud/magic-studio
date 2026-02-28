
import { useRef, useCallback } from 'react';
import { playerPreviewService } from '../services';
import { formatTime } from '../utils/timeUtils';

import { useMagicCutStore } from '../store/magicCutStore';

interface UseResourceSkimmingProps {
    resourceId: string;
    duration: number;
    containerRef: React.RefObject<HTMLDivElement | null>;
    scrubberLineRef: React.RefObject<HTMLDivElement | null>;
    scrubberTimeRef: React.RefObject<HTMLDivElement | null>;
    videoRef: React.RefObject<HTMLVideoElement | null>;
    isReady: boolean;
    isEffect: boolean;
    isVideo: boolean;
    isDragging: boolean;
}

export const useResourceSkimming = ({
    resourceId,
    duration,
    containerRef,
    scrubberLineRef,
    scrubberTimeRef,
    videoRef,
    isReady,
    isEffect,
    isVideo,
    isDragging
}: UseResourceSkimmingProps) => {
    const { state } = useMagicCutStore();
    const rafRef = useRef<number | null>(null);
    const pendingEventRef = useRef<{ clientX: number } | null>(null);

    const processEvent = useCallback(() => {
        if (!pendingEventRef.current || !containerRef.current) {
            rafRef.current = null;
            return;
        }

        const { clientX } = pendingEventRef.current;
        pendingEventRef.current = null;

        const rect = containerRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
        const percentage = x / rect.width;
        
        if (scrubberLineRef.current) {
            scrubberLineRef.current.style.display = 'block';
            scrubberLineRef.current.style.left = `${percentage * 100}%`;
        }
        
        const targetTime = percentage * duration;
        
        if (scrubberTimeRef.current) {
            scrubberTimeRef.current.style.display = 'block';
            scrubberTimeRef.current.style.left = `${percentage * 100}%`;
            scrubberTimeRef.current.innerText = formatTime(targetTime);
        }
        
        const resource = state.resources[resourceId];
        if (resource) {
            playerPreviewService.previewResource(resource, targetTime);
        }

        if (isVideo && videoRef.current) {
            const v = videoRef.current;
            if (Number.isFinite(targetTime)) {
                if (Math.abs(v.currentTime - targetTime) > 0.1) {
                    if ((v as any).fastSeek) {
                        (v as any).fastSeek(targetTime);
                    } else {
                        v.currentTime = targetTime;
                    }
                }
            }
        }

        rafRef.current = null;
    }, [duration, resourceId, isVideo, state.resources, containerRef, scrubberLineRef, scrubberTimeRef, videoRef]);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!isReady || isDragging || isEffect) return;

        pendingEventRef.current = { clientX: e.clientX };

        if (!rafRef.current) {
            rafRef.current = requestAnimationFrame(processEvent);
        }
    }, [isReady, isDragging, isEffect, processEvent]);

    const handleMouseLeave = useCallback(() => {
        if (rafRef.current) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        }
        pendingEventRef.current = null;
        
        if (scrubberLineRef.current) scrubberLineRef.current.style.display = 'none';
        if (scrubberTimeRef.current) scrubberTimeRef.current.style.display = 'none';
        
        playerPreviewService.clearPreview();

    }, [scrubberLineRef, scrubberTimeRef]);

    return {
        handleMouseMove,
        handleMouseLeave
    };
};

