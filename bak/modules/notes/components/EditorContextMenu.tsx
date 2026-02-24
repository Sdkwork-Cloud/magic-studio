
import React, { useEffect, useRef } from 'react';
import { 
    Copy, ClipboardPaste, Scissors, 
    Sparkles, Wand2, Languages, FileText, 
    Eraser, List, CheckCircle2
} from 'lucide-react';
import { Editor } from '@tiptap/react';
import { useTranslation } from '../../../i18n';
import { platform } from '../../../platform';

interface EditorContextMenuProps {
    x: number;
    y: number;
    editor: Editor;
    onClose: () => void;
    onTriggerAI: (mode: 'insert' | 'replace', context: string) => void;
}

export const EditorContextMenu: React.FC<EditorContextMenuProps> = ({ x, y, editor, onClose, onTriggerAI }) => {
    const menuRef = useRef<HTMLDivElement>(null);
    const { t } = useTranslation();

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    const selectionText = editor.state.selection.content().toString();
    const hasSelection = !editor.state.selection.empty;

    const handleCopy = () => {
        if (hasSelection) {
            const text = editor.state.selection.content().toString();
            // Use platform API if available for consistency, else browser API
            if (platform.getPlatform() === 'desktop') {
                platform.copy(text);
            } else {
                navigator.clipboard.writeText(text);
            }
        }
        onClose();
    };

    const handlePaste = async () => {
        try {
            const text = await platform.paste();
            if (text) editor.commands.insertContent(text);
        } catch (e) {
            console.error('Paste failed', e);
            // Fallback for web if platform.paste fails or isn't implemented
            try {
                const text = await navigator.clipboard.readText();
                if (text) editor.commands.insertContent(text);
            } catch (err) {
                console.error('Web paste failed', err);
            }
        }
        onClose();
    };

    const handleCut = () => {
        if (hasSelection) {
             const text = editor.state.selection.content().toString();
             platform.copy(text); // Or navigator.clipboard
             editor.commands.deleteSelection();
        }
        onClose();
    };

    const handleAIAction = (prompt: string, mode: 'insert' | 'replace') => {
        const context = hasSelection ? selectionText : editor.getText();
        onTriggerAI(mode, `${prompt}:\n\n${context}`);
        onClose();
    };

    // Bounds checking to keep menu on screen
    const top = Math.min(y, window.innerHeight - 300);
    const left = Math.min(x, window.innerWidth - 220);

    return (
        <div 
            ref={menuRef}
            className="fixed z-[100] w-56 bg-[#252526] border border-[#454545] shadow-2xl rounded-lg py-1 flex flex-col text-sm text-gray-200 animate-in fade-in zoom-in-95 duration-75 select-none"
            style={{ top, left }}
        >
            {/* Standard Edit Actions */}
            <MenuItem onClick={handleCut} icon={<Scissors size={14} />} label={t('common.actions.cut')} disabled={!hasSelection} shortcut="Ctrl+X" />
            <MenuItem onClick={handleCopy} icon={<Copy size={14} />} label={t('common.actions.copy')} disabled={!hasSelection} shortcut="Ctrl+C" />
            <MenuItem onClick={handlePaste} icon={<ClipboardPaste size={14} />} label={t('common.actions.paste')} shortcut="Ctrl+V" />
            
            <Separator />

            {/* AI Actions */}
            <div className="px-3 py-1 text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <Sparkles size={10} className="text-purple-400" />
                {t('notes.editor.context_menu.ai_tools')}
            </div>

            {hasSelection ? (
                <>
                    <MenuItem onClick={() => handleAIAction("Improve writing", 'replace')} icon={<Wand2 size={14} className="text-purple-400" />} label={t('notes.editor.context_menu.improve')} />
                    <MenuItem onClick={() => handleAIAction("Fix grammar and spelling", 'replace')} icon={<CheckCircle2 size={14} className="text-green-400" />} label={t('notes.editor.context_menu.fix_grammar')} />
                    <MenuItem onClick={() => handleAIAction("Translate to English", 'replace')} icon={<Languages size={14} className="text-blue-400" />} label={t('notes.editor.context_menu.translate')} />
                    <MenuItem onClick={() => handleAIAction("Summarize this", 'insert')} icon={<FileText size={14} />} label={t('notes.editor.context_menu.summarize')} />
                </>
            ) : (
                <>
                    <MenuItem onClick={() => handleAIAction("Continue writing", 'insert')} icon={<Wand2 size={14} className="text-purple-400" />} label={t('notes.editor.context_menu.continue')} />
                    <MenuItem onClick={() => handleAIAction("Generate a summary", 'insert')} icon={<List size={14} />} label={t('notes.editor.context_menu.summarize_page')} />
                </>
            )}

            <Separator />
            <MenuItem onClick={() => { editor.commands.clearContent(); onClose(); }} icon={<Eraser size={14} />} label={t('notes.editor.context_menu.clear_all')} danger />
        </div>
    );
};

const MenuItem: React.FC<{ 
    onClick: () => void, 
    icon: React.ReactNode, 
    label: string, 
    disabled?: boolean,
    danger?: boolean,
    shortcut?: string
}> = ({ onClick, icon, label, disabled, danger, shortcut }) => (
    <button 
        onClick={(e) => { e.stopPropagation(); if (!disabled) onClick(); }}
        disabled={disabled}
        className={`
            flex items-center gap-2.5 px-3 py-1.5 text-left w-full transition-colors relative
            ${disabled ? 'opacity-40 cursor-default' : danger ? 'text-red-400 hover:bg-[#4d1f1f] hover:text-red-200' : 'hover:bg-[#094771] hover:text-white'}
        `}
    >
        <span className="opacity-80">{icon}</span>
        <span className="flex-1 truncate">{label}</span>
        {shortcut && <span className="text-[10px] opacity-40 ml-2 font-mono">{shortcut}</span>}
    </button>
);

const Separator = () => <div className="h-[1px] bg-[#454545] my-1 mx-2" />;
