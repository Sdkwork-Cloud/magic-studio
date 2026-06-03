
import React, { useState } from 'react';
import { Sparkles, X, Wand2, Languages, RotateCw } from 'lucide-react';
import { useTranslation } from '@sdkwork/magic-studio-i18n';

interface AIPromptModalProps {
    onClose: () => void;
    onInsert: (text: string) => void;
    onGenerate?: (request: AIPromptGenerateRequest) => Promise<string>;
    context: string;
}

export interface AIPromptGenerateRequest {
    prompt: string;
    context: string;
}

interface ActionButtonProps {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    disabled?: boolean;
}

export const AIPromptModal: React.FC<AIPromptModalProps> = ({ onClose, onInsert, onGenerate, context }) => {
    const { t } = useTranslation();
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleGenerate = async (customPrompt?: string) => {
        const finalPrompt = (customPrompt || prompt).trim();
        if (!finalPrompt || isLoading) {
            return;
        }

        if (!onGenerate) {
            setErrorMessage(t('notes.ai_generation.unavailable'));
            return;
        }

        setIsLoading(true);
        setErrorMessage(null);
        try {
            const generatedText = await onGenerate({
                prompt: finalPrompt,
                context,
            });
            if (!generatedText.trim()) {
                throw new Error(t('notes.ai_generation.empty_response'));
            }
            onInsert(generatedText);
        } catch (error) {
            console.error('[AIPromptModal] AI generation failed', error);
            setErrorMessage(error instanceof Error && error.message
                ? error.message
                : t('notes.ai_generation.failed'));
        } finally {
            setIsLoading(false);
        }
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
                    <ActionButton icon={<Wand2 size={14}/>} label={t('notes.ai_actions.continue')} disabled={isLoading} onClick={() => handleGenerate("Continue writing based on context")} />
                    <ActionButton icon={<RotateCw size={14}/>} label={t('notes.ai_actions.polish')} disabled={isLoading} onClick={() => handleGenerate("Polish this text")} />
                    <ActionButton icon={<Languages size={14}/>} label={t('notes.ai_actions.translate')} disabled={isLoading} onClick={() => handleGenerate("Translate to English")} />
                    <ActionButton icon={<Sparkles size={14}/>} label={t('notes.ai_actions.summarize')} disabled={isLoading} onClick={() => handleGenerate("Summarize this")} />
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

                {errorMessage && (
                    <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs leading-snug text-red-300">
                        {errorMessage}
                    </div>
                )}
            </div>
        </div>
    );
};

const ActionButton: React.FC<ActionButtonProps> = ({ icon, label, onClick, disabled }) => (
    <button 
        onClick={onClick}
        disabled={disabled}
        className="flex items-center justify-center gap-2 px-3 py-2 bg-[#2a2a2c] hover:bg-[#333] border border-[#333] rounded-lg text-xs text-gray-300 transition-colors disabled:cursor-wait disabled:opacity-60"
    >
        {icon} {label}
    </button>
);
