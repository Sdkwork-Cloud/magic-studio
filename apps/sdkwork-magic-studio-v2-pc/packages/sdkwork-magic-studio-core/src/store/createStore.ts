import { createStore as createVanillaStore, type StoreApi as VanillaStoreApi } from 'zustand/vanilla';
import { create, useStore } from 'zustand/react';
import type { UseBoundStore } from 'zustand/react';
import { StoreState, StoreActions, StoreConfig, CreateStoreReturn } from './types';

// Type alias for zustand/react StoreApi (which is not directly exported)
type ReactStoreApi<T> = VanillaStoreApi<T>;

/**
 * Creates a vanilla Zustand store that can be used across React and non-React contexts.
 * Follows the architecture specification for using zustand/vanilla.
 */
export function createStore<S extends StoreState, A extends StoreActions>(
    config: StoreConfig<S, A>
): CreateStoreReturn<S, A> {
    const { initialState, actions } = config;

    const storeCreator = (set: ReactStoreApi<S & A>['setState'], get: ReactStoreApi<S & A>['getState']) => ({
        ...initialState,
        ...actions(set, get)
    });

    return create<S & A>()(storeCreator as any);
}

/**
 * Creates a vanilla store instance for non-React usage.
 * This is the recommended way for creating stores per architecture.
 */
export function createVanilla<S extends StoreState>(initialState: S): ReactStoreApi<S> {
    return createVanillaStore<S>(() => initialState);
}

/**
 * Hook to use a vanilla store in React components.
 */
export { useStore as useVanillaStore };

export function createSimpleStore<T extends StoreState>(initialState: T) {
    return create<T>()(() => initialState);
}

export type { UseBoundStore };
export type { ReactStoreApi as StoreApi };
