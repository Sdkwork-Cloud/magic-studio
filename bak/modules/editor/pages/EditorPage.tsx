
import React, { useEffect, useState, useCallback } from 'react';
import { useEditorStore } from '../store/editorStore';
import FileExplorer from '../components/FileExplorer';
import CodeEditor from '../components/CodeEditor';
import AIChatPane from '../components/AIChatPane';

// --- Resizer Component ---
const Resizer: React.FC<{ onMouseDown: (e: React.MouseEvent) => void }> = ({ onMouseDown }) => {
    return (
        <div className="group relative flex-none w-[1px] h-full bg-[#2b2b2b] z-50">
            {/* Visual Highlight Overlay (Blue) - Appears on hover */}
            <div className="absolute inset-y-0 left-0 right-0 bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-150 delay-75 pointer-events-none" />
            
            {/* Invisible Hit Area - Wider for usability */}
            <div 
                className="absolute inset-y-0 -left-1 -right-1 bg-transparent cursor-col-resize z-50"
                onMouseDown={onMouseDown}
            />
        </div>
    );
};

const EditorLayout: React.FC = () => {
    const { saveCurrentFile } = useEditorStore();
    
    // --- Layout State ---
    // Default widths
    const [chatWidth, setChatWidth] = useState(450); // Increased width ~1/6th wider (was 380)
    const [explorerWidth, setExplorerWidth] = useState(260);
    
    // Resizing state
    const [isResizing, setIsResizing] = useState<'chat' | 'explorer' | null>(null);

    // --- Shortcuts ---
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                e.preventDefault();
                saveCurrentFile();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [saveCurrentFile]);

    // --- Resizing Logic ---
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing) return;

            // Main Sidebar is fixed at 48px in MainLayout
            const SIDEBAR_OFFSET = 48; 

            if (isResizing === 'chat') {
                // Calculate new width relative to the sidebar offset
                const newWidth = e.clientX - SIDEBAR_OFFSET;
                // Constraints: Min 240px, Max 800px
                if (newWidth >= 240 && newWidth <= 800) {
                    setChatWidth(newWidth);
                }
            } else if (isResizing === 'explorer') {
                // Explorer starts after (Sidebar + Chat + ChatResizer)
                // We simplify by just taking the delta from the chat's right edge
                const startX = SIDEBAR_OFFSET + chatWidth; 
                const newWidth = e.clientX - startX;
                
                // Constraints: Min 180px, Max 600px
                if (newWidth >= 180 && newWidth <= 600) {
                    setExplorerWidth(newWidth);
                }
            }
        };

        const handleMouseUp = () => {
            if (isResizing) {
                setIsResizing(null);
                document.body.style.cursor = 'default';
                document.body.style.userSelect = 'auto'; // Re-enable text selection
            }
        };

        if (isResizing) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            // Force cursor and disable selection during drag
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing, chatWidth]);

    return (
        <div className="flex h-full w-full overflow-hidden">
            {/* Far Left: AI Chat */}
            <div 
                style={{ width: chatWidth }} 
                className="flex-none hidden md:block bg-[#111113]"
            >
                <AIChatPane />
            </div>

            {/* Resizer: Chat <-> Explorer */}
            <Resizer onMouseDown={() => setIsResizing('chat')} />

            {/* Left-Middle: File Explorer */}
            <div 
                style={{ width: explorerWidth }} 
                className="flex-none bg-[#1e1e1e]"
            >
                <FileExplorer />
            </div>

            {/* Resizer: Explorer <-> Editor */}
            <Resizer onMouseDown={() => setIsResizing('explorer')} />

            {/* Center/Right: Monaco Editor + Tabs + WindowControls */}
            <div className="flex-1 min-w-0 bg-black flex flex-col">
                <CodeEditor />
            </div>
        </div>
    );
};

const EditorPage: React.FC = () => {
  return <EditorLayout />;
};

export default EditorPage;
