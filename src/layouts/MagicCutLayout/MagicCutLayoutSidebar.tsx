
import React from 'react';
import { 
    Film, Image as ImageIcon, Music, Type, Sticker, Sparkles, LayoutTemplate, 
    Import, Settings
} from 'lucide-react';
import { useTranslation } from '@sdkwork/react-i18n';

interface SidebarProps {
    onSelectTab: (tab: string) => void;
    activeTab: string;
}

export const MagicCutLayoutSidebar: React.FC<SidebarProps> = ({ onSelectTab, activeTab }) => {
    const { t } = useTranslation();

    const TABS = [
        { id: 'video', icon: Film, label: t('magicCut.resources.videos') },
        { id: 'image', icon: ImageIcon, label: t('magicCut.resources.images') },
        { id: 'audio', icon: Music, label: t('magicCut.resources.audio') },
        { id: 'text', icon: Type, label: t('magicCut.resources.text') },
        { id: 'stickers', icon: Sticker, label: t('magicCut.resources.stickers') },
        { id: 'effects', icon: Sparkles, label: t('magicCut.resources.effects') },
        { id: 'transitions', icon: LayoutTemplate, label: t('magicCut.resources.transitions') },
    ];

    return (
        <div className="w-16 h-full bg-[#050505] border-r border-[#1a1a1a] flex flex-col items-center py-4 select-none z-20">
            <div className="flex flex-col w-full gap-2 px-2">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => onSelectTab(tab.id)}
                        className={`
                            flex flex-col items-center justify-center gap-1 w-full aspect-square rounded-xl transition-all
                            ${activeTab === tab.id 
                                ? 'bg-[#1e1e20] text-red-500 shadow-sm' 
                                : 'text-gray-500 hover:text-gray-300 hover:bg-[#1a1a1c]'
                            }
                        `}
                    >
                        <tab.icon size={20} strokeWidth={1.5} />
                        <span className="text-[9px] font-medium">{tab.label}</span>
                    </button>
                ))}
            </div>

            <div className="mt-auto flex flex-col gap-2 w-full px-2">
                 <button className="flex flex-col items-center justify-center gap-1 w-full aspect-square rounded-xl text-gray-500 hover:text-gray-300 hover:bg-[#1a1a1c] transition-all">
                    <Import size={20} strokeWidth={1.5} />
                    <span className="text-[9px] font-medium">{t('magicCut.resources.import')}</span>
                </button>
                 <button className="flex flex-col items-center justify-center gap-1 w-full aspect-square rounded-xl text-gray-500 hover:text-gray-300 hover:bg-[#1a1a1c] transition-all">
                    <Settings size={20} strokeWidth={1.5} />
                    <span className="text-[9px] font-medium">{t('sidebar.settings')}</span>
                </button>
            </div>
        </div>
    );
};
