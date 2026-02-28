
import React, { useState, useEffect } from 'react';
import { Editor } from '@tiptap/react';
import { 
    Heading1, Heading2, List, ListOrdered, CheckSquare, 
    Code, Quote, Image as ImageIcon
} from 'lucide-react';
import { filePicker } from '@sdkwork/react-editor';

interface BlockFloatingMenuProps {
    editor: Editor;
}

// Define specific style interface
interface MenuStyle {
    display?: string;
    position?: 'fixed' | 'absolute';
    top?: string;
    left?: string;
    zIndex?: number;
}

interface MenuButtonProps {
    onClick: () => void;
    icon: React.ReactNode;
    label?: string;
}

export const BlockFloatingMenu: React.FC<BlockFloatingMenuProps> = ({ editor }) => {
    const [style, setStyle] = useState<MenuStyle>({ display: 'none' });

    useEffect(() => {
        const update = () => {
            if (!editor || editor.isDestroyed) {
                setStyle({ display: 'none' });
                return;
            }

            try {
                const { selection } = editor.state;
                const { $anchor } = selection;
                const isRootDepth = $anchor.depth === 1;
                const isEmpty = $anchor.parent.textContent.length === 0;
                const isParagraph = $anchor.parent.type.name === 'paragraph';

                // Show only on empty paragraphs at root depth
                if (!selection.empty || !isRootDepth || !isEmpty || !isParagraph) {
                    setStyle({ display: 'none' });
                    return;
                }

                // Calculate position (might throw if view not ready)
                const start = editor.view.coordsAtPos(selection.from);
                
                // Adjust position to the left of the cursor
                setStyle({
                    position: 'fixed',
                    top: `${start.top - 6}px`, // Slight adjustment to center vertically with text
                    left: `${start.left - 20}px`,
                    zIndex: 50,
                    display: 'flex'
                });
            } catch (e) {
                // Ignore if view is not ready
                setStyle({ display: 'none' });
            }
        };

        editor.on('selectionUpdate', update);
        editor.on('update', update);
        editor.on('focus', update);
        editor.on('blur', () => setStyle({ display: 'none' }));

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

    const handleImageClick = async () => {
        try {
            const files = await filePicker.pickFiles(false, 'image/*');
            if (files.length > 0) {
                const file = files[0];
                // Convert to Base64
                let binary = '';
                const len = file.data.byteLength;
                for (let i = 0; i < len; i++) {
                    binary += String.fromCharCode(file.data[i]);
                }
                const base64 = btoa(binary);
                
                // Simple mime guess
                const ext = file.name.split('.').pop()?.toLowerCase();
                let mime = 'image/jpeg';
                if (ext === 'png') mime = 'image/png';
                if (ext === 'svg') mime = 'image/svg+xml';
                if (ext === 'gif') mime = 'image/gif';
                if (ext === 'webp') mime = 'image/webp';

                const src = `data:${mime};base64,${base64}`;

                editor
                    .chain()
                    .focus()
                    .insertContent({ type: 'image', attrs: { src } })
                    .run();
            }
        } catch (e) {
            console.error('Image insertion failed', e);
        }
    };

    if (style.display === 'none') return null;

    return (
        <div 
            className="flex items-center gap-1 p-1 absolute"
            style={style}
        >
             <div className="flex items-center gap-1 bg-[#1e1e1e] p-1 rounded-lg border border-[#333] shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-right-2 duration-150 -translate-x-full">
                <MenuBtn 
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} 
                    icon={<Heading1 size={16} />} 
                    // label="H1" -> Removed redundant label
                />
                <MenuBtn 
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} 
                    icon={<Heading2 size={16} />} 
                    // label="H2" -> Removed redundant label
                />
                
                <div className="w-[1px] h-4 bg-[#333] mx-1" />
                
                <MenuBtn 
                    onClick={() => editor.chain().focus().toggleBulletList().run()} 
                    icon={<List size={16} />} 
                />
                <MenuBtn 
                    onClick={() => editor.chain().focus().toggleOrderedList().run()} 
                    icon={<ListOrdered size={16} />} 
                />
                <MenuBtn 
                    onClick={() => editor.chain().focus().toggleTaskList().run()} 
                    icon={<CheckSquare size={16} />} 
                />
                
                <div className="w-[1px] h-4 bg-[#333] mx-1" />

                <MenuBtn 
                    onClick={() => editor.chain().focus().toggleCodeBlock().run()} 
                    icon={<Code size={16} />} 
                />
                <MenuBtn 
                    onClick={() => editor.chain().focus().toggleBlockquote().run()} 
                    icon={<Quote size={16} />} 
                />
                
                <div className="w-[1px] h-4 bg-[#333] mx-1" />

                <MenuBtn 
                    onClick={handleImageClick} 
                    icon={<ImageIcon size={16} />} 
                />
        </div>
    </div>
    );
};

const MenuBtn: React.FC<MenuButtonProps> = ({ onClick, icon, label }) => (
    <button
        onClick={onClick}
        onMouseDown={(e) => e.preventDefault()}
        className="flex items-center gap-1 p-1.5 rounded hover:bg-[#2d2d2d] text-gray-400 hover:text-white transition-colors"
    >
        {icon}
        {label && <span className="text-[10px] font-bold">{label}</span>}
    </button>
);
