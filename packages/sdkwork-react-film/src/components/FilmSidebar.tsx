
import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { useRouter, ROUTES } from '@sdkwork/react-core';
import { ProjectList } from './ProjectList';

export const FilmSidebar: React.FC = () => {
    const { navigate } = useRouter();
    
    return (
        <div className="w-[260px] h-full flex flex-col bg-[#08080a] shrink-0">
            {/* Sidebar Header with Back Button */}
            <div className="p-4 border-b border-[#1a1a1a]">
                <button 
                    onClick={() => navigate(ROUTES.HOME)}
                    className="flex items-center gap-2 px-2 py-1.5 text-gray-400 hover:text-white hover:bg-[#1a1a1a] rounded-lg transition-colors w-full"
                    title="Back to Home"
                >
                    <ChevronLeft size={16} />
                    <span className="text-xs font-medium">Back to Home</span>
                </button>
            </div>
            {/* Sidebar Title */}
            <div className="px-4 py-3 border-b border-[#1a1a1a]">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                    Production List
                </span>
            </div>
            <ProjectList />
        </div>
    );
};
