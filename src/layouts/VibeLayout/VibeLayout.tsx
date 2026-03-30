
import React, { useState, useEffect } from 'react';
import { VibeLayoutSidebar } from './VibeLayoutSidebar';

export interface VibeLayoutProps {
    leftPane?: React.ComponentType<any>;
    children: React.ReactNode;
}

// Resizer Component
const Resizer: React.FC<{ onMouseDown: (e: React.MouseEvent) => void }> = ({ onMouseDown }) => (
    <div className="group relative flex-none w-[1px] h-full bg-[#1a1a1a] z-50 cursor-col-resize hover:bg-blue-500 transition-colors delay-75">
        <div className="absolute inset-y-0 -left-1 -right-1 bg-transparent z-50" onMouseDown={onMouseDown} />
    </div>
);

export const VibeLayout: React.FC<VibeLayoutProps> = ({ leftPane: LeftPane, children }) => {
    const [leftWidth, setLeftWidth] = useState(280);
    const [isResizing, setIsResizing] = useState(false);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing) return;
            const SIDEBAR_WIDTH = 64; 
            const newWidth = e.clientX - SIDEBAR_WIDTH;
            if (newWidth >= 200 && newWidth <= 600) {
                setLeftWidth(newWidth);
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
            {/* 1. Vibe Sidebar */}
            <VibeLayoutSidebar />

            {/* 2. Left Pane (Config/Explorer) */}
            {LeftPane && (
                <>
                    <div style={{ width: leftWidth }} className="flex-none h-full overflow-hidden bg-[#050505] flex flex-col">
                        <LeftPane />
                    </div>
                    <Resizer onMouseDown={() => setIsResizing(true)} />
                </>
            )}

            {/* 3. Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 bg-[#020202] relative z-0">
                {children}
            </div>
        </div>
    );
};
