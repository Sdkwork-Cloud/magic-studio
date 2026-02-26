
import React, { useState } from 'react';
import { Sparkles, X, Wand2, Languages, RotateCw } from 'lucide-react';
import { useTranslation } from '@sdkwork/react-i18n';

interface AIPromptModalProps {
    onClose: () => void;
    onInsert: (text: string) => void;
    context: string;
}

export const AIPromptModal: React.FC<AIPromptModalProps> = ({ onClose, onInsert, context }) => {
    const { t } = useTranslation();
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleGenerate = async (customPrompt?: string) => {
        setIsLoading(true);
        const finalPrompt = customPrompt || prompt;
        
        // Mock Generation for now
        setTimeout(() => {
            const mockResponse = `\n\n[AI Generated Content for: "${finalPrompt}"]\n\nHere is a continuation of your thought based on the context provided. This system uses advanced LLMs to help you write faster and better.\n\n- Point 1\n- Point 2\n`;
            onInsert(mockResponse);
            setIsLoading(false);
        }, 1500);
    };

    return (
        <div className="absolute bottom-20 right-6 w-96 bg-[#1e1e1e] border border-[#333] rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
            <div className="p-3 bg-[#252526] border-b border-[#333] flex justify-between items-center">
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                    <Sparkles size={16} className="text-blue-500" />
                    {t('notes.ai_tools')}
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-white">
                    <X size={16} />
                </button>
            </div>

            <div className="p-4 space-y-4">
                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-2">
                    <ActionButton icon={<Wand2 size={14}/>} label={t('notes.ai_actions.continue')} onClick={() => handleGenerate("Continue writing based on context")} />
                    <ActionButton icon={<RotateCw size={14}/>} label={t('notes.ai_actions.polish')} onClick={() => handleGenerate("Polish this text")} />
                    <ActionButton icon={<Languages size={14}/>} label={t('notes.ai_actions.translate')} onClick={() => handleGenerate("Translate to English")} />
                    <ActionButton icon={<Sparkles size={14}/>} label={t('notes.ai_actions.summarize')} onClick={() => handleGenerate("Summarize this")} />
                </div>

                <div className="relative">
                    <textarea 
                        className="w-full bg-[#111] border border-[#333] rounded-lg p-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none h-24"
                        placeholder={t('notes.editor.ai_panel.placeholder_write')}
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        disabled={isLoading}
                    />
                    {isLoading && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    )}
                </div>

                <button 
                    onClick={() => handleGenerate()}
                    disabled={!prompt.trim() || isLoading}
                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2 rounded-lg text-sm font-medium transition-colors"
                >
                    {t('skills.create.actions.generate')}
                </button>
            </div>
        </div>
    );
};

const ActionButton = ({ icon, label, onClick }: { icon: any, label: string, onClick: () => void }) => (
    <button 
        onClick={onClick}
        className="flex items-center justify-center gap-2 px-3 py-2 bg-[#2a2a2c] hover:bg-[#333] border border-[#333] rounded-lg text-xs text-gray-300 transition-colors"
    >
        {icon} {label}
    </button>
);
