
import { UniversalPlayerHandle } from '../components/Player/UniversalPlayer'
import { useEffect, useCallback } from 'react';
import { useMagicCutBus } from '../providers/MagicCutEventProvider';
import { MagicCutEvents, SkimPayload } from '../events';
;
import { PlayerController } from '../controllers/PlayerController';
import { useMagicCutStore } from '../store/magicCutStore';
import { TimelineStore } from '../store/transientStore';

export const usePlayerPreviewSync = (
    playerRef: React.RefObject<UniversalPlayerHandle>,
    playerController: PlayerController,
    store: TimelineStore
) => {
    const bus = useMagicCutBus();
    const { useTransientState } = useMagicCutStore();
    const dragOperation = useTransientState(s => s.dragOperation);
    const isPlaying = useTransientState(s => s.isPlaying);

    const handleTimelineSkim = useCallback((payload: SkimPayload) => {
        const currentStoreState = store.getState();
        const isBusy = !!currentStoreState.skimmingResource || !!currentStoreState.dragOperation || !!dragOperation || isPlaying;
        
        if (isBusy) return;

        if (playerRef.current) {
            playerRef.current.setPreviewResource(null);
            
            if (payload.time !== null) {
                playerRef.current.renderNow(payload.time, false);
            } else {
                const currentTime = playerController.getCurrentTime();
                playerRef.current.renderNow(currentTime, false);
            }
        }
    }, [store, dragOperation, isPlaying, playerController, playerRef]);

    useEffect(() => {
        bus.on(MagicCutEvents.TIMELINE_SKIM, handleTimelineSkim);
        return () => bus.off(MagicCutEvents.TIMELINE_SKIM, handleTimelineSkim);
    }, [bus, handleTimelineSkim]);
};

