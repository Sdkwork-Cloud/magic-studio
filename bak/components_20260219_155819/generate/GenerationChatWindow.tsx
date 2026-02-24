
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { GenerateHistory } from './GenerateHistory';
import { LayoutGrid, Sparkles, Loader2, Image as ImageIcon, Film } from 'lucide-react';
import { CreationChatInput, InputFooterButton } from '../CreationChatInput';
import { useRouter } from '../../router';
import { ROUTES } from '../../router/routes';
import { ImageModelSelector } from '../../modules/image/components/ImageModelSelector';
import { VideoModelSelector } from '../../modules/video/components/VideoModelSelector';
import { AspectRatioSelector } from '../../components/AspectRatioSelector';
import { InputAttachment } from '../CreationChatInput/types';

interface GenerationChatWindowProps {
    mode: 'image' | 'video' | 'agent' | string;
    title: string;
    backLabel?: string;
    onNavigateBack: () => void;
    
    // Data & Actions
    history: any[];
    isGenerating: boolean;
    onDelete: (id: string) => void;
    onReuse: (task: any) => void;
    
    // Configuration
    config: any;
    setConfig: (updates: any) => void;
    onGenerate: () => void;
    
    // Optional Handlers
    onUpload?: () => void;
    onRemoveReferenceImage?: (index: number) => void;
    onRemoveStartFrame?: () => void;
}

export const GenerationChatWindow: React.FC<GenerationChatWindowProps> = ({
    mode: initialMode, title, backLabel = "Gallery Mode", onNavigateBack,
    history, isGenerating, onDelete, onReuse,
    config, setConfig, onGenerate, onUpload, onRemoveReferenceImage, onRemoveStartFrame
}) => {
    const [activeMode, setActiveMode] = useState(initialMode);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { navigate } = useRouter();

    // Reset local mode when prop changes (e.g. navigation)
    useEffect(() => {
        setActiveMode(initialMode);
    }, [initialMode]);

    // Auto-scroll logic
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [history.length, isGenerating]);

    const handleModeSwitch = (modeId: string) => {
        setActiveMode(modeId);
    };

    const Icon = activeMode === 'image' ? ImageIcon : Film;
    const gradient = activeMode === 'image' ? 'from-purple-600 to-blue-600' : 'from-pink-600 to-rose-600';
    const emptyIconColor = activeMode === 'image' ? 'text-purple-500/50' : 'text-pink-500/50';

    // Map legacy attachments logic to CreationChatInput format
    const attachments: InputAttachment[] = useMemo(() => {
        const list: InputAttachment[] = [];
        if (activeMode === 'video' && config.image) {
             list.push({ id: 'start-frame', name: 'Start Frame', type: 'image', url: config.image });
        }
        if (activeMode === 'image' && config.referenceImages) {
             config.referenceImages.forEach((url: string, i: number) => {
                 list.push({ id: `ref-${i}`, name: `Ref ${i+1}`, type: 'image', url });
             });
        }
        return list;
    }, [config, activeMode]);

    const handleRemoveAttachment = (id: string) => {
        if (activeMode === 'video' && id === 'start-frame') {
            onRemoveStartFrame?.();
        } else if (activeMode === 'image') {
            const idx = parseInt(id.split('-')[1]);
            onRemoveReferenceImage?.(idx);
        }
    };

    const renderFooterControls = () => {
        return (
            <div className="flex items-center gap-2">
                <div className="min-w-[140px]">
                    {activeMode === 'image' ? (
                        <ImageModelSelector 
                            value={config.model || ''}
                            onChange={(m) => setConfig({ model: m })}
                            className="border-transparent bg-transparent hover:bg-[#ffffff08] text-xs h-8 rounded-full px-2"
                        />
                    ) : activeMode === 'video' ? (
                        <VideoModelSelector 
                            value={config.model || ''}
                            onChange={(m) => setConfig({ model: m })}
                            className="border-transparent bg-transparent hover:bg-[#ffffff08] text-xs h-8 rounded-full px-2"
                        />
                    ) : null}
                </div>

                {(activeMode === 'image' || activeMode === 'video') && (
                     <AspectRatioSelector 
                        value={config.aspectRatio || '16:9'}
                        onChange={(r) => setConfig({ aspectRatio: r })}
                        resolution={config.resolution || '2k'}
                        onResolutionChange={(r) => setConfig({ resolution: r })}
                        className="border-transparent bg-transparent hover:bg-[#ffffff08] text-xs h-8 text-gray-400 hover:text-white"
                     />
                )}
            </div>
        );
    };

    return (
        <div className="flex w-full h-full bg-[#111] overflow-hidden flex-col font-sans">
            {/* Header */}
            <div className="flex-none h-14 border-b border-[#27272a] flex items-center justify-between px-6 bg-[#18181b] z-10">
                 <div className="flex items-center gap-2">
                     <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-lg shadow-purple-900/20`}>
                         <Icon size={16} />
                     </div>
                     <h3 className="font-bold text-gray-200 tracking-tight">{title}</h3>
                 </div>
                 <button 
                    onClick={onNavigateBack}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-white bg-[#27272a] hover:bg-[#333] rounded-lg transition-colors border border-[#333]"
                >
                     <LayoutGrid size={14} /> {backLabel}
                 </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden relative bg-[#09090b]" ref={scrollContainerRef}>
                 <div className="h-full overflow-y-auto p-4 md:p-8 scroll-smooth custom-scrollbar">
                    <div className="max-w-[1372px] mx-auto min-h-full flex flex-col justify-end pb-8">
                        {history.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-600 select-none pb-20">
                                <div className="w-24 h-24 rounded-3xl bg-[#18181b] border border-[#27272a] flex items-center justify-center mb-6 shadow-inner">
                                    <Sparkles size={40} className={emptyIconColor} />
                                </div>
                                <h3 className="text-xl font-bold text-gray-300">Start Creating</h3>
                                <p className="text-sm opacity-50 mt-2 max-w-sm text-center leading-relaxed">
                                    {activeMode === 'image' 
                                        ? "Describe your imagination, select a style, or upload a reference image."
                                        : "Describe a scene to generate high-quality video using Veo."}
                                </p>
                            </div>
                        ) : (
                            <GenerateHistory 
                                tasks={history} 
                                onDelete={onDelete} 
                                onReuse={onReuse}
                                filter={activeMode === 'agent' ? 'all' : activeMode as any}
                            />
                        )}
                        
                        {isGenerating && (
                             <div className="max-w-[1600px] mx-auto w-full mt-6 p-6 rounded-xl bg-[#18181b] border border-[#27272a] animate-pulse flex items-center gap-6 shadow-lg">
                                 <div className="w-10 h-10 bg-purple-500/10 rounded-full flex items-center justify-center">
                                     <Loader2 size={20} className="text-purple-500 animate-spin" />
                                 </div>
                                 <div className="flex-1 space-y-3">
                                     <div className="h-2 bg-[#333] rounded w-1/4"></div>
                                     <div className="h-2 bg-[#333] rounded w-1/3"></div>
                                 </div>
                             </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                 </div>
            </div>

            {/* Input Area */}
            <div className="flex-none p-6 bg-[#09090b] flex justify-center z-20">
                 <div className="w-full max-w-4xl">
                     <CreationChatInput 
                        variant="compact"
                        value={config.prompt || config.text || ''}
                        onChange={(val) => setConfig(activeMode === 'audio' || activeMode === 'voice' ? { text: val } : { prompt: val })}
                        onGenerate={onGenerate}
                        isGenerating={isGenerating}
                        placeholder={activeMode === 'video' ? "Describe the video..." : "Describe the image..."}
                        footerControls={renderFooterControls()}
                        onUpload={onUpload}
                        attachments={attachments}
                        onRemoveAttachment={handleRemoveAttachment}
                        className="shadow-2xl"
                     />
                 </div>
            </div>
        </div>
    );
};
