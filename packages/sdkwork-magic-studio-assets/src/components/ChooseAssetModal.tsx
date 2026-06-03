import React, { Suspense, lazy } from 'react';
import type { ChooseAssetModalProps } from './ChooseAssetModal.types';

const LazyChooseAssetModalContent = lazy(() => import('./ChooseAssetModalContent'));

const ChooseAssetModalFallback: React.FC = () => (
    <div
        className="relative w-[90vw] h-[85vh] max-w-[1600px] bg-[#1e1e1e] border border-[#333] rounded-2xl shadow-2xl overflow-hidden"
        onClick={(event) => event.stopPropagation()}
    >
        <div className="flex h-full items-center justify-center bg-[#111] text-gray-400">
            <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-600 border-t-white" />
                <span className="text-xs uppercase tracking-[0.2em]">Loading Assets</span>
            </div>
        </div>
    </div>
);

export type { ChooseAssetModalProps } from './ChooseAssetModal.types';

export const ChooseAssetModal: React.FC<ChooseAssetModalProps> = (props) => {
    if (!props.isOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <Suspense fallback={<ChooseAssetModalFallback />}>
                <LazyChooseAssetModalContent {...props} />
            </Suspense>
        </div>
    );
};
