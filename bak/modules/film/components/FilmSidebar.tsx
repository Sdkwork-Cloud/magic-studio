
import React from 'react';
import { ProjectList } from './ProjectList';

export const FilmSidebar: React.FC = () => {
    return (
        <div className="w-full h-full flex flex-col bg-[#08080a]">
            {/* Sidebar Title */}
            <div className="p-4 border-b border-[#1a1a1a]">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                    Production List
                </span>
            </div>
            <ProjectList />
        </div>
    );
};
