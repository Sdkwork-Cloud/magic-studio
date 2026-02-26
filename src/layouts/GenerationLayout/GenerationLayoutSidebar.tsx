
import { useRouter } from '@sdkwork/react-core'
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
    ChevronLeft, ChevronDown, Check, 
    Image as ImageIcon, Smile, Video, AudioWaveform, Music, Mic2, Volume2
} from 'lucide-react';
;
import { ROUTES } from '../../router/routes';
import { useTranslation } from '@sdkwork/react-i18n';

interface GenerationLayoutSidebarProps {
    className?: string;
    onBack?: () => void;
}

export const GenerationLayoutSidebar: React.FC<GenerationLayoutSidebarProps> = ({ className = '', onBack }) => {
    const { navigate, currentPath } = useRouter();
    const { t } = useTranslation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Debug: Log path changes
    React.useEffect(() => {
        console.log('[GenerationLayoutSidebar] currentPath changed:', currentPath);
    }, [currentPath]);

    const TOOLS = useMemo(() => [
        { id: 'video', labelKey: 'sidebar.video_workspace', route: ROUTES.VIDEO, icon: Video, color: 'text-pink-400', bgColor: 'bg-pink-500/10', borderColor: 'border-pink-500/20' },
        { id: 'image', labelKey: 'sidebar.image_gen_workspace', route: ROUTES.IMAGE, icon: ImageIcon, color: 'text-purple-400', bgColor: 'bg-purple-500/10', borderColor: 'border-purple-500/20' },
        { id: 'character', labelKey: 'sidebar.character_workspace', route: ROUTES.CHARACTER, icon: Smile, color: 'text-cyan-400', bgColor: 'bg-cyan-500/10', borderColor: 'border-cyan-500/20' },
        { id: 'sfx', labelKey: 'sidebar.sfx_workspace', route: ROUTES.SFX, icon: AudioWaveform, color: 'text-orange-400', bgColor: 'bg-orange-500/10', borderColor: 'border-orange-500/20' },
        { id: 'music', labelKey: 'sidebar.music_workspace', route: ROUTES.MUSIC, icon: Music, color: 'text-indigo-400', bgColor: 'bg-indigo-500/10', borderColor: 'border-indigo-500/20' },
        { id: 'voice', labelKey: 'sidebar.voice_workspace', route: ROUTES.VOICE, icon: Mic2, color: 'text-green-400', bgColor: 'bg-green-500/10', borderColor: 'border-green-500/20' },
        { id: 'audio', labelKey: 'sidebar.audio_workspace', route: ROUTES.AUDIO, icon: Volume2, color: 'text-teal-400', bgColor: 'bg-teal-500/10', borderColor: 'border-teal-500/20' },
    ], []);

    const currentTool = TOOLS.find(t => t.route === currentPath) || TOOLS[0];

    const CurrentIcon = currentTool.icon;

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        if (isMenuOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isMenuOpen]);

    const handleBack = () => {
        if (onBack) onBack();
        else navigate(ROUTES.HOME);
    };

    return (
        <div className={`w-16 flex-none bg-[#050505] border-r border-[#1a1a1a] flex flex-col h-full items-center py-4 z-20 ${className}`}>
            <button 
                onClick={handleBack}
                className="p-2 mb-4 text-gray-500 hover:text-white hover:bg-[#1a1a1c] rounded-xl transition-colors"
                title={t('actions.back')}
            >
                <ChevronLeft size={20} />
            </button>
            
            <div className="w-8 h-[1px] bg-[#1a1a1a] mb-4" />

            <div className="flex flex-col gap-2 w-full px-2">
                {TOOLS.map(tool => {
                    const ToolIcon = tool.icon;
                    const isActive = currentPath === tool.route;
                    return (
                        <button
                            key={tool.id}
                            onClick={() => navigate(tool.route)}
                            className={`
                                relative group w-full aspect-square rounded-xl flex items-center justify-center transition-all duration-200
                                ${isActive 
                                    ? `bg-[#1e1e20] text-white shadow-lg ring-1 ring-white/5` 
                                    : 'text-gray-500 hover:text-gray-300 hover:bg-[#1a1a1c]'
                                }
                            `}
                            title={t(tool.labelKey)}
                        >
                            <ToolIcon size={20} className={isActive ? tool.color : ''} />
                            
                            {isActive && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-white/50 rounded-r-full" />
                            )}

                            <div className="absolute left-full ml-3 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 border border-[#333]">
                                {t(tool.labelKey)}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
