import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, LayoutGrid, Box, Check, Plus, Trash2, FolderOpen } from 'lucide-react';
import { useWorkspaceStore } from '../store/workspaceStore';
import { useTranslation } from '@sdkwork/react-i18n';
import { CreateWorkspaceModal } from './modals/CreateWorkspaceModal';
import { CreateProjectModal } from './modals/CreateProjectModal';
import { ProjectType, StudioProject, StudioWorkspace } from '@sdkwork/react-commons';

export interface WorkspaceProjectSelectorProps {
    variant?: 'light' | 'dark' | 'portal';
    showDelete?: boolean;
    defaultProjectType?: ProjectType;
    onWorkspaceChange?: (workspace: StudioWorkspace | null) => void;
    onProjectChange?: (project: StudioProject) => void;
    className?: string;
    compact?: boolean;
}

interface EmptyPanelProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    isPortal: boolean;
    action?: React.ReactNode;
}

const EmptyPanel: React.FC<EmptyPanelProps> = ({
    icon,
    title,
    description,
    isPortal,
    action
}) => (
    <div
        className={`h-full rounded-xl border border-dashed px-4 py-5 flex items-center justify-center text-center ${
            isPortal
                ? 'border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent'
                : 'border-gray-200 dark:border-[#313135] bg-gradient-to-b from-gray-50 to-white dark:from-[#18181a] dark:to-[#131315]'
        }`}
    >
        <div className="max-w-[220px]">
            <div
                className={`mx-auto mb-3 w-11 h-11 rounded-xl flex items-center justify-center ${
                    isPortal ? 'bg-white/10 text-gray-300' : 'bg-gray-100 dark:bg-[#232326] text-gray-500 dark:text-gray-300'
                }`}
            >
                {icon}
            </div>
            <h4 className={`text-xs font-semibold ${isPortal ? 'text-gray-200' : 'text-gray-800 dark:text-gray-100'}`}>{title}</h4>
            <p className={`mt-1 text-[11px] leading-5 ${isPortal ? 'text-gray-500' : 'text-gray-500 dark:text-gray-400'}`}>{description}</p>
            {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
        </div>
    </div>
);

export const WorkspaceProjectSelector: React.FC<WorkspaceProjectSelectorProps> = ({
    variant = 'dark',
    showDelete = true,
    defaultProjectType = 'APP',
    onWorkspaceChange,
    onProjectChange,
    className = '',
    compact = false
}) => {
    const MENU_WIDTH = 560;
    const MENU_HEIGHT = 340;
    const VIEWPORT_PADDING = 12;
    const MENU_OFFSET = 8;

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
    const [menuRect, setMenuRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null);

    const triggerRef = useRef<HTMLButtonElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);

    const updateMenuRect = useCallback(() => {
        if (!showMenu || !triggerRef.current || typeof window === 'undefined') {
            return;
        }

        const triggerRect = triggerRef.current.getBoundingClientRect();
        const viewportW = window.innerWidth;
        const viewportH = window.innerHeight;

        const width = Math.min(MENU_WIDTH, viewportW - VIEWPORT_PADDING * 2);
        const spaceBelow = viewportH - triggerRect.bottom - MENU_OFFSET - VIEWPORT_PADDING;
        const spaceAbove = triggerRect.top - MENU_OFFSET - VIEWPORT_PADDING;
        const shouldOpenUp = spaceBelow < Math.min(MENU_HEIGHT, 260) && spaceAbove > spaceBelow;
        const preferredHeight = shouldOpenUp ? spaceAbove : spaceBelow;
        const height = Math.min(MENU_HEIGHT, Math.max(120, preferredHeight));

        let left = triggerRect.left;
        let top = shouldOpenUp
            ? triggerRect.top - MENU_OFFSET - height
            : triggerRect.bottom + MENU_OFFSET;

        left = Math.min(
            Math.max(left, VIEWPORT_PADDING),
            Math.max(VIEWPORT_PADDING, viewportW - width - VIEWPORT_PADDING),
        );
        top = Math.min(
            Math.max(top, VIEWPORT_PADDING),
            Math.max(VIEWPORT_PADDING, viewportH - height - VIEWPORT_PADDING),
        );

        setMenuRect({ top, left, width, height });
    }, [showMenu]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            if (panelRef.current?.contains(target) || triggerRef.current?.contains(target)) {
                return;
            }
            if (showMenu) {
                setShowMenu(false);
            }
        };
        if (showMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showMenu]);

    useEffect(() => {
        if (!showMenu) {
            setMenuRect(null);
            return;
        }

        const scheduleUpdate = () => {
            window.requestAnimationFrame(() => {
                updateMenuRect();
            });
        };

        scheduleUpdate();
        window.addEventListener('resize', scheduleUpdate);
        window.addEventListener('scroll', scheduleUpdate, true);

        return () => {
            window.removeEventListener('resize', scheduleUpdate);
            window.removeEventListener('scroll', scheduleUpdate, true);
        };
    }, [showMenu, updateMenuRect]);

    useEffect(() => {
        if (!showMenu) return;
        const handleEscClose = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setShowMenu(false);
            }
        };
        document.addEventListener('keydown', handleEscClose);
        return () => document.removeEventListener('keydown', handleEscClose);
    }, [showMenu]);

    useEffect(() => {
        if (showMenu && currentWorkspace) {
            setSelectedWorkspaceUuid(currentWorkspace.uuid);
        }
    }, [showMenu, currentWorkspace]);

    const activeWorkspace = selectedWorkspaceUuid 
        ? workspaces.find(ws => ws.uuid === selectedWorkspaceUuid) 
        : currentWorkspace;

    const handleWorkspaceClick = (ws: StudioWorkspace) => {
        setSelectedWorkspaceUuid(ws.uuid);
    };

    const handleProjectSelect = (p: StudioProject) => {
        if (activeWorkspace) {
            setCurrentWorkspace(activeWorkspace);
        }
        setCurrentProject(p);
        setShowMenu(false);
        onWorkspaceChange?.(activeWorkspace ?? null);
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
        ? 'bg-[#111114]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_22px_55px_rgba(0,0,0,0.45)] animate-in fade-in zoom-in-95 duration-150 overflow-hidden'
        : 'bg-white/95 dark:bg-[#0b0b0d]/95 backdrop-blur-xl border border-gray-200 dark:border-[#202024] rounded-2xl shadow-[0_20px_48px_rgba(10,10,12,0.2)] animate-in fade-in zoom-in-95 duration-100 overflow-hidden';

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
        <div className={className}>
            <button
                ref={triggerRef}
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

            {showMenu && menuRect && createPortal(
                <div
                    ref={panelRef}
                    className={menuStyles}
                    style={{
                        position: 'fixed',
                        top: `${menuRect.top}px`,
                        left: `${menuRect.left}px`,
                        width: `${menuRect.width}px`,
                        zIndex: 1001,
                    }}
                >
                    <div className="flex min-h-0" style={{ height: `${menuRect.height}px` }}>
                        {/* Left: Workspace List */}
                        <div className={`w-[196px] flex-none flex flex-col border-r ${isPortal ? 'border-white/5' : 'border-gray-200 dark:border-[#27272a]'}`}>
                            <div className={`px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider flex items-center justify-between ${
                                isPortal 
                                    ? 'text-gray-500 bg-[#1a1a1c] border-b border-white/5' 
                                    : 'text-gray-500 bg-gray-50 dark:bg-[#1a1a1c] border-b border-gray-100 dark:border-[#27272a]'
                            }`}>
                                <span>{t('header.workspaces')}</span>
                                <span className={`text-[9px] px-1.5 py-0.5 rounded ${isPortal ? 'bg-white/5 text-gray-400' : 'bg-gray-200 dark:bg-[#27272a] text-gray-500'}`}>
                                    {workspaces.length}
                                </span>
                            </div>
                            
                            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-1.5">
                                {workspaces.length === 0 ? (
                                    <div className="h-full">
                                        <EmptyPanel
                                            icon={<LayoutGrid size={18} />}
                                            title={t('header.no_workspaces')}
                                            description="Create your first workspace to organize projects."
                                            isPortal={isPortal}
                                        />
                                    </div>
                                ) : (
                                    workspaces.map(ws => (
                                        <button
                                            key={ws.uuid}
                                            onClick={() => handleWorkspaceClick(ws)}
                                            className={`group w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${
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
                                                        className="hidden group-hover:block p-1 rounded text-gray-400 hover:bg-red-500/10 hover:text-red-400"
                                                    >
                                                        <Trash2 size={12} />
                                                    </div>
                                                )}
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>

                            <div className={`p-1.5 border-t ${isPortal ? 'border-white/5 bg-[#1a1a1c]' : 'border-gray-100 dark:border-[#1a1a1a] bg-gray-50 dark:bg-[#1a1a1c]'}`}>
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
                            <div className={`px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider flex items-center justify-between ${
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
                            
                            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-2">
                                {!activeWorkspace ? (
                                    <div className="h-full">
                                        <EmptyPanel
                                            icon={<FolderOpen size={18} />}
                                            title={t('header.select_workspace_first')}
                                            description="Choose a workspace on the left to browse its projects."
                                            isPortal={isPortal}
                                        />
                                    </div>
                                ) : activeWorkspace.projects?.length === 0 ? (
                                    <div className="h-full">
                                        <EmptyPanel
                                            icon={<Box size={18} />}
                                            title={t('header.no_projects')}
                                            description="Start by creating your first project in this workspace."
                                            isPortal={isPortal}
                                            action={
                                                <button
                                                    onClick={() => setShowCreateProjModal(true)}
                                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-medium transition-colors ${
                                                        isPortal
                                                            ? 'text-orange-300 border-orange-400/40 hover:bg-orange-500/10'
                                                            : 'text-orange-600 dark:text-orange-400 border-orange-300 dark:border-orange-700 hover:bg-orange-50 dark:hover:bg-orange-950/20'
                                                    }`}
                                                >
                                                    <Plus size={13} />
                                                    {t('header.create_project')}
                                                </button>
                                            }
                                        />
                                    </div>
                                ) : (
                                    activeWorkspace.projects?.map(p => (
                                        <button
                                            key={p.uuid}
                                            onClick={() => handleProjectSelect(p)}
                                            className={`group w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${
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
                                                        className="hidden group-hover:block p-1 rounded text-gray-400 hover:bg-red-500/10 hover:text-red-400"
                                                    >
                                                        <Trash2 size={12} />
                                                    </div>
                                                )}
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>

                            <div className={`p-1.5 border-t ${isPortal ? 'border-white/5 bg-[#1a1a1c]' : 'border-gray-100 dark:border-[#1a1a1a] bg-gray-50 dark:bg-[#1a1a1c]'}`}>
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
                </div>,
                document.body
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
