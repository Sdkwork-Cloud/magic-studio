
import React, { useState, useRef, useEffect } from 'react';
import {
    ChevronLeft, Scissors, Share2, Save, ChevronDown, FileJson
} from 'lucide-react';
import { ROUTES } from '../../router/routes';
import { WorkspaceProjectSelector } from '@sdkwork/react-workspace';
import { useTranslation } from '@sdkwork/react-i18n';
import { useMagicCutStore } from '@sdkwork/react-magiccut';
import { useRouter, platform } from '@sdkwork/react-core';

export const MagicCutLayoutHeader: React.FC = () => {
    const { navigate, currentQuery } = useRouter();
    const { t: _t } = useTranslation();
    
    const { project } = useMagicCutStore();

    const [showExportMenu, setShowExportMenu] = useState(false);
    
    const exportRef = useRef<HTMLDivElement>(null);

    const [backRoute, setBackRoute] = useState<any>(ROUTES.PORTAL);
    const [backLabel, setBackLabel] = useState('Portal');

    useEffect(() => {
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
                <WorkspaceProjectSelector 
                    variant="portal"
                    showDelete={false}
                    defaultProjectType="VIDEO"
                    compact={true}
                />

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
                                    onClick={() => {}}
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
        </>
    );
};
