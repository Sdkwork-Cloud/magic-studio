import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, LayoutGrid, Box, Check, Plus, Trash2, FolderOpen } from 'lucide-react';
import { useWorkspaceStore } from '../store/workspaceStore';
import { useTranslation } from '@sdkwork/react-i18n';
import { CreateWorkspaceModal } from './modals/CreateWorkspaceModal';
import { CreateProjectModal } from './modals/CreateProjectModal';
import { ProjectType } from '@sdkwork/react-commons';

export interface WorkspaceProjectSelectorProps {
    variant?: 'light' | 'dark' | 'portal';
    showDelete?: boolean;
    defaultProjectType?: ProjectType;
    onWorkspaceChange?: (workspace: any) => void;
    onProjectChange?: (project: any) => void;
    className?: string;
    compact?: boolean;
}

export const WorkspaceProjectSelector: React.FC<WorkspaceProjectSelectorProps> = ({
    variant = 'dark',
    showDelete = true,
    defaultProjectType = 'APP',
    onWorkspaceChange,
    onProjectChange,
    className = '',
    compact = false
}) => {
    const { t } = useTranslation();
    const {
        workspaces, currentWorkspace, currentProject,
        setCurrentWorkspace, setCurrentProject,
        removeWorkspace, removeProject
    } = useWorkspaceStore();

    const [showMenu, setShowMenu] = useState(false);
    const [selectedWorkspaceUuid, setSelectedWorkspaceUuid] = useState<string | null>(null);
    const [showCreateWsModal, setShowCreateWsModal] = useState(false);
    const [showCreateProjModal, setShowCreateProjModal] = useState(false);

    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (showMenu && currentWorkspace) {
            setSelectedWorkspaceUuid(currentWorkspace.uuid);
        }
    }, [showMenu, currentWorkspace]);

    const activeWorkspace = selectedWorkspaceUuid 
        ? workspaces.find(ws => ws.uuid === selectedWorkspaceUuid) 
        : currentWorkspace;

    const handleWorkspaceClick = (ws: any) => {
        setSelectedWorkspaceUuid(ws.uuid);
    };

    const handleProjectSelect = (p: any) => {
        if (activeWorkspace) {
            setCurrentWorkspace(activeWorkspace);
        }
        setCurrentProject(p);
        setShowMenu(false);
        onWorkspaceChange?.(activeWorkspace);
        onProjectChange?.(p);
    };

    const handleDeleteWorkspace = (e: React.MouseEvent, uuid: string) => {
        e.stopPropagation();
        if (confirm(t('common.actions.delete') + '?')) {
            removeWorkspace(uuid);
            if (selectedWorkspaceUuid === uuid) {
                setSelectedWorkspaceUuid(workspaces[0]?.uuid || null);
            }
        }
    };

    const handleDeleteProject = (e: React.MouseEvent, uuid: string) => {
        e.stopPropagation();
        if (confirm(t('common.actions.delete') + '?')) {
            removeProject(activeWorkspace?.uuid || '', uuid);
        }
    };

    const isPortal = variant === 'portal';

    const buttonStyles = isPortal
        ? 'flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-white/5 transition-colors group'
        : `flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-[#1a1a1c] px-2 py-1 rounded transition-colors group`;

    const menuStyles = isPortal
        ? 'absolute top-full left-0 mt-2 bg-[#151517] border border-white/10 rounded-xl shadow-2xl flex z-[1001] animate-in fade-in zoom-in-95 duration-100 overflow-hidden'
        : 'absolute top-full left-0 mt-1 bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#1a1a1a] rounded-lg shadow-2xl flex z-[1001] animate-in fade-in zoom-in-95 duration-75 overflow-hidden';

    const getDisplayText = () => {
        if (currentWorkspace && currentProject) {
            return `${currentWorkspace.name} / ${currentProject.name}`;
        }
        if (currentWorkspace) {
            return `${currentWorkspace.name} / ${t('header.select_project')}`;
        }
        return t('header.select_workspace');
    };

    return (
        <div className={`relative ${className}`} ref={menuRef}>
            <button
                onClick={() => setShowMenu(!showMenu)}
                className={buttonStyles}
            >
                <div className={`flex items-center gap-2 ${isPortal ? '' : ''}`}>
                    <div className={isPortal 
                        ? 'w-5 h-5 bg-gradient-to-br from-blue-600 to-indigo-600 rounded flex items-center justify-center text-white shadow-sm' 
                        : 'w-5 h-5 bg-gradient-to-br from-blue-600 to-indigo-600 rounded flex items-center justify-center text-white shadow-sm'
                    }>
                        <LayoutGrid size={compact ? 12 : 14} />
                    </div>
                    <span className={isPortal 
                        ? 'text-xs font-medium text-gray-300 max-w-[180px] truncate' 
                        : 'text-xs font-semibold text-gray-700 dark:text-gray-200 max-w-[200px] truncate'
                    }>
                        {getDisplayText()}
                    </span>
                </div>
                <ChevronDown size={compact ? 10 : 12} className={
                    isPortal 
                        ? 'text-gray-500 group-hover:text-white' 
                        : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300'
                } />
            </button>

            {showMenu && (
                <div className={menuStyles} style={{ width: '520px' }}>
                    <div className="flex h-[320px]">
                        {/* Left: Workspace List */}
                        <div className={`w-[180px] flex-none flex flex-col border-r ${isPortal ? 'border-white/5' : 'border-gray-200 dark:border-[#27272a]'}`}>
                            <div className={`px-3 py-2 text-[10px] font-bold uppercase tracking-wider flex items-center justify-between ${
                                isPortal 
                                    ? 'text-gray-500 bg-[#1a1a1c] border-b border-white/5' 
                                    : 'text-gray-500 bg-gray-50 dark:bg-[#1a1a1c] border-b border-gray-100 dark:border-[#27272a]'
                            }`}>
                                <span>{t('header.workspaces')}</span>
                                <span className={`text-[9px] px-1.5 py-0.5 rounded ${isPortal ? 'bg-white/5 text-gray-400' : 'bg-gray-200 dark:bg-[#27272a] text-gray-500'}`}>
                                    {workspaces.length}
                                </span>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-1">
                                {workspaces.length === 0 ? (
                                    <div className={`px-3 py-4 text-xs text-center ${isPortal ? 'text-gray-600' : 'text-gray-500'}`}>
                                        {t('header.no_workspaces')}
                                    </div>
                                ) : (
                                    workspaces.map(ws => (
                                        <button
                                            key={ws.uuid}
                                            onClick={() => handleWorkspaceClick(ws)}
                                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${
                                                selectedWorkspaceUuid === ws.uuid
                                                    ? isPortal 
                                                        ? 'bg-blue-600/10 text-blue-400' 
                                                        : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                                    : isPortal
                                                        ? 'text-gray-400 hover:bg-white/5 hover:text-white'
                                                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1a1a1c]'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden">
                                                <LayoutGrid size={14} className={`flex-none ${
                                                    selectedWorkspaceUuid === ws.uuid
                                                        ? isPortal ? 'text-blue-400' : 'text-blue-600 dark:text-blue-400'
                                                        : isPortal ? 'text-gray-500' : 'text-gray-400 dark:text-gray-500'
                                                }`} />
                                                <span className="truncate">{ws.name}</span>
                                            </div>
                                            <div className="flex items-center gap-1 flex-none">
                                                {selectedWorkspaceUuid === ws.uuid && (
                                                    <Check size={14} className={isPortal ? 'text-blue-400' : 'text-blue-600 dark:text-blue-400'} />
                                                )}
                                                {showDelete && (
                                                    <div
                                                        onClick={(e) => handleDeleteWorkspace(e, ws.uuid)}
                                                        className="hidden group-hover:block p-1 text-gray-400 hover:text-red-400"
                                                    >
                                                        <Trash2 size={12} />
                                                    </div>
                                                )}
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>

                            <div className={`p-1 border-t ${isPortal ? 'border-white/5 bg-[#1a1a1c]' : 'border-gray-100 dark:border-[#1a1a1a] bg-gray-50 dark:bg-[#1a1a1c]'}`}>
                                <button
                                    onClick={() => { setShowCreateWsModal(true); setShowMenu(false); }}
                                    className={`w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium rounded-md transition-colors border border-dashed ${
                                        isPortal 
                                            ? 'text-blue-400 hover:bg-white/5 border-blue-500/30 hover:border-blue-500/50'
                                            : 'text-blue-600 dark:text-blue-400 hover:bg-white dark:hover:bg-[#252526] border-blue-300 dark:border-blue-900'
                                    }`}
                                >
                                    <Plus size={14} /> {t('header.create_workspace')}
                                </button>
                            </div>
                        </div>

                        {/* Right: Project List */}
                        <div className="flex-1 min-w-0 flex flex-col">
                            <div className={`px-3 py-2 text-[10px] font-bold uppercase tracking-wider flex items-center justify-between ${
                                isPortal 
                                    ? 'text-gray-500 bg-[#1a1a1c] border-b border-white/5' 
                                    : 'text-gray-500 bg-gray-50 dark:bg-[#1a1a1c] border-b border-gray-100 dark:border-[#27272a]'
                            }`}>
                                <span>{t('header.projects')}</span>
                                {activeWorkspace && (
                                    <span className={`text-[9px] px-1.5 py-0.5 rounded ${isPortal ? 'bg-white/5 text-gray-400' : 'bg-gray-200 dark:bg-[#27272a] text-gray-500'}`}>
                                        {activeWorkspace.projects?.length || 0}
                                    </span>
                                )}
                            </div>
                            
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-1">
                                {!activeWorkspace ? (
                                    <div className={`px-3 py-4 text-xs text-center ${isPortal ? 'text-gray-600' : 'text-gray-500'}`}>
                                        <FolderOpen size={24} className="mx-auto mb-2 opacity-30" />
                                        {t('header.select_workspace_first')}
                                    </div>
                                ) : activeWorkspace.projects?.length === 0 ? (
                                    <div className={`px-3 py-4 text-xs text-center ${isPortal ? 'text-gray-600' : 'text-gray-500'}`}>
                                        <Box size={24} className="mx-auto mb-2 opacity-30" />
                                        {t('header.no_projects')}
                                    </div>
                                ) : (
                                    activeWorkspace.projects?.map(p => (
                                        <button
                                            key={p.uuid}
                                            onClick={() => handleProjectSelect(p)}
                                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${
                                                currentProject?.uuid === p.uuid && currentWorkspace?.uuid === activeWorkspace.uuid
                                                    ? isPortal 
                                                        ? 'bg-orange-600/10 text-orange-400' 
                                                        : 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400'
                                                    : isPortal
                                                        ? 'text-gray-400 hover:bg-white/5 hover:text-white'
                                                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1a1a1c]'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden">
                                                <Box size={14} className={`flex-none ${
                                                    currentProject?.uuid === p.uuid && currentWorkspace?.uuid === activeWorkspace.uuid
                                                        ? isPortal ? 'text-orange-400' : 'text-orange-500 dark:text-orange-400'
                                                        : isPortal ? 'text-gray-500' : 'text-gray-400 dark:text-gray-500'
                                                }`} />
                                                <span className="truncate">{p.name}</span>
                                            </div>
                                            <div className="flex items-center gap-1 flex-none">
                                                {currentProject?.uuid === p.uuid && currentWorkspace?.uuid === activeWorkspace.uuid && (
                                                    <Check size={14} className={isPortal ? 'text-orange-400' : 'text-orange-500 dark:text-orange-400'} />
                                                )}
                                                {showDelete && (
                                                    <div
                                                        onClick={(e) => handleDeleteProject(e, p.uuid)}
                                                        className="hidden group-hover:block p-1 text-gray-400 hover:text-red-400"
                                                    >
                                                        <Trash2 size={12} />
                                                    </div>
                                                )}
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>

                            <div className={`p-1 border-t ${isPortal ? 'border-white/5 bg-[#1a1a1c]' : 'border-gray-100 dark:border-[#1a1a1a] bg-gray-50 dark:bg-[#1a1a1c]'}`}>
                                <button
                                    onClick={() => { setShowCreateProjModal(true); }}
                                    disabled={!activeWorkspace}
                                    className={`w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium rounded-md transition-colors border border-dashed disabled:opacity-50 disabled:cursor-not-allowed ${
                                        isPortal 
                                            ? 'text-orange-400 hover:bg-white/5 border-orange-500/30 hover:border-orange-500/50'
                                            : 'text-orange-600 dark:text-orange-400 hover:bg-white dark:hover:bg-[#252526] border-orange-300 dark:border-orange-900'
                                    }`}
                                >
                                    <Plus size={14} /> {t('header.create_project')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <CreateWorkspaceModal
                isOpen={showCreateWsModal}
                onClose={() => setShowCreateWsModal(false)}
            />

            <CreateProjectModal
                isOpen={showCreateProjModal}
                onClose={() => setShowCreateProjModal(false)}
                initialType={defaultProjectType}
            />
        </div>
    );
};
