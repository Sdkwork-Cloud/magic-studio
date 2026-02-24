import React from 'react';
import { CreationLayoutSidebar } from './CreationLayoutSidebar';

export interface CreationLayoutProps {
    leftPane?: React.ComponentType<any>;
    children: React.ReactNode;
}

export const CreationLayout: React.FC<CreationLayoutProps> = ({ leftPane: LeftPane, children }) => {
    return (
        <div className="flex w-full h-full bg-[#020202] overflow-hidden">
            {/* 1. Creation Sidebar (Navigation) */}
            <CreationLayoutSidebar />

            {/* 2. Optional Left Pane (If provided by route) */}
            {LeftPane && (
                <div className="w-[300px] flex-none border-r border-[#1a1a1a] bg-[#050505] flex flex-col h-full overflow-hidden z-10 relative">
                    <LeftPane />
                </div>
            )}
            
            {/* 3. Main Content Area (Children) */}
            <div className="flex-1 flex flex-col min-w-0 bg-[#1e1e1e] relative z-0">
                {children}
            </div>
        </div>
    );
};
