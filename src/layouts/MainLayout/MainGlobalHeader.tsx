
import { WindowControls } from '@sdkwork/react-commons'
import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronRight, Home, Terminal, Code, Cpu, Settings, User,
  BookOpen, Bug, RefreshCw,
  Github, Rocket, Zap
} from 'lucide-react';
import { ROUTES } from '../../router/routes';
import { useAuthStore } from '@sdkwork/react-auth';
import { useWorkspaceStore, WorkspaceProjectSelector } from '@sdkwork/react-workspace';
import { useSettingsStore } from '@sdkwork/react-settings';
import { useTranslation } from '@sdkwork/react-i18n';
import { useRouter, platform } from '@sdkwork/react-core';
import { useEditorStore } from '@sdkwork/react-editor';
import { GitHubSyncModal } from '@sdkwork/react-editor';
import { PublishAppModal } from '@sdkwork/react-editor';

const MainGlobalHeader: React.FC = () => {
  const { currentPath } = useRouter();
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const { settings } = useSettingsStore();
  
  const { currentProject } = useWorkspaceStore();

  const { syncToGitHub, publishApp, rootPath } = useEditorStore();

  const [showDevMenu, setShowDevMenu] = useState(false);
  
  const [showGitModal, setShowGitModal] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  
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
      <div className="flex-none h-[40px] bg-white dark:bg-[#050505] border-b border-[#e4e4e7] dark:border-[#1a1a1a] flex items-center justify-between select-none z-[1000] transition-colors duration-200">
        
        {/* LEFT: Workspace / Project Context Switcher */}
        <div className="flex items-center h-full px-4">
          <WorkspaceProjectSelector 
            variant="dark"
            showDelete={true}
            defaultProjectType="APP"
          />
        </div>

        {/* CENTER: Draggable Region Space */}
        <div className="flex-1 h-full" data-tauri-drag-region />

        {/* RIGHT: Breadcrumbs & Controls */}
        <div className="flex items-center h-full">
           
           {/* Contextual Breadcrumbs */}
           <div className="flex items-center px-4 h-full gap-2 border-r border-gray-200 dark:border-[#1a1a1a] mr-0">
              <span className="text-[10px] text-gray-400 dark:text-gray-600 font-medium uppercase tracking-wider hidden md:block">{parent}</span>
              <ChevronRight size={10} className="text-gray-400 dark:text-gray-700 hidden md:block" />
              <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                  <Icon size={14} />
                  <span className="text-xs font-medium">{label}</span>
              </div>
           </div>

           {/* Project Actions (Git / Publish) - Only if project/folder open AND in Editor mode */}
           {rootPath && currentPath === ROUTES.EDITOR && (
               <div className="flex items-center gap-1 px-2 h-full border-r border-gray-200 dark:border-[#1a1a1a]">
                   <button 
                       onClick={() => setShowGitModal(true)}
                       className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-200 dark:hover:bg-[#2d2d2d] rounded transition-colors"
                       title={t('editor.explorer.git.title')}
                   >
                       <Github size={14} />
                   </button>
                   <button 
                       onClick={() => setShowPublishModal(true)}
                       className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-gray-200 dark:hover:bg-[#2d2d2d] rounded transition-colors"
                       title={t('editor.explorer.publish.title')}
                   >
                       <Rocket size={14} />
                   </button>
               </div>
           )}

           {/* Developer Tools Toggle */}
           {settings.general.developerMode && (
               <div className="h-full flex items-center border-r border-gray-200 dark:border-[#1a1a1a] px-0" ref={devRef}>
                   <div className="relative h-full">
                      <button 
                          onClick={() => setShowDevMenu(!showDevMenu)}
                          className={`h-full w-[46px] flex items-center justify-center text-gray-400 hover:bg-[#2d2d2d] hover:text-green-400 transition-colors focus:outline-none ${showDevMenu ? 'bg-[#2d2d2d] text-green-400' : ''}`}
                          title="Developer Tools"
                      >
                          <Bug size={14} />
                      </button>
                      
                      {showDevMenu && (
                          <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#1a1a1a] rounded-lg shadow-2xl py-1 z-[100] animate-in fade-in zoom-in-95 duration-75">
                              <div className="px-3 py-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Developer</div>
                              <button 
                                  onClick={() => { platform.restartApp(); setShowDevMenu(false); }}
                                  className="flex items-center gap-2 w-full px-3 py-2 text-xs text-left hover:bg-gray-100 dark:hover:bg-[#1a1a1c] transition-colors text-gray-700 dark:text-gray-200"
                              >
                                  <RefreshCw size={14} className="text-blue-500" /> Reload App
                              </button>
                              <button 
                                  onClick={() => { platform.toggleDevTools(); setShowDevMenu(false); }}
                                  className="flex items-center gap-2 w-full px-3 py-2 text-xs text-left hover:bg-gray-100 dark:hover:bg-[#1a1a1c] transition-colors text-gray-700 dark:text-gray-200"
                              >
                                  <Terminal size={14} className="text-green-500" /> Toggle DevTools
                              </button>
                          </div>
                      )}
                   </div>
               </div>
           )}

           {/* Window Controls */}
           <div className="h-full">
             <WindowControls />
           </div>
        </div>

        {/* Modals */}
        {showGitModal && (
            <GitHubSyncModal 
                onClose={() => setShowGitModal(false)}
                onSync={syncToGitHub}
            />
        )}
        
        {showPublishModal && (
            <PublishAppModal 
                onClose={() => setShowPublishModal(false)}
                onPublish={publishApp}
                initialName={currentProject ? currentProject.name : 'my-app'}
            />
        )}
      </div>
    </>
  );
};

export default MainGlobalHeader;
