
import React, { useState, useEffect, useRef } from 'react';
import { X, Sparkles, FileText, AlignLeft, Globe, Zap, Loader2, ArrowRight, Eye, RefreshCw, Layers } from 'lucide-react';
import { useTranslation } from '@sdkwork/react-i18n';
import { genAIService } from '@sdkwork/react-core';

import { Button, markdownUtils } from '@sdkwork/react-commons';

interface AIDrafterModalProps {
    initialTopic?: string;
    onClose: () => void;
    /**
     * Callback when generation is confirmed.
     * Returns the fully rendered HTML string.
     */
    onInsert: (htmlContent: string) => void;
}

const SUPPORTED_LANGUAGES = [
    { value: 'Chinese (Simplified)', labelKey: 'notes.ai_drafter.languages.chineseSimplified' },
    { value: 'English', label: 'English' },
    { value: 'Japanese', labelKey: 'notes.ai_drafter.languages.japanese' },
    { value: 'Korean', labelKey: 'notes.ai_drafter.languages.korean' },
    { value: 'Spanish', label: 'Español' },
    { value: 'French', label: 'Français' },
    { value: 'German', label: 'Deutsch' },
    { value: 'Portuguese', label: 'Português' },
];

export const AIDrafterModal: React.FC<AIDrafterModalProps> = ({ initialTopic, onClose, onInsert }) => {
    const { t } = useTranslation();
    
    // Config State
    const [topic, setTopic] = useState(initialTopic || '');
    const [context, setContext] = useState('');
    const [type, setType] = useState('Article');
    const [tone, setTone] = useState('Professional');
    const [language, setLanguage] = useState('Chinese (Simplified)');
    
    // Generation State
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedMarkdown, setGeneratedMarkdown] = useState('');
    const [generatedHtml, setGeneratedHtml] = useState('');
    const [hasStarted, setHasStarted] = useState(false);
    
    const previewRef = useRef<HTMLDivElement>(null);

    // Auto-scroll preview
    useEffect(() => {
        if (previewRef.current && isGenerating) {
            previewRef.current.scrollTop = previewRef.current.scrollHeight;
        }
    }, [generatedHtml, isGenerating]);

    // Real-time Markdown -> HTML conversion
    useEffect(() => {
        const html = markdownUtils.toHtml(generatedMarkdown);
        setGeneratedHtml(html);
    }, [generatedMarkdown]);

    const handleGenerate = async () => {
        if (!topic.trim()) return;
        
        setIsGenerating(true);
        setHasStarted(true);
        setGeneratedMarkdown(''); // Reset
        
        try {
            await genAIService.streamArticle(
                { topic, type, tone, language, context },
                (chunk: string) => {
                    setGeneratedMarkdown(prev => prev + chunk);
                }
            );
        } catch (e) {
            console.error("Article generation failed", e);
            setGeneratedMarkdown(prev => prev + "\n\n**Error:** Failed to generate article. Please check your network or API key.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleConfirmInsert = () => {
        onInsert(generatedHtml);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 p-6">
            <div 
                className="w-full max-w-6xl h-[85vh] bg-[#121214] border border-[#333] rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-all"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex-none px-6 py-4 border-b border-[#333] bg-[#18181b] flex justify-between items-center">
                    <div className="flex items-center gap-3 text-white">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-900/20">
                            <Sparkles size={18} className="text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-base">{t('notes.ai_drafter.title')}</h3>
                            <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">AI Writing Assistant</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-[#333] rounded-lg">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* LEFT: Configuration */}
                    <div className={`
                        flex-none w-[380px] border-r border-[#333] bg-[#121214] flex flex-col p-6 space-y-6 overflow-y-auto custom-scrollbar transition-all duration-300
                        ${hasStarted && window.innerWidth < 1024 ? 'hidden' : 'block'} 
                    `}>
                        {/* 1. Topic */}
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-1.5">
                                <FileText size={12} /> {t('notes.ai_drafter.topic_label')}
                            </label>
                            <textarea
                                className="w-full bg-[#0a0a0a] border border-[#333] rounded-xl p-3 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 resize-none h-24 transition-all leading-relaxed"
                                placeholder={t('notes.ai_drafter.topic_placeholder')}
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                autoFocus={!hasStarted}
                                disabled={isGenerating}
                            />
                        </div>

                        {/* 2. Context */}
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-1.5">
                                <Layers size={12} /> {t('notes.ai_drafter.context_label')}
                            </label>
                            <textarea
                                className="w-full bg-[#0a0a0a] border border-[#333] rounded-xl p-3 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 resize-none h-24 transition-all leading-relaxed"
                                placeholder={t('notes.ai_drafter.context_placeholder')}
                                value={context}
                                onChange={(e) => setContext(e.target.value)}
                                disabled={isGenerating}
                            />
                        </div>

                        <div className="w-full h-[1px] bg-[#333]" />

                        {/* 3. Settings Grid */}
                        <div className="grid grid-cols-1 gap-4">
                            
                            {/* Language */}
                            <div className="space-y-1">
                                 <label className="text-xs font-bold text-gray-500 uppercase ml-1 flex items-center gap-1">
                                    <Globe size={12} /> {t('notes.ai_drafter.language')}
                                </label>
                                <div className="relative group">
                                    <select 
                                        className="w-full bg-[#18181b] border border-[#333] text-gray-200 text-sm rounded-lg px-3 py-2.5 appearance-none focus:outline-none focus:border-purple-500 cursor-pointer hover:bg-[#202022] transition-colors"
                                        value={language}
                                        onChange={(e) => setLanguage(e.target.value)}
                                        disabled={isGenerating}
                                    >
                                        {SUPPORTED_LANGUAGES.map(lang => (
                                            <option key={lang.value} value={lang.value}>
                                                {lang.labelKey ? t(lang.labelKey) : lang.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                {/* Format */}
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase ml-1 flex items-center gap-1">
                                        <FileText size={12} /> {t('notes.ai_drafter.format')}
                                    </label>
                                    <select 
                                        className="w-full bg-[#18181b] border border-[#333] text-gray-200 text-sm rounded-lg px-3 py-2.5 appearance-none focus:outline-none focus:border-purple-500 cursor-pointer hover:bg-[#202022] transition-colors"
                                        value={type}
                                        onChange={(e) => setType(e.target.value)}
                                        disabled={isGenerating}
                                    >
                                        <option value="Article">{t('notes.ai_drafter.formats.article')}</option>
                                        <option value="Blog Post">{t('notes.ai_drafter.formats.blog')}</option>
                                        <option value="Essay">{t('notes.ai_drafter.formats.essay')}</option>
                                        <option value="Report">{t('notes.ai_drafter.formats.report')}</option>
                                        <option value="Story">{t('notes.ai_drafter.formats.story')}</option>
                                    </select>
                                </div>

                                {/* Tone */}
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase ml-1 flex items-center gap-1">
                                        <AlignLeft size={12} /> {t('notes.ai_drafter.tone')}
                                    </label>
                                    <select 
                                        className="w-full bg-[#18181b] border border-[#333] text-gray-200 text-sm rounded-lg px-3 py-2.5 appearance-none focus:outline-none focus:border-purple-500 cursor-pointer hover:bg-[#202022] transition-colors"
                                        value={tone}
                                        onChange={(e) => setTone(e.target.value)}
                                        disabled={isGenerating}
                                    >
                                        <option value="Professional">{t('notes.ai_drafter.tones.professional')}</option>
                                        <option value="Casual">{t('notes.ai_drafter.tones.casual')}</option>
                                        <option value="Enthusiastic">{t('notes.ai_drafter.tones.enthusiastic')}</option>
                                        <option value="Academic">{t('notes.ai_drafter.tones.academic')}</option>
                                        <option value="Creative">{t('notes.ai_drafter.tones.creative')}</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Generate Button */}
                        <div className="pt-4 mt-auto">
                            <Button 
                                onClick={handleGenerate}
                                disabled={!topic.trim() || isGenerating}
                                className={`
                                    w-full py-3.5 text-sm font-bold border-0 shadow-lg transition-all duration-300 rounded-xl
                                    ${isGenerating 
                                        ? 'bg-[#333] text-gray-500 cursor-wait' 
                                        : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 shadow-purple-900/20'
                                    }
                                `}
                            >
                                {isGenerating ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <Loader2 size={16} className="animate-spin" />
                                        {t('notes.ai_drafter.generating')}
                                    </span>
                                ) : (
                                    <span className="flex items-center justify-center gap-2">
                                        {hasStarted ? <RefreshCw size={16} /> : <Zap size={16} className="fill-current" />}
                                        {hasStarted ? 'Regenerate' : t('notes.ai_drafter.submit')}
                                    </span>
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* RIGHT: Live Preview */}
                    <div className="flex-1 flex flex-col bg-[#0a0a0a] min-w-0 relative">
                        {/* Preview Toolbar */}
                        <div className="flex-none h-10 border-b border-[#333] bg-[#121214] flex items-center justify-between px-4">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                <Eye size={12} /> Live Preview
                            </span>
                            {isGenerating && (
                                <span className="text-[10px] text-purple-400 animate-pulse flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                                    Writing...
                                </span>
                            )}
                        </div>

                        {/* Preview Content */}
                        <div 
                            ref={previewRef}
                            className="flex-1 overflow-y-auto p-8 custom-scrollbar scroll-smooth"
                        >
                            {!hasStarted ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-600 space-y-4">
                                    <div className="w-20 h-20 rounded-3xl bg-[#18181b] border border-[#27272a] flex items-center justify-center">
                                        <FileText size={40} className="opacity-20" />
                                    </div>
                                    <div className="text-center space-y-1">
                                        <p className="text-sm font-medium text-gray-400">Ready to draft</p>
                                        <p className="text-xs text-gray-600 max-w-xs mx-auto">
                                            Enter a topic and optional context on the left to start generating your article.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="prose prose-invert prose-sm max-w-3xl mx-auto pb-20">
                                    {/* Render HTML from Markdown */}
                                    <div dangerouslySetInnerHTML={{ __html: generatedHtml }} />
                                    
                                    {/* Cursor Blinking */}
                                    {isGenerating && (
                                        <span className="inline-block w-2 h-5 bg-purple-500 ml-1 align-middle animate-pulse" />
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Footer / Insert Action */}
                        <div className="flex-none p-4 bg-[#121214] border-t border-[#333] flex justify-end">
                            <Button 
                                onClick={handleConfirmInsert}
                                disabled={!generatedHtml || isGenerating}
                                className={`
                                    px-8 gap-2 bg-green-600 hover:bg-green-500 border-0 shadow-lg shadow-green-900/20 font-bold transition-all rounded-xl py-3
                                    ${!generatedHtml || isGenerating ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:scale-[1.02]'}
                                `}
                            >
                                Use Article <ArrowRight size={16} />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
