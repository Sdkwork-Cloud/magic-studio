
import React, { useState, useEffect } from 'react';
import { GenerationLayoutSidebar } from './GenerationLayoutSidebar';

export interface GenerationLayoutProps {
    leftPane?: React.ComponentType<any>;
    children: React.ReactNode;
}

// Resizer Handle Component
const Resizer: React.FC<{ onMouseDown: (e: React.MouseEvent) => void }> = ({ onMouseDown }) => (
    <div className="group relative flex-none w-[1px] h-full bg-[#1a1a1a] z-50 cursor-col-resize hover:bg-blue-600 transition-colors delay-75">
        {/* Invisible hit area for easier grabbing */}
        <div className="absolute inset-y-0 -left-2 -right-2 bg-transparent z-50" onMouseDown={onMouseDown} />
    </div>
);

export const GenerationLayout: React.FC<GenerationLayoutProps> = ({ leftPane: LeftPane, children }) => {
    // Default width increased to 560px (~30% wider than previous 420px) to accommodate complex video modes
    const [sidebarWidth, setSidebarWidth] = useState(560);
    const [isResizing, setIsResizing] = useState(false);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing) return;
            
            // Icon Sidebar is fixed at 64px (w-16)
            const ICON_SIDEBAR_WIDTH = 64; 
            const newWidth = e.clientX - ICON_SIDEBAR_WIDTH;
            
            // Constraints: Min 360px, Max 800px
            if (newWidth >= 360 && newWidth <= 800) {
                setSidebarWidth(newWidth);
            }
        };

        const handleMouseUp = () => {
            if (isResizing) {
                setIsResizing(false);
                document.body.style.cursor = 'default';
                document.body.style.userSelect = 'auto';
            }
        };

        if (isResizing) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            // Force cursor style during drag
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing]);

    return (
        <div className="flex w-full h-full bg-[#020202] overflow-hidden">
            {/* 1. Thin Icon Sidebar (Navigation) */}
            <GenerationLayoutSidebar />

            {/* 2. Config Panel (Left Pane) - Resizable */}
            {LeftPane && (
                <>
                    <div
                        style={{ width: sidebarWidth }}
                        className="flex-none border-r border-[#1a1a1a] bg-[#050505] flex flex-col h-full overflow-hidden z-10 relative transition-none"
                    >
                        <LeftPane />
                    </div>
                    <Resizer onMouseDown={() => setIsResizing(true)} />
                </>
            )}

            {/* 3. Main Content Area (Children) */}
            <div className="flex-1 flex flex-col min-w-0 bg-[#020202] relative z-0">
                {children}
            </div>
        </div>
    );
};
