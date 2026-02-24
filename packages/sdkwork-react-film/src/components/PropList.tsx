
import { FilmProp } from 'sdkwork-react-commons'
import React, { useState } from 'react';
import { useFilmStore } from '../store/filmStore';
import { Zap, Loader2, Plus } from 'lucide-react';

import { PropModal } from './PropModal';
import { PropCard } from './overview/PropCard';

export const PropList: React.FC = () => {
    const { project, selectItem, selectedId, autoExtractProps, createProp, updateProp, isProcessing } = useFilmStore();
    const props = project.props || [];
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProp, setEditingProp] = useState<FilmProp | undefined>(undefined);

    const handleCreate = () => {
        setEditingProp(undefined);
        setIsModalOpen(true);
    };

    const handleEdit = (prop: FilmProp) => {
        setEditingProp(prop);
        setIsModalOpen(true);
        selectItem(prop.uuid, 'prop');
    };

    const handleSave = (data: Partial<FilmProp>) => {
        if (editingProp) {
            updateProp(editingProp.uuid, data);
        } else {
            createProp(data);
        }
    };

    return (
        <div className="p-8 h-full overflow-y-auto bg-[#111]">
             <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold text-white">Key Props</h2>
                    <p className="text-xs text-gray-500 mt-1">Manage key items appearing in the script, maintaining visual design consistency.</p>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={handleCreate}
                        className="flex items-center gap-2 px-4 py-2 bg-[#252526] hover:bg-[#333] border border-[#333] hover:text-white text-gray-300 rounded-lg text-xs font-bold transition-colors"
                    >
                        <Plus size={14} /> Add Prop
                    </button>
                    <button 
                        onClick={autoExtractProps}
                        disabled={isProcessing}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-[#27272a] disabled:text-gray-500 text-white rounded-lg text-xs font-bold transition-colors"
                    >
                        {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                        {isProcessing ? 'Extracting...' : 'AI Extract Props'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {props.map((prop: FilmProp) => (
                    <PropCard 
                        key={prop.uuid} 
                        prop={prop} 
                        onClick={() => handleEdit(prop)}
                        isSelected={selectedId === prop.uuid}
                    />
                ))}
                
                {/* Add Button in Grid */}
                <button 
                    onClick={handleCreate}
                    className="aspect-square rounded-xl border-2 border-dashed border-[#27272a] hover:border-[#444] bg-[#18181b]/30 hover:bg-[#18181b] flex flex-col items-center justify-center text-gray-500 hover:text-white transition-colors group"
                >
                    <div className="w-12 h-12 rounded-full bg-[#252526] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <Plus size={24} />
                    </div>
                    <span className="text-xs font-bold uppercase">Add Prop</span>
                </button>
            </div>

            <PropModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                initialData={editingProp}
            />
        </div>
    );
};
