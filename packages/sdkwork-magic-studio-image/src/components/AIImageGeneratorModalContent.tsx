import { Button } from '@sdkwork/magic-studio-commons'
import { GenerateHistory, EditorComponents, type GenerationResultSelection } from '@sdkwork/magic-studio-generation-history'
import React, { useState } from 'react';

import { persistGeneratedSelectionAsset } from '@sdkwork/magic-studio-assets/services';

import { ImageStoreProvider, useImageStore } from '../store/imageStore';
import { ImageCanvasEditorModal } from './ImageCanvasEditorModal';
import { ImageGridEditorModal } from './ImageGridEditorModal';
import { LazyImageLeftGeneratorPanel } from './LazyImageLeftGeneratorPanel';
import type { AIImageGeneratorModalProps } from './imageModal.types';
import { Check, X } from 'lucide-react';

const editors: EditorComponents = {
    GridEditor: ImageGridEditorModal as EditorComponents['GridEditor'],
    CanvasEditor: ImageCanvasEditorModal as EditorComponents['CanvasEditor']
};

const AIImageGeneratorWorkspace: React.FC<AIImageGeneratorModalProps & { initialPrompt: string }> = ({
    initialPrompt, onClose, onSuccess, multiSelect = false
}) => {
    const { history, deleteTask, setConfig } = useImageStore();
    const [selectedSelections, setSelectedSelections] = useState<GenerationResultSelection[]>([]);

    const handleSelect = (selection: GenerationResultSelection) => {
        if (multiSelect) {
            setSelectedSelections((prev) => {
                if (prev.some((item) => item.key === selection.key)) {
                    return prev.filter((item) => item.key !== selection.key);
                }
                return [...prev, selection];
            });
        } else {
            onSuccess(selection);
        }
    };

    const handleConfirmSelection = () => {
        if (selectedSelections.length > 0) {
            onSuccess(selectedSelections);
        }
    };

    const handleSaveToAssets = async (selection: GenerationResultSelection) => {
        const { type } = selection;
        const ts = Date.now();

        const persisted = await persistGeneratedSelectionAsset({
            selection,
            type:
                type === 'video' ||
                type === 'audio' ||
                type === 'music' ||
                type === 'voice'
                    ? type
                    : 'image',
            domain:
                type === 'video'
                    ? 'video-studio'
                    : type === 'audio'
                        ? 'audio-studio'
                        : type === 'music'
                            ? 'music'
                            : type === 'voice'
                                ? 'voice-speaker'
                                : 'image-studio',
            name:
                type === 'video'
                    ? `gen_video_${ts}.mp4`
                    : type === 'audio'
                        ? `gen_audio_${ts}.wav`
                        : type === 'music'
                            ? `gen_music_${ts}.mp3`
                            : type === 'voice'
                                ? `gen_voice_${ts}.wav`
                                : `gen_image_${ts}.png`
        });
        if (!persisted.assetId) {
            return;
        }
    };

    return (
        <div className="flex h-full overflow-hidden relative">
            <div className="w-[420px] flex-none h-full border-r border-[#333] z-10 bg-[#09090b] flex flex-col overflow-hidden">
                <LazyImageLeftGeneratorPanel
                    initialPrompt={initialPrompt}
                    onClose={onClose}
                />
            </div>

            <div className="flex-1 bg-[#111] flex flex-col min-w-0 relative h-full">
                <div className="flex-1 min-h-0 overflow-hidden relative">
                    <GenerateHistory
                        tasks={history}
                        onDelete={deleteTask}
                        onReuse={(task) => setConfig(task.config)}
                        onSelect={handleSelect}
                        selectedKeys={selectedSelections.map((selection) => selection.key)}
                        order="desc"
                        filter="image"
                        onSaveToAssets={handleSaveToAssets}
                        editors={editors}
                    />
                </div>

                <div className="absolute top-0 right-0 h-14 flex items-center px-6 gap-3 z-20 pointer-events-auto">
                    {multiSelect && selectedSelections.length > 0 && (
                        <div className="flex items-center gap-2 bg-[#1e1e1e]/80 backdrop-blur-md border border-[#333] rounded-lg p-1 animate-in fade-in zoom-in shadow-xl">
                            <span className="text-xs text-gray-300 px-2">
                                {selectedSelections.length} selected
                            </span>
                            <Button
                                size="sm"
                                onClick={handleConfirmSelection}
                                className="h-7 text-xs gap-1.5 bg-blue-600 hover:bg-blue-500 border-0"
                            >
                                <Check size={12} /> Confirm
                            </Button>
                        </div>
                    )}

                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-white bg-[#1e1e1e]/50 hover:bg-[#333] rounded-lg transition-colors backdrop-blur-sm border border-[#333]/50 shadow-sm"
                    >
                        <X size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export const AIImageGeneratorModalContent: React.FC<AIImageGeneratorModalProps & { initialPrompt: string }> = (props) => (
    <ImageStoreProvider initialConfig={props.config}>
        <AIImageGeneratorWorkspace {...props} />
    </ImageStoreProvider>
);
