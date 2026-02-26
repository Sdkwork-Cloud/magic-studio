
import { useRouter, ROUTES } from '@sdkwork/react-core'
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FilmStoreProvider } from '../store/filmStore';
import { FilmSidebar, FilmWorkspace, FilmChatPanel, FilmSettingsDropdown, FilmPreviewPanel } from '../index';
import { 
    ChevronLeft, Film, MoreVertical, Save, Download, 
    FileText, Users, Box, MapPin, Clapperboard, Sparkles, 
    PanelLeftOpen, PanelRightOpen, ChevronRight, LayoutDashboard,
    MonitorPlay
} from 'lucide-react';

import { useFilmStore } from '../store/filmStore';

// --- Edge Toggle Button ---
const EdgeToggle: React.FC<{ onClick: () => void; side: 'left' | 'right' }> = ({ onClick, side }) => (
    <button 
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        className={`
            absolute top-1/2 -translate-y-1/2 z-50 w-3 h-12 
            bg-[#18181b] border border-[#333] text-gray-500 hover:text-white hover:bg-blue-600 hover:border-blue-500 
            flex items-center justify-center cursor-pointer transition-all duration-200 shadow-lg opacity-0 group-hover/panel:opacity-100 delay-75
            ${side === 'left' ? '-right-3 rounded-r-md border-l-0' : '-left-3 rounded-l-md border-r-0'}
        `}
        title={side === 'left' ? "Collapse Sidebar" : "Collapse Panel"}
    >
        {side === 'left' ? <ChevronLeft size={10} /> : <ChevronRight size={10} />}
    </button>
);

// --- Improved Resizer ---
const Resizer: React.FC<{ onMouseDown: (e: React.MouseEvent) => void; isResizing?: boolean }> = ({ onMouseDown, isResizing }) => (
    <div 
        className="group relative flex-none w-[1px] h-full z-40 cursor-col-resize hover:z-[60]"
        onMouseDown={onMouseDown}
    >
        {/* Visual Line */}
        <div className={`absolute inset-y-0 left-0 right-0 w-[1px] transition-colors duration-150 ${isResizing ? 'bg-blue-500' : 'bg-[#27272a] group-hover:bg-blue-500'}`} />
        {/* Hit Area */}
        <div className="absolute inset-y-0 -left-2 -right-2 bg-transparent" />
    </div>
);

// --- Collapsed Strip (Refined) ---
const CollapsedStrip: React.FC<{ onClick: () => void; side: 'left' | 'right'; label?: string }> = ({ onClick, side, label }) => (
    <div 
        className={`flex-none w-10 bg-[#0a0a0a] border-${side === 'left' ? 'r' : 'l'} border-[#27272a] flex flex-col items-center py-3 cursor-pointer hover:bg-[#111] transition-colors group z-40`}
        onClick={onClick}
        title={`Expand ${label || (side === 'left' ? 'Sidebar' : 'Panel')}`}
    >
        <button className="p-1.5 text-gray-500 group-hover:text-white transition-colors mb-4">
             {side === 'left' ? <PanelLeftOpen size={18} /> : <PanelRightOpen size={18} />}
        </button>
        {label && (
             <div className="flex-1 flex items-center justify-center w-full overflow-hidden pb-4">
                 <div className="writing-vertical-lr text-[11px] font-bold text-gray-600 group-hover:text-gray-400 uppercase tracking-widest whitespace-nowrap select-none rotate-180">
                     {label}
                 </div>
             </div>
        )}
    </div>
);

// --- Status Badge ---
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
        'DRAFT': { color: 'text-gray-400', bg: 'bg-gray-500/10', label: 'Draft' },
        'ANALYZING': { color: 'text-yellow-400', bg: 'bg-yellow-500/10', label: 'Analyzing' },
        'SCRIPT_READY': { color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'Script Ready' },
        'STORYBOARD_READY': { color: 'text-purple-400', bg: 'bg-purple-500/10', label: 'Storyboard Ready' },
        'GENERATING': { color: 'text-orange-400', bg: 'bg-orange-500/10', label: 'Generating' },
        'COMPLETED': { color: 'text-green-400', bg: 'bg-green-500/10', label: 'Completed' },
    };

    const config = statusConfig[status] || statusConfig['DRAFT'];

    return (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${config.color} ${config.bg}`}>
            {config.label}
        </span>
    );
};

// Navigation Tabs
const navTabs = [
    { id: 'overview', label: '概览', icon: LayoutDashboard }, 
    { id: 'script', label: '剧本', icon: FileText },
    { id: 'characters', label: '角色', icon: Users },
    { id: 'props', label: '道具', icon: Box },
    { id: 'locations', label: '场景', icon: MapPin },
    { id: 'storyboard', label: '分镜', icon: Clapperboard },
    { id: 'timeline', label: '生成', icon: Sparkles },
];

const FilmHeader: React.FC = () => {
    const { navigate } = useRouter();
    const { project, isProcessing, currentView, setView } = useFilmStore();
    const [showMenu, setShowMenu] = useState(false);

    return (
        <header className="h-14 bg-[#0a0a0a] border-b border-[#1a1a1a] flex items-center px-4 gap-4 flex-none z-[100] relative select-none">
            <div className="flex items-center gap-3">
                <button 
                    onClick={() => navigate(ROUTES.HOME)} 
                    className="p-2 hover:bg-[#1a1a1a] rounded-lg text-gray-400 hover:text-white transition-colors"
                >
                    <ChevronLeft size={18} />
                </button>
                <div className="h-6 w-px bg-[#27272a]" />
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-gradient-to-br from-red-600 to-red-800 rounded-lg flex items-center justify-center shadow-lg shadow-red-900/20">
                        <Film size={16} className="text-white" />
                    </div>
                    <div>
                        <h1 className="font-bold text-sm text-white tracking-tight flex items-center gap-2">
                             {project.name}
                        </h1>
                        <div className="flex items-center gap-2 mt-0.5">
                            <StatusBadge status={project.status} />
                            <span className="text-[10px] text-gray-500">{project.settings.aspect}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex justify-center">
                <div className="flex items-center gap-1 bg-[#111] rounded-lg p-1 border border-[#1a1a1a]">
                    {navTabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = currentView === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setView(tab.id as any)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                                    isActive 
                                        ? 'text-white bg-red-600/20 text-red-400' 
                                        : 'text-gray-400 hover:text-white hover:bg-[#1a1a1a]'
                                }`}
                            >
                                <Icon size={14} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="flex items-center gap-1 bg-[#111] rounded-lg p-1 border border-[#1a1a1a]">
                <FilmSettingsDropdown />
                
                <div className="w-px h-4 bg-[#27272a]" />
                
                {/* Preview Button */}
                <button 
                    onClick={() => setView('preview')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${currentView === 'preview' ? 'text-green-400 bg-green-500/10' : 'text-gray-400 hover:text-white hover:bg-[#1a1a1a]'}`}
                    title="Preview Movie"
                >
                    <MonitorPlay size={14} /> Preview
                </button>

                <div className="w-px h-4 bg-[#27272a]" />
                <button className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium text-gray-400 hover:text-white hover:bg-[#1a1a1a] transition-all" disabled={isProcessing}>
                    <Save size={14} /> Save
                </button>
                <div className="w-px h-4 bg-[#27272a]" />
                <button className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium text-gray-400 hover:text-white hover:bg-[#1a1a1a] transition-all">
                    <Download size={14} /> Export
                </button>
                <div className="w-px h-4 bg-[#27272a]" />
                <button onClick={() => setShowMenu(!showMenu)} className="p-2 hover:bg-[#1a1a1a] rounded-md text-gray-400 hover:text-white transition-all">
                    <MoreVertical size={16} />
                </button>
            </div>
        </header>
    );
};

const FilmPageContent: React.FC = () => {
    // Layout State
    const [leftWidth, setLeftWidth] = useState(240);
    const [rightWidth, setRightWidth] = useState(360); // Wider for Chat
    const [isResizing, setIsResizing] = useState<'left' | 'right' | null>(null);
    
    // Default collapsed Left for immersive writing
    const [isLeftCollapsed, setIsLeftCollapsed] = useState(true);
    const [isRightCollapsed, setIsRightCollapsed] = useState(false);
    
    const { currentView } = useFilmStore();

    // Refs for Drag
    const containerRef = useRef<HTMLDivElement>(null);

    const startResizing = useCallback((direction: 'left' | 'right') => {
        setIsResizing(direction);
    }, []);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing || !containerRef.current) return;
            
            const containerRect = containerRef.current.getBoundingClientRect();
            
            if (isResizing === 'left') {
                const newWidth = e.clientX - containerRect.left;
                // Snap to collapse
                if (newWidth < 100) {
                    setIsLeftCollapsed(true);
                    setIsResizing(null);
                } else {
                    setLeftWidth(Math.max(200, Math.min(newWidth, 600)));
                }
            } else {
                const newWidth = containerRect.right - e.clientX;
                // Snap to collapse
                if (newWidth < 100) {
                    setIsRightCollapsed(true);
                    setIsResizing(null);
                } else {
                    setRightWidth(Math.max(300, Math.min(newWidth, 800)));
                }
            }
        };

        const handleMouseUp = () => {
            setIsResizing(null);
        };

        if (isResizing) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };
    }, [isResizing]);
    
    // If in Preview Mode, render Full Screen Panel
    if (currentView === 'preview') {
        return (
            <div className="flex flex-col h-full w-full bg-[#0a0a0a] text-gray-200 overflow-hidden">
                <FilmHeader />
                <div className="flex-1 overflow-hidden relative">
                    <FilmPreviewPanel />
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full w-full bg-[#0a0a0a] text-gray-200 overflow-hidden">
            <FilmHeader />

            <div className="flex-1 flex overflow-hidden relative" ref={containerRef}>
                
                {/* --- Left Panel (Project List) --- */}
                {isLeftCollapsed ? (
                    <CollapsedStrip onClick={() => setIsLeftCollapsed(false)} side="left" />
                ) : (
                    <div style={{ width: leftWidth }} className="flex-none flex flex-col min-w-[200px] border-r border-[#27272a] bg-[#0a0a0a] relative group/panel">
                        <FilmSidebar />
                        {/* Edge Toggle on Right Border */}
                        <EdgeToggle onClick={() => setIsLeftCollapsed(true)} side="left" />
                    </div>
                )}

                {/* Left Resizer */}
                {!isLeftCollapsed && <Resizer onMouseDown={() => startResizing('left')} isResizing={isResizing === 'left'} />}

                {/* --- Center Workspace (Script / Storyboard) --- */}
                <div className="flex-1 min-w-0 bg-[#09090b] relative z-0">
                    <FilmWorkspace />
                </div>

                {/* Right Resizer */}
                {!isRightCollapsed && <Resizer onMouseDown={() => startResizing('right')} isResizing={isResizing === 'right'} />}

                {/* --- Right Panel (AI Chat / Co-pilot) --- */}
                {isRightCollapsed ? (
                    <CollapsedStrip onClick={() => setIsRightCollapsed(false)} side="right" label="Co-Pilot" />
                ) : (
                    <div style={{ width: rightWidth }} className="flex-none flex flex-col min-w-[300px] border-l border-[#27272a] bg-[#111113] relative group/panel">
                        <FilmChatPanel />
                         {/* Edge Toggle on Left Border */}
                        <EdgeToggle onClick={() => setIsRightCollapsed(true)} side="right" />
                    </div>
                )}
            </div>
        </div>
    );
};

const FilmPage: React.FC = () => {
    return (
        <FilmStoreProvider>
            <FilmPageContent />
        </FilmStoreProvider>
    );
};

export default FilmPage;
