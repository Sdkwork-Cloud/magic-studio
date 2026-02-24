
import React, { ReactNode } from 'react';
import { MagicCutStoreProvider } from '../store/magicCutStore';
import { MagicCutEventProvider } from './MagicCutEventProvider';
import { MagicCutErrorBoundary } from '../components/ErrorBoundary/MagicCutErrorBoundary';

export const MagicCutRouteProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    return (
        <MagicCutStoreProvider>
            <MagicCutEventProvider>
                <MagicCutErrorBoundary componentName="MagicCut Route">
                    {children}
                </MagicCutErrorBoundary>
            </MagicCutEventProvider>
        </MagicCutStoreProvider>
    );
};
