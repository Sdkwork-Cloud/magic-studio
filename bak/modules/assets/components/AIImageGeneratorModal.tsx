
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ImageLeftGeneratorPanel } from '../../image/components/ImageLeftGeneratorPanel';
import { genAIService } from '../../notes/services/genAIService';
import { Sparkles, X, Check } from 'lucide-react';
import { ImageStoreProvider, useImageStore } from '../../image/store/imageStore';
import { GenerationConfig } from '../../image/entities/image.entity';
import { GenerationHistoryListPane, GENERATION_TABS } from '../../../components/generate/GenerationHistoryListPane';
import { Button } from '../../../components/Button/Button';

export interface AIImageGeneratorModalProps {
    contextText?: string;
    config?: Partial<GenerationConfig>;
    onClose: () => void;
    /**
     * onSuccess callback.
     * @param result - Single string if multiSelect is false, array of strings if true.
     * @param config - The generation config used.
     */
    onSuccess: (result: string | string[], config?: GenerationConfig) => void;
    
    /**
     * If true, allows selecting multiple images.
     * Default: false
     */
    multiSelect?: boolean;
}

const AIImageGeneratorContent: React.FC<AIImageGeneratorModalProps & { initialPrompt: string }> = ({ 
    initialPrompt, onClose, onSuccess, multiSelect = false 
}) => {
    const { history, config: currentConfig, deleteTask, setConfig } = useImageStore();
    const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set());

    // Filter tabs to only show 'image' initially, but keep flexibility if needed
    // Actually we want the pane to default to 'image' filter
    const [activeTab, setActiveTab] = useState('image');

    const handleSelect = (url: string) => {
        if (multiSelect) {
            setSelectedUrls(prev => {
                const next = new Set(prev);
                if (next.has(url)) next.delete(url);
                else next.add(url);
                return next;
            });
        } else {
            // Single select mode: return immediately
            onSuccess(url, currentConfig);
        }
    };

    const handleConfirmSelection = () => {
        if (selectedUrls.size > 0) {
            onSuccess(Array.from(selectedUrls), currentConfig);
        }
    };

    return (
        <div className="flex h-full overflow-hidden relative">
             {/* Left: Generator Controls */}
             <div className="w-[420px] flex-none h-full border-r border-[#333] z-10 bg-[#09090b] flex flex-col overflow-hidden">
                <ImageLeftGeneratorPanel 
                    initialPrompt={initialPrompt}
                    onClose={onClose}
                />
             </div>

             {/* Right: Results Gallery */}
             <div className="flex-1 bg-[#111] flex flex-col min-w-0 relative h-full">
                 <GenerationHistoryListPane 
                    tasks={history}
                    onDelete={deleteTask}
                    onReuse={(task) => setConfig(task.config)}
                    selectionMode={true}
                    onSelect={handleSelect}
                    selectedItems={Array.from(selectedUrls)}
                    minimal={false}
                    // Force filter to current tab, or allow user to switch? 
                    // Usually generator modal is for specific media type, but history might contain mixed.
                    // We default activeTab to 'image' in useState.
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    tabs={GENERATION_TABS.filter(t => t.id === 'image' || t.id === 'all')} // Simplify tabs for modal
                    className="bg-[#111] w-full h-full"
                    // Removed customHeader prop to use standard header
                 />

                 {/* Overlay Controls (Floating on top of standard header) */}
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

    // Use Portal to escape stacking contexts of parent containers
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
