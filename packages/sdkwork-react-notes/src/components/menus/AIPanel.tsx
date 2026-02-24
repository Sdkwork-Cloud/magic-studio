
import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Wand2, Languages, FileText, Check, X, Loader2, PenTool } from 'lucide-react';
import { useTranslation } from 'sdkwork-react-i18n';

interface AIPanelProps {
    onClose: () => void;
    onInsert: (text: string, mode: 'replace' | 'insert') => void;
    onDraft?: (topic: string) => void;
    selectionText: string;
    contextText: string;
    position: { top: number; left: number } | null;
}

export const AIPanel: React.FC<AIPanelProps> = ({ onClose, onInsert, onDraft, selectionText, position }) => {
    const { t } = useTranslation();
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (inputRef.current) inputRef.current.focus();
        
        const handleClickOutside = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    const handleAction = async (prompt: string, mode: 'replace' | 'insert' = 'insert') => {
        setIsLoading(true);
        // Mock AI delay
        setTimeout(() => {
            const mockResult = `\n[AI Generated: ${prompt}]\nHere is the improved or generated content based on your request. It is concise and professional.`;
            onInsert(mockResult, mode);
            setIsLoading(false);
        }, 1200);
    };

    const handleDraftClick = () => {
        if (onDraft) {
            onDraft(selectionText || input);
            onClose();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (input.trim()) handleAction(input, selectionText ? 'replace' : 'insert');
        } else if (e.key === 'Escape') {
            onClose();
        }
    };

    // Calculate position: Keep it on screen
    // Default center if no position provided
    const style: React.CSSProperties = position ? {
        top: Math.min(position.top + 40, window.innerHeight - 360) + 'px', // Adjusted for taller panel
        left: Math.max(20, Math.min(position.left - 150, window.innerWidth - 320)) + 'px',
    } : { top: '20%', left: '50%', transform: 'translateX(-50%)' };

    return (
        <div 
            ref={panelRef}
            style={style}
            className="fixed z-[100] w-[320px] bg-[#1e1e1e] border border-[#333] rounded-xl shadow-2xl animate-in fade-in zoom-in-95 duration-100 overflow-hidden flex flex-col"
        >
            {/* Input Header */}
            <div className="p-2 border-b border-[#333] bg-[#252526] flex items-center gap-2">
                <Sparkles size={16} className="text-purple-400 ml-2 animate-pulse" />
                <input
                    ref={inputRef}
                    className="flex-1 bg-transparent border-none text-sm text-white placeholder-gray-500 focus:ring-0 px-2 py-1 outline-none"
                    placeholder={selectionText ? t('notes.editor.ai_panel.placeholder_selection') : t('notes.editor.ai_panel.placeholder_write')}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isLoading}
                />
                {isLoading && <Loader2 size={14} className="animate-spin text-gray-500 mr-2" />}
            </div>

            {/* Quick Actions List */}
            <div className="p-1 space-y-0.5">
                {selectionText ? (
                    <>
                        <div className="px-3 py-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                            Refine
                        </div>
                        <MenuOption 
                            icon={<Wand2 size={14} className="text-blue-400" />} 
                            label={t('notes.editor.ai_panel.improve')}
                            onClick={() => handleAction("Improve this writing", 'replace')} 
                        />
                        <MenuOption 
                            icon={<Check size={14} className="text-green-400" />} 
                            label={t('notes.editor.ai_panel.fix_grammar')}
                            onClick={() => handleAction("Fix grammar", 'replace')} 
                        />
                        <MenuOption 
                            icon={<Languages size={14} className="text-orange-400" />} 
                            label={t('notes.editor.ai_panel.translate')}
                            onClick={() => handleAction("Translate to English", 'replace')} 
                        />
                         
                        <div className="h-[1px] bg-[#333] my-1 mx-2" />
                        
                        <div className="px-3 py-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                            Generate
                        </div>
                        {/* New Option: Draft Full Article from Selection - Now Translated */}
                        <MenuOption 
                            icon={<PenTool size={14} className="text-purple-500" />} 
                            label={t('notes.editor.context_menu.draft_from_selection')}
                            onClick={handleDraftClick}
                        />
                         <MenuOption 
                            icon={<FileText size={14} className="text-gray-400" />} 
                            label={t('notes.editor.context_menu.summarize')}
                            onClick={() => handleAction("Summarize this", 'insert')} 
                        />
                    </>
                ) : (
                    <>
                         <div className="px-3 py-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                            Draft
                        </div>
                        <MenuOption 
                            icon={<Wand2 size={14} className="text-purple-400" />} 
                            label={t('notes.editor.context_menu.continue')}
                            onClick={() => handleAction("Continue writing", 'insert')} 
                        />
                        <MenuOption 
                            icon={<FileText size={14} className="text-gray-400" />} 
                            label={t('notes.editor.ai_panel.brainstorm')}
                            onClick={() => handleAction("Brainstorm ideas for this topic", 'insert')} 
                        />
                        <MenuOption 
                            icon={<PenTool size={14} className="text-blue-400" />} 
                            label={t('notes.ai_drafter.title')}
                            onClick={handleDraftClick}
                        />
                    </>
                )}
            </div>
            
            <div className="bg-[#111] px-3 py-1.5 text-[10px] text-gray-600 flex justify-between items-center border-t border-[#333]">
                <span>{t('notes.editor.ai_panel.disclaimer')}</span>
                <span>ESC to close</span>
            </div>
        </div>
    );
};

const MenuOption: React.FC<{ icon: any, label: string, onClick: () => void }> = ({ icon, label, onClick }) => (
    <button 
        onClick={onClick}
        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:bg-[#2a2a2c] hover:text-white rounded-md transition-colors text-left"
    >
        {icon}
        <span>{label}</span>
    </button>
);
