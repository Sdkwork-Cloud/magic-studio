
import React, { useState, useEffect } from 'react';
import { useMagicCutBus } from '../../../providers/MagicCutEventProvider';
import { MagicCutEvents, ContextMenuPayload } from '../../../events';
import { TimelineContextMenu } from './TimelineContextMenu';
import { MenuState } from './types';

export const TimelineMenuLayer: React.FC = () => {
    const bus = useMagicCutBus();
    const [menuState, setMenuState] = useState<MenuState | null>(null);

    useEffect(() => {
        const handleOpen = (payload: ContextMenuPayload) => {
            setMenuState({
                isOpen: true,
                x: payload.x,
                y: payload.y,
                type: payload.type,
                targetId: payload.id || null,
                time: payload.time || 0
            });
        };

        const unsubscribe = bus.on(MagicCutEvents.UI_CONTEXT_MENU, handleOpen);
        return () => unsubscribe();
    }, [bus]);

    if (!menuState || !menuState.isOpen) return null;

    return (
        <TimelineContextMenu 
            menuState={menuState} 
            onClose={() => setMenuState(null)} 
        />
    );
};

