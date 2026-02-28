
import { NoteSidebar, NoteEditor } from '../index'
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { NoteStoreProvider } from '../store/noteStore';

// --- Resizer Component ---
const Resizer: React.FC<{ onMouseDown: (e: React.MouseEvent) => void }> = ({ onMouseDown }) => {
    return (
        <div className="group relative flex-none w-[1px] h-full bg-[#1a1a1a] z-50 cursor-col-resize flex items-center justify-center hover:bg-blue-600 transition-colors delay-75">
            {/* Invisible Hit Area */}
            <div 
                className="absolute inset-y-0 -left-2 -right-2 bg-transparent z-50"
                onMouseDown={onMouseDown}
            />
        </div>
    );
};

const NotesPageContent: React.FC = () => {
    // --- Layout State ---
    const [sidebarWidth, setSidebarWidth] = useState(() => {
        const saved = localStorage.getItem('notes_sidebar_width');
        return saved ? parseInt(saved, 10) : 260;
    });
    
    // Refs for event handlers to avoid re-binding
    const isResizingRef = useRef(false);
    const sidebarWidthRef = useRef(sidebarWidth);

    useEffect(() => {
        sidebarWidthRef.current = sidebarWidth;
    }, [sidebarWidth]);

    const startResizing = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        isResizingRef.current = true;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    }, []);

    // --- Resizing Logic ---
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizingRef.current) return;
            
            // Main App Sidebar is fixed at 48px
            const APP_SIDEBAR_WIDTH = 48;
            const newWidth = e.clientX - APP_SIDEBAR_WIDTH;

            // Constraints: Min 180px, Max 500px
            // Clamp value to ensure it stays within bounds
            const clampedWidth = Math.max(180, Math.min(500, newWidth));
            setSidebarWidth(clampedWidth);
        };

        const handleMouseUp = () => {
            if (isResizingRef.current) {
                isResizingRef.current = false;
                document.body.style.cursor = 'default';
                document.body.style.userSelect = 'auto';
                localStorage.setItem('notes_sidebar_width', sidebarWidthRef.current.toString());
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    return (
        <div className="flex w-full h-full overflow-hidden bg-[#050505]">
            {/* Left Sidebar */}
            <div 
                style={{ width: sidebarWidth }} 
                className="flex-none flex flex-col h-full overflow-hidden border-r border-[#27272a]"
            >
                <NoteSidebar />
            </div>

            {/* Resizer */}
            <Resizer onMouseDown={startResizing} />

            {/* Main Editor Area */}
            <div className="flex-1 min-w-0 h-full">
                <NoteEditor />
            </div>
        </div>
    );
};

const NotesPage: React.FC = () => {
  return (
    <NoteStoreProvider>
        <NotesPageContent />
    </NoteStoreProvider>
  );
};

export default NotesPage;
