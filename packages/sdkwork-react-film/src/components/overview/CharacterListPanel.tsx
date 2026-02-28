
import React, { useState } from 'react';
import { Users, ArrowRight, Sparkles, Plus, Loader2 } from 'lucide-react';
import { CharacterCard } from './CharacterCard';
import { useFilmStore } from '../../store/filmStore';
import { FilmCharacter, MediaScene } from '@sdkwork/react-commons';
import { filmService } from '../../services/filmService';
import { hasFilmAssetReference } from '../../utils/filmAssetUrlResolver';
import { importFilmAssetFromUrl } from '../../utils/filmModalAssetImport';
import {
    createFilmAssetMediaResource,
    upsertFilmRefAssetByScene
} from '../../utils/filmAssetFactories';

interface CharacterListPanelProps {
    characters: FilmCharacter[];
    onEdit: (char: FilmCharacter) => void;
    onAdd: () => void;
    onViewAll: () => void;
    variant?: 'dashboard' | 'grid'; // New prop
}

export const CharacterListPanel: React.FC<CharacterListPanelProps> = ({ 
    characters, onEdit, onAdd, onViewAll, variant = 'grid' 
}) => {
    const { updateCharacter } = useFilmStore();
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerateAll = async () => {
        if (isGenerating) return;
        setIsGenerating(true);
        
        for (const char of characters) {
            const avatarAsset = char.refAssets?.find(a => a.scene === MediaScene.AVATAR);
            if (hasFilmAssetReference(avatarAsset || char.faceImage || null)) continue;
            
            const prompt = `Character design, ${char.name}, ${char.appearance?.gender || ''}, ${char.appearance?.ageGroup || ''}, ${char.description || ''}, detailed, 8k`;
            try {
                const url = await filmService.generateImage(prompt, '3:4');
                const imported = await importFilmAssetFromUrl(
                    url,
                    `${char.name}_avatar`,
                    'image',
                    {
                        origin: 'film-character-auto-gen',
                        characterUuid: char.uuid
                    }
                );
                const newAsset = createFilmAssetMediaResource({
                    assetId: imported.assetId,
                    type: 'image',
                    scene: MediaScene.AVATAR,
                    url: imported.url,
                    fileName: `${char.name}_avatar`
                });
                
                updateCharacter(char.uuid, { 
                    refAssets: upsertFilmRefAssetByScene(char.refAssets, newAsset)
                });
            } catch (e) {
                console.error(`Failed to generate for ${char.name}`, e);
            }
        }
        setIsGenerating(false);
    };

    const isDashboard = variant === 'dashboard';

    return (
        <div className={`space-y-4 ${isDashboard ? 'bg-[#121214] border border-[#27272a] rounded-xl p-5' : ''}`}>
            <div className="flex items-center justify-between">
                 <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${isDashboard ? 'bg-cyan-500/10 text-cyan-400' : 'text-cyan-400'}`}>
                        <Users size={16} /> 
                    </div>
                    <span className="text-sm font-bold text-gray-200 uppercase tracking-wider">
                        Characters
                    </span>
                    <span className="text-xs text-gray-500 font-mono bg-[#252526] px-1.5 py-0.5 rounded ml-2">
                        {characters.length}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={handleGenerateAll}
                        disabled={isGenerating}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#252526] hover:bg-[#333] text-cyan-400 text-[10px] font-bold rounded-lg border border-[#333] hover:border-cyan-500/30 transition-all disabled:opacity-50"
                    >
                        {isGenerating ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                        {isGenerating ? 'Generating...' : 'Auto-Gen Missing'}
                    </button>
                    {isDashboard && (
                        <button onClick={onViewAll} className="p-1.5 hover:bg-[#333] rounded text-gray-500 hover:text-white transition-colors" title="View All">
                            <ArrowRight size={14} />
                        </button>
                    )}
                </div>
            </div>

            {/* Content Area */}
            {isDashboard ? (
                <div className="flex gap-4 overflow-x-auto pb-4 pt-1 no-scrollbar snap-x">
                    {characters.map(char => (
                        <div key={char.uuid} className="flex-none w-[160px] snap-start">
                            <CharacterCard 
                                character={char} 
                                onClick={() => onEdit(char)} 
                            />
                        </div>
                    ))}
                    
                    {/* Add Button (Right aligned in carousel) */}
                    <button 
                        onClick={onAdd}
                        className="flex-none w-[160px] aspect-[3/4] bg-[#1a1a1c] border border-dashed border-[#333] hover:border-cyan-500/50 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-500 hover:text-cyan-400 transition-all group snap-start"
                    >
                        <div className="w-10 h-10 rounded-full bg-[#252526] group-hover:bg-[#2a2a2d] flex items-center justify-center transition-transform group-hover:scale-110">
                            <Plus size={20} />
                        </div>
                        <span className="text-[10px] font-bold uppercase">Add New</span>
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                    {characters.map(char => (
                        <CharacterCard 
                            key={char.uuid} 
                            character={char} 
                            onClick={() => onEdit(char)} 
                        />
                    ))}
                    
                    <button 
                        onClick={onAdd}
                        className="bg-[#121212] border-2 border-dashed border-[#27272a] hover:border-cyan-500/50 rounded-xl flex flex-col items-center justify-center gap-3 text-gray-500 hover:text-cyan-400 transition-all group aspect-[3/4]"
                    >
                        <div className="w-12 h-12 rounded-full bg-[#1e1e1e] flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Plus size={24} />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider">Add Character</span>
                    </button>
                </div>
            )}
        </div>
    );
};
