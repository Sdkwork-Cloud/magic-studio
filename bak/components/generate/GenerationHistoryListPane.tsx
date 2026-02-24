
import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Upload, ChevronDown, Image as ImageIcon, Film, Music, User, LayoutGrid, List } from 'lucide-react';
import { GenerateHistory } from './GenerateHistory';
import { ImportData } from './upload/types';
import { UploadImageGenerationModal } from './upload/UploadImageGenerationModal';
import { UploadVideoGenerationModal } from './upload/UploadVideoGenerationModal';
import { UploadMusicGenerationModal } from './upload/UploadMusicGenerationModal';
import { useTranslation } from '../../i18n';

export interface HistoryTab {
    id: string;
    label: string;
}

// Unified Global Tabs Definition with Translation Keys
export const GENERATION_TABS: HistoryTab[] = [
    { id: 'all', label: 'studio.tabs.all' },
    { id: 'image', label: 'studio.tabs.image' },
    { id: 'character', label: 'studio.tabs.character' },
    { id: 'video', label: 'studio.tabs.video' },
    { id: 'audio', label: 'studio.tabs.audio' },
    { id: 'music', label: 'studio.tabs.music' },
    { id: 'voice', label: 'studio.tabs.voice' },
    { id: 'speech', label: 'studio.tabs.speech' },
];

export interface GenerationHistoryListPaneProps {
    // Data Source
    tasks: any[];
    
    // Core Actions
    onDelete: (id: string) => void;
    onReuse: (task: any) => void;
    
    // Selection Mode (Open/Closed Principle extension)
    /** Enables selection mode styling and behavior */
    selectionMode?: boolean;
    /** Callback when an item (media url) is selected */
    onSelect?: (url: string, task: any) => void;
    /** List of currently selected item URLs (for multi-select visual state) */
    selectedItems?: string[];

    // Layout & Appearance
    /** Hides the top toolbar for embedded use cases */
    minimal?: boolean;
    /** Optional styling override */
    className?: string;
    /** Inject a custom header element (e.g. for Modals) */
    customHeader?: React.ReactNode;

    // Tabs Control (Optional)
    tabs?: HistoryTab[]; 
    activeTab?: string;
    onTabChange?: (id: string) => void;
    
    // Feature: Chat Mode
    onChatMode?: () => void;
    
    // Feature: Filtering
    filter?: string; 
    
    // Feature: Favorites
    showFavorites?: boolean;
    onToggleFavorites?: (show: boolean) => void;

    // Feature: Import
    onImport?: (data: ImportData) => void;
}

export const GenerationHistoryListPane: React.FC<GenerationHistoryListPaneProps> = ({
    tasks,
    onDelete,
    onReuse,
    selectionMode = false,
    onSelect,
    selectedItems = [],
    minimal = false,
    className = "",
    customHeader,
    tabs = GENERATION_TABS,
    activeTab,
    onTabChange,
    onChatMode,
    filter = 'all',
    showFavorites = false,
    onToggleFavorites,
    onImport
}) => {
    const { t } = useTranslation();
    const [showImportMenu, setShowImportMenu] = useState(false);
    const [activeModal, setActiveModal] = useState<'image' | 'video' | 'music' | null>(null);
    const importMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (importMenuRef.current && !importMenuRef.current.contains(e.target as Node)) {
                setShowImportMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleOpenUpload = (type: 'image' | 'video' | 'music') => {
        setActiveModal(type);
        setShowImportMenu(false);
    };

    return (
        <div className={`flex flex-col w-full h-full min-w-0 bg-[#09090b] ${className}`}>
            
            {/* 1. Custom Header Injection (Highest Priority) */}
            {customHeader && (
                <div className="flex-none z-10">
                    {customHeader}
                </div>
            )}

            {/* 2. Standard Header (Conditional) */}
            {!minimal && !customHeader && (
                <div className="h-14 border-b border-[#27272a] flex items-center justify-between px-6 bg-[#18181b] flex-none z-10">
                     <div className="flex items-center gap-6 h-full overflow-x-auto no-scrollbar">
                        {onTabChange && tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => onTabChange(tab.id)}
                                className={`
                                    relative h-full flex items-center text-sm font-medium transition-colors border-b-2 whitespace-nowrap
                                    ${activeTab === tab.id 
                                        ? 'text-white border-[#4ade80]' 
                                        : 'text-gray-500 border-transparent hover:text-gray-300'
                                    }
                                `}
                            >
                                {t(tab.label)}
                            </button>
                        ))}
                        
                        {!onTabChange && (
                            <span className="text-sm font-bold text-gray-200">History</span>
                        )}
                     </div>
                     
                     <div className="flex items-center gap-3">
                        {onImport && (
                            <div className="relative" ref={importMenuRef}>
                                <button 
                                    onClick={() => setShowImportMenu(!showImportMenu)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-white bg-[#27272a] hover:bg-[#333] rounded-lg transition-colors border border-[#333]"
                                >
                                    <Upload size={14} />
                                    <span className="hidden sm:inline">Import</span>
                                    <ChevronDown size={12} className="opacity-50" />
                                </button>
                                
                                {showImportMenu && (
                                    <div className="absolute top-full right-0 mt-1 w-40 bg-[#252526] border border-[#333] rounded-xl shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-75">
                                        <button onClick={() => handleOpenUpload('image')} className="flex items-center gap-2 w-full px-3 py-2 text-xs text-left text-gray-300 hover:bg-[#333] hover:text-white transition-colors">
                                            <ImageIcon size={14} className="text-purple-400" /> Import Image
                                        </button>
                                        <button onClick={() => handleOpenUpload('video')} className="flex items-center gap-2 w-full px-3 py-2 text-xs text-left text-gray-300 hover:bg-[#333] hover:text-white transition-colors">
                                            <Film size={14} className="text-pink-400" /> Import Video
                                        </button>
                                        <button onClick={() => handleOpenUpload('music')} className="flex items-center gap-2 w-full px-3 py-2 text-xs text-left text-gray-300 hover:bg-[#333] hover:text-white transition-colors">
                                            <Music size={14} className="text-indigo-400" /> Import Music
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
    
                        <div className="w-[1px] h-4 bg-[#333]" />
    
                        {onToggleFavorites && (
                            <div className="flex items-center gap-2">
                                 <input 
                                    type="checkbox" 
                                    id="show-favorites" 
                                    checked={showFavorites}
                                    onChange={(e) => onToggleFavorites(e.target.checked)}
                                    className="w-4 h-4 rounded bg-[#27272a] border-gray-600 text-[#4ade80] focus:ring-0 cursor-pointer" 
                                 />
                                 <label htmlFor="show-favorites" className="text-xs text-gray-400 cursor-pointer select-none hover:text-gray-300 hidden sm:inline">
                                     Favorites
                                 </label>
                            </div>
                        )}
    
                        {onChatMode && (
                            <>
                                <div className="w-[1px] h-4 bg-[#333] hidden sm:block" />
                                <button 
                                    onClick={onChatMode}
                                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-white bg-[#27272a] hover:bg-[#333] rounded-lg transition-colors border border-[#333]"
                                >
                                    <MessageSquare size={14} /> <span className="hidden sm:inline">Chat</span>
                                </button>
                            </>
                        )}
                     </div>
                </div>
            )}
            
            {/* 3. The List Content */}
            <div className="flex-1 min-h-0 overflow-hidden relative">
                <GenerateHistory 
                    tasks={tasks} 
                    onDelete={onDelete} 
                    onReuse={onReuse}
                    onSelect={selectionMode ? onSelect : undefined}
                    selectedItems={selectedItems}
                    order="desc" 
                    filter={filter as any} 
                />
            </div>

            {/* Modals */}
            {activeModal === 'image' && onImport && (
                <UploadImageGenerationModal onClose={() => setActiveModal(null)} onImport={onImport} />
            )}
            {activeModal === 'video' && onImport && (
                <UploadVideoGenerationModal onClose={() => setActiveModal(null)} onImport={onImport} />
            )}
            {activeModal === 'music' && onImport && (
                <UploadMusicGenerationModal onClose={() => setActiveModal(null)} onImport={onImport} />
            )}
        </div>
    );
};
