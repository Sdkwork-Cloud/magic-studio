
import { WindowControls } from 'sdkwork-react-commons'
import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronRight, Home, Terminal, Code, Cpu, Settings, User,
  ChevronDown, Box, LayoutGrid, Check, Trash2, Plus, BookOpen, Bug, RefreshCw,
  Github, Rocket, Zap
} from 'lucide-react';
;
import { ROUTES } from '../../router/routes';
;
import { useAuthStore } from 'sdkwork-react-auth';
import { useWorkspaceStore } from 'sdkwork-react-workspace';
import { useSettingsStore } from 'sdkwork-react-settings';
import { useTranslation } from 'sdkwork-react-i18n';
import { useRouter, platform } from 'sdkwork-react-core';
import { useEditorStore } from 'sdkwork-react-editor';
import { GitHubSyncModal } from 'sdkwork-react-editor';
import { PublishAppModal } from 'sdkwork-react-editor';
import { CreateWorkspaceModal } from 'sdkwork-react-workspace';
import { CreateProjectModal } from 'sdkwork-react-workspace';

const MainGlobalHeader: React.FC = () => {
  const { currentPath } = useRouter();
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const { settings } = useSettingsStore();
  
  const { 
    workspaces, currentWorkspace, currentProject, 
    setCurrentWorkspace, setCurrentProject,
    removeWorkspace, removeProject 
  } = useWorkspaceStore();

  const { syncToGitHub, publishApp, rootPath } = useEditorStore();

  const [showWsMenu, setShowWsMenu] = useState(false);
  const [showProjMenu, setShowProjMenu] = useState(false);
  const [showDevMenu, setShowDevMenu] = useState(false);
  
  // Modal States
  const [showGitModal, setShowGitModal] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showCreateWsModal, setShowCreateWsModal] = useState(false);
  const [showCreateProjModal, setShowCreateProjModal] = useState(false);
  
  const wsRef = useRef<HTMLDivElement>(null);
  const projRef = useRef<HTMLDivElement>(null);
  const devRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wsRef.current && !wsRef.current.contains(event.target as Node)) setShowWsMenu(false);
      if (projRef.current && !projRef.current.contains(event.target as Node)) setShowProjMenu(false);
      if (devRef.current && !devRef.current.contains(event.target as Node)) setShowDevMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCreateWorkspace = () => {
    setShowCreateWsModal(true);
    setShowWsMenu(false);
  };

  const handleCreateProject = () => {
    setShowCreateProjModal(true);
    setShowProjMenu(false);
  };

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
        <div className="flex items-center h-full px-4 gap-3 relative z-50">
          
          {/* 1. Workspace Selector */}
          <div className="relative" ref={wsRef}>
            <button 
              onClick={() => setShowWsMenu(!showWsMenu)}
              className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-[#1a1a1c] px-2 py-1 rounded transition-colors group"
            >
              <div className="w-5 h-5 bg-gradient-to-br from-blue-600 to-indigo-600 rounded flex items-center justify-center text-white shadow-sm">
                 <LayoutGrid size={12} />
              </div>
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 max-w-[120px] truncate">
                {currentWorkspace ? currentWorkspace.name : t('header.select_workspace')}
              </span>
              <ChevronDown size={12} className="text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
            </button>

            {/* Dropdown */}
            {showWsMenu && (
              <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#1a1a1a] rounded-lg shadow-2xl flex flex-col z-[1001] animate-in fade-in zoom-in-95 duration-75 overflow-hidden">
                 <div className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider bg-gray-50 dark:bg-[#1a1a1c] border-b border-gray-100 dark:border-[#27272a]">
                     {t('header.workspaces')}
                 </div>
                 
                 {/* Scrollable List */}
                 <div className="max-h-[240px] overflow-y-auto custom-scrollbar p-1">
                     {workspaces.map(ws => (
                       <button 
                          key={ws.uuid} 
                          className="w-full group flex items-center justify-between px-2 py-1.5 hover:bg-blue-50 dark:hover:bg-[#1a1a1c] rounded cursor-pointer text-left transition-colors" 
                          onClick={() => { setCurrentWorkspace(ws); setShowWsMenu(false); }}
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                             <LayoutGrid size={14} className={currentWorkspace?.uuid === ws.uuid ? 'text-blue-600 dark:text-white' : 'text-gray-400 dark:text-gray-500'} />
                             <span className={`text-sm truncate ${currentWorkspace?.uuid === ws.uuid ? 'text-blue-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>{ws.name}</span>
                          </div>
                          {currentWorkspace?.uuid === ws.uuid && <Check size={14} className="text-blue-600 dark:text-white flex-shrink-0" />}
                          <div 
                            onClick={(e) => { e.stopPropagation(); if(confirm(t('common.actions.delete') + '?')) removeWorkspace(ws.uuid); }}
                            className="hidden group-hover:block p-1 text-gray-400 hover:text-red-400"
                          >
                            <Trash2 size={12} />
                          </div>
                       </button>
                     ))}
                 </div>
                 
                 {/* Fixed Bottom Action */}
                 <div className="p-1 border-t border-gray-100 dark:border-[#1a1a1a] bg-gray-50 dark:bg-[#1a1a1c]">
                     <button 
                        onClick={handleCreateWorkspace} 
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-white dark:hover:bg-[#252526] rounded-md transition-colors border border-dashed border-blue-300 dark:border-blue-900"
                     >
                        <Plus size={14} /> {t('header.create_workspace')}
                     </button>
                 </div>
              </div>
            )}
          </div>

          <div className="text-gray-300 dark:text-gray-600">/</div>

          {/* 2. Project Selector */}
          <div className="relative" ref={projRef}>
            <button 
              onClick={() => setShowProjMenu(!showProjMenu)}
              disabled={!currentWorkspace}
              className={`flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-[#1a1a1c] px-2 py-1 rounded transition-colors group ${!currentWorkspace ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
               <Box size={14} className="text-orange-500 dark:text-orange-400" />
               <span className="text-xs font-medium text-gray-600 dark:text-gray-300 max-w-[150px] truncate">
                  {currentProject ? currentProject.name : t('header.select_project')}
               </span>
               <ChevronDown size={12} className="text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
            </button>

             {/* Dropdown */}
             {showProjMenu && currentWorkspace && (
              <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#1a1a1a] rounded-lg shadow-2xl flex flex-col z-[1001] animate-in fade-in zoom-in-95 duration-75 overflow-hidden">
                 <div className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider bg-gray-50 dark:bg-[#1a1a1c] border-b border-gray-100 dark:border-[#27272a]">
                     {t('header.projects_in', { workspace: currentWorkspace.name })}
                 </div>
                 
                 <div className="max-h-[240px] overflow-y-auto custom-scrollbar p-1">
                     {currentWorkspace.projects.length === 0 ? (
                       <div className="px-4 py-3 text-xs text-gray-500 italic text-center">{t('header.no_projects')}</div>
                     ) : (
                       currentWorkspace.projects.map(p => (
                          <button 
                              key={p.uuid} 
                              className="w-full group flex items-center justify-between px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-[#1a1a1c] rounded cursor-pointer text-left transition-colors" 
                              onClick={() => { setCurrentProject(p); setShowProjMenu(false); }}
                          >
                              <div className="flex items-center gap-2 overflow-hidden">
                                <Box size={14} className={currentProject?.uuid === p.uuid ? 'text-orange-500 dark:text-orange-400' : 'text-gray-400 dark:text-gray-500'} />
                                <span className={`text-sm truncate ${currentProject?.uuid === p.uuid ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>{p.name}</span>
                              </div>
                              {currentProject?.uuid === p.uuid && <Check size={14} className="text-blue-600 dark:text-white flex-shrink-0" />}
                               <div 
                                  onClick={(e) => { e.stopPropagation(); if(confirm(t('common.actions.delete') + '?')) removeProject(p.uuid); }}
                                  className="hidden group-hover:block p-1 text-gray-400 hover:text-red-400"
                                >
                                  <Trash2 size={12} />
                                </div>
                          </button>
                       ))
                     )}
                 </div>
                 
                 {/* Fixed Bottom Action */}
                 <div className="p-1 border-t border-gray-100 dark:border-[#1a1a1a] bg-gray-50 dark:bg-[#1a1a1c]">
                     <button 
                        onClick={handleCreateProject} 
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-white dark:hover:bg-[#252526] rounded-md transition-colors border border-dashed border-blue-300 dark:border-blue-900"
                     >
                        <Plus size={14} /> {t('header.create_project')}
                     </button>
                 </div>
              </div>
            )}
          </div>

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

        <CreateWorkspaceModal 
            isOpen={showCreateWsModal}
            onClose={() => setShowCreateWsModal(false)}
        />
        
        <CreateProjectModal 
            isOpen={showCreateProjModal}
            onClose={() => setShowCreateProjModal(false)}
        />
      </div>
    </>
  );
};

export default MainGlobalHeader;
