
import { useRouter } from '@sdkwork/react-core'
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
    ChevronLeft, 
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

    const TOOLS = useMemo(() => [
        { id: 'video', labelKey: 'sidebar.video_workspace', route: ROUTES.VIDEO, icon: Video },
        { id: 'image', labelKey: 'sidebar.image_gen_workspace', route: ROUTES.IMAGE, icon: ImageIcon },
        { id: 'character', labelKey: 'sidebar.character_workspace', route: ROUTES.CHARACTER, icon: Smile },
        { id: 'sfx', labelKey: 'sidebar.sfx_workspace', route: ROUTES.SFX, icon: AudioWaveform },
        { id: 'music', labelKey: 'sidebar.music_workspace', route: ROUTES.MUSIC, icon: Music },
        { id: 'voice', labelKey: 'sidebar.voice_workspace', route: ROUTES.VOICE, icon: Mic2 },
        { id: 'audio', labelKey: 'sidebar.audio_workspace', route: ROUTES.AUDIO, icon: Volume2 },
    ], []);

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
        <div className={`app-sidebar-rail w-16 flex-none flex flex-col h-full items-center py-4 z-20 ${className}`}>
            <button 
                onClick={handleBack}
                className="app-sidebar-item p-2 mb-4 rounded-2xl transition-colors"
                title={t('actions.back')}
            >
                <ChevronLeft size={20} />
            </button>
            
            <div className="app-sidebar-divider w-8 h-px mb-4" />

            <div className="flex flex-col gap-2 w-full px-2">
                {TOOLS.map(tool => {
                    const ToolIcon = tool.icon;
                    const isActive = currentPath === tool.route;
                    return (
                        <button
                            key={tool.id}
                            onClick={() => navigate(tool.route)}
                            data-active={isActive}
                            className={`
                                app-sidebar-item relative group w-full aspect-square rounded-xl flex items-center justify-center transition-all duration-200
                            `}
                            title={t(tool.labelKey)}
                        >
                            <ToolIcon size={20} />
                            
                            {isActive && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary-500 rounded-r-full" />
                            )}

                            <div className="app-sidebar-tooltip absolute left-full ml-3 px-2 py-1 text-xs rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                                {t(tool.labelKey)}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
