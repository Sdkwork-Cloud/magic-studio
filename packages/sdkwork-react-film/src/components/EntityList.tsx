
import { FilmCharacter } from 'sdkwork-react-commons'
import React, { useState } from 'react';
import { useFilmStore } from '../store/filmStore';
import { Plus, Zap, Loader2 } from 'lucide-react';
import { CharacterModal } from './CharacterModal';

import { CharacterCard } from './overview/CharacterCard';

export const EntityList: React.FC = () => {
    const { project, selectItem, selectedId, autoExtractCharacters, createCharacter, updateCharacter, isProcessing } = useFilmStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingChar, setEditingChar] = useState<FilmCharacter | undefined>(undefined);

    const handleCreate = () => {
        setEditingChar(undefined);
        setIsModalOpen(true);
    };

    const handleEdit = (char: FilmCharacter) => {
        setEditingChar(char);
        setIsModalOpen(true);
        selectItem(char.uuid, 'character'); // Also select it
    };

    const handleSave = (data: Partial<FilmCharacter>) => {
        if (editingChar) {
            updateCharacter(editingChar.uuid, data);
        } else {
            createCharacter(data);
        }
    };

    return (
        <div className="p-8 h-full overflow-y-auto bg-[#111]">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold text-white">Characters</h2>
                    <p className="text-xs text-gray-500 mt-1">Manage characters in the script, define their appearance, personality and voice characteristics.</p>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={handleCreate}
                        className="flex items-center gap-2 px-4 py-2 bg-[#252526] hover:bg-[#333] border border-[#333] hover:text-white text-gray-300 rounded-lg text-xs font-bold transition-colors"
                    >
                        <Plus size={14} /> Add Character
                    </button>
                    <button 
                        onClick={autoExtractCharacters}
                        disabled={isProcessing}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-[#27272a] disabled:text-gray-500 text-white rounded-lg text-xs font-bold transition-colors"
                    >
                        {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                        {isProcessing ? 'Extracting...' : 'AI Extract Characters'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                {project.characters.map(char => (
                    <CharacterCard 
                        key={char.uuid}
                        character={char}
                        onClick={() => handleEdit(char)}
                        isSelected={selectedId === char.uuid}
                    />
                ))}
                
                {/* Add Button in Grid */}
                <button 
                    onClick={handleCreate}
                    className="aspect-[3/4] rounded-xl border-2 border-dashed border-[#27272a] hover:border-[#444] bg-[#18181b]/30 hover:bg-[#18181b] flex flex-col items-center justify-center text-gray-500 hover:text-white transition-colors group"
                >
                    <div className="w-12 h-12 rounded-full bg-[#252526] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <Plus size={24} />
                    </div>
                    <span className="text-xs font-bold uppercase">Add Character</span>
                </button>
            </div>

            <CharacterModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                initialData={editingChar}
            />
        </div>
    );
};
