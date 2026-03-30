import React from 'react';
import { CreationLayoutSidebar } from './CreationLayoutSidebar';

export interface CreationLayoutProps {
    leftPane?: React.ComponentType<any>;
    children: React.ReactNode;
}

export const CreationLayout: React.FC<CreationLayoutProps> = ({ leftPane: LeftPane, children }) => {
    return (
        <div className="app-shell h-full">
            {/* 1. Creation Sidebar (Navigation) */}
            <CreationLayoutSidebar />

            {/* 2. Optional Left Pane (If provided by route) */}
            {LeftPane && (
                <div className="w-[300px] flex-none border-r border-[var(--border-color)] bg-[var(--bg-panel-subtle)] flex flex-col h-full overflow-hidden z-10 relative">
                    <LeftPane />
                </div>
            )}
            
            {/* 3. Main Content Area (Children) */}
            <div className="app-shell-main flex flex-col min-w-0 relative z-0">
                {children}
            </div>
        </div>
    );
};
