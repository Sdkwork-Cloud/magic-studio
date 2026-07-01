export type EventHandler<T = any> = (payload: T) => void;

export interface EventBusConfig {
    debug?: boolean;
    maxListeners?: number;
}

export interface EventSubscription {
    unsubscribe: () => void;
}
