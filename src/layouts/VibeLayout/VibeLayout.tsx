
import React, { useState, useEffect } from 'react';
import { VibeLayoutSidebar } from './VibeLayoutSidebar';

export interface VibeLayoutProps {
    leftPane?: React.ComponentType<any>;
    children: React.ReactNode;
}

// Resizer Component
const Resizer: React.FC<{ onMouseDown: (e: React.MouseEvent) => void }> = ({ onMouseDown }) => (
    <div className="app-resizer group relative h-full z-50 cursor-col-resize delay-75">
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
        <div className="app-shell h-full">
            {/* 1. Vibe Sidebar */}
            <VibeLayoutSidebar />

            {/* 2. Left Pane (Config/Explorer) */}
            {LeftPane && (
                <>
                    <div style={{ width: leftWidth }} className="flex-none h-full overflow-hidden bg-[var(--bg-panel-subtle)] border-r border-[var(--border-color)] flex flex-col">
                        <LeftPane />
                    </div>
                    <Resizer onMouseDown={() => setIsResizing(true)} />
                </>
            )}

            {/* 3. Main Content Area */}
            <div className="app-shell-main flex flex-col min-w-0 relative z-0">
                {children}
            </div>
        </div>
    );
};
