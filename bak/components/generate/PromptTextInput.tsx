
import React, { useState, useRef, useEffect } from 'react';
import { Copy, Check, Sparkles, Loader2, ChevronLeft, ChevronRight, History } from 'lucide-react';
import { platform } from '../../platform';
import { InputAttachment } from '../CreationChatInput/types'; // Shared types
import { MentionPreviewPopover } from '../CreationChatInput/components/MentionPreviewPopover';
import { getSuggestionConfig } from '../CreationChatInput/suggestion';

// Tiptap
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Mention from '@tiptap/extension-mention';

interface PromptTextInputProps {
    value: string;
    onChange?: (value: string) => void;
    
    // Configuration
    label?: string | null;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
    readOnly?: boolean;
    
    // AI Features
    /** 
     * Callback function to enhance the prompt. 
     * Should return a Promise that resolves to the optimized string.
     */
    onEnhance?: (currentText: string) => Promise<string>;
    enableEnhance?: boolean; // Control visibility of the enhance button
    isEnhancing?: boolean; // External loading state (optional, internal state preferred now)
    
    // Appearance
    rows?: number; // Approximate height mapping
    minHeight?: number;
    maxHeight?: number;

    // Asset Integration
    assets?: InputAttachment[];
}

// CSS to style the internal editor content and mention chips
const EDITOR_STYLES = `
.prompt-editor .ProseMirror {
    outline: none;
    color: #e4e4e7;
    font-size: 14px;
    line-height: 1.6;
    min-height: 100%;
}
.prompt-editor .ProseMirror p.is-editor-empty:first-child::before {
    color: #52525b; /* gray-600 */
    content: attr(data-placeholder);
    float: left;
    height: 0;
    pointer-events: none;
}
.prompt-editor .mention-chip {
    color: #60a5fa; /* blue-400 */
    background-color: rgba(59, 130, 246, 0.15);
    border-radius: 0.25rem;
    padding: 0 0.25em;
    font-weight: 600;
    box-decoration-break: clone;
    cursor: pointer;
    display: inline-block;
    border: 1px solid rgba(59, 130, 246, 0.2);
    user-select: none;
}
.prompt-editor .mention-chip:hover {
    background-color: rgba(59, 130, 246, 0.25);
}

/* --- Custom Scrollbar (Stealth Mode) --- */
.prompt-editor-scroll-container {
    scrollbar-width: thin;
    scrollbar-color: transparent transparent;
}
.prompt-editor-scroll-container:hover {
    scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
}

.prompt-editor-scroll-container::-webkit-scrollbar {
    width: 6px;
    height: 6px;
}
.prompt-editor-scroll-container::-webkit-scrollbar-track {
    background: transparent;
}
.prompt-editor-scroll-container::-webkit-scrollbar-thumb {
    background-color: transparent;
    border-radius: 3px;
    border: 2px solid transparent; /* padding around thumb */
    background-clip: content-box;
}
.prompt-editor-scroll-container:hover::-webkit-scrollbar-thumb {
    background-color: rgba(255, 255, 255, 0.2);
}
.prompt-editor-scroll-container::-webkit-scrollbar-thumb:hover {
    background-color: rgba(255, 255, 255, 0.4);
}
.prompt-editor-scroll-container::-webkit-scrollbar-corner {
    background: transparent;
}
`;

export const PromptTextInput: React.FC<PromptTextInputProps> = ({
    value, 
    onChange, 
    readOnly, 
    label = "Prompt", 
    placeholder = "Enter text...", 
    className = "", 
    disabled, 
    onEnhance, 
    enableEnhance = true, 
    isEnhancing: externalIsEnhancing, 
    rows = 4,
    minHeight,
    maxHeight = 300,
    assets = []
}) => {
    const [copied, setCopied] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [localIsEnhancing, setLocalIsEnhancing] = useState(false);
    
    // History State
    const [history, setHistory] = useState<string[]>([value]);
    const [historyIndex, setHistoryIndex] = useState(0);

    const assetsRef = useRef(assets);
    
    // Sync external value to history if it changes drastically (e.g. reset)
    // Only if it doesn't match current history pointer to avoid loop
    useEffect(() => {
        if (value !== history[historyIndex]) {
            // If value is completely different (e.g. parent reset), reset history or append?
            // For safety, we just append a new state if it's external change
            // setHistory([value]);
            // setHistoryIndex(0);
        }
    }, [value]); // Be careful with this dep

    // Asset Preview State
    const [previewAnchor, setPreviewAnchor] = useState<HTMLElement | null>(null);
    const [previewAsset, setPreviewAsset] = useState<{ item: InputAttachment, index: number } | null>(null);

    // Keep assets ref fresh for suggestion closure
    useEffect(() => {
        assetsRef.current = assets;
    }, [assets]);

    const calculatedMinHeight = minHeight || (rows * 24 + 16); 
    const isProcessing = externalIsEnhancing || localIsEnhancing;

    const editor = useEditor({
        editable: !readOnly && !disabled,
        extensions: [
            StarterKit,
            Placeholder.configure({
                placeholder: placeholder,
                emptyEditorClass: 'is-editor-empty',
            }),
            Mention.configure({
                HTMLAttributes: {
                    class: 'mention-chip',
                },
                renderHTML({ node, options }) {
                    return [
                        'span',
                        {
                            ...options.HTMLAttributes,
                            'data-type': 'mention',
                            'data-id': node.attrs.id,
                        },
                        `@${node.attrs.label ?? node.attrs.id}`,
                    ]
                },
                suggestion: getSuggestionConfig(() => assetsRef.current),
            }),
        ],
        editorProps: {
            attributes: {
                class: `prompt-editor w-full h-full`,
            },
            handleClick: (view, pos, event) => {
                const target = event.target as HTMLElement;
                if (target.classList.contains('mention-chip')) {
                    const id = target.getAttribute('data-id');
                    if (id) {
                        const index = assetsRef.current.findIndex(a => a.id === id);
                        const asset = assetsRef.current[index];
                        if (asset) {
                            setPreviewAnchor(target);
                            setPreviewAsset({ item: asset, index });
                            return true;
                        }
                    }
                }
                return false;
            }
        },
        content: value,
        onUpdate: ({ editor }) => {
            const text = editor.getText();
            onChange?.(text);
        },
        onFocus: () => setIsFocused(true),
        onBlur: () => setIsFocused(false),
    });

    // External Value Sync
    useEffect(() => {
        if (editor && value !== editor.getText()) {
            if (value === '' && editor.getText().trim() !== '') {
                editor.commands.clearContent();
            } else if (!editor.isFocused) {
                editor.commands.setContent(value);
            }
        }
    }, [value, editor]);

    useEffect(() => {
        if (editor) {
            editor.setEditable(!readOnly && !disabled);
        }
    }, [readOnly, disabled, editor]);

    const handleCopy = () => {
        if (!editor) return;
        platform.copy(editor.getText());
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleEnhanceClick = async () => {
        if (!onEnhance || isProcessing) return;
        
        setLocalIsEnhancing(true);
        try {
            const currentText = editor?.getText() || value;
            const newText = await onEnhance(currentText);
            
            if (newText && newText !== currentText) {
                const newHistory = history.slice(0, historyIndex + 1);
                newHistory.push(newText);
                
                setHistory(newHistory);
                setHistoryIndex(newHistory.length - 1);
                
                editor?.commands.setContent(newText);
                onChange?.(newText);
            }
        } catch (e) {
            console.error("Enhancement failed", e);
        } finally {
            setLocalIsEnhancing(false);
        }
    };

    const handleUndoHistory = () => {
        if (historyIndex > 0) {
            const prevIndex = historyIndex - 1;
            const text = history[prevIndex];
            setHistoryIndex(prevIndex);
            editor?.commands.setContent(text);
            onChange?.(text);
        }
    };

    const handleRedoHistory = () => {
        if (historyIndex < history.length - 1) {
            const nextIndex = historyIndex + 1;
            const text = history[nextIndex];
            setHistoryIndex(nextIndex);
            editor?.commands.setContent(text);
            onChange?.(text);
        }
    };

    return (
        <div className={`flex flex-col gap-2 ${className}`}>
            <style>{EDITOR_STYLES}</style>
            
            {label && (
                <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{label}</label>
                </div>
            )}
            
            <div className={`
                relative bg-[#18181b] border rounded-xl transition-all duration-200 group flex flex-col overflow-hidden
                ${isFocused 
                    ? 'border-blue-500/50 ring-1 ring-blue-500/20 shadow-lg shadow-blue-900/5' 
                    : 'border-[#27272a] hover:border-[#3f3f46]'
                }
                ${(readOnly || disabled) ? 'bg-[#141416] border-[#27272a] opacity-80' : ''}
            `}>
                {/* Editor Area */}
                <div 
                    className="prompt-editor-scroll-container w-full p-3 cursor-text overflow-y-auto flex-1 custom-scrollbar"
                    style={{ minHeight: calculatedMinHeight, maxHeight: maxHeight }}
                    onClick={() => editor?.commands.focus()}
                >
                    <EditorContent editor={editor} />
                </div>

                {/* Bottom Actions Bar */}
                <div className="flex items-center justify-between px-3 py-2 border-t border-[#27272a] bg-[#1e1e20]/50 select-none backdrop-blur-sm">
                    <div className="flex items-center gap-2">
                        {/* AI Enhance Button */}
                        {onEnhance && enableEnhance && !readOnly && !disabled && (
                            <div className="flex items-center gap-1">
                                <button 
                                    onClick={handleEnhanceClick}
                                    disabled={isProcessing || !value}
                                    className={`
                                        flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-medium transition-all duration-200 border
                                        ${isProcessing 
                                            ? 'text-purple-300 bg-purple-500/10 border-purple-500/20 cursor-wait' 
                                            : 'text-purple-400 border-transparent hover:text-white hover:bg-purple-500/20 hover:border-purple-500/30'
                                        }
                                        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-transparent
                                    `}
                                    title="Optimize prompt with AI"
                                >
                                    {isProcessing ? (
                                        <Loader2 size={12} className="animate-spin" />
                                    ) : (
                                        <Sparkles size={12} className={isProcessing ? "animate-pulse" : ""} /> 
                                    )}
                                    {isProcessing ? 'Enhancing...' : 'Enhance'}
                                </button>

                                {/* History Controls */}
                                {history.length > 1 && (
                                    <div className="flex items-center bg-[#252526] rounded-md ml-1 border border-[#333]">
                                        <button 
                                            onClick={handleUndoHistory}
                                            disabled={historyIndex <= 0}
                                            className="p-1 hover:text-white text-gray-400 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#333] rounded-l-md transition-colors"
                                            title="Undo Optimization"
                                        >
                                            <ChevronLeft size={10} />
                                        </button>
                                        <span className="text-[9px] text-gray-500 font-mono px-1 border-x border-[#333]">
                                            v{historyIndex + 1}
                                        </span>
                                        <button 
                                            onClick={handleRedoHistory}
                                            disabled={historyIndex >= history.length - 1}
                                            className="p-1 hover:text-white text-gray-400 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#333] rounded-r-md transition-colors"
                                            title="Redo Optimization"
                                        >
                                            <ChevronRight size={10} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                        
                        {/* Mention Hint */}
                        {!readOnly && !disabled && assets.length > 0 && (
                            <span className="text-[9px] text-gray-600 hidden sm:inline-block ml-2">Type <span className="text-gray-500 font-bold font-mono">@</span> to link assets</span>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="text-[9px] text-gray-600 font-mono">
                            {value.length} chars
                        </div>
                        <div className="w-[1px] h-3 bg-[#333]" />
                        <button 
                            onClick={handleCopy}
                            className={`flex items-center gap-1.5 text-[10px] transition-colors font-medium hover:bg-white/5 px-2 py-0.5 rounded ${copied ? 'text-green-500' : 'text-gray-500 hover:text-white'}`}
                            title="Copy Prompt"
                        >
                            {copied ? <Check size={12} /> : <Copy size={12} />}
                            {copied ? 'Copied' : 'Copy'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Asset Preview Popover */}
            <MentionPreviewPopover 
                anchorEl={previewAnchor}
                attachment={previewAsset?.item || null}
                index={previewAsset?.index ?? -1}
                onClose={() => {
                    setPreviewAnchor(null);
                    setPreviewAsset(null);
                }}
            />
        </div>
    );
};
