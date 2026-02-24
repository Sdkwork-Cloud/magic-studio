import { useEffect, useRef, DependencyList } from 'react';
import { EventBus } from './EventBus';
import { EventHandler } from './types';

export function useEventBus<T = any>(
    eventBus: EventBus,
    event: string,
    handler: EventHandler<T>,
    deps: DependencyList = []
): void {
    const handlerRef = useRef(handler);
    handlerRef.current = handler;

    useEffect(() => {
        const unsubscribe = eventBus.on<T>(event, (payload) => {
            handlerRef.current(payload);
        });

        return unsubscribe;
    }, [eventBus, event, ...deps]);
}

export function useEventBusOnce<T = any>(
    eventBus: EventBus,
    event: string,
    handler: EventHandler<T>
): void {
    useEffect(() => {
        return eventBus.once<T>(event, handler);
    }, [eventBus, event, handler]);
}

export function useEventSubscription<T = any>(
    event: string,
    handler: EventHandler<T>,
    deps: DependencyList = [],
    eventBus?: EventBus
): void {
    const handlerRef = useRef(handler);
    handlerRef.current = handler;

    useEffect(() => {
        if (!eventBus) return;
        
        const unsubscribe = eventBus.on<T>(event, (payload) => {
            handlerRef.current(payload);
        });

        return unsubscribe;
    }, [eventBus, event, ...deps]);
}
