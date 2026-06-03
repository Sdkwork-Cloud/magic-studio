import { Button } from '@sdkwork/magic-studio-commons'
import {
    GenerationHistoryListPane,
    GENERATION_TABS,
    type GenerationResultSelection,
} from '@sdkwork/magic-studio-assets/generation'
import React, { useState } from 'react';

import { ImageStoreProvider, useImageStore } from '../store/imageStore';
import { LazyImageLeftGeneratorPanel } from './LazyImageLeftGeneratorPanel';
import type { ImageGeneratorModalProps } from './imageModal.types';
import { Check, X } from 'lucide-react';

const ImageGeneratorWorkspace: React.FC<ImageGeneratorModalProps> = ({
    onClose, onSuccess, actionLabel = "Add to Timeline"
}) => {
    const { history, deleteTask, setConfig } = useImageStore();
    const [selectedSelection, setSelectedSelection] = useState<GenerationResultSelection | null>(null);

    const handleSelect = (selection: GenerationResultSelection) => {
        setSelectedSelection(selection);
    };

    const handleConfirm = () => {
        if (selectedSelection) {
            onSuccess(selectedSelection);
        }
    };

    return (
        <div className="flex h-full overflow-hidden relative">
            <div className="w-[420px] flex-none h-full border-r border-[#333] z-10 bg-[#09090b] flex flex-col">
                <LazyImageLeftGeneratorPanel onClose={onClose} />
            </div>
            <div className="flex-1 bg-[#111] flex flex-col min-w-0 relative">
                <GenerationHistoryListPane
                    tasks={history}
                    onDelete={deleteTask}
                    onReuse={(task) => setConfig(task.config)}
                    selectionMode={true}
                    selectedKeys={selectedSelection ? [selectedSelection.key] : []}
                    onSelect={handleSelect}
                    tabs={GENERATION_TABS.filter(t => t.id === 'image' || t.id === 'all')}
                    activeTab="image"
                    className="w-full h-full"
                />

                <div className="absolute top-0 right-0 h-14 flex items-center px-6 gap-3 z-20 pointer-events-auto">
                    {selectedSelection && (
                        <div className="flex items-center gap-2 bg-[#1e1e1e]/90 backdrop-blur-md border border-[#333] rounded-lg p-1 animate-in fade-in zoom-in shadow-xl">
                            <Button size="sm" onClick={handleConfirm} className="h-7 text-xs gap-1.5 bg-blue-600 hover:bg-blue-500 border-0">
                                <Check size={12} /> {actionLabel}
                            </Button>
                        </div>
                    )}
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-white bg-[#1e1e1e]/50 hover:bg-[#333] rounded-lg transition-colors backdrop-blur-sm border border-[#333]/50 shadow-sm">
                        <X size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export const ImageGeneratorModalContent: React.FC<ImageGeneratorModalProps> = (props) => (
    <ImageStoreProvider>
        <ImageGeneratorWorkspace {...props} />
    </ImageStoreProvider>
);
