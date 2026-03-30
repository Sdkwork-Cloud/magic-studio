import React, { useState, useRef, useEffect } from 'react';
import {
    ChevronLeft, Scissors, Share2, Save, ChevronDown, FileJson
} from 'lucide-react';
import { WindowControls } from '@sdkwork/react-commons';
import { ROUTES } from '../../router/routes';
import { WorkspaceProjectSelector } from '@sdkwork/react-workspace';
import { useTranslation } from '@sdkwork/react-i18n';
import { useMagicCutStore } from '@sdkwork/react-magiccut';
import { useRouter, platform } from '@sdkwork/react-core';

export const MagicCutLayoutHeader: React.FC = () => {
    const { navigate, currentQuery } = useRouter();
    const { t } = useTranslation();
    const isDesktopRuntime = platform.getPlatform() === 'desktop';
    const { project } = useMagicCutStore();
    const searchParams = new URLSearchParams(currentQuery);
    const fromSource = searchParams.get('from');
    const backRoute = fromSource === 'canvas' ? ROUTES.CANVAS : ROUTES.PORTAL;
    const backLabel = fromSource === 'canvas'
        ? t('magicCut.header.back.canvas')
        : t('magicCut.header.back.portal');

    const [showExportMenu, setShowExportMenu] = useState(false);
    const exportRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (exportRef.current && !exportRef.current.contains(event.target as Node)) setShowExportMenu(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleExportJson = async () => {
        if (!project) return;
        try {
            const json = JSON.stringify(project, null, 2);
            const filename = `${project.name.replace(/\s+/g, '_')}_project.json`;
            await platform.saveFile(json, filename);
            setShowExportMenu(false);
        } catch (e) {
            console.error("Export JSON failed", e);
        }
    };

    return (
        <>
            <div className="app-header-glass h-14 flex items-center justify-between pl-4 pr-0 z-[1000] select-none shrink-0 relative overflow-hidden">
                {isDesktopRuntime && (
                    <div className="absolute inset-0 z-0" data-tauri-drag-region />
                )}

                {/* Left: Navigation & Branding */}
                <div className="relative z-10 flex items-center gap-4">
                    <button 
                        onClick={() => navigate(backRoute)}
                        className="app-header-action p-2 rounded-2xl transition-colors group flex items-center gap-2"
                        title={t('magicCut.header.backTo', { target: backLabel })}
                    >
                        <ChevronLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
                        <span className="text-xs font-bold hidden md:inline">{backLabel}</span>
                    </button>
                    
                    <div className="h-6 w-px bg-[var(--border-color)]" />

                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center text-white shadow-lg ring-1 ring-white/10">
                            <Scissors size={16} />
                        </div>
                        <div className="hidden md:block">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-[var(--text-primary)] tracking-tight">{t('magicCut.header.brand')}</span>
                                <span className="app-status-pill text-[9px]" data-tone="primary">{t('magicCut.header.beta')}</span>
                            </div>
                            <span className="text-[10px] text-[var(--text-muted)] font-medium">{t('magicCut.header.subtitle')}</span>
                        </div>
                    </div>
                </div>

                {/* Center: Context Switcher */}
                <div className="absolute inset-y-0 left-1/2 z-10 hidden -translate-x-1/2 items-center lg:flex">
                    <WorkspaceProjectSelector 
                        variant="portal"
                        showDelete={false}
                        defaultProjectType="VIDEO"
                        compact={true}
                    />
                </div>

                {/* Right: Actions */}
                <div className="relative z-10 flex h-full items-center gap-3 pl-4">
                    <div className="hidden md:flex items-center text-xs text-[var(--text-muted)] gap-2 mr-2">
                        <span className="app-status-dot animate-pulse" data-tone="success" />
                        {t('magicCut.header.saved')}
                    </div>
                    
                    <button className="app-header-action h-8 px-3 text-xs font-medium rounded-xl transition-colors flex items-center gap-2 border border-[var(--border-color)]">
                        <Share2 size={14} />
                        <span className="hidden sm:inline">{t('magicCut.header.share')}</span>
                    </button>
                    
                    <div className="relative" ref={exportRef}>
                        <button 
                            onClick={() => setShowExportMenu(!showExportMenu)}
                            className="flex h-8 items-center gap-2 rounded-xl bg-[var(--text-primary)] px-4 text-xs font-bold text-[var(--bg-panel-strong)] shadow-lg transition-colors hover:bg-primary-600 hover:text-white"
                        >
                            <Save size={14} />
                            <span>{t('magicCut.header.export')}</span>
                            <ChevronDown size={10} />
                        </button>
                        
                        {showExportMenu && (
                            <div className="app-floating-panel absolute top-full right-0 mt-2 w-48 rounded-2xl flex flex-col z-[1001] animate-in fade-in zoom-in-95 duration-100 overflow-hidden p-1">
                                <button 
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[color-mix(in_srgb,var(--text-primary)_6%,transparent)] rounded-xl transition-colors text-left"
                                    onClick={() => {}}
                                >
                                    <Save size={14} /> {t('magicCut.header.exportVideo')}
                                </button>
                                <button 
                                    onClick={handleExportJson}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[color-mix(in_srgb,var(--text-primary)_6%,transparent)] rounded-xl transition-colors text-left"
                                >
                                    <FileJson size={14} /> {t('magicCut.header.exportJsonProject')}
                                </button>
                            </div>
                        )}
                    </div>

                    {isDesktopRuntime && (
                        <div className="ml-2 h-full overflow-hidden border-l border-[var(--border-color)]">
                            <WindowControls />
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};
