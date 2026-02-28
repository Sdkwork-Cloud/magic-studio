import React, { createContext, useContext, useRef } from 'react';
import { useStore } from 'zustand';
import { usePromptOptimizerStore, PromptOptimizerStore } from './promptOptimizerStore';
import type { StoreApi } from 'zustand';

export const PromptOptimizerStoreContext = createContext<StoreApi<PromptOptimizerStore> | null>(null);

export const PromptOptimizerStoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const storeRef = useRef<StoreApi<PromptOptimizerStore> | null>(null);
    if (!storeRef.current) {
        storeRef.current = usePromptOptimizerStore as unknown as StoreApi<PromptOptimizerStore>;
    }
    
    return (
        <PromptOptimizerStoreContext.Provider value={storeRef.current}>
            {children}
        </PromptOptimizerStoreContext.Provider>
    );
};

export function usePromptOptimizerStoreContext<T>(
    selector: (state: PromptOptimizerStore) => T
): T {
    const store = useContext(PromptOptimizerStoreContext);
    if (!store) {
        throw new Error('usePromptOptimizerStoreContext must be used within a PromptOptimizerStoreProvider');
    }
    return useStore(store, selector);
}

export { usePromptOptimizerStore } from './promptOptimizerStore';
export type { PromptOptimizerStore } from './promptOptimizerStore';
