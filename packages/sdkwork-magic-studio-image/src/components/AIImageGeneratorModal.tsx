
import React, { Suspense, lazy, useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles } from 'lucide-react';
import { imageBusinessService } from '../services';
import type { AIImageGeneratorModalProps } from './imageModal.types';

const AIImageGeneratorModalContent = lazy(() =>
    import('./AIImageGeneratorModalContent').then((module) => ({
        default: module.AIImageGeneratorModalContent
    }))
);

const ImageWorkspaceFallback: React.FC = () => (
    <div className="flex h-full items-center justify-center text-sm text-gray-300">
        Loading image workspace...
    </div>
);

export type { AIImageGeneratorModalProps } from './imageModal.types';

export const AIImageGeneratorModal: React.FC<AIImageGeneratorModalProps> = (props) => {
    const contextPrompt = props.contextText?.trim() || '';
    const configuredPrompt =
        typeof props.config?.prompt === 'string' && props.config.prompt.trim().length > 0
            ? props.config.prompt
            : '';
    const promptSeed = configuredPrompt || props.contextText?.trim() || '';
    const initialPromptState = useMemo<{
        seed: string;
        enhancedPrompt: string;
        status: 'idle' | 'loading' | 'resolved';
    }>(
        () => ({
            seed: promptSeed,
            enhancedPrompt: '',
            status: configuredPrompt
                ? 'resolved'
                : contextPrompt.length > 0
                    ? 'loading'
                    : 'idle'
        }),
        [configuredPrompt, contextPrompt.length, promptSeed]
    );
    const [promptState, setPromptState] = useState<{
        seed: string;
        enhancedPrompt: string;
        status: 'idle' | 'loading' | 'resolved';
    }>(initialPromptState);
    const effectivePromptState = promptState.seed === promptSeed
        ? promptState
        : initialPromptState;
    const initialPrompt = configuredPrompt || effectivePromptState.enhancedPrompt;
    const isAnalyzing = effectivePromptState.status === 'loading';

    useEffect(() => {
        if (configuredPrompt || contextPrompt.length === 0 || effectivePromptState.status !== 'loading') {
            return;
        }

        let cancelled = false;
        imageBusinessService.imageService.enhancePrompt(contextPrompt)
                .then((prompt) => {
                    if (!cancelled) {
                        setPromptState({
                            seed: promptSeed,
                            enhancedPrompt: prompt && prompt.trim().length > 0 ? prompt : '',
                            status: 'resolved'
                        });
                    }
                })
                .catch(err => {
                    console.error("Prompt suggestion failed", err);
                    if (!cancelled) {
                        setPromptState({
                            seed: promptSeed,
                            enhancedPrompt: '',
                            status: 'resolved'
                        });
                    }
                });
        return () => {
            cancelled = true;
        };
    }, [configuredPrompt, contextPrompt, effectivePromptState.status, promptSeed]);

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
                    <Suspense fallback={<ImageWorkspaceFallback />}>
                        <AIImageGeneratorModalContent
                            {...props} 
                            initialPrompt={initialPrompt} 
                        />
                    </Suspense>
                </div>
            )}
        </div>,
        document.body
    );
};
