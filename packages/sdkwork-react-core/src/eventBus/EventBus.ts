import { EventHandler, EventBusConfig } from './types';

export class EventBus {
    private listeners: Map<string, Set<EventHandler>> = new Map();
    private config: EventBusConfig;

    constructor(config: EventBusConfig = {}) {
        this.config = {
            debug: false,
            maxListeners: 100,
            ...config
        };
    }

    public on<T = any>(event: string, handler: EventHandler<T>): () => void {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }

        const handlers = this.listeners.get(event)!;
        
        if (handlers.size >= (this.config.maxListeners || 100)) {
            console.warn(`[EventBus] Max listeners reached for event: ${event}`);
        }

        handlers.add(handler);

        if (this.config.debug) {
            console.debug(`[EventBus] Subscribed to "${event}", total listeners: ${handlers.size}`);
        }

        return () => this.off(event, handler);
    }

    public off<T = any>(event: string, handler: EventHandler<T>): void {
        const handlers = this.listeners.get(event);
        if (handlers) {
            handlers.delete(handler);
            if (handlers.size === 0) {
                this.listeners.delete(event);
            }
            if (this.config.debug) {
                console.debug(`[EventBus] Unsubscribed from "${event}", remaining: ${handlers.size}`);
            }
        }
    }

    public emit<T = any>(event: string, payload?: T): void {
        const handlers = this.listeners.get(event);
        if (handlers) {
            if (this.config.debug) {
                console.debug(`[EventBus] Emitting "${event}" to ${handlers.size} listeners`, payload);
            }
            handlers.forEach(handler => {
                try {
                    handler(payload);
                } catch (e) {
                    console.error(`[EventBus] Error handling event "${event}":`, e);
                }
            });
        } else if (this.config.debug) {
            console.debug(`[EventBus] No listeners for event "${event}"`);
        }
    }

    public once<T = any>(event: string, handler: EventHandler<T>): () => void {
        const wrappedHandler: EventHandler<T> = (payload) => {
            this.off(event, wrappedHandler);
            handler(payload);
        };
        return this.on(event, wrappedHandler);
    }

    public hasListeners(event: string): boolean {
        const handlers = this.listeners.get(event);
        return handlers ? handlers.size > 0 : false;
    }

    public listenerCount(event: string): number {
        const handlers = this.listeners.get(event);
        return handlers ? handlers.size : 0;
    }

    public clear(): void {
        this.listeners.clear();
        if (this.config.debug) {
            console.debug('[EventBus] All listeners cleared');
        }
    }

    public events(): string[] {
        return Array.from(this.listeners.keys());
    }
}

export const globalEventBus = new EventBus({ debug: false });
