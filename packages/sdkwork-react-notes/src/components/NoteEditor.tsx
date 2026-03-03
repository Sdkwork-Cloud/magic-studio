
import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useNoteStore } from '../store/noteStore';
import { useEditor, EditorContent, ReactNodeViewRenderer, type Editor as TiptapEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import ImageExtension from '@tiptap/extension-image';
import LinkExtension from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Typography from '@tiptap/extension-typography';
import Highlight from '@tiptap/extension-highlight';
import Gapcursor from '@tiptap/extension-gapcursor';
import CharacterCount from '@tiptap/extension-character-count';

// Custom Extensions
import { TextColorExtension } from './editor/TextColorExtension';
import { VideoExtension, AudioExtension } from './editor/MediaExtension';
import { FileAttachmentExtension } from './editor/FileAttachmentExtension';
import { MiniProgramExtension } from './editor/MiniProgramExtension'; 

import { 
    FileText, Layout, BookOpen, Clock, Type, Code, Calendar, Hash, ChevronDown, 
    Image as ImageIcon, Heading1, Heading2, Heading3, List, ListOrdered, CheckSquare, 
    Quote, Bold, Italic, Strikethrough, Undo, Redo,
    Video, Mic, ImagePlus, Plus, Music, File, Sparkles, Wand2, Loader2, PanelRight,
    Send, AppWindow, FileCode, ChevronRight
} from 'lucide-react';
import { EditorContextMenu } from './EditorContextMenu';

import { useTranslation } from '@sdkwork/react-i18n';
import { filePicker } from '@sdkwork/react-editor';

import { genAIService } from '@sdkwork/react-core';
import { NoteType, markdownUtils } from '@sdkwork/react-commons'; 

// Custom Menus & Modals
import { TextBubbleMenu } from './menus/TextBubbleMenu';
import { BlockFloatingMenu } from './menus/BlockFloatingMenu';
import { AIPanel } from './menus/AIPanel';
import { AIWriterFloat, type AIWriterGenerateOptions } from './menus/AIWriterFloat';
import { NoteChatPane } from './NoteChatPane';
import { ImageNode } from './editor/ImageNode';
import { AIGenerateModal, MediaType } from './AIGenerateModal'; 
import { PublishModal } from './PublishModal';
import { MiniProgramModal, type MiniProgramInsertPayload } from './MiniProgramModal'; 
import { HtmlSourceModal } from './HtmlSourceModal'; 
import { NoteEditorEmpty } from './NoteEditorEmpty'; 

// Specialized Generator Modals
import { ImageGeneratorModal } from '@sdkwork/react-image';
import { VideoGeneratorModal } from '@sdkwork/react-video';

import { assetBusinessFacade, readWorkspaceScope } from '@sdkwork/react-assets';
import { AssetType } from '@sdkwork/react-commons';

// --- Helper: Advanced Word Count (CJK support) ---
const countWords = (text: string): number => {
    const cjk = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    const nonCjk = text.replace(/[\u4e00-\u9fa5]/g, ' ');
    const english = nonCjk.trim().split(/\s+/).filter(Boolean).length;
    return cjk + english;
};

// --- Helper: Sanitize HTML for Tiptap Streaming ---
const sanitizeStreamingHtml = (html: string): string => {
    let clean = html.replace(/<li>\s*<\/li>/g, '<li><p></p></li>');
    return clean;
};

const resolveNotesScope = (): { workspaceId: string; projectId?: string } => {
    const scope = readWorkspaceScope();
    return { workspaceId: scope.workspaceId, projectId: scope.projectId };
};

const toAssetContentType = (type: AssetType): 'image' | 'video' | 'audio' | 'file' => {
    if (type === 'image' || type === 'video' || type === 'audio' || type === 'file') {
        return type;
    }
    return 'file';
};

// --- Resizer Component ---
const Resizer: React.FC<{ onMouseDown: (e: React.MouseEvent) => void }> = ({ onMouseDown }) => {
    return (
        <div className="group relative flex-none w-[1px] h-full bg-[#27272a] z-50 hover:bg-blue-600 transition-colors delay-75 cursor-col-resize">
            <div 
                className="absolute inset-y-0 -left-2 -right-2 bg-transparent z-50"
                onMouseDown={onMouseDown}
            />
        </div>
    );
};

// --- Toolbar Components ---

interface ToolbarButtonProps {
    onClick: () => void;
    isActive?: boolean;
    disabled?: boolean;
    icon: React.ElementType;
    title: string;
    className?: string;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({ onClick, isActive, icon: Icon, title, disabled, className }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        title={title}
        className={`
            p-1.5 rounded-lg transition-all duration-200 flex items-center justify-center relative
            ${isActive 
                ? 'bg-blue-600/20 text-blue-400' 
                : 'text-gray-400 hover:bg-[#1e1e20] hover:text-white'
            }
            ${disabled ? 'opacity-30 cursor-not-allowed hover:bg-transparent' : ''}
            ${className || ''}
        `}
    >
        <Icon size={16} strokeWidth={2.5} />
    </button>
);

const ToolbarDivider = () => <div className="w-[1px] h-5 bg-[#27272a] mx-1 flex-shrink-0" />;

// --- Dropdown Components ---

const InsertDropdown: React.FC<{ onUpload: (type: 'image' | 'video' | 'audio' | 'file') => void, onOpenMiniProgram: () => void }> = ({ onUpload, onOpenMiniProgram }) => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (type: 'image' | 'video' | 'audio' | 'file' | 'miniprogram') => {
        if (type === 'miniprogram') {
            onOpenMiniProgram();
        } else {
            onUpload(type);
        }
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${isOpen ? 'bg-[#27272a] text-white' : 'text-gray-400 hover:text-white hover:bg-[#1e1e20]'}`}
                title={t('notes.editor.actions.insert_media')}
            >
                <Plus size={14} />
                <span>{t('notes.editor.actions.insert')}</span>
                <ChevronDown size={10} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-[#1e1e20] border border-[#333] rounded-lg shadow-xl py-1 z-[100] animate-in fade-in zoom-in-95 duration-75 flex flex-col overflow-hidden">
                    <button onClick={() => handleSelect('image')} className="flex items-center gap-3 px-3 py-2 text-xs text-left hover:bg-[#27272a] text-gray-300 hover:text-white transition-colors">
                        <ImageIcon size={14} className="text-purple-500" /> {t('notes.editor.media.image')}
                    </button>
                    <button onClick={() => handleSelect('video')} className="flex items-center gap-3 px-3 py-2 text-xs text-left hover:bg-[#27272a] text-gray-300 hover:text-white transition-colors">
                        <Video size={14} className="text-blue-500" /> {t('notes.editor.media.video')}
                    </button>
                    <button onClick={() => handleSelect('audio')} className="flex items-center gap-3 px-3 py-2 text-xs text-left hover:bg-[#27272a] text-gray-300 hover:text-white transition-colors">
                        <Music size={14} className="text-pink-500" /> {t('notes.editor.media.audio_music')}
                    </button>
                    <button onClick={() => handleSelect('file')} className="flex items-center gap-3 px-3 py-2 text-xs text-left hover:bg-[#27272a] text-gray-300 hover:text-white transition-colors">
                        <File size={14} className="text-gray-500" /> {t('notes.editor.media.file_attachment')}
                    </button>
                    <div className="h-[1px] bg-[#27272a] my-1" />
                    <button onClick={() => handleSelect('miniprogram')} className="flex items-center gap-3 px-3 py-2 text-xs text-left hover:bg-[#27272a] text-gray-300 hover:text-white transition-colors">
                        <AppWindow size={14} className="text-green-500" /> {t('notes.editor.media.mini_program')}
                    </button>
                </div>
            )}
        </div>
    );
};

const AIDropdown: React.FC<{ onAction: (type: MediaType) => void }> = ({ onAction }) => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (type: MediaType) => {
        onAction(type);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors border ${isOpen ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' : 'bg-transparent border-transparent text-gray-400 hover:bg-[#1e1e20] hover:text-white'}`}
                title={t('notes.editor.actions.ai_tools')}
            >
                <Sparkles size={14} />
                <span>{t('notes.editor.actions.ai_tools')}</span>
                <ChevronDown size={10} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-1 w-52 bg-[#1e1e20] border border-[#333] rounded-lg shadow-xl py-1 z-[100] animate-in fade-in zoom-in-95 duration-75 flex flex-col overflow-hidden">
                    <div className="px-3 py-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider bg-[#252526]/50">{t('notes.editor.actions.generative_ai')}</div>
                    <button onClick={() => handleSelect('image')} className="flex items-center gap-3 px-3 py-2 text-xs text-left hover:bg-[#27272a] text-gray-300 hover:text-white group transition-colors">
                        <ImagePlus size={14} className="text-purple-500 group-hover:scale-110 transition-transform" /> {t('notes.editor.actions.generate_image')}
                    </button>
                    <button onClick={() => handleSelect('video')} className="flex items-center gap-3 px-3 py-2 text-xs text-left hover:bg-[#27272a] text-gray-300 hover:text-white group transition-colors">
                        <Video size={14} className="text-purple-500 group-hover:scale-110 transition-transform" /> {t('notes.editor.actions.generate_video')}
                    </button>
                    <button onClick={() => handleSelect('audio')} className="flex items-center gap-3 px-3 py-2 text-xs text-left hover:bg-[#27272a] text-gray-300 hover:text-white group transition-colors">
                        <Mic size={14} className="text-purple-500 group-hover:scale-110 transition-transform" /> {t('notes.editor.actions.generate_speech')}
                    </button>
                    <div className="h-[1px] bg-[#27272a] my-1" />
                    <div className="px-3 py-1.5 text-xs text-gray-600 italic">
                        {t('notes.editor.actions.ai_tip_selection')}
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Main Toolbar ---
interface EditorToolbarProps {
    editor: TiptapEditor | null;
    onUpload: (type: 'image' | 'video' | 'audio' | 'file') => void;
    onOpenGenModal: (type: MediaType) => void;
    onOpenMiniProgram: () => void;
    onViewSource: () => void;
    isGenerating?: boolean;
    isChatOpen: boolean;
    onToggleChat: () => void;
    showChatToggle: boolean;
    onOpenAIWriter: () => void;
}

const EditorToolbar: React.FC<EditorToolbarProps> = ({ 
    editor, onUpload, onOpenGenModal, onOpenAIWriter, onOpenMiniProgram, onViewSource, isGenerating, isChatOpen, onToggleChat, showChatToggle
}) => {
    const { t } = useTranslation();
    if (!editor) return null;

    return (
        <div id="note-editor-toolbar" className="sticky top-0 z-20 w-full bg-[#050505]/90 backdrop-blur-md border-b border-[#1f1f22] mb-6 px-2 py-2 flex flex-wrap items-center gap-1">
            
            {/* Primary Action: AI Writer */}
            <button
                onClick={onOpenAIWriter}
                disabled={isGenerating}
                className={`
                    flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all shadow-sm mr-2
                    ${isGenerating ? 'bg-[#27272a] cursor-not-allowed text-gray-500' : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500'}
                `}
                title={t('notes.editor.actions.write')}
            >
                {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
                <span>{isGenerating ? t('notes.editor.actions.writing') : t('notes.editor.actions.write')}</span>
            </button>

            <ToolbarDivider />

            {/* History */}
            <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} icon={Undo} title="Undo (Cmd+Z)" />
            <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} icon={Redo} title="Redo (Cmd+Shift+Z)" />

            <ToolbarDivider />

            {/* Typography */}
            <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive('heading', { level: 1 })} icon={Heading1} title="Heading 1" />
            <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })} icon={Heading2} title="Heading 2" />
            <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} isActive={editor.isActive('heading', { level: 3 })} icon={Heading3} title="Heading 3" />
            
            <ToolbarDivider />

            {/* Basic Format */}
            <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} icon={Bold} title="Bold (Cmd+B)" />
            <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} icon={Italic} title="Italic (Cmd+I)" />
            <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')} icon={Strikethrough} title="Strikethrough" />
            <ToolbarButton onClick={() => editor.chain().focus().toggleCode().run()} isActive={editor.isActive('code')} icon={Code} title="Inline Code" />

            <ToolbarDivider />

            {/* Lists */}
            <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} icon={List} title="Bullet List" />
            <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} icon={ListOrdered} title="Ordered List" />
            <ToolbarButton onClick={() => editor.chain().focus().toggleTaskList().run()} isActive={editor.isActive('taskList')} icon={CheckSquare} title="Task List" />

            <ToolbarDivider />

            {/* Blocks */}
            <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive('blockquote')} icon={Quote} title="Quote" />
            
            <ToolbarDivider />

            {/* Insert & AI Menus */}
            <div className="flex items-center gap-1 pl-1 flex-1">
                <InsertDropdown onUpload={onUpload} onOpenMiniProgram={onOpenMiniProgram} />
                <AIDropdown onAction={onOpenGenModal} />
            </div>

            {/* Right Side: Extras */}
            <ToolbarButton onClick={onViewSource} icon={FileCode} title={t('notes.editor.actions.view_source')} className="mr-1" />
            
            {showChatToggle && (
                <>
                    <ToolbarDivider />
                    <ToolbarButton onClick={onToggleChat} isActive={isChatOpen} icon={PanelRight} title={t('notes.editor.actions.toggle_chat')} />
                </>
            )}
        </div>
    );
};

// --- Universal Component Interface ---
export interface UniversalNoteEditorProps {
    // Data
    initialContent?: string;
    initialTitle?: string;
    noteType?: NoteType;
    breadcrumbs?: string[];
    lastUpdated?: string | number;
    tags?: string[];
    className?: string; // Allow custom styling
    
    // Configuration
    config?: {
        mode?: 'page' | 'inline' | 'embed'; // Page: Full, Inline: Boxed, Embed: Plain/Fill
        showToolbar?: boolean;
        showMetadata?: boolean;
        showTypeSelector?: boolean;
        showPublishButton?: boolean;
        showChatToggle?: boolean;
        readOnly?: boolean;
        placeholder?: string;
    };

    // Events
    onChange?: (content: string) => void;
    onTitleChange?: (title: string) => void;
    onTypeChange?: (type: NoteType) => void;
    onPublishClick?: () => void;
    onFileUpload?: (type: 'image' | 'video' | 'audio' | 'file') => Promise<void>;
}

// --- The Reusable Pure Component ---
export const UniversalNoteEditor: React.FC<UniversalNoteEditorProps> = ({ 
    initialContent = '',
    initialTitle = '',
    noteType = 'doc',
    breadcrumbs = [],
    lastUpdated = Date.now(),
    tags = [],
    className = '',
    config,
    onChange,
    onTitleChange,
    onTypeChange,
    onPublishClick,
    onFileUpload
}) => {
    const { t } = useTranslation();

    // Default Config Merge
    const {
        mode = 'page',
        showToolbar = true,
        showMetadata = true,
        showTypeSelector = true,
        showPublishButton = true,
        showChatToggle = true,
        readOnly = false,
        placeholder
    } = (config || {}) as NonNullable<UniversalNoteEditorProps['config']>;

    // State
    const [showAI, setShowAI] = useState(false);
    const [aiPosition, setAiPosition] = useState<{ top: number; left: number } | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [genModalType, setGenModalType] = useState<MediaType | null>(null);
    
    // New AI Float State
    const [showAIWidget, setShowAIWidget] = useState(false);
    const [aiWidgetPrompt, setAiWidgetPrompt] = useState('');
    const [aiWidgetPos, setAiWidgetPos] = useState<{top: number, left: number} | null>(null);
    
    // Track streaming state
    const stopGenerationRef = useRef(false);
    const insertionStartPosRef = useRef<number | null>(null);
    const accumulatedTextRef = useRef<string>('');

    const [showMiniProgramModal, setShowMiniProgramModal] = useState(false); 
    const [showHtmlSourceModal, setShowHtmlSourceModal] = useState(false); 
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number } | null>(null);
    const [isTypeMenuOpen, setIsTypeMenuOpen] = useState(false);
    
    // Chat State
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatWidth, setChatWidth] = useState(360);
    const isResizingChatRef = useRef(false);
    const typeMenuRef = useRef<HTMLDivElement>(null);
    const titleTextareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (mode === 'page' && showChatToggle) {
             setIsChatOpen(window.innerWidth >= 1280);
        }
    }, [mode, showChatToggle]);

    const adjustTitleHeight = () => {
        const el = titleTextareaRef.current;
        if (el) {
            el.style.height = 'auto';
            el.style.height = `${el.scrollHeight}px`;
        }
    };

    useEffect(() => {
        adjustTitleHeight();
    }, [initialTitle]);

    const startResizingChat = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        isResizingChatRef.current = true;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    }, []);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizingChatRef.current) return;
            const minEditorWidth = 400;
            const minChatWidth = 280;
            const maxChatWidth = Math.max(minChatWidth, window.innerWidth - minEditorWidth);
            const newWidth = window.innerWidth - e.clientX;
            setChatWidth(Math.max(minChatWidth, Math.min(maxChatWidth, newWidth)));
        };
        const handleMouseUp = () => {
            if (isResizingChatRef.current) {
                isResizingChatRef.current = false;
                document.body.style.cursor = 'default';
                document.body.style.userSelect = 'auto';
            }
        };
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    const typeConfig = useMemo(() => {
        return {
            doc: { label: t('notes.editor.types.doc'), icon: FileText, font: 'font-sans', placeholder: t('notes.editor.placeholder.doc') },
            article: { label: t('notes.editor.types.article'), icon: Layout, font: 'font-serif', placeholder: t('notes.editor.placeholder.article') },
            novel: { label: t('notes.editor.types.novel'), icon: BookOpen, font: 'font-serif', placeholder: t('notes.editor.placeholder.novel') },
            log: { label: t('notes.editor.types.log'), icon: Clock, font: 'font-mono', placeholder: t('notes.editor.placeholder.log') },
            news: { label: t('notes.editor.types.news'), icon: Type, font: 'font-sans', placeholder: t('notes.editor.placeholder.news') },
            code: { label: t('notes.editor.types.code'), icon: Code, font: 'font-mono', placeholder: t('notes.editor.placeholder.code') }
        } as const;
    }, [t]);

    const currentConfig = typeConfig[noteType] || typeConfig['doc'];

    const editor = useEditor({
        editable: !readOnly,
        extensions: [
            StarterKit.configure({
                heading: { levels: [1, 2, 3] },
                codeBlock: { HTMLAttributes: { class: 'bg-[#18181b] p-4 rounded-md font-mono text-sm my-4 border border-[#27272a]' } },
                blockquote: { HTMLAttributes: { class: 'border-l-4 border-gray-600 pl-4 italic text-gray-400 my-4' } }
            }),
            CharacterCount,
            Placeholder.configure({
                placeholder: ({ node }) => {
                    if (node.type.name === 'heading') return `Heading ${node.attrs.level}`;
                    return placeholder || currentConfig.placeholder;
                },
                includeChildren: true,
            }),
            ImageExtension.extend({ addNodeView() { return ReactNodeViewRenderer(ImageNode); } }).configure({ inline: true, allowBase64: true }),
            VideoExtension, AudioExtension, FileAttachmentExtension, MiniProgramExtension, 
            LinkExtension.configure({ openOnClick: false, autolink: true, HTMLAttributes: { class: 'text-blue-400 hover:underline cursor-pointer' } }),
            Underline, Highlight.configure({ multicolor: true }), TextColorExtension, TaskList, TaskItem.configure({ nested: true }), Typography, Gapcursor,
        ],
        content: initialContent,
        editorProps: {
            attributes: {
                class: `prose prose-lg dark:prose-invert max-w-none focus:outline-none ${mode === 'page' ? 'min-h-[calc(100vh-12rem)] pb-40' : 'min-h-[200px]'} ${currentConfig.font} selection:bg-blue-900/40`,
            }
        },
        onUpdate: ({ editor }) => {
            if (onChange) onChange(editor.getHTML());
        },
    });

    useEffect(() => {
        if (editor && initialContent !== editor.getHTML()) {
            if (!editor.isFocused) {
                 editor.commands.setContent(initialContent);
            }
        }
    }, [initialContent, editor]);

    const handleFileUploadInternal = async (type: 'image' | 'video' | 'audio' | 'file') => {
        if (onFileUpload) {
            await onFileUpload(type);
        } else if (editor) {
            try {
                let accept = '*';
                if (type === 'image') accept = 'image/*';
                else if (type === 'video') accept = 'video/*';
                else if (type === 'audio') accept = 'audio/*';

                const files = await filePicker.pickFiles(false, accept);
                
                if (files.length > 0) {
                     const file = files[0];
                     
                     let assetType: AssetType = 'file';
                     if (type === 'image') assetType = 'image';
                     if (type === 'video') assetType = 'video';
                     if (type === 'audio') assetType = 'audio';

                     const result = await assetBusinessFacade.importNotesAsset({
                        scope: resolveNotesScope(),
                        type: toAssetContentType(assetType),
                        name: file.name,
                        data: file.data,
                        sourcePath: file.path,
                        metadata: { source: 'note-upload', origin: 'upload' }
                     });
                     const payload = result.asset.payload;
                     const primaryCandidate =
                        typeof result.asset.primaryType === 'string'
                            ? payload[result.asset.primaryType]
                            : undefined;
                     const payloadAssets = payload.assets;
                     const fallbackAsset = Array.isArray(payloadAssets) ? payloadAssets[0] : undefined;
                     const primaryResource = primaryCandidate ?? fallbackAsset;
                     const src = result.primaryLocator.uri;
                     const size = typeof primaryResource?.size === 'number' ? primaryResource.size : 0;
                     
                     if (type === 'image') {
                        editor.chain().focus().insertContent({ type: 'image', attrs: { src } }).run();
                     }
                     else if (type === 'video') editor.chain().focus().insertContent(`<video src="${src}" controls class="w-full rounded-lg my-4"></video>`).run();
                     else if (type === 'audio') editor.chain().focus().insertContent(`<audio src="${src}" controls class="w-full my-4"></audio>`).run();
                     else if (type === 'file') {
                         editor.chain().focus().insertContent({
                             type: 'fileAttachment',
                             attrs: { src, name: file.name, size }
                         }).run();
                     }
                }
            } catch (e) { console.error(e); }
        }
    };

    const triggerAI = useCallback((_mode: 'insert' | 'replace', _context: string) => {
        if (!editor || editor.isDestroyed) return;
        
        try {
            const { from } = editor.state.selection;
            const coords = editor.view.coordsAtPos(from);
            setAiPosition({ top: coords.top, left: coords.left });
            setShowAI(true);
        } catch (e) {
            console.warn('Cannot calculate AI panel position', e);
        }
    }, [editor]);

    const openAIWidget = (prefilledPrompt: string = '') => {
        if (!editor || editor.isDestroyed) return;
        
        try {
             // Ensure view is available
             if (!editor.view || !editor.view.dom) return;

             if (!editor.isFocused) {
                 editor.commands.focus('start');
             }

             const { from } = editor.state.selection;
             const coords = editor.view.coordsAtPos(from);
             
             const leftPos = Math.max(20, Math.min(coords.left, window.innerWidth - 540));
             const topPos = coords.top + 20;

             setAiWidgetPos({ 
                 top: topPos, 
                 left: leftPos 
             });
             setAiWidgetPrompt(prefilledPrompt);
             setShowAIWidget(true);
        } catch(e) {
             console.warn('Cannot calculate AI widget position', e);
        }
    };

    const handleAIStreamingGenerate = async (prompt: string, options: AIWriterGenerateOptions) => {
        if (!editor) return;
        setIsGenerating(true);
        stopGenerationRef.current = false;
        
        const { empty } = editor.state.selection;
        if (!empty) {
            editor.commands.deleteSelection();
        }
        
        insertionStartPosRef.current = editor.state.selection.from;
        accumulatedTextRef.current = '';

        const context = editor.getText().slice(0, 3000); 

        const isHtmlMode = options.format === 'html';

        try {
            await genAIService.streamArticle(
                { 
                    topic: prompt, 
                    type: 'Article', 
                    tone: options.tone, 
                    language: options.language, 
                    context 
                },
                (chunk) => {
                    if (stopGenerationRef.current) return;
                    
                    if (isHtmlMode) {
                        accumulatedTextRef.current += chunk;
                        const rawHtml = markdownUtils.toHtml(accumulatedTextRef.current);
                        const html = sanitizeStreamingHtml(rawHtml);
                        
                        try {
                            const currentPos = editor.state.selection.from;
                            const startPos = insertionStartPosRef.current!;
                            
                            if (currentPos >= startPos) {
                                editor.chain()
                                    .command(({ tr, dispatch }) => {
                                        if (dispatch) {
                                            tr.delete(startPos, currentPos);
                                            return true;
                                        }
                                        return false;
                                    })
                                    .insertContentAt(startPos, html)
                                    .focus()
                                    .scrollIntoView()
                                    .run();
                            }
                        } catch (e) {
                            console.debug('Streaming partial update skipped:', e);
                        }
                    } else {
                        editor.commands.insertContent(chunk);
                    }
                }
            );
        } catch (e) {
            console.error(e);
            editor.commands.insertContent("\n\n[AI Generation Error]\n");
        } finally {
            setIsGenerating(false);
            setShowAIWidget(false);
            insertionStartPosRef.current = null;
            accumulatedTextRef.current = '';
        }
    };

    const handleAIResult = (text: string, mode: 'replace' | 'insert') => {
        if (!editor) return;
        if (mode === 'replace') editor.chain().focus().deleteSelection().insertContent(text).run();
        else editor.chain().focus().insertContent(text).run();
        setShowAI(false);
    };

    const handleDirectDraft = (topic: string) => {
        openAIWidget(t('notes.ai_prompts.write_article', { topic }));
    };

    const handleImageSuccess = async (url: string) => {
        try {
            const result = await assetBusinessFacade.importNotesAsset({
                scope: resolveNotesScope(),
                type: 'image',
                name: `gen_img_${Date.now()}.png`,
                remoteUrl: url,
                metadata: { source: 'note-gen', origin: 'ai' }
            });
            if (editor) editor.chain().focus().insertContent({ type: 'image', attrs: { src: result.primaryLocator.uri } }).run();
        } catch (e) {
            console.error("Failed to save asset", e);
            if (editor) editor.chain().focus().insertContent({ type: 'image', attrs: { src: url } }).run();
        }
        setGenModalType(null);
    };
    
    const handleVideoSuccess = async (url: string) => {
         try {
             const result = await assetBusinessFacade.importNotesAsset({
                 scope: resolveNotesScope(),
                 type: 'video',
                 name: `gen_vid_${Date.now()}.mp4`,
                 remoteUrl: url,
                 metadata: { source: 'note-gen', origin: 'ai' }
             });
             if (editor) editor.chain().focus().insertContent(`<video src="${result.primaryLocator.uri}" controls class="w-full rounded-lg my-4"></video>`).run();
         } catch (e) {
             console.error("Failed to save video asset", e);
             if (editor) editor.chain().focus().insertContent(`<video src="${url}" controls class="w-full rounded-lg my-4"></video>`).run();
         }
         setGenModalType(null);
    };

    const handleAudioSuccess = async (url: string) => {
         try {
             const result = await assetBusinessFacade.importNotesAsset({
                 scope: resolveNotesScope(),
                 type: 'audio',
                 name: `gen_aud_${Date.now()}.wav`,
                 remoteUrl: url,
                 metadata: { source: 'note-gen', origin: 'ai' }
             });
             if (editor) editor.chain().focus().insertContent(`<audio src="${result.primaryLocator.uri}" controls class="w-full my-4"></audio>`).run();
         } catch (e) {
             console.error("Failed to save audio asset", e);
             if (editor) editor.chain().focus().insertContent(`<audio src="${url}" controls class="w-full my-4"></audio>`).run();
         }
         setGenModalType(null);
    };
    
    const handleInsertMiniProgram = (data: MiniProgramInsertPayload) => {
        if (editor) {
            editor.chain().focus().insertContent({
                type: 'miniProgram',
                attrs: data
            }).run();
        }
        setShowMiniProgramModal(false);
    };

    let containerClasses = "";
    let editorSurfaceClasses = "";
    let maxWidthClasses = "";

    if (mode === 'page') {
        containerClasses = "flex-1 flex h-full bg-[#050505] relative overflow-hidden font-sans transition-colors duration-200";
        editorSurfaceClasses = "flex-1 h-full overflow-y-auto px-6 md:px-12 lg:px-24 editor-scrollbar scroll-smooth";
        maxWidthClasses = "max-w-5xl mx-auto relative min-h-full pt-12 md:pt-16 pb-40";
    } else if (mode === 'inline') {
        containerClasses = "w-full bg-[#050505] relative rounded-lg border border-[#27272a] font-sans transition-colors duration-200";
        editorSurfaceClasses = "p-4 min-h-[300px]";
        maxWidthClasses = "w-full";
    } else if (mode === 'embed') {
        containerClasses = "w-full h-full bg-[#1e1e1e] relative font-sans transition-colors duration-200 flex flex-col";
        editorSurfaceClasses = "flex-1 h-full overflow-y-auto px-8 py-6 editor-scrollbar scroll-smooth";
        maxWidthClasses = "max-w-4xl mx-auto w-full";
    }

    return (
        <div className={`${containerClasses} ${className}`}>
            <div className="flex-1 flex flex-col min-w-0 h-full">
                <div 
                    className={editorSurfaceClasses}
                    onClick={(e) => { if (editor && e.target === e.currentTarget) editor.commands.focus(); }}
                    onContextMenu={(e) => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY }); }}
                >
                    <div className={maxWidthClasses}>
                        {breadcrumbs.length > 0 && (
                            <div className="mb-4 flex items-center flex-wrap gap-1 text-[11px] text-gray-500">
                                {breadcrumbs.map((segment, index) => (
                                    <React.Fragment key={`${segment}-${index}`}>
                                        {index > 0 && <ChevronRight size={10} className="text-gray-600" />}
                                        <span className="px-1.5 py-0.5 rounded bg-[#141417] border border-[#242428] text-gray-400">
                                            {segment}
                                        </span>
                                    </React.Fragment>
                                ))}
                            </div>
                        )}
                        
                        {/* Metadata Header */}
                        {showMetadata && (
                            <div className={`flex items-center justify-between mb-6 group transition-all duration-300 select-none relative ${isTypeMenuOpen ? 'opacity-100 z-30' : 'opacity-60 hover:opacity-100 z-10'}`}>
                                <div className="flex items-center gap-3">
                                    {showTypeSelector && (
                                        <div className="relative" ref={typeMenuRef}>
                                            <button 
                                                onClick={() => setIsTypeMenuOpen(!isTypeMenuOpen)}
                                                disabled={readOnly}
                                                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#18181b] text-xs font-medium transition-colors ${isTypeMenuOpen ? 'bg-[#27272a] text-white ring-2 ring-blue-500/20' : 'text-gray-300 hover:bg-[#27272a]'}`}
                                            >
                                                <currentConfig.icon size={14} className="text-gray-400" />
                                                <span>{currentConfig.label}</span>
                                                <ChevronDown size={10} className={`opacity-50 transition-transform ${isTypeMenuOpen ? 'rotate-180' : ''}`} />
                                            </button>
                                            
                                            {isTypeMenuOpen && (
                                                <div className="absolute top-full left-0 mt-2 w-52 bg-[#1e1e20] border border-[#333] rounded-xl shadow-2xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100 origin-top-left">
                                                    <div className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider">{t('notes.editor.change_type')}</div>
                                                    {(Object.keys(typeConfig) as NoteType[]).map(t => {
                                                        const conf = typeConfig[t];
                                                        return (
                                                            <button 
                                                                key={t}
                                                                onClick={() => { onTypeChange?.(t); setIsTypeMenuOpen(false); }}
                                                                className={`flex items-center gap-3 w-full px-4 py-2.5 text-xs text-left hover:bg-[#2a2a2d] transition-colors ${noteType === t ? 'text-blue-400 bg-blue-900/10 font-medium' : 'text-gray-400'}`}
                                                            >
                                                                {React.createElement(conf.icon, { size: 14 })}
                                                                {conf.label}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    <div className="h-4 w-[1px] bg-[#27272a]" />
                                    <div className="flex items-center gap-1.5 text-xs text-gray-500 font-mono">
                                        <Calendar size={12} />
                                        <span>{new Date(lastUpdated).toLocaleDateString()}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="text-xs text-gray-500 font-mono flex items-center gap-3">
                                        {tags && tags.length > 0 && (
                                            <div className="flex items-center gap-1">
                                                <Hash size={12} />
                                                {tags.join(', ')}
                                            </div>
                                        )}
                                        <span>{countWords(editor?.getText() || '')} {t('notes.editor.words')}</span>
                                    </div>
                                    
                                    {showPublishButton && (
                                        <button
                                            onClick={onPublishClick}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-all shadow-sm text-xs font-semibold"
                                        >
                                            <Send size={12} />
                                            <span>{t('notes.editor.actions.publish')}</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Title Input */}
                        <div className="group relative mb-4 z-0">
                            <textarea
                                ref={titleTextareaRef}
                                className="w-full text-3xl md:text-4xl font-bold bg-transparent border-none outline-none text-white placeholder-gray-700 leading-tight py-2 pr-24 resize-none overflow-hidden"
                                value={initialTitle}
                                onChange={(e) => {
                                    onTitleChange?.(e.target.value);
                                    adjustTitleHeight();
                                }}
                                placeholder={t('notes.editor.untitled_page')}
                                readOnly={readOnly}
                                rows={1}
                                style={{ minHeight: '1.2em', maxHeight: '4.5em' }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        editor?.commands.focus();
                                    }
                                }}
                            />
                            
                            {/* AI Draft Button (Contextual) */}
                            {initialTitle.trim() && !readOnly && (
                                <div className="absolute right-0 top-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                                    <button
                                        onClick={() => openAIWidget(t('notes.ai_prompts.write_article', { topic: initialTitle }))}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs font-bold rounded-lg shadow-lg hover:shadow-purple-500/30 transform hover:scale-105 transition-all"
                                        title={t('notes.ai_drafter.title')}
                                    >
                                        <Sparkles size={12} fill="currentColor" />
                                        <span>{t('notes.editor.actions.generate_article')}</span>
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Toolbar */}
                        {showToolbar && !readOnly && (
                            <EditorToolbar 
                                editor={editor} 
                                onUpload={handleFileUploadInternal}
                                onOpenGenModal={(type) => setGenModalType(type)}
                                onOpenMiniProgram={() => setShowMiniProgramModal(true)}
                                onViewSource={() => setShowHtmlSourceModal(true)}
                                isGenerating={isGenerating}
                                isChatOpen={isChatOpen}
                                onToggleChat={() => setIsChatOpen(!isChatOpen)}
                                showChatToggle={showChatToggle}
                                onOpenAIWriter={() => openAIWidget('')}
                            />
                        )}

                        {/* Content */}
                        <div className="relative z-0 min-h-[500px]">
                            {editor && (
                                <>
                                    {!readOnly && <TextBubbleMenu editor={editor} onAI={() => triggerAI('replace', editor.state.selection.content().toString())} />}
                                    {!readOnly && <BlockFloatingMenu editor={editor} />}
                                    <EditorContent editor={editor} className="min-h-full" />
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Sidebar Elements */}
            {isChatOpen && editor && showChatToggle && (
                 <Resizer onMouseDown={startResizingChat} />
            )}
            {isChatOpen && editor && showChatToggle && (
                <div style={{ width: chatWidth }} className="flex-none z-20 min-w-[280px] max-w-[800px] h-full bg-[#1e1e1e] border-l border-[#27272a]">
                    <NoteChatPane editor={editor} onClose={() => setIsChatOpen(false)} />
                </div>
            )}

            {/* Modals & Overlays */}
            {contextMenu && editor && !readOnly && (
                <EditorContextMenu 
                    x={contextMenu.x} y={contextMenu.y} editor={editor} 
                    onClose={() => setContextMenu(null)}
                    onTriggerAI={(mode, ctx) => { triggerAI(mode, ctx); }}
                />
            )}
            {showAI && (
                <AIPanel 
                    onClose={() => setShowAI(false)} 
                    onInsert={handleAIResult}
                    onDraft={handleDirectDraft}
                    selectionText={editor?.state.selection.content().toString() || ''}
                    contextText={editor?.getText() || ''}
                    position={aiPosition}
                />
            )}
            
            <AIWriterFloat 
                visible={showAIWidget}
                position={aiWidgetPos}
                initialPrompt={aiWidgetPrompt}
                isGenerating={isGenerating}
                onClose={() => setShowAIWidget(false)}
                onGenerate={handleAIStreamingGenerate}
                onStop={() => { stopGenerationRef.current = true; setIsGenerating(false); }}
            />
            
            {genModalType === 'image' && (
                <ImageGeneratorModal 
                    onClose={() => setGenModalType(null)}
                    onSuccess={handleImageSuccess}
                    actionLabel={t('notes.editor.actions.insert_to_note')}
                />
            )}
            
            {genModalType === 'video' && (
                <VideoGeneratorModal 
                    onClose={() => setGenModalType(null)}
                    onSuccess={handleVideoSuccess}
                    actionLabel={t('notes.editor.actions.insert_to_note')}
                />
            )}
            
            {genModalType === 'audio' && (
                <AIGenerateModal
                    initialType="audio"
                    onClose={() => setGenModalType(null)}
                    onInsert={(_type, src) => {
                        handleAudioSuccess(src);
                    }}
                />
            )}
            
            {showMiniProgramModal && (
                <MiniProgramModal 
                    onClose={() => setShowMiniProgramModal(false)}
                    onInsert={handleInsertMiniProgram}
                />
            )}
            
            {showHtmlSourceModal && editor && (
                <HtmlSourceModal 
                    isOpen={showHtmlSourceModal}
                    onClose={() => setShowHtmlSourceModal(false)}
                    content={editor.getHTML()}
                />
            )}
        </div>
    );
};

export const NoteEditor: React.FC = () => {
    const { activeNote, updateNote, folders } = useNoteStore();
    const [showPublishModal, setShowPublishModal] = useState(false);

    const breadcrumbs = useMemo(() => {
        if (!activeNote?.parentId) {
            return [] as string[];
        }
        const segments: string[] = [];
        const visited = new Set<string>();
        let currentParentId: string | null = activeNote.parentId;

        while (currentParentId) {
            if (visited.has(currentParentId)) {
                break;
            }
            visited.add(currentParentId);
            const folder = folders.find((item) => item.id === currentParentId);
            if (!folder) {
                break;
            }
            segments.unshift(folder.name);
            currentParentId = folder.parentId;
        }

        return segments;
    }, [activeNote?.parentId, folders]);

    if (!activeNote) {
        return <NoteEditorEmpty />;
    }

    const handleChange = (content: string) => {
        updateNote(activeNote.id, { content });
    };

    const handleTitleChange = (title: string) => {
        updateNote(activeNote.id, { title });
    };
    
    const handleTypeChange = (type: NoteType) => {
        updateNote(activeNote.id, { type });
    };

    return (
        <>
            <UniversalNoteEditor 
                key={activeNote.id}
                initialContent={activeNote.content}
                initialTitle={activeNote.title}
                noteType={activeNote.type}
                breadcrumbs={breadcrumbs}
                lastUpdated={activeNote.updatedAt}
                tags={activeNote.tags}
                onChange={handleChange}
                onTitleChange={handleTitleChange}
                onTypeChange={handleTypeChange}
                onPublishClick={() => setShowPublishModal(true)}
            />
            
            {showPublishModal && (
                <PublishModal 
                    note={activeNote} 
                    onClose={() => setShowPublishModal(false)} 
                />
            )}
        </>
    );
};
