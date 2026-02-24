
import React, { createContext, useContext, useMemo, useEffect } from 'react';
import { EventBus } from '../../../infrastructure/eventBus/EventBus';
import { useEventSubscription } from '../../../infrastructure/eventBus/useEventBus';

export type MagicCutEventBus = EventBus;

const MagicCutEventContext = createContext<EventBus | null>(null);

/**
 * Provides a scoped EventBus for a single MagicCut editor instance.
 * This ensures that events in one editor (e.g. "Delete Clip") do not affect other editors.
 */
export const MagicCutEventProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Create a stable instance of EventBus for the lifetime of this component tree
    const bus = useMemo(() => new EventBus(), []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            bus.clear();
        };
    }, [bus]);

    return (
        <MagicCutEventContext.Provider value={bus}>
            {children}
        </MagicCutEventContext.Provider>
    );
};

/**
 * Hook to consume the scoped EventBus instance directly.
 * Useful for components that need to emit events.
 */
export const useMagicCutBus = () => {
    const bus = useContext(MagicCutEventContext);
    if (!bus) {
        throw new Error('useMagicCutBus must be used within a MagicCutEventProvider');
    }
    return bus;
};

/**
 * Helper hook for subscribing to events within the MagicCut context.
 * Automatically handles cleanup and binds to the scoped bus.
 */
export function useMagicCutEvent<T = any>(
    event: string, 
    handler: (payload: T) => void,
    deps: React.DependencyList = []
) {
    const bus = useMagicCutBus();
    // Reuse the infrastructure hook, injecting the scoped bus
    useEventSubscription(event, handler, deps, bus);
}
