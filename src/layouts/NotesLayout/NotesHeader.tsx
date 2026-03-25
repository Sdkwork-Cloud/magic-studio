
import { useRouter } from '@sdkwork/react-core'
import React from 'react';
import { ChevronLeft, BookOpen, Settings } from 'lucide-react';
import { ROUTES } from '../../router/routes';
import { useTranslation } from '@sdkwork/react-i18n';
import { WorkspaceProjectSelector } from '@sdkwork/react-workspace';

export const NotesHeader: React.FC = () => {
    const { navigate } = useRouter();
    const { t } = useTranslation();

    return (
        <div className="h-14 bg-[#09090b] border-b border-[#27272a] flex items-center justify-between px-4 select-none shrink-0 z-50">
            {/* Left: Navigation & Brand */}
            <div className="flex items-center gap-4">
                <button 
                    onClick={() => navigate(ROUTES.HOME)}
                    className="p-2 text-gray-500 hover:text-white hover:bg-[#27272a] rounded-lg transition-colors group"
                    title={t('header.home')}
                >
                    <ChevronLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
                </button>
                
                <div className="h-6 w-px bg-[#27272a]" />

                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-orange-900/20 ring-1 ring-white/10">
                        <BookOpen size={16} fill="currentColor" />
                    </div>
                    <div>
                        <h1 className="font-bold text-sm text-white leading-none tracking-tight">{t('notes.header.title')}</h1>
                        <span className="text-[10px] text-gray-500 font-medium">{t('notes.header.subtitle')}</span>
                    </div>
                </div>
            </div>

            {/* Center: Workspace / Project Selector */}
            <WorkspaceProjectSelector 
                variant="portal"
                showDelete={false}
                defaultProjectType="APP"
                compact={true}
            />

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
                <button 
                    className="p-2 text-gray-500 hover:text-white hover:bg-[#27272a] rounded-lg transition-colors"
                    title={t('sidebar.settings')}
                    onClick={() => navigate(ROUTES.SETTINGS)}
                >
                    <Settings size={18} />
                </button>
            </div>
        </div>
    );
};
