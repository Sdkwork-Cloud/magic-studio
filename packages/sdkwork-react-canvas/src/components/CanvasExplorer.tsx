
import React from 'react';
import { Plus, Trash2, Layout } from 'lucide-react';
import { useCanvasStore } from '../store/canvasStore';
import { useTranslation } from 'sdkwork-react-i18n';

export const CanvasExplorer: React.FC = () => {
    const { boards, activeBoardId, selectBoard, createBoard, deleteBoard } = useCanvasStore();
    const { t } = useTranslation();

    const handleCreate = () => {
        const title = prompt("Board Title:");
        if (title) createBoard(title);
    };

    return (
        <div className="h-full flex flex-col bg-[#1e1e1e] border-r border-[#27272a]">
             {/* Header */}
             <div className="h-10 flex items-center justify-between px-3 border-b border-[#333] bg-[#252526]">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('canvas.title')}</span>
                <button 
                    onClick={handleCreate}
                    className="p-1 hover:bg-[#333] rounded text-gray-400 hover:text-white transition-colors"
                    title={t('canvas.new_board')}
                >
                    <Plus size={14} />
                </button>
             </div>

             {/* List */}
             <div className="flex-1 overflow-y-auto p-2 space-y-1">
                 {boards.map(board => (
                     <div 
                        key={board.id}
                        onClick={() => selectBoard(board.id)}
                        className={`
                            group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors
                            ${activeBoardId === board.id ? 'bg-[#094771] text-white' : 'text-gray-400 hover:bg-[#2a2a2c] hover:text-gray-200'}
                        `}
                     >
                         <div className="flex items-center gap-3 overflow-hidden">
                             <Layout size={14} className="flex-shrink-0" />
                             <div className="flex flex-col min-w-0">
                                 <span className="text-sm font-medium truncate">{board.title}</span>
                                 <span className="text-[10px] opacity-60 truncate">{board.elements.length} {t('canvas.elements')}</span>
                             </div>
                         </div>
                         
                         <button 
                            onClick={(e) => { e.stopPropagation(); if(confirm('Delete board?')) deleteBoard(board.id); }}
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
