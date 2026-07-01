import { StoreApi, UseBoundStore } from 'zustand';

export type StoreState = Record<string, any>;

export type StoreActions = Record<string, (...args: any[]) => any>;

export interface StoreConfig<S extends StoreState, A extends StoreActions> {
    name: string;
    initialState: S;
    actions: (set: StoreApi<S & A>['setState'], get: StoreApi<S & A>['getState']) => A;
}

export type CreateStoreReturn<S extends StoreState, A extends StoreActions> = UseBoundStore<StoreApi<S & A>>;
