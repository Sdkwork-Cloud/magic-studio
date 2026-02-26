
import React, { useState } from 'react';
import { Presentation, Search, Plus, Trash2 } from 'lucide-react';
import { useChatPPTStore } from '../store/chatPPTStore';
import { useTranslation } from '@sdkwork/react-i18n';

export const PPTExplorer: React.FC = () => {
    const { presentations, activePresentationId, selectPresentation, createPresentation, deletePresentation } = useChatPPTStore();
    const [search, setSearch] = useState('');
    const { t } = useTranslation();

    const filtered = presentations.filter(p => p.title.toLowerCase().includes(search.toLowerCase()));

    const handleCreate = () => {
        const title = prompt("Enter presentation title:");
        if (title) createPresentation(title);
    };

    return (
        <div className="h-full flex flex-col bg-[#1e1e1e] border-r border-[#27272a]">
             {/* Header */}
             <div className="h-10 flex items-center justify-between px-3 border-b border-[#333] bg-[#252526]">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('studio.ppt.presentations')}</span>
                <button 
                    onClick={handleCreate}
                    className="p-1 hover:bg-[#333] rounded text-gray-400 hover:text-white transition-colors"
                    title={t('studio.ppt.new_presentation')}
                >
                    <Plus size={14} />
                </button>
             </div>

             {/* Search */}
             <div className="p-2 border-b border-[#333]">
                <div className="relative">
                    <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input 
                        type="text" 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={t('common.actions.search') + "..."}
                        className="w-full bg-[#111] border border-[#333] rounded-md pl-7 pr-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                </div>
             </div>

             {/* List */}
             <div className="flex-1 overflow-y-auto p-2 space-y-1">
                 {filtered.map(ppt => (
                     <div 
                        key={ppt.id}
                        onClick={() => selectPresentation(ppt.id)}
                        className={`
                            group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors
                            ${activePresentationId === ppt.id ? 'bg-[#094771] text-white' : 'text-gray-400 hover:bg-[#2a2a2c] hover:text-gray-200'}
                        `}
                     >
                         <div className="flex items-center gap-3 overflow-hidden">
                             <Presentation size={14} className="flex-shrink-0" />
                             <div className="flex flex-col min-w-0">
                                 <span className="text-sm font-medium truncate">{ppt.title}</span>
                                 <span className="text-[10px] opacity-60 truncate">{ppt.slides.length} {t('studio.ppt.slides')} ? {new Date(ppt.updatedAt).toLocaleDateString()}</span>
                             </div>
                         </div>
                         
                         <button 
                            onClick={(e) => { e.stopPropagation(); if(confirm('Delete presentation?')) deletePresentation(ppt.id); }}
                            className="p-1 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity"
                         >
                             <Trash2 size={12} />
                         </button>
                     </div>
                 ))}
             </div>
        </div>
    );
};
