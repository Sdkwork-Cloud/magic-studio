
import { WindowControls } from '@sdkwork/react-commons'
import React, { Suspense, lazy, useState, useRef, useEffect } from 'react';
import {
  ChevronRight, Home, Terminal, Code, Settings, User,
  BookOpen, Bug, RefreshCw, Zap
} from 'lucide-react';
import { ROUTES } from '../../router/routes';
import { useAuthStore } from '@sdkwork/react-auth';
import { useWorkspaceStore, WorkspaceProjectSelector } from '@sdkwork/react-workspace';
import { useSettingsStore } from '@sdkwork/react-settings';
import { useTranslation } from '@sdkwork/react-i18n';
import { useRouter, platform } from '@sdkwork/react-core';

const EditorProjectActions = lazy(() => import('./EditorProjectActions'));

const MainGlobalHeader: React.FC = () => {
  const { currentPath } = useRouter();
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const { settings } = useSettingsStore();
  
  const { currentProject } = useWorkspaceStore();

  const [showDevMenu, setShowDevMenu] = useState(false);

  const devRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (devRef.current && !devRef.current.contains(event.target as Node)) setShowDevMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getBreadcrumbs = () => {
    switch (currentPath) {
      case ROUTES.HOME: return { icon: Terminal, label: t('sidebar.terminal'), parent: t('header.breadcrumbs.tools') };
      case ROUTES.EDITOR: return { icon: Code, label: t('sidebar.editor'), parent: t('header.breadcrumbs.development') };
      case ROUTES.NOTES: return { icon: BookOpen, label: t('sidebar.notes'), parent: t('header.breadcrumbs.tools') };
      case ROUTES.SETTINGS: return { icon: Settings, label: t('sidebar.settings'), parent: t('header.breadcrumbs.system') };
      case ROUTES.PROFILE: return { icon: User, label: user?.username || t('sidebar.account'), parent: t('header.breadcrumbs.user') };
      case ROUTES.VIP: return { icon: Zap, label: t('header.pro_plans'), parent: t('header.breadcrumbs.user') };
      default: return { icon: Home, label: t('header.home'), parent: t('header.breadcrumbs.app') };
    }
  };

  const { icon: Icon, label, parent } = getBreadcrumbs();

  return (
    <>
      <div className="app-header-glass desktop-shell-header flex-none h-12 flex items-center justify-between select-none z-[1000] transition-colors duration-200">
        
        {/* LEFT: Workspace / Project Context Switcher */}
        <div className="flex items-center h-full px-3 sm:px-4" data-tauri-drag-region>
          <WorkspaceProjectSelector 
            variant="portal"
            showDelete={true}
            defaultProjectType="APP"
          />
        </div>

        {/* CENTER: Draggable Region Space */}
        <div className="flex-1 h-full" data-tauri-drag-region />

        {/* RIGHT: Breadcrumbs & Controls */}
        <div className="flex items-center h-full" data-tauri-drag-region="false">
           
           {/* Contextual Breadcrumbs */}
           <div className="flex items-center px-4 h-full gap-2 border-r border-[var(--border-color)] mr-0">
              <span className="text-[10px] text-[var(--text-muted)] font-semibold uppercase tracking-[0.16em] hidden md:block">{parent}</span>
              <ChevronRight size={10} className="text-[var(--text-muted)] hidden md:block" />
              <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
                  <Icon size={14} />
                  <span className="text-xs font-medium">{label}</span>
              </div>
           </div>

           {currentPath === ROUTES.EDITOR && (
              <Suspense fallback={null}>
                <EditorProjectActions projectName={currentProject?.name} />
              </Suspense>
           )}

           {/* Debug Menu Toggle */}
           {settings.general.developerMode && (
               <div className="h-full flex items-center border-r border-[var(--border-color)] px-0" ref={devRef}>
                   <div className="relative h-full">
                      <button 
                          onClick={() => setShowDevMenu(!showDevMenu)}
                          className={`app-header-action h-full w-[46px] flex items-center justify-center transition-colors focus:outline-none ${showDevMenu ? 'bg-[color-mix(in_srgb,var(--text-primary)_10%,transparent)] text-primary-500' : ''}`}
                          title={t('header.developer_tools')}
                      >
                          <Bug size={14} />
                      </button>
                      
                      {showDevMenu && (
                          <div className="app-floating-panel absolute right-0 top-full mt-2 w-48 rounded-2xl py-1 z-[100] animate-in fade-in zoom-in-95 duration-75">
                              <div className="px-3 py-1.5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.16em]">{t('header.developer_menu')}</div>
                              <button 
                                  onClick={() => { platform.restartApp(); setShowDevMenu(false); }}
                                  className="flex items-center gap-2 w-full px-3 py-2 text-xs text-left rounded-xl hover:bg-[color-mix(in_srgb,var(--text-primary)_6%,transparent)] transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                              >
                                  <RefreshCw size={14} className="text-primary-500" /> {t('header.reload_app')}
                              </button>
                              <button 
                                  onClick={() => { platform.toggleDevTools(); setShowDevMenu(false); }}
                                  className="flex items-center gap-2 w-full px-3 py-2 text-xs text-left rounded-xl hover:bg-[color-mix(in_srgb,var(--text-primary)_6%,transparent)] transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                              >
                                  <Terminal size={14} className="text-primary-500" /> {t('header.toggle_devtools')}
                              </button>
                          </div>
                      )}
                   </div>
               </div>
           )}

           {/* Window Controls */}
           <div className="h-full border-l border-[var(--border-color)]">
             <WindowControls />
           </div>
        </div>

      </div>
    </>
  );
};

export default MainGlobalHeader;
