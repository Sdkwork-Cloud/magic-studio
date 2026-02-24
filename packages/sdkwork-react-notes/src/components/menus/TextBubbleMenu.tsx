
import React, { useState, useEffect, useRef } from 'react';
import { Editor } from '@tiptap/react';
import { 
    Bold, Italic, Strikethrough, Code, Link2, 
    Highlighter, Sparkles, ChevronDown, Check, X, Baseline
} from 'lucide-react';
import { useTranslation } from 'sdkwork-react-i18n';

interface TextBubbleMenuProps {
    editor: Editor;
    onAI: () => void;
}

// Notion-like Colors
const TEXT_COLORS = [
    { color: 'inherit', label: 'Default' },
    { color: '#787774', label: 'Gray' },
    { color: '#9F6B53', label: 'Brown' },
    { color: '#D9730D', label: 'Orange' },
    { color: '#CB912F', label: 'Yellow' },
    { color: '#448361', label: 'Green' },
    { color: '#337EA9', label: 'Blue' },
    { color: '#9065B0', label: 'Purple' },
    { color: '#C14C8A', label: 'Pink' },
    { color: '#D44C47', label: 'Red' },
];

const HIGHLIGHT_COLORS = [
    { color: 'transparent', label: 'None' },
    { color: '#F1F1EF', label: 'Gray' },
    { color: '#F3EEEE', label: 'Brown' },
    { color: '#F8ECDF', label: 'Orange' },
    { color: '#FAF3DD', label: 'Yellow' },
    { color: '#EEF3ED', label: 'Green' },
    { color: '#E9F3F7', label: 'Blue' },
    { color: '#F6F3F9', label: 'Purple' },
    { color: '#F9F2F5', label: 'Pink' },
    { color: '#FDEBEC', label: 'Red' },
];

// Define specific style interface to avoid generic CSSProperties issues
interface MenuStyle {
    display?: string;
    position?: 'fixed' | 'absolute';
    top?: string;
    left?: string;
    transform?: string;
    zIndex?: number;
}

export const TextBubbleMenu: React.FC<TextBubbleMenuProps> = ({ editor, onAI }) => {
    const [style, setStyle] = useState<MenuStyle>({ display: 'none' });
    const { t } = useTranslation();

    useEffect(() => {
        const update = () => {
            if (!editor || editor.isDestroyed) {
                setStyle({ display: 'none' });
                return;
            }

            try {
                const { selection } = editor.state;
                const isCodeBlock = editor.isActive('codeBlock');
                
                if (selection.empty || isCodeBlock) {
                    setStyle({ display: 'none' });
                    return;
                }

                // 1. Get Selection Coordinates (Viewport Relative)
                // This might throw if view is not ready
                const { from, to } = selection;
                const start = editor.view.coordsAtPos(from);
                const end = editor.view.coordsAtPos(to);
                
                // 2. Menu Dimensions (Approximation)
                const MENU_HEIGHT = 45; 
                const MENU_WIDTH = 420; 
                const BUFFER = 10;

                // 3. Calculate Default Position (Centered above selection)
                const left = (start.left + end.left) / 2;
                let top = start.top - MENU_HEIGHT - BUFFER;

                // 4. Dynamic Collision Detection
                const toolbarEl = document.getElementById('note-editor-toolbar');
                let ceilingY = 0;

                if (toolbarEl) {
                    const rect = toolbarEl.getBoundingClientRect();
                    ceilingY = rect.bottom; 
                } else {
                    ceilingY = 60; 
                }
                
                const safeThreshold = ceilingY + BUFFER;

                // 5. Flip Logic
                if (top < safeThreshold) {
                    top = end.bottom + BUFFER;
                }

                // 6. Horizontal Constraint
                const windowWidth = window.innerWidth;
                const halfMenu = MENU_WIDTH / 2;
                const adjustedLeft = Math.max(halfMenu + 20, Math.min(left, windowWidth - halfMenu - 20));

                setStyle({
                    position: 'fixed',
                    top: `${top}px`,
                    left: `${adjustedLeft}px`,
                    transform: 'translateX(-50%)',
                    zIndex: 100,
                    display: 'flex'
                });
            } catch (e) {
                // If coordsAtPos fails, just hide
                setStyle({ display: 'none' });
            }
        };

        editor.on('selectionUpdate', update);
        editor.on('update', update);
        editor.on('focus', update);
        editor.on('blur', () => {
             // Keep menu visible for a moment to allow clicking buttons
             setTimeout(() => {
                 if (!document.activeElement?.closest('.bubble-menu-container')) {
                    // We rely on Tiptap's focus handling mostly, 
                    // this timeout allows clicking menu items before hiding.
                 }
             }, 200);
        });

        window.addEventListener('scroll', update, true); 
        window.addEventListener('resize', update);

        return () => {
            editor.off('selectionUpdate', update);
            editor.off('update', update);
            editor.off('focus', update);
            editor.off('blur');
            window.removeEventListener('scroll', update, true);
            window.removeEventListener('resize', update);
        };
    }, [editor]);

    if (style.display === 'none') return null;

    return (
        <div 
            className="bubble-menu-container flex items-center gap-1 p-1 bg-[#1e1e1e] rounded-lg shadow-2xl border border-[#333] overflow-visible backdrop-blur-md animate-in fade-in zoom-in-95 duration-100 origin-center transition-all z-[100]"
            style={style as React.CSSProperties}
            onMouseDown={(e) => e.preventDefault()}
        >
            {/* AI Trigger */}
            <button 
                onClick={(e) => { e.preventDefault(); onAI(); }}
                className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-purple-400 hover:bg-purple-500/20 rounded-md transition-colors mr-1 h-7"
            >
                <Sparkles size={12} />
                <span>{t('notes.editor.bubble_menu.ask_ai')}</span>
            </button>

            <div className="w-[1px] h-4 bg-[#333] mx-0.5" />

            <MenuBtn 
                onClick={() => (editor.chain().focus() as any).toggleBold().run()} 
                active={editor.isActive('bold')}
                icon={<Bold size={14} />} 
                tooltip="Bold (Cmd+B)"
            />
            <MenuBtn 
                onClick={() => (editor.chain().focus() as any).toggleItalic().run()} 
                active={editor.isActive('italic')}
                icon={<Italic size={14} />} 
                tooltip="Italic (Cmd+I)"
            />
            <MenuBtn 
                onClick={() => (editor.chain().focus() as any).toggleStrike().run()} 
                active={editor.isActive('strike')}
                icon={<Strikethrough size={14} />} 
                tooltip="Strikethrough"
            />
            <MenuBtn 
                onClick={() => (editor.chain().focus() as any).toggleCode().run()} 
                active={editor.isActive('code')}
                icon={<Code size={14} />} 
                tooltip="Inline Code"
            />
            
            <div className="w-[1px] h-4 bg-[#333] mx-0.5" />

            <MenuBtn 
                onClick={() => {
                    const previousUrl = editor.getAttributes('link').href;
                    const url = window.prompt('URL', previousUrl);
                    if (url === null) return;
                    if (url === '') {
                        (editor.chain().focus() as any).extendMarkRange('link').unsetLink().run();
                        return;
                    }
                    (editor.chain().focus() as any).extendMarkRange('link').setLink({ href: url }).run();
                }} 
                active={editor.isActive('link')}
                icon={<Link2 size={14} />} 
                tooltip="Link"
            />
            
            {/* Text Color Dropdown */}
            <ColorSelector 
                icon={<Baseline size={14} />}
                colors={TEXT_COLORS}
                activeColor={editor.getAttributes('textStyle').color}
                onSelect={(color) => (editor.chain().focus() as any).setColor(color).run()}
                onClear={() => (editor.chain().focus() as any).unsetColor().run()}
                title="Text Color"
            />

            {/* Highlight Background Dropdown */}
            <ColorSelector 
                icon={<Highlighter size={14} />}
                colors={HIGHLIGHT_COLORS}
                activeColor={editor.getAttributes('highlight').color}
                onSelect={(color) => (editor.chain().focus() as any).setHighlight({ color }).run()}
                onClear={() => (editor.chain().focus() as any).unsetHighlight().run()}
                title="Highlight"
            />
        </div>
    );
};

const MenuBtn = ({ onClick, active, icon, tooltip }: any) => (
    <button
        onClick={onClick}
        onMouseDown={(e) => e.preventDefault()}
        title={tooltip}
        className={`
            p-1.5 rounded-md transition-colors text-gray-400 hover:text-white h-7 w-7 flex items-center justify-center
            ${active ? 'text-blue-400 bg-blue-400/10' : 'hover:bg-[#2d2d2d]'}
        `}
    >
        {icon}
    </button>
);

const ColorSelector: React.FC<{ 
    icon: React.ReactNode, 
    colors: { color: string, label: string }[], 
    activeColor?: string, 
    onSelect: (color: string) => void, 
    onClear: () => void,
    title: string 
}> = ({ icon, colors, activeColor, onSelect, onClear, title }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    return (
        <div className="relative" ref={containerRef}>
            <div className="flex items-center h-7 rounded-md overflow-hidden bg-[#1e1e1e] hover:bg-[#2d2d2d] transition-colors">
                <button 
                    className={`flex items-center justify-center w-6 h-full text-gray-400 hover:text-white ${activeColor ? 'text-blue-400' : ''}`}
                    onClick={() => setIsOpen(!isOpen)}
                    title={title}
                    onMouseDown={(e) => e.preventDefault()}
                >
                    {icon}
                </button>
                <button 
                    className="flex items-center justify-center w-3 h-full text-gray-500 hover:text-white border-l border-white/5"
                    onClick={() => setIsOpen(!isOpen)}
                    onMouseDown={(e) => e.preventDefault()}
                >
                    <ChevronDown size={10} />
                </button>
            </div>

            {isOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 p-2 bg-[#252526] border border-[#333] rounded-lg shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100 min-w-[160px]">
                     <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 px-1">
                        {title}
                    </div>
                    <div className="grid grid-cols-5 gap-1 mb-2">
                        {colors.map(c => (
                            <button
                                key={c.color}
                                onClick={() => { 
                                    if(c.color === 'inherit' || c.color === 'transparent') onClear();
                                    else onSelect(c.color); 
                                    setIsOpen(false); 
                                }}
                                className="w-6 h-6 rounded-md border border-transparent hover:border-white/50 transition-all relative flex items-center justify-center group"
                                style={{ backgroundColor: c.color === 'inherit' || c.color === 'transparent' ? 'transparent' : c.color }}
                                title={c.label}
                                onMouseDown={(e) => e.preventDefault()}
                            >
                                {(c.color === 'inherit' || c.color === 'transparent') && (
                                    <div className="w-full h-[1px] bg-red-500 rotate-45" />
                                )}
                                {activeColor === c.color && (
                                    <Check size={12} className={c.color === '#000000' ? 'text-white' : 'text-black/70'} />
                                )}
                            </button>
                        ))}
                    </div>
                    <button 
                        onClick={() => { onClear(); setIsOpen(false); }}
                        className="w-full flex items-center justify-center gap-2 px-2 py-1.5 rounded-md hover:bg-[#333] text-gray-400 hover:text-white text-xs transition-colors border-t border-[#333]"
                        onMouseDown={(e) => e.preventDefault()}
                    >
                        <X size={12} /> Clear
                    </button>
                </div>
            )}
        </div>
    );
};
