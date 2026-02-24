import { create, StoreApi, UseBoundStore } from 'zustand';
import { createContext, useContext, ReactNode } from 'react';

export function createProviderStore<T extends object>(
    initialState: T,
    name?: string
) {
    const useStore = create<T>(() => initialState);

    const Context = createContext<UseBoundStore<StoreApi<T>> | undefined>(undefined);

    const Provider: React.FC<{ children: ReactNode; initialState?: Partial<T> }> = ({ 
        children
    }) => {
        return (
            <Context.Provider value={useStore}>
                {children}
            </Context.Provider>
        );
    };

    const useStoreContext = (): T => {
        const store = useContext(Context);
        if (!store) {
            throw new Error(`${name || 'Store'} Provider is missing`);
        }
        return store();
    };

    return {
        useStore,
        Provider,
        useStoreContext,
        Context
    };
}
