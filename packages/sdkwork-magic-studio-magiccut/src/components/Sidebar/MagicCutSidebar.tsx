
import React, { memo } from 'react';
import { 
    Film, Image as ImageIcon, Music, Type, Sparkles, LayoutTemplate, Box
} from 'lucide-react';

interface SidebarProps {
    onSelectTab: (tab: string) => void;
    activeTab: string;
}

const TABS_CONFIG = [
    { id: 'video', icon: Film, label: 'Video' },
    { id: 'image', icon: ImageIcon, label: 'Image' },
    { id: 'text', icon: Type, label: 'Text' },
    { id: 'audio', icon: Music, label: 'Audio' },
    { id: 'music', icon: Music, label: 'Music' },
    { id: 'effects', icon: Sparkles, label: 'Effects' },
    { id: 'transitions', icon: LayoutTemplate, label: 'Trans' },
    { id: 'templates', icon: Box, label: 'Templates' }, 
] as const;

export const MagicCutSidebar: React.FC<SidebarProps> = memo(({ onSelectTab, activeTab }) => {
    return (
        <div className="w-[72px] h-full bg-[#050505] border-r border-white/5 flex flex-col items-center py-4 select-none z-20">
            <div className="flex flex-col w-full gap-3 px-3">
                {TABS_CONFIG.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => onSelectTab(tab.id)}
                        className={`
                            group flex flex-col items-center justify-center gap-1 w-full aspect-square rounded-xl transition-all duration-200
                            ${activeTab === tab.id 
                                ? 'bg-[#1a1a1a] text-white shadow-lg ring-1 ring-white/10' 
                                : 'text-gray-500 hover:text-gray-300 hover:bg-[#1a1a1a]/50'
                            }
                        `}
                    >
                        <tab.icon 
                            size={20} 
                            strokeWidth={activeTab === tab.id ? 2 : 1.5} 
                            className={`transition-colors ${activeTab === tab.id ? 'text-red-500' : 'group-hover:text-gray-300'}`}
                        />
                        <span className="text-[9px] font-medium tracking-wide">{tab.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
});

