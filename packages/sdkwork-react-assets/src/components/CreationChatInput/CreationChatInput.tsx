
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ArrowUp, Loader2, Plus, Zap, FolderOpen, UploadCloud } from 'lucide-react';
import { CreationChatInputProps, InputAttachment } from './types';
import { AttachmentGrid } from './components/AttachmentGrid';
import { MentionPreviewPopover } from './components/MentionPreviewPopover';
import { getAssetLabel } from './utils';
import { Popover } from '@sdkwork/react-commons';

// TipTap Imports
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Mention from '@tiptap/extension-mention';
import { getSuggestionConfig } from './suggestion';

// CSS for Tiptap
const EDITOR_STYLES = `
.ProseMirror {
    outline: none;
    color: #e4e4e7; /* gray-200 */
    font-size: 16px; /* Increased font size for better readability */
    line-height: 1.6; 
    padding: 0;
    text-align: left;
}

.ProseMirror p {
    margin-bottom: 0;
}

.ProseMirror p + p {
    margin-top: 0.5em;
}

.ProseMirror p.is-editor-empty:first-child::before {
    color: #71717a; /* gray-500 */
    content: attr(data-placeholder);
    float: left;
    height: 0;
    pointer-events: none;
}

.ProseMirror::-webkit-scrollbar {
  width: 4px;
}
.ProseMirror::-webkit-scrollbar-track {
  background: transparent;
}
.ProseMirror::-webkit-scrollbar-thumb {
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}
.ProseMirror::-webkit-scrollbar-thumb:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

/* Mention Chip Styling - Updated for "Label" look */
.mention-chip {
    color: #60a5fa;
    background-color: rgba(59, 130, 246, 0.1);
    border-radius: 0.25rem;
    padding: 0 0.25em;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    user-select: none;
    display: inline-block;
    border: 1px solid transparent;
}
.mention-chip:hover {
    background-color: rgba(59, 130, 246, 0.2);
    border-color: rgba(59, 130, 246, 0.3);
}
`;

export const CreationChatInput: React.FC<CreationChatInputProps> = ({
    value, onChange, onGenerate, onStop, isGenerating,
    attachments = [], onRemoveAttachment, onUpload,
    header, footerControls, rightControls, actionButton, cost,
    placeholder = "Describe your idea...", autoFocus, className = '',
    textareaClassName = '', glowClassName,
    width, maxHeight = 400, minHeight = 48, variant: _variant = 'default',
    editorInstanceRef
}) => {
    const [isFocused, setIsFocused] = useState(false);
    
    // Popover State for Mentions
    const [previewAnchor, setPreviewAnchor] = useState<HTMLElement | null>(null);
    const [previewAttachment, setPreviewAttachment] = useState<{ item: InputAttachment, index: number } | null>(null);
    
    // Popover State for Upload Menu (Hover)
    const [isUploadMenuOpen, setIsUploadMenuOpen] = useState(false);
    const uploadButtonRef = useRef<HTMLDivElement>(null);
    const hoverTimeoutRef = useRef<any>(null);

    const containerRef = useRef<HTMLDivElement>(null);
    const attachmentsRef = useRef(attachments);

    // Keep ref updated for the suggestion closure
    useEffect(() => {
        attachmentsRef.current = attachments;
    }, [attachments]);

    const handleUploadEnter = () => {
        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
        setIsUploadMenuOpen(true);
    };

    const handleUploadLeave = () => {
        hoverTimeoutRef.current = setTimeout(() => {
            setIsUploadMenuOpen(false);
        }, 300);
    };

    // Initialize Editor
    const editor = useEditor({
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
                suggestion: getSuggestionConfig(() => attachmentsRef.current),
            }),
        ],
        editorProps: {
            attributes: {
                class: `prose prose-invert max-w-none focus:outline-none ${textareaClassName}`,
                // Apply minHeight and maxHeight directly to the editor content area
                style: `min-height: ${minHeight}px; max-height: ${maxHeight}px; overflow-y: auto;`
            },
            handleClick: (_view: any, _pos: number, event: MouseEvent) => {
                const target = event.target as HTMLElement;
                if (target.classList.contains('mention-chip')) {
                    const id = target.getAttribute('data-id');
                    if (id) {
                        const index = attachmentsRef.current.findIndex(a => a.id === id);
                        const attachment = attachmentsRef.current[index];

                        if (attachment && (attachment.type === 'image' || attachment.type === 'video' || attachment.type === 'audio')) {
                            setPreviewAnchor(target);
                            setPreviewAttachment({ item: attachment, index });
                            return true;
                        }
                    }
                }

                // If clicked anywhere else in the editor (not a chip), close the preview
                setPreviewAnchor(null);
                setPreviewAttachment(null);
                return false;
            }
        },
        content: value,
        onUpdate: ({ editor }) => {
            const text = editor.getText();
            onChange(text); 
        },
        onFocus: () => setIsFocused(true),
        onBlur: () => setIsFocused(false),
    });

    // Expose editor instance
    useEffect(() => {
        if (editor && editorInstanceRef) {
            editorInstanceRef.current = editor;
        }
    }, [editor, editorInstanceRef]);

    useEffect(() => {
        if (editor && value === '' && editor.getText().trim() !== '') {
            editor.commands.clearContent();
        }
    }, [value, editor]);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (value.trim() || attachments.length > 0) {
                onGenerate();
            }
        }
    }, [value, attachments.length, onGenerate]);

    useEffect(() => {
        if (autoFocus && editor && !editor.isDestroyed) {
            editor.commands.focus('start');
        }
    }, [autoFocus, editor]);

    // Safety check for editor view access
    useEffect(() => {
        if (!editor || editor.isDestroyed) return;

        let dom: HTMLElement | undefined;
        try {
            // Tiptap throws if view is not ready
            dom = editor.view.dom;
        } catch (e) {
            // Ignore view not ready
            return;
        }

        if (dom) {
            dom.addEventListener('keydown', handleKeyDown);
            return () => dom!.removeEventListener('keydown', handleKeyDown);
        }
    }, [editor, handleKeyDown]);

    const wrapperClass = `relative z-10 group ${className} ${!width ? 'w-full' : ''}`;
    
    const glassContainerClass = `
        relative flex flex-col transition-all duration-300 ease-out
        bg-[#09090b]
        border
        overflow-visible
        rounded-[24px]
    `;

    const containerStateClass = isFocused 
        ? "border-white/10 shadow-[0_8px_30px_-6px_rgba(0,0,0,0.6)] ring-1 ring-white/10" 
        : "border-[#27272a] shadow-xl hover:border-[#3f3f46]";

    const glowGradient = glowClassName || 'from-blue-600/20 via-purple-600/20 to-pink-600/20';

    return (
        <div 
            className={wrapperClass} 
            ref={containerRef}
            style={width ? { width } : undefined}
            onMouseDown={(e) => e.stopPropagation()} 
        >
            <style>{EDITOR_STYLES}</style>

            <div 
                className={`
                    absolute -inset-[1px] rounded-[26px] bg-gradient-to-r ${glowGradient} blur-xl transition-opacity duration-500 pointer-events-none
                    ${isFocused ? 'opacity-50' : 'opacity-0'}
                `} 
            />

            {header && (
                 <div className="mb-2 px-1 relative z-20 animate-in fade-in slide-in-from-bottom-1">
                     {header}
                 </div>
            )}

            <div 
                className={`${glassContainerClass} ${containerStateClass}`}
                onClick={(e) => {
                    const target = e.target as HTMLElement;
                    
                    // Critical Fix: Do not close preview if clicking a mention chip
                    if (target.closest('.mention-chip')) {
                        return;
                    }

                    // Close preview if container background is clicked (and not a chip)
                    setPreviewAnchor(null);
                    setPreviewAttachment(null);
                    
                    // Maintain focus
                    if (!editor?.isFocused) {
                        editor?.commands.focus();
                    }
                }}
            >
                <div className={`flex flex-col relative z-10`}>
                
                   {/* Top: Attachments */}
                   <AttachmentGrid 
                        attachments={attachments} 
                        onRemove={(id) => onRemoveAttachment?.(id)} 
                   />

                   {/* Middle: Input & Upload Trigger */}
                   <div className={`flex items-start gap-4 w-full px-5 ${attachments.length > 0 ? 'pb-4 pt-2' : 'py-5'}`}>
                        {onUpload && (
                            <>
                                <div 
                                    ref={uploadButtonRef}
                                    onMouseEnter={handleUploadEnter}
                                    onMouseLeave={handleUploadLeave}
                                    className="relative flex items-center justify-center pt-0.5"
                                >
                                    <button 
                                        className={`
                                            flex-shrink-0 flex items-center justify-center rounded-full transition-all duration-200
                                            w-9 h-9 border
                                            ${isUploadMenuOpen 
                                                ? 'bg-[#27272a] text-white border-[#333] shadow-md' 
                                                : 'border-transparent text-gray-400 hover:text-white hover:bg-[#27272a] hover:border-[#333]'
                                            }
                                        `}
                                        title="Attach media"
                                        tabIndex={-1}
                                        onClick={(e) => { e.stopPropagation(); setIsUploadMenuOpen(true); }}
                                    >
                                        <Plus size={20} strokeWidth={2} className={`transition-transform duration-300 ${isUploadMenuOpen ? 'rotate-45' : ''}`} />
                                    </button>
                                </div>
                                
                                <Popover
                                    isOpen={isUploadMenuOpen}
                                    onClose={() => setIsUploadMenuOpen(false)}
                                    triggerRef={uploadButtonRef as any}
                                    width={220}
                                    align="start"
                                    offset={12}
                                    className="bg-[#18181b]/95 backdrop-blur-xl border border-[#27272a] p-1.5 flex flex-col gap-1 shadow-2xl ring-1 ring-white/5 rounded-xl pointer-events-auto"
                                >
                                    <div 
                                        className="contents"
                                        onMouseEnter={handleUploadEnter}
                                        onMouseLeave={handleUploadLeave}
                                    >
                                        <div className="px-2 py-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 flex justify-between items-center">
                                            <span>Add Content</span>
                                        </div>
                                        <button 
                                            onClick={() => { onUpload('local'); setIsUploadMenuOpen(false); }}
                                            className="flex items-center gap-3 px-3 py-2.5 text-xs text-gray-300 hover:bg-[#27272a] hover:text-white rounded-lg transition-colors text-left group"
                                        >
                                            <div className="p-1.5 bg-blue-500/10 text-blue-500 rounded-md group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                                <UploadCloud size={14} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-medium">Local Upload</span>
                                                <span className="text-[9px] text-gray-500 group-hover:text-gray-400">From your computer</span>
                                            </div>
                                        </button>
                                        <button 
                                            onClick={() => { onUpload('asset'); setIsUploadMenuOpen(false); }}
                                            className="flex items-center gap-3 px-3 py-2.5 text-xs text-gray-300 hover:bg-[#27272a] hover:text-white rounded-lg transition-colors text-left group"
                                        >
                                            <div className="p-1.5 bg-orange-500/10 text-orange-500 rounded-md group-hover:bg-orange-500 group-hover:text-white transition-colors">
                                                <FolderOpen size={14} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-medium">Asset Library</span>
                                                <span className="text-[9px] text-gray-500 group-hover:text-gray-400">Reuse existing files</span>
                                            </div>
                                        </button>
                                    </div>
                                </Popover>
                            </>
                        )}

                        <div className="flex-1 min-w-0 cursor-text">
                            <EditorContent editor={editor} />
                        </div>
                   </div>

                   {/* Bottom: Footer Controls */}
                   {(footerControls || rightControls || actionButton || cost) && (
                       <div className="flex items-center justify-between gap-3 px-4 pb-4 pt-1">
                            
                            <div className="flex items-center gap-2 flex-1 min-w-0 overflow-x-auto no-scrollbar mask-fade-right">
                                 {footerControls}
                            </div>

                            <div className="flex items-center gap-3 shrink-0 pl-2">
                                 {rightControls}

                                 {cost !== undefined && !isGenerating && (
                                    <div className="hidden sm:flex items-center gap-1 text-[10px] font-bold text-gray-500/80 select-none bg-white/5 px-2.5 py-1.5 rounded-lg border border-white/5">
                                        <Zap size={10} className="fill-current text-yellow-600/80" />
                                        <span>{cost}</span>
                                    </div>
                                 )}

                                 {actionButton ? actionButton : (
                                     <button 
                                         onClick={(e) => { e.stopPropagation(); isGenerating ? onStop?.() : onGenerate(); }}
                                         disabled={(!value.trim() && attachments.length === 0) && !isGenerating}
                                         className={`
                                            flex items-center justify-center transition-all duration-200 shadow-lg group
                                            w-9 h-9 rounded-xl
                                            ${isGenerating 
                                                ? 'bg-[#27272a] text-gray-400 cursor-not-allowed border border-[#333]' 
                                                : (value.trim() || attachments.length > 0)
                                                    ? 'bg-white text-black hover:scale-105 hover:shadow-white/20'
                                                    : 'bg-[#27272a] text-gray-500 border border-[#333] hover:bg-[#333] hover:text-gray-300'
                                            }
                                         `}
                                     >
                                         {isGenerating ? (
                                             <Loader2 size={16} className="animate-spin" />
                                         ) : (
                                             <ArrowUp size={20} strokeWidth={2.5} className={`transition-transform duration-300 ${(value.trim() || attachments.length > 0) ? '-rotate-90 sm:rotate-0' : ''}`} />
                                         )}
                                     </button>
                                 )}
                            </div>
                       </div>
                   )}
                </div>
            </div>
            
            {/* Popover Preview for Mentions */}
            <MentionPreviewPopover 
                anchorEl={previewAnchor}
                attachment={previewAttachment?.item || null}
                index={previewAttachment?.index ?? -1}
                onClose={() => {
                    setPreviewAnchor(null);
                    setPreviewAttachment(null);
                }}
            />
        </div>
    );
};
