
import { Button } from 'sdkwork-react-commons'
import React, { useState, useEffect } from 'react';
import { Sparkles, X, Wand2, RefreshCw, CheckCircle2, ArrowLeft, Loader2 } from 'lucide-react';
import { genAIService } from 'sdkwork-react-core';

interface AIGenerateCoverModalProps {
    contextText: string;
    onClose: () => void;
    onSuccess: (imageUrl: string) => void;
}

type Step = 'analyzing' | 'selection' | 'generating' | 'preview';

export const AIGenerateCoverModal: React.FC<AIGenerateCoverModalProps> = ({ contextText, onClose, onSuccess }) => {
    const [step, setStep] = useState<Step>('analyzing');
    const [prompts, setPrompts] = useState<string[]>([]);
    const [selectedPrompt, setSelectedPrompt] = useState<string>('');
    const [generatedImage, setGeneratedImage] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        analyzeContent();
    }, []);

    const analyzeContent = async () => {
        setStep('analyzing');
        setError(null);
        try {
            const suggestions = await genAIService.generateCoverPrompts(contextText || "General topic");
            setPrompts(suggestions);
            setStep('selection');
        } catch (e: any) {
            setError(e.message || "Failed to analyze content");
            // Fallback prompts
            setPrompts([
                "A modern minimalist abstract composition, high quality, 4k",
                "A futuristic digital landscape, neon colors, synthwave style",
                "A professional clean workspace with technology elements, photorealistic"
            ]);
            setStep('selection');
        }
    };

    const generateImage = async (prompt: string) => {
        setSelectedPrompt(prompt);
        setStep('generating');
        setError(null);
        try {
            const imageUrl = await genAIService.generateImage(prompt);
            setGeneratedImage(imageUrl);
            setStep('preview');
        } catch (e: any) {
            setError(e.message || "Failed to generate image");
            setStep('selection');
        }
    };

    const handleConfirm = () => {
        if (generatedImage) {
            onSuccess(generatedImage);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div 
                className="w-[600px] bg-[#1e1e1e] border border-[#333] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-[#333] bg-[#252526] flex justify-between items-center">
                    <div className="flex items-center gap-2 text-white font-bold">
                        <Sparkles size={18} className="text-purple-500" />
                        <span>AI Cover Generator</span>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X size={18} />
                    </button>
                </div>

                <div className="p-6 min-h-[350px] flex flex-col">
                    
                    {/* STEP 1: ANALYZING */}
                    {step === 'analyzing' && (
                        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
                             <div className="relative">
                                 <div className="w-16 h-16 rounded-full border-2 border-purple-500/30 animate-ping absolute inset-0" />
                                 <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">
                                     <Wand2 size={32} className="animate-pulse" />
                                 </div>
                             </div>
                             <div>
                                 <h3 className="text-lg font-medium text-white mb-1">Analyzing Context...</h3>
                                 <p className="text-sm text-gray-500">Generating creative concepts based on your content.</p>
                             </div>
                        </div>
                    )}

                    {/* STEP 2: SELECTION */}
                    {step === 'selection' && (
                        <div className="flex-1 flex flex-col">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Select a Style Concept</h3>
                            {error && (
                                <div className="mb-4 p-3 bg-red-900/20 border border-red-900/50 rounded-lg text-red-400 text-xs flex items-center gap-2">
                                    <X size={14} /> {error}
                                </div>
                            )}
                            <div className="space-y-3 flex-1 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
                                {prompts.map((prompt, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => generateImage(prompt)}
                                        className="w-full text-left p-4 bg-[#252526] hover:bg-[#2a2a2c] border border-[#333] hover:border-purple-500/50 rounded-xl transition-all group relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 left-0 w-1 h-full bg-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <p className="text-sm text-gray-200 line-clamp-2 pr-4">{prompt}</p>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-purple-400">
                                            <ArrowLeft size={16} className="rotate-180" />
                                        </div>
                                    </button>
                                ))}
                            </div>
                            <div className="mt-4 flex justify-between items-center border-t border-[#333] pt-4">
                                <button onClick={analyzeContent} className="text-xs text-gray-500 hover:text-white flex items-center gap-1.5 transition-colors">
                                    <RefreshCw size={12} /> Regenerate Ideas
                                </button>
                                <span className="text-xs text-gray-600">Powered by Gemini</span>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: GENERATING */}
                    {step === 'generating' && (
                        <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center">
                             <div className="w-64 h-40 bg-[#111] border border-[#333] rounded-lg relative overflow-hidden flex items-center justify-center">
                                 <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/10 to-transparent w-full h-full animate-[shimmer_2s_infinite]" />
                                 <Loader2 size={32} className="text-purple-500 animate-spin relative z-10" />
                             </div>
                             <div className="max-w-sm">
                                 <h3 className="text-white font-medium mb-2">Dreaming...</h3>
                                 <p className="text-xs text-gray-500 italic px-4">"{selectedPrompt}"</p>
                             </div>
                        </div>
                    )}

                    {/* STEP 4: PREVIEW */}
                    {step === 'preview' && (
                        <div className="flex-1 flex flex-col h-full">
                             <div className="flex-1 bg-[#111] rounded-xl border border-[#333] overflow-hidden relative group mb-6 flex items-center justify-center min-h-[250px]">
                                 <img src={generatedImage} className="max-w-full max-h-[350px] object-contain shadow-2xl" alt="Generated Cover" />
                                 <div className="absolute bottom-3 right-3 flex gap-2">
                                     <button 
                                        onClick={() => generateImage(selectedPrompt)}
                                        className="p-2 bg-black/60 hover:bg-black/80 text-white rounded-lg backdrop-blur-md transition-colors border border-white/10"
                                        title="Regenerate"
                                    >
                                         <RefreshCw size={16} />
                                     </button>
                                 </div>
                             </div>

                             <div className="flex gap-3">
                                 <Button variant="secondary" onClick={() => setStep('selection')} className="flex-1">
                                     <ArrowLeft size={16} className="mr-2" /> Back
                                 </Button>
                                 <Button onClick={handleConfirm} className="flex-[2] bg-gradient-to-r from-purple-600 to-blue-600 border-0">
                                     <CheckCircle2 size={16} className="mr-2" /> Use Cover
                                 </Button>
                             </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};
