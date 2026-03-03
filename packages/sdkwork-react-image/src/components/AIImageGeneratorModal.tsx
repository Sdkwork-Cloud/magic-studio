
import { Button } from '@sdkwork/react-commons'
import { GenerateHistory, EditorComponents } from '@sdkwork/react-generation-history'
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ImageLeftGeneratorPanel } from './ImageLeftGeneratorPanel';
import { genAIService, inlineDataService } from '@sdkwork/react-core';
import { Sparkles, X, Check } from 'lucide-react';
import { ImageStoreProvider, useImageStore } from '../store/imageStore';
import type { GenerationConfig } from '../services';
import { ImageGridEditorModal } from './ImageGridEditorModal';
import { ImageCanvasEditorModal } from './ImageCanvasEditorModal';
import { assetBusinessFacade, readWorkspaceScope } from '@sdkwork/react-assets';
import { MediaType } from '@sdkwork/react-commons';

export interface AIImageGeneratorModalProps {
    contextText?: string;
    config?: Partial<GenerationConfig>;
    onClose: () => void;
    onSuccess: (result: string | string[], config?: GenerationConfig) => void;
    multiSelect?: boolean;
}

const editors: EditorComponents = {
    GridEditor: ImageGridEditorModal,
    CanvasEditor: ImageCanvasEditorModal
};

const resolveScope = (): { workspaceId: string; projectId?: string } => {
    const scope = readWorkspaceScope();
    return {
        workspaceId: scope.workspaceId,
        projectId: scope.projectId
    };
};

const AIImageGeneratorContent: React.FC<AIImageGeneratorModalProps & { initialPrompt: string }> = ({ 
    initialPrompt, onClose, onSuccess, multiSelect = false 
}) => {
    const { history, config: currentConfig, deleteTask, setConfig } = useImageStore();
    const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set());

    const handleSelect = (url: string) => {
        if (multiSelect) {
            setSelectedUrls(prev => {
                const next = new Set(prev);
                if (next.has(url)) next.delete(url);
                else next.add(url);
                return next;
            });
        } else {
            onSuccess(url, currentConfig);
        }
    };

    const handleConfirmSelection = () => {
        if (selectedUrls.size > 0) {
            onSuccess(Array.from(selectedUrls), currentConfig);
        }
    };

    const handleSaveToAssets = async (url: string, type: MediaType) => {
        if (!url || url.startsWith('assets://')) {
            return;
        }
        const inlineData = await inlineDataService.tryExtractInlineData(url);
        const scope = resolveScope();
        const ts = Date.now();

        if (type === 'video') {
            await assetBusinessFacade.importVideoStudioAsset({
                scope,
                type: 'video',
                name: `gen_video_${ts}.mp4`,
                data: inlineData,
                remoteUrl: inlineData ? undefined : url,
                metadata: { origin: 'ai', source: 'image-modal-save' }
            });
            return;
        }

        if (type === 'audio') {
            await assetBusinessFacade.importAudioStudioAsset({
                scope,
                type: 'audio',
                name: `gen_audio_${ts}.wav`,
                data: inlineData,
                remoteUrl: inlineData ? undefined : url,
                metadata: { origin: 'ai', source: 'image-modal-save' }
            });
            return;
        }

        if (type === 'music') {
            await assetBusinessFacade.importMusicAsset({
                scope,
                type: 'music',
                name: `gen_music_${ts}.mp3`,
                data: inlineData,
                remoteUrl: inlineData ? undefined : url,
                metadata: { origin: 'ai', source: 'image-modal-save' }
            });
            return;
        }

        if (type === 'voice') {
            await assetBusinessFacade.importVoiceSpeakerAsset({
                scope,
                type: 'voice',
                name: `gen_voice_${ts}.wav`,
                data: inlineData,
                remoteUrl: inlineData ? undefined : url,
                metadata: { origin: 'ai', source: 'image-modal-save' }
            });
            return;
        }

        await assetBusinessFacade.importImageStudioAsset({
            scope,
            type: 'image',
            name: `gen_image_${ts}.png`,
            data: inlineData,
            remoteUrl: inlineData ? undefined : url,
            metadata: { origin: 'ai', source: 'image-modal-save' }
        });
    };

    return (
        <div className="flex h-full overflow-hidden relative">
             <div className="w-[420px] flex-none h-full border-r border-[#333] z-10 bg-[#09090b] flex flex-col overflow-hidden">
                <ImageLeftGeneratorPanel 
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
                        selectedItems={Array.from(selectedUrls)}
                        order="desc" 
                        filter="image"
                        onSaveToAssets={handleSaveToAssets}
                        editors={editors}
                     />
                 </div>

                 <div className="absolute top-0 right-0 h-14 flex items-center px-6 gap-3 z-20 pointer-events-auto">
                     {multiSelect && selectedUrls.size > 0 && (
                         <div className="flex items-center gap-2 bg-[#1e1e1e]/80 backdrop-blur-md border border-[#333] rounded-lg p-1 animate-in fade-in zoom-in shadow-xl">
                             <span className="text-xs text-gray-300 px-2">
                                 {selectedUrls.size} selected
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

export const AIImageGeneratorModal: React.FC<AIImageGeneratorModalProps> = (props) => {
    const [initialPrompt, setInitialPrompt] = useState<string>('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    useEffect(() => {
        if (props.config?.prompt) {
            setInitialPrompt(props.config.prompt);
            return;
        }

        if (props.contextText && props.contextText.trim().length > 0) {
            setIsAnalyzing(true);
            genAIService.generateCoverPrompts(props.contextText)
                .then(prompts => {
                    if (prompts && prompts.length > 0) {
                        setInitialPrompt(prompts[0]);
                    }
                })
                .catch(err => console.error("Prompt suggestion failed", err))
                .finally(() => setIsAnalyzing(false));
        }
    }, [props.contextText, props.config?.prompt]);

    return createPortal(
        <div 
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 p-4"
            onClick={(e) => { if (e.target === e.currentTarget) props.onClose(); }}
        >
            {isAnalyzing ? (
                <div className="flex flex-col items-center justify-center text-white gap-4">
                    <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center shadow-lg shadow-purple-500/10">
                        <Sparkles size={32} className="text-purple-400 animate-pulse" />
                    </div>
                    <p className="text-sm font-medium text-gray-300">Analyzing context for prompts...</p>
                </div>
            ) : (
                <div 
                    className="w-[95vw] max-w-[1800px] h-[90vh] bg-[#09090b] border border-[#333] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                >
                    <ImageStoreProvider initialConfig={props.config}>
                        <AIImageGeneratorContent 
                            {...props} 
                            initialPrompt={initialPrompt} 
                        />
                    </ImageStoreProvider>
                </div>
            )}
        </div>,
        document.body
    );
};
