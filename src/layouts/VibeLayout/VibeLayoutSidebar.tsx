
import { useRouter } from '@sdkwork/react-core'
import React from 'react';
import { 
    Home, Presentation, ChevronLeft, Layout 
} from 'lucide-react';
import { useTranslation } from '@sdkwork/react-i18n';
import { ROUTES } from '../../router/routes';

export const VibeLayoutSidebar: React.FC = () => {
    const { navigate, currentPath } = useRouter();
    const { t } = useTranslation();

    const TOOLS = [
        { id: 'home', route: ROUTES.HOME, icon: Home, label: t('sidebar.home') },
        { id: 'ppt', route: ROUTES.CHAT_PPT, icon: Presentation, label: t('sidebar.chat_ppt') },
        { id: 'canvas', route: ROUTES.CANVAS, icon: Layout, label: t('vibeLayout.tools.canvas') },
    ];

    return (
        <div className="app-sidebar-rail w-16 flex-none flex flex-col items-center py-4 z-20">
            {/* Back / Home Action */}
            <button 
                onClick={() => navigate(ROUTES.HOME)}
                className="app-sidebar-item p-3 mb-6 rounded-2xl transition-colors"
                title={t('common.actions.back_home')}
            >
                <ChevronLeft size={20} />
            </button>

            {/* Navigation Items */}
            <div className="flex flex-col gap-4 w-full px-2">
                {TOOLS.map(tool => {
                    const isActive = currentPath === tool.route;
                    const Icon = tool.icon;
                    
                    if (tool.id === 'home') return null; // Skip home in list as we have back button

                    return (
                        <button
                            key={tool.id}
                            onClick={() => navigate(tool.route)}
                            data-active={isActive}
                            className={`
                                app-sidebar-item relative group w-full aspect-square rounded-xl flex items-center justify-center transition-all duration-200
                            `}
                            title={tool.label}
                        >
                            <Icon size={20} />
                            
                            {/* Active Dot */}
                            {isActive && (
                                <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary-500 rounded-l-full" />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
