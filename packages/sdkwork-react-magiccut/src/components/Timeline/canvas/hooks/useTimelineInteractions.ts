
import React, { useRef, useCallback } from 'react';
import { InteractionState, DragOperation } from '../../../../store/types';
import { PlayerController } from '../../../../controllers/PlayerController';
import { MagicCutEventBus } from '../../../../providers/MagicCutEventProvider';
import { MagicCutEvents } from '../../../../events';

interface UseTimelineInteractionsOptions {
    containerRef: React.RefObject<HTMLDivElement | null>;
    pixelsPerSecond: number;
    playerController: PlayerController;
    bus: MagicCutEventBus;
    interaction: InteractionState;
    dragOperation: DragOperation | null;
    trackLayouts: { id: string; top: number; height: number }[];
    selectClip: (id: string | null, multi?: boolean) => void;
}

interface UseTimelineInteractionsReturn {
    handleBackgroundMouseDown: (e: React.MouseEvent) => void;
    handleContainerMouseMove: (e: React.MouseEvent) => void;
    handleContainerMouseLeave: () => void;
    isScrubbing: React.MutableRefObject<boolean>;
}

export const useTimelineInteractions = ({
    containerRef,
    pixelsPerSecond,
    playerController,
    bus,
    interaction,
    dragOperation,
    trackLayouts,
    selectClip
}: UseTimelineInteractionsOptions): UseTimelineInteractionsReturn => {
    const isScrubbing = useRef(false);
    const mouseMoveRaf = useRef<number | null>(null);

    const getTimeFromEvent = useCallback((clientX: number, cachedRect?: DOMRect) => {
        const container = containerRef.current;
        if (!container) return 0;
        
        const rect = cachedRect || container.getBoundingClientRect();
        const x = (clientX - rect.left) + container.scrollLeft;
        
        return Math.max(0, x / pixelsPerSecond);
    }, [containerRef, pixelsPerSecond]);

    const getTrackFromY = useCallback((clientY: number) => {
        const container = containerRef.current;
        if (!container) return null;
        
        const rect = container.getBoundingClientRect();
        const y = clientY - rect.top + container.scrollTop;
        
        for (const layout of trackLayouts) {
            if (y >= layout.top && y < layout.top + layout.height) {
                return layout.id;
            }
        }
        return null;
    }, [containerRef, trackLayouts]);

    const handleBackgroundMouseDown = useCallback((e: React.MouseEvent) => {
        if (e.button !== 0) return;
        
        if (dragOperation) return;

        const wasPlaying = playerController.getIsPlaying();

        if (wasPlaying) {
            playerController.pause();
        }

        selectClip(null);

        let isDrag = false;
        const startX = e.clientX;
        const startY = e.clientY;
        
        const cachedRect = containerRef.current?.getBoundingClientRect();

        const handleWinMove = (ev: MouseEvent) => {
            if (!isDrag) {
                const dx = Math.abs(ev.clientX - startX);
                const dy = Math.abs(ev.clientY - startY);
                if (dx > 5 || dy > 5) {
                    isDrag = true;
                    isScrubbing.current = true;
                    
                    document.body.style.cursor = 'ew-resize';
                    document.body.style.userSelect = 'none';
                }
            }

            if (isScrubbing.current) {
                if (mouseMoveRaf.current === null) {
                    mouseMoveRaf.current = requestAnimationFrame(() => {
                        const t = getTimeFromEvent(ev.clientX, cachedRect);
                        bus.emit(MagicCutEvents.TIMELINE_SKIM, { time: t });
                        playerController.scrub(t);
                        mouseMoveRaf.current = null;
                    });
                }
            }
        };

        const handleWinUp = (ev: MouseEvent) => {
            if (mouseMoveRaf.current) {
                cancelAnimationFrame(mouseMoveRaf.current);
                mouseMoveRaf.current = null;
            }

            const finalTime = getTimeFromEvent(ev.clientX, cachedRect);

            if (isScrubbing.current) {
                playerController.seek(finalTime);
            } else {
                if (!wasPlaying) {
                    playerController.seek(finalTime);
                }
            }
            
            bus.emit(MagicCutEvents.TIMELINE_SKIM, { time: null });

            isScrubbing.current = false;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            
            window.removeEventListener('mousemove', handleWinMove);
            window.removeEventListener('mouseup', handleWinUp);
        };

        window.addEventListener('mousemove', handleWinMove);
        window.addEventListener('mouseup', handleWinUp);
        
    }, [getTimeFromEvent, getTrackFromY, dragOperation, playerController, selectClip, bus, containerRef]);

    const handleContainerMouseMove = useCallback((e: React.MouseEvent) => {
        if (interaction.type !== 'idle' || dragOperation || playerController.getIsPlaying() || isScrubbing.current) {
            bus.emit(MagicCutEvents.TIMELINE_SKIM, { time: null });
            return;
        }

        const time = getTimeFromEvent(e.clientX);

        if (mouseMoveRaf.current === null) {
            mouseMoveRaf.current = requestAnimationFrame(() => {
                bus.emit(MagicCutEvents.TIMELINE_SKIM, { time });
                
                mouseMoveRaf.current = null;
            });
        }
    }, [getTimeFromEvent, interaction.type, dragOperation, playerController, bus]);

    const handleContainerMouseLeave = useCallback(() => {
        if (isScrubbing.current) return;
        
        if (mouseMoveRaf.current) cancelAnimationFrame(mouseMoveRaf.current);
        bus.emit(MagicCutEvents.TIMELINE_SKIM, { time: null });
    }, [bus]);

    return {
        handleBackgroundMouseDown,
        handleContainerMouseMove,
        handleContainerMouseLeave,
        isScrubbing
    };
};

export default useTimelineInteractions;

