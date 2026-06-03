import React, { Suspense, lazy } from 'react';

const ImageLeftGeneratorPanel = lazy(() =>
    import('./ImageLeftGeneratorPanel').then((module) => ({
        default: module.ImageLeftGeneratorPanel
    }))
);

interface LazyImageLeftGeneratorPanelProps {
    initialPrompt?: string;
    onClose?: () => void;
}

const ImageLeftGeneratorPanelFallback: React.FC = () => (
    <div className="flex h-full items-center justify-center bg-[#09090b] text-xs text-gray-400">
        Loading image generator...
    </div>
);

export const LazyImageLeftGeneratorPanel: React.FC<LazyImageLeftGeneratorPanelProps> = (props) => (
    <Suspense fallback={<ImageLeftGeneratorPanelFallback />}>
        <ImageLeftGeneratorPanel {...props} />
    </Suspense>
);
