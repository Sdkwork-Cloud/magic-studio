
import React, { useState, useRef, useEffect } from 'react';
import {
    ChevronLeft, Scissors, Share2, Save, ChevronDown, LayoutGrid, Box, Check, Plus, FileJson
} from 'lucide-react';
;
import { ROUTES } from '../../router/routes';
import { useWorkspaceStore } from 'sdkwork-react-workspace';
import { useTranslation } from 'sdkwork-react-i18n';
import { CreateProjectModal } from 'sdkwork-react-workspace';
import { useMagicCutStore } from 'sdkwork-react-magiccut';
import { useRouter, platform } from 'sdkwork-react-core';

export const MagicCutLayoutHeader: React.FC = () => {
    const { navigate, currentQuery } = useRouter();
    const { t } = useTranslation();
    
    // Magic Cut Store for active project data
    const { project } = useMagicCutStore();
    
    // Workspace & Project State
    const { 
        workspaces, currentWorkspace, currentProject, 
        setCurrentWorkspace, setCurrentProject
    } = useWorkspaceStore();

    const [showWsMenu, setShowWsMenu] = useState(false);
    const [showProjMenu, setShowProjMenu] = useState(false);
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [showCreateProjModal, setShowCreateProjModal] = useState(false);
    
    const wsRef = useRef<HTMLDivElement>(null);
    const projRef = useRef<HTMLDivElement>(null);
    const exportRef = useRef<HTMLDivElement>(null);

    // Smart Return Logic
    const [backRoute, setBackRoute] = useState<any>(ROUTES.PORTAL);
    const [backLabel, setBackLabel] = useState('Portal');

    useEffect(() => {
        // Use currentQuery from context which is guaranteed to be updated by navigate()
        const searchParams = new URLSearchParams(currentQuery);
        const fromSource = searchParams.get('from');
        
        if (fromSource === 'canvas') {
            setBackRoute(ROUTES.CANVAS);
            setBackLabel('Canvas');
        } else {
            setBackRoute(ROUTES.PORTAL);
            setBackLabel('Portal');
        }
    }, [currentQuery]);

    // Close menus on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wsRef.current && !wsRef.current.contains(event.target as Node)) setShowWsMenu(false);
            if (projRef.current && !projRef.current.contains(event.target as Node)) setShowProjMenu(false);
            if (exportRef.current && !exportRef.current.contains(event.target as Node)) setShowExportMenu(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleCreateProject = () => {
        setShowCreateProjModal(true);
        setShowProjMenu(false);
    };

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
            <div className="h-14 bg-[#020202]/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-4 z-[1000] select-none shrink-0 relative">
                {/* Left: Navigation & Branding */}
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate(backRoute)}
                        className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors group flex items-center gap-2"
                        title={`Return to ${backLabel}`}
                    >
                        <ChevronLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
                        <span className="text-xs font-bold hidden md:inline">{backLabel}</span>
                    </button>
                    
                    <div className="h-6 w-px bg-white/5" />

                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-red-600 to-orange-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-red-900/20 ring-1 ring-white/10">
                            <Scissors size={16} />
                        </div>
                        <div className="hidden md:block">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-white tracking-tight">Magic Cut</span>
                                <span className="text-[9px] text-red-300 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20 font-medium">BETA</span>
                            </div>
                            <span className="text-[10px] text-gray-500 font-medium">AI-Native Video Editor</span>
                        </div>
                    </div>
                </div>

                {/* Center: Context Switcher */}
                <div className="flex items-center gap-2 bg-[#0a0a0a] border border-white/5 rounded-lg p-1">
                    
                    {/* Workspace Selector */}
                    <div className="relative" ref={wsRef}>
                        <button 
                            onClick={() => setShowWsMenu(!showWsMenu)}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-white/5 transition-colors group"
                        >
                            <LayoutGrid size={12} className="text-gray-500 group-hover:text-white" />
                            <span className="text-xs font-medium text-gray-300 max-w-[100px] truncate">
                                {currentWorkspace ? currentWorkspace.name : "Workspace"}
                            </span>
                            <ChevronDown size={10} className="text-gray-600 group-hover:text-gray-400" />
                        </button>

                        {showWsMenu && (
                            <div className="absolute top-full left-0 mt-2 w-60 bg-[#151517] border border-white/10 rounded-xl shadow-2xl flex flex-col z-[1001] animate-in fade-in zoom-in-95 duration-100 overflow-hidden">
                                <div className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider bg-[#1a1a1c] border-b border-white/5">Workspaces</div>
                                
                                <div className="max-h-[240px] overflow-y-auto custom-scrollbar p-1">
                                    {workspaces.map(ws => (
                                        <button 
                                            key={ws.uuid}
                                            onClick={() => { setCurrentWorkspace(ws); setShowWsMenu(false); }}
                                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${currentWorkspace?.uuid === ws.uuid ? 'bg-blue-600/10 text-blue-400' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                                        >
                                            <span>{ws.name}</span>
                                            {currentWorkspace?.uuid === ws.uuid && <Check size={12} />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <span className="text-gray-700">/</span>

                    {/* Project Selector */}
                    <div className="relative" ref={projRef}>
                        <button 
                            onClick={() => setShowProjMenu(!showProjMenu)}
                            disabled={!currentWorkspace}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors group ${!currentWorkspace ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/5'}`}
                        >
                            <Box size={12} className="text-orange-500 group-hover:text-orange-400" />
                            <span className="text-xs font-medium text-gray-200 max-w-[140px] truncate">
                                {currentProject ? currentProject.name : "Select Project"}
                            </span>
                            <ChevronDown size={10} className="text-gray-600 group-hover:text-gray-400" />
                        </button>

                        {showProjMenu && currentWorkspace && (
                            <div className="absolute top-full left-0 mt-2 w-64 bg-[#151517] border border-white/10 rounded-xl shadow-2xl flex flex-col z-[1001] animate-in fade-in zoom-in-95 duration-100 overflow-hidden">
                                <div className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider bg-[#1a1a1c] border-b border-white/5">
                                    Projects
                                </div>
                                
                                <div className="max-h-[240px] overflow-y-auto custom-scrollbar p-1">
                                    {currentWorkspace.projects.length === 0 ? (
                                        <div className="px-3 py-4 text-center text-xs text-gray-600">No projects found</div>
                                    ) : (
                                        currentWorkspace.projects.map(p => (
                                            <button 
                                                key={p.uuid}
                                                onClick={() => { setCurrentProject(p); setShowProjMenu(false); }}
                                                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${currentProject?.uuid === p.uuid ? 'bg-orange-600/10 text-orange-400' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                                            >
                                                <span>{p.name}</span>
                                                {currentProject?.uuid === p.uuid && <Check size={12} />}
                                            </button>
                                        ))
                                    )}
                                </div>
                                
                                {/* Fixed Footer */}
                                <div className="p-1 border-t border-white/5 bg-[#1a1a1c]">
                                     <button 
                                        onClick={handleCreateProject} 
                                        className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-orange-400 hover:bg-white/5 rounded-md transition-colors border border-dashed border-orange-500/30 hover:border-orange-500/50"
                                     >
                                         <Plus size={12} /> Create Project
                                     </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-3">
                    <div className="hidden md:flex items-center text-xs text-gray-500 gap-2 mr-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        Saved
                    </div>
                    
                    <button className="h-8 px-3 bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-medium rounded-lg transition-colors flex items-center gap-2 border border-white/5 hover:border-white/10">
                        <Share2 size={14} />
                        <span className="hidden sm:inline">Share</span>
                    </button>
                    
                    <div className="relative" ref={exportRef}>
                        <button 
                            onClick={() => setShowExportMenu(!showExportMenu)}
                            className="h-8 px-4 bg-white text-black hover:bg-gray-200 text-xs font-bold rounded-lg transition-colors shadow-lg shadow-white/5 flex items-center gap-2"
                        >
                            <Save size={14} />
                            <span>Export</span>
                            <ChevronDown size={10} />
                        </button>
                        
                        {showExportMenu && (
                            <div className="absolute top-full right-0 mt-2 w-48 bg-[#151517] border border-white/10 rounded-xl shadow-2xl flex flex-col z-[1001] animate-in fade-in zoom-in-95 duration-100 overflow-hidden p-1">
                                <button 
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-left"
                                    onClick={() => {/* Trigger video export modal if available in parent context, but this is layout header */}}
                                >
                                    <Save size={14} /> Export Video
                                </button>
                                <button 
                                    onClick={handleExportJson}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-left"
                                >
                                    <FileJson size={14} /> Export JSON Project
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <CreateProjectModal 
                isOpen={showCreateProjModal}
                onClose={() => setShowCreateProjModal(false)}
                initialType="VIDEO"
            />
        </>
    );
};
