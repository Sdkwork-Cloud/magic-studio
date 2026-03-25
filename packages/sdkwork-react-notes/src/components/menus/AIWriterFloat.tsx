
import React, { useState, useEffect, useRef } from 'react';
import { 
    Sparkles, ArrowUp, StopCircle, Languages, AlignLeft, 
    FileCode, FileType, Check, ChevronDown, Command
} from 'lucide-react';
import { useTranslation } from '@sdkwork/react-i18n';

export interface AIWriterGenerateOptions {
    tone: string;
    language: string;
    format: 'html' | 'markdown';
}

interface AIWriterFloatProps {
    visible: boolean;
    position: { top: number; left: number } | null;
    initialPrompt?: string;
    onClose: () => void;
    onGenerate: (prompt: string, options: AIWriterGenerateOptions) => Promise<void>;
    isGenerating: boolean;
    onStop: () => void;
}

export const AIWriterFloat: React.FC<AIWriterFloatProps> = ({ 
    visible, position, initialPrompt = '', onClose, onGenerate, isGenerating, onStop 
}) => {
    const { t } = useTranslation();
    const [prompt, setPrompt] = useState(initialPrompt);
    
    // Configuration State
    const [tone, setTone] = useState('Professional');
    const [language, setLanguage] = useState('Chinese (Simplified)');
    const [outputFormat, setOutputFormat] = useState<'html' | 'markdown'>('html');
    
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Sync prompt when prop changes
    useEffect(() => {
        if (visible) {
            setPrompt(initialPrompt);
            // Slight delay to ensure render before focus
            setTimeout(() => {
                if (inputRef.current) {
                    inputRef.current.focus();
                    inputRef.current.style.height = 'auto'; // Reset to calc correct height
                    inputRef.current.style.height = `${Math.min(Math.max(inputRef.current.scrollHeight, 36), 200)}px`;
                }
            }, 50);
        }
    }, [visible, initialPrompt]);

    // Auto-resize textarea
    useEffect(() => {
        const el = inputRef.current;
        if (el) {
            el.style.height = 'auto';
            const newHeight = Math.min(Math.max(el.scrollHeight, 36), 200); // Min 36px, Max 200px
            el.style.height = `${newHeight}px`;
            el.style.overflowY = el.scrollHeight > 200 ? 'auto' : 'hidden';
        }
    }, [prompt]);

    // Click outside to close
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            // Check if click is inside container or all related portal/dropdown roots
            if (containerRef.current && !containerRef.current.contains(e.target as Node) && !isGenerating) {
                // Ensure we aren't clicking a dropdown item that might be portaled (though we render inline here)
                const target = e.target as HTMLElement;
                if (!target.closest('.ai-float-dropdown')) {
                    onClose();
                }
            }
        };
        if (visible) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [visible, onClose, isGenerating]);

    if (!visible || !position) return null;

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (prompt.trim()) {
                onGenerate(prompt, { tone, language, format: outputFormat });
            }
        }
        if (e.key === 'Escape' && !isGenerating) {
            onClose();
        }
    };

    // Derived Options with Translations
    const toneOptions = [
        { value: 'Professional', label: t('notes.ai_drafter.tones.professional') },
        { value: 'Casual', label: t('notes.ai_drafter.tones.casual') },
        { value: 'Academic', label: t('notes.ai_drafter.tones.academic') },
        { value: 'Creative', label: t('notes.ai_drafter.tones.creative') },
        { value: 'Concise', label: t('notes.ai_drafter.tones.concise') },
        { value: 'Enthusiastic', label: t('notes.ai_drafter.tones.enthusiastic') },
    ];

    const languageOptions = [
        { value: 'Chinese (Simplified)', label: t('notes.ai_drafter.languages.chineseSimplified') },
        { value: 'English', label: t('notes.ai_drafter.languages.english') },
        { value: 'Japanese', label: t('notes.ai_drafter.languages.japanese') },
        { value: 'Korean', label: t('notes.ai_drafter.languages.korean') },
        { value: 'Spanish', label: t('notes.ai_drafter.languages.spanish') },
        { value: 'French', label: t('notes.ai_drafter.languages.french') },
        { value: 'German', label: t('notes.ai_drafter.languages.german') },
    ];

    // Calculate position style
    const style: React.CSSProperties = {
        top: position.top,
        left: position.left,
        transform: 'translateY(10px)',
    };

    return (
        <div 
            ref={containerRef}
            className="fixed z-[9999] flex flex-col w-[600px] bg-[#18181b]/95 backdrop-blur-xl border border-[#333] rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 origin-top-left ring-1 ring-white/5"
            style={style}
        >
            {/* Row 1: Input Area - Aligned to bottom to handle multiline growth nicely */}
            <div className="flex items-end p-3 gap-3">
                <div className={`
                    w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-500 mb-[1px]
                    ${isGenerating 
                        ? 'bg-gradient-to-tr from-purple-500/20 to-blue-500/20 text-purple-400 animate-pulse' 
                        : 'bg-gradient-to-br from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-900/30'}
                `}>
                    {isGenerating ? <LoaderIcon /> : <Sparkles size={18} fill="currentColor" />}
                </div>

                <textarea
                    ref={inputRef}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isGenerating}
                    placeholder={t('notes.editor.ai_panel.placeholder_write')}
                    rows={1}
                    className="flex-1 bg-transparent border-none outline-none text-[15px] text-white placeholder-gray-500 font-medium resize-none min-h-[36px] max-h-[200px] py-[7px] leading-snug custom-scrollbar"
                />

                <div className="mb-[1px] flex-shrink-0">
                    {isGenerating ? (
                        <button 
                            onClick={onStop}
                            className="p-2 bg-[#2a2a2c] hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded-lg transition-colors border border-[#333] w-9 h-9 flex items-center justify-center"
                            title={t('notes.editor.ai_panel.stop')}
                        >
                            <StopCircle size={18} />
                        </button>
                    ) : (
                        <button 
                            onClick={() => prompt.trim() && onGenerate(prompt, { tone, language, format: outputFormat })}
                            disabled={!prompt.trim()}
                            className={`
                                p-2 rounded-lg transition-all duration-200 border w-9 h-9 flex items-center justify-center
                                ${prompt.trim() 
                                    ? 'bg-white text-black hover:bg-gray-200 border-white shadow-md' 
                                    : 'bg-[#2a2a2c] text-gray-600 border-[#333] cursor-not-allowed'}
                            `}
                        >
                            <ArrowUp size={18} strokeWidth={3} />
                        </button>
                    )}
                </div>
            </div>

            {/* Row 2: Configuration Toolbar (Visible when not generating) */}
            {!isGenerating && (
                <div className="flex items-center justify-between px-3 pb-3 pt-0 animate-in slide-in-from-top-1 duration-200">
                    
                    {/* Left: Selectors */}
                    <div className="flex items-center gap-2">
                        {/* Language Selector */}
                        <CustomDropdown 
                            icon={<Languages size={13} />}
                            value={language}
                            options={languageOptions}
                            onChange={setLanguage}
                            activeColor="text-blue-400"
                        />
                        
                        {/* Tone Selector */}
                        <CustomDropdown 
                            icon={<AlignLeft size={13} />}
                            value={tone}
                            options={toneOptions}
                            onChange={setTone}
                            activeColor="text-purple-400"
                        />
                    </div>
                    
                    {/* Right: Format Toggle */}
                    <div className="flex items-center gap-3">
                        <div className="h-4 w-[1px] bg-[#333]" />
                        
                        <div className="flex bg-[#222] p-0.5 rounded-lg border border-[#333]">
                            <button
                                onClick={() => setOutputFormat('html')}
                                className={`
                                    flex items-center gap-1.5 px-2 py-1 text-[10px] font-medium rounded-md transition-all
                                    ${outputFormat === 'html' 
                                        ? 'bg-[#333] text-white shadow-sm' 
                                        : 'text-gray-500 hover:text-gray-300'}
                                `}
                                title={t('notes.editor.ai_panel.rich_text_tooltip')}
                            >
                                <FileType size={12} /> {t('notes.editor.ai_panel.format_rich_text')}
                            </button>
                            <button
                                onClick={() => setOutputFormat('markdown')}
                                className={`
                                    flex items-center gap-1.5 px-2 py-1 text-[10px] font-medium rounded-md transition-all
                                    ${outputFormat === 'markdown' 
                                        ? 'bg-[#333] text-white shadow-sm' 
                                        : 'text-gray-500 hover:text-gray-300'}
                                `}
                                title={t('notes.editor.ai_panel.markdown_tooltip')}
                            >
                                <FileCode size={12} /> {t('notes.editor.ai_panel.format_markdown')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Footer Hint (Optional) */}
            {!isGenerating && prompt.trim().length === 0 && (
                <div className="px-4 pb-3 text-[10px] text-gray-600 flex items-center justify-end border-t border-[#27272a] pt-2 mt-1">
                    <span className="flex items-center gap-1">
                        <Command size={10} /> {t('notes.editor.ai_panel.hint_run')}
                    </span>
                </div>
            )}
        </div>
    );
};

// --- Sub-components ---

interface DropdownOption {
    label: string;
    value: string;
}

interface CustomDropdownProps {
    icon: React.ReactNode;
    value: string;
    options: DropdownOption[];
    onChange: (val: string) => void;
    activeColor?: string;
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({ icon, value, options, onChange, activeColor = "text-white" }) => {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    // Resolve label for current value
    const currentLabel = options.find(o => o.value === value)?.label || value;

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    return (
        <div className="relative ai-float-dropdown" ref={ref}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all
                    ${isOpen 
                        ? 'bg-[#2a2a2c] border-[#444] text-white' 
                        : 'bg-transparent border-transparent hover:bg-[#222] text-gray-400 hover:text-gray-200'}
                `}
            >
                <span className={isOpen ? activeColor : ''}>{icon}</span>
                <span className="truncate max-w-[100px]">{currentLabel}</span>
                <ChevronDown size={10} className={`opacity-50 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-1.5 w-48 bg-[#1e1e1e] border border-[#333] rounded-xl shadow-2xl py-1 z-[100] animate-in fade-in zoom-in-95 duration-75 overflow-hidden ring-1 ring-black/50">
                    <div className="max-h-[240px] overflow-y-auto custom-scrollbar">
                        {options.map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => { onChange(opt.value); setIsOpen(false); }}
                                className={`
                                    w-full flex items-center justify-between px-3 py-2 text-xs text-left transition-colors
                                    ${opt.value === value 
                                        ? 'bg-[#2a2a2c] text-white' 
                                        : 'text-gray-400 hover:bg-[#252526] hover:text-gray-200'}
                                `}
                            >
                                <span>{opt.label}</span>
                                {opt.value === value && <Check size={12} className={activeColor} />}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const LoaderIcon = () => (
    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);
