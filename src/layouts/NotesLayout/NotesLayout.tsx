
import React from 'react';
import { NotesHeader } from './NotesHeader';

export interface NotesLayoutProps {
    children: React.ReactNode;
    leftPane?: React.ComponentType<any>;
}

export const NotesLayout: React.FC<NotesLayoutProps> = ({ children, leftPane: LeftPane }) => {
    return (
        <div className="flex flex-col w-full h-full bg-[#1e1e1e] overflow-hidden relative">
            <NotesHeader />
            <div className="flex-1 min-h-0 relative flex flex-col overflow-hidden">
                {LeftPane && (
                    <div className="w-80 border-r border-white/10 overflow-hidden">
                        <LeftPane />
                    </div>
                )}
                <div className="flex-1 overflow-hidden">
                    {children}
                </div>
            </div>
        </div>
    );
};
