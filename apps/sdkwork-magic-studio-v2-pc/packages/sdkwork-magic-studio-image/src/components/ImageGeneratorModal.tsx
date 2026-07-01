
import React, { Suspense, lazy } from 'react';
import { createPortal } from 'react-dom';

import type { ImageGeneratorModalProps } from './imageModal.types';

const ImageGeneratorModalContent = lazy(() =>
    import('./ImageGeneratorModalContent').then((module) => ({
        default: module.ImageGeneratorModalContent
    }))
);

const ImageGeneratorModalFallback: React.FC = () => (
    <div className="flex h-full items-center justify-center text-sm text-gray-300">
        Loading image workspace...
    </div>
);

export type { ImageGeneratorModalProps } from './imageModal.types';

export const ImageGeneratorModal: React.FC<ImageGeneratorModalProps> = (props) => {
    return createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-[95vw] h-[90vh] bg-[#09090b] rounded-2xl shadow-2xl border border-[#333] overflow-hidden">
                <Suspense fallback={<ImageGeneratorModalFallback />}>
                    <ImageGeneratorModalContent {...props} />
                </Suspense>
            </div>
        </div>,
        document.body
    );
};
