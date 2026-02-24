
import React from 'react';
import { Film, Bell, Settings, User } from 'lucide-react';

export const FilmHeader: React.FC = () => {
    return (
        <header className="h-12 flex items-center justify-between px-4 bg-[#0a0a0a] border-b border-[#1a1a1a] shrink-0">
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                    <Film size={18} className="text-orange-500" />
                    <span className="text-sm font-bold text-white">Film Studio</span>
                </div>
            </div>
            
            <div className="flex items-center gap-2">
                <button className="p-2 text-gray-400 hover:text-white hover:bg-[#1a1a1a] rounded-lg transition-colors">
                    <Bell size={16} />
                </button>
                <button className="p-2 text-gray-400 hover:text-white hover:bg-[#1a1a1a] rounded-lg transition-colors">
                    <Settings size={16} />
                </button>
                <button className="p-2 text-gray-400 hover:text-white hover:bg-[#1a1a1a] rounded-lg transition-colors">
                    <User size={16} />
                </button>
            </div>
        </header>
    );
};
