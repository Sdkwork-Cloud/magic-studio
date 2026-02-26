
import { UniversalPlayerHandle } from '../components/Player/UniversalPlayer'
import { useEffect, useCallback } from 'react';
import { useMagicCutBus } from '../providers/MagicCutEventProvider';
import { MagicCutEvents, SkimPayload } from '../events';
;
import { PlayerController } from '../controllers/PlayerController';
import { useMagicCutStore } from '../store/magicCutStore';
import { TimelineStore } from '../store/transientStore';
import { useRafCallback } from './usePerformance';

export const usePlayerPreviewSync = (
    playerRef: React.RefObject<UniversalPlayerHandle>,
    playerController: PlayerController,
    store: TimelineStore
) => {
    const bus = useMagicCutBus();
    const { useTransientState } = useMagicCutStore();
    const dragOperation = useTransientState(s => s.dragOperation);
    const isPlaying = useTransientState(s => s.isPlaying);

    const rafRender = useRafCallback((time: number | null) => {
        const currentStoreState = store.getState();
        const isBusy = !!currentStoreState.skimmingResource || !!currentStoreState.dragOperation || !!dragOperation || isPlaying;
        
        if (isBusy) return;

        if (playerRef.current) {
            playerRef.current.setPreviewResource(null);
            
            if (time !== null) {
                playerRef.current.renderNow(time, false);
            } else {
                const currentTime = playerController.getCurrentTime();
                playerRef.current.renderNow(currentTime, false);
            }
        }
    });

    const handleTimelineSkim = useCallback((payload: SkimPayload) => {
        rafRender(payload.time);
    }, [rafRender]);

    useEffect(() => {
        bus.on(MagicCutEvents.TIMELINE_SKIM, handleTimelineSkim);
        return () => bus.off(MagicCutEvents.TIMELINE_SKIM, handleTimelineSkim);
    }, [bus, handleTimelineSkim]);
};

