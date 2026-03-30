
import { useRouter } from '@sdkwork/react-core'
import React from 'react';
import { useTranslation } from '@sdkwork/react-i18n';
import { 
    Scissors, Layout, BookOpen, ChevronLeft, FolderOpen, HardDrive
} from 'lucide-react';
;
import { ROUTES } from '../../router/routes';

interface CreationLayoutSidebarProps {
    className?: string;
}

export const CreationLayoutSidebar: React.FC<CreationLayoutSidebarProps> = ({ className = '' }) => {
    const { navigate, currentPath } = useRouter();
    const { t } = useTranslation();

    const TOOLS = [
        { id: 'magic-cut', label: t('sidebar.magic_cut'), route: ROUTES.MAGIC_CUT, icon: Scissors },
        { id: 'canvas', label: t('market.nav.canvas'), route: ROUTES.CANVAS, icon: Layout },
        { id: 'notes', label: t('sidebar.notes'), route: ROUTES.NOTES, icon: BookOpen },
        { id: 'assets', label: t('sidebar.assets'), route: ROUTES.ASSETS, icon: FolderOpen },
        { id: 'drive', label: t('sidebar.drive'), route: ROUTES.DRIVE, icon: HardDrive },
    ];

    return (
        <div className={`app-sidebar-rail w-16 flex-none flex flex-col h-full items-center py-4 z-20 ${className}`}>
            {/* Back Button */}
            <button 
                onClick={() => navigate(ROUTES.HOME)}
                className="app-sidebar-item p-2 mb-4 rounded-2xl transition-colors"
                title={t('common.actions.back_home')}
            >
                <ChevronLeft size={20} />
            </button>
            
            <div className="app-sidebar-divider w-8 h-px mb-4" />

            {/* Icons List */}
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
                            title={tool.label}
                        >
                            <ToolIcon size={20} />
                            
                            {/* Active Indicator */}
                            {isActive && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary-500 rounded-r-full" />
                            )}

                            {/* Tooltip */}
                            <div className="app-sidebar-tooltip absolute left-full ml-3 px-2 py-1 text-xs rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                                {tool.label}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
