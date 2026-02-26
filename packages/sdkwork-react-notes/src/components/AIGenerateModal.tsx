
import { Button, genAIService } from '@sdkwork/react-commons';
import React, { useState } from 'react';
import { 
    X, Image as ImageIcon, Video, Mic, Sparkles, 
    Loader2, RotateCcw 
} from 'lucide-react';
import { useTranslation } from '@sdkwork/react-i18n';

export type MediaType = 'image' | 'video' | 'audio';

interface AIGenerateModalProps {
    initialType: MediaType;
    onClose: () => void;
    onInsert: (type: MediaType, src: string) => void;
}

export const AIGenerateModal: React.FC<AIGenerateModalProps> = ({ initialType, onClose, onInsert }) => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<MediaType>(initialType);
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [resultSrc, setResultSrc] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        
        setIsGenerating(true);
        setError(null);
        setResultSrc(null);

        try {
            let src = '';
            if (activeTab === 'image') {
                src = await genAIService.generateImage(prompt);
            } else if (activeTab === 'video') {
                src = await genAIService.generateVideo(prompt);
            } else if (activeTab === 'audio') {
                src = await genAIService.generateSpeech(prompt);
            }
            setResultSrc(src);
        } catch (e: any) {
            console.error(e);
            setError(e.message || "Generation failed");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleInsert = () => {
        if (resultSrc) {
            onInsert(activeTab, resultSrc);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-[600px] bg-[#121214] border border-[#333] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                
                {/* Header Tabs */}
                <div className="flex border-b border-[#333] bg-[#18181b]">
                    <TabButton 
                        active={activeTab === 'image'} 
                        onClick={() => { setActiveTab('image'); setResultSrc(null); setError(null); }} 
                        icon={<ImageIcon size={16} />} 
                        label="Image" 
                    />
                    <TabButton 
                        active={activeTab === 'video'} 
                        onClick={() => { setActiveTab('video'); setResultSrc(null); setError(null); }} 
                        icon={<Video size={16} />} 
                        label="Video" 
                    />
                    <TabButton 
                        active={activeTab === 'audio'} 
                        onClick={() => { setActiveTab('audio'); setResultSrc(null); setError(null); }} 
                        icon={<Mic size={16} />} 
                        label="Audio" 
                    />
                    <div className="flex-1 draggable-region" />
                    <button onClick={onClose} className="px-4 text-gray-400 hover:text-white transition-colors">
                        <X size={18} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 flex flex-col gap-4">
                    
                    {/* Input Area */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">
                            {activeTab === 'audio' ? 'Text to Speech' : 'Prompt'}
                        </label>
                        <div className="relative">
                            <textarea
                                className="w-full bg-[#0a0a0a] border border-[#333] rounded-xl p-3 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 resize-none h-24 transition-all"
                                placeholder={
                                    activeTab === 'image' ? "Describe the image you want to generate..." :
                                    activeTab === 'video' ? "Describe the video scene..." :
                                    "Enter the text you want spoken..."
                                }
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                disabled={isGenerating}
                            />
                            <div className="absolute bottom-2 right-2">
                                <button
                                    onClick={handleGenerate}
                                    disabled={!prompt.trim() || isGenerating}
                                    className={`
                                        flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-lg
                                        ${!prompt.trim() || isGenerating 
                                            ? 'bg-[#333] text-gray-500 cursor-not-allowed' 
                                            : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:scale-105'
                                        }
                                    `}
                                >
                                    {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                                    <span>Generate</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Preview Area */}
                    <div className="min-h-[200px] bg-[#0a0a0a] border border-[#333] rounded-xl flex items-center justify-center relative overflow-hidden group">
                        {isGenerating ? (
                            <div className="flex flex-col items-center gap-3 text-blue-400">
                                <Loader2 size={32} className="animate-spin" />
                                <span className="text-xs font-medium animate-pulse">
                                    {activeTab === 'video' ? 'Generating video (this may take a minute)...' : 'Generating...'}
                                </span>
                            </div>
                        ) : resultSrc ? (
                            <>
                                {activeTab === 'image' && <img src={resultSrc} alt="Generated" className="max-w-full max-h-[300px] object-contain" />}
                                {activeTab === 'video' && <video src={resultSrc} controls className="max-w-full max-h-[300px] rounded-lg" />}
                                {activeTab === 'audio' && (
                                    <div className="w-full px-8 py-12 flex flex-col items-center gap-4">
                                        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/20">
                                            <Mic size={32} className="text-white" />
                                        </div>
                                        <audio src={resultSrc} controls className="w-full" />
                                    </div>
                                )}
                                
                                {/* Overlay Actions */}
                                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                     <button 
                                        onClick={handleGenerate}
                                        className="p-2 bg-black/50 hover:bg-black/80 text-white rounded-lg backdrop-blur-sm transition-colors"
                                        title="Regenerate"
                                    >
                                        <RotateCcw size={16} />
                                    </button>
                                </div>
                            </>
                        ) : error ? (
                             <div className="text-red-400 text-sm text-center px-4">
                                 <p className="font-bold mb-1">Generation Failed</p>
                                 <p className="opacity-80">{error}</p>
                             </div>
                        ) : (
                            <div className="text-gray-600 text-xs italic flex flex-col items-center gap-2">
                                <Sparkles size={24} className="opacity-20" />
                                Preview will appear here
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="flex justify-end pt-2">
                         <Button 
                            onClick={handleInsert} 
                            disabled={!resultSrc}
                            className={`w-full py-3 rounded-xl font-bold shadow-xl transition-all ${!resultSrc ? 'opacity-50' : 'hover:scale-[1.01]'}`}
                         >
                             Insert to Note
                         </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const TabButton = ({ active, onClick, icon, label }: any) => (
    <button
        onClick={onClick}
        className={`
            flex items-center gap-2 px-6 py-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2
            ${active 
                ? 'bg-[#1e1e20] text-blue-400 border-blue-500' 
                : 'text-gray-500 border-transparent hover:text-gray-300 hover:bg-[#202022]'
            }
        `}
    >
        {icon} {label}
    </button>
);
