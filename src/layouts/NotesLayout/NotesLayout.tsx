
import React from 'react';
import { NotesHeader } from './NotesHeader';

export interface NotesLayoutProps {
    children: React.ReactNode;
    leftPane?: React.ComponentType<any>;
}

export const NotesLayout: React.FC<NotesLayoutProps> = ({ children, leftPane: LeftPane }) => {
    return (
        <div className="flex flex-col w-full h-full bg-[var(--bg-app)] overflow-hidden relative text-[var(--text-primary)]">
            <NotesHeader />
            <div className="flex-1 min-h-0 relative flex flex-col overflow-hidden">
                {LeftPane && (
                    <div className="w-80 border-r border-[var(--border-color)] overflow-hidden bg-[var(--bg-panel-subtle)]">
                        <LeftPane />
                    </div>
                )}
                <div className="app-shell-main flex-1 overflow-hidden">
                    {children}
                </div>
            </div>
        </div>
    );
};
