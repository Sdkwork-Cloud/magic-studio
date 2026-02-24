
import React from 'react';
import { User, Sparkles } from 'lucide-react';

import { FilmCharacter, useAssetUrl, MediaScene } from 'sdkwork-react-commons';

export interface CharacterCardProps {
    character: FilmCharacter;
    onClick?: () => void;
    isSelected?: boolean;
}

export const CharacterCard: React.FC<CharacterCardProps> = ({ character, onClick, isSelected }) => {
    const faceImageUrl = character.faceImage?.url;
    const avatarAsset = character.refAssets?.find(a => a.scene === MediaScene.AVATAR);
    const avatarUrl = faceImageUrl || avatarAsset?.url || avatarAsset?.image?.url;
    const { url: displayUrl } = useAssetUrl(avatarUrl || null);

    return (
        <div 
            onClick={onClick}
            className={`
                group relative bg-[#121214] border rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 flex flex-col h-full
                ${isSelected 
                    ? 'border-cyan-500 ring-2 ring-cyan-500/20' 
                    : 'border-[#27272a] hover:border-cyan-500/40'
                }
            `}
        >
            {/* Image Area */}
            <div className="aspect-[3/4] bg-[#0a0a0a] relative overflow-hidden">
                {displayUrl ? (
                    <img 
                        src={displayUrl} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                        alt={character.name} 
                        loading="lazy"
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-700 bg-[#161618]">
                        <User size={32} strokeWidth={1.5} className="mb-2" />
                        <span className="text-[10px] uppercase font-bold tracking-wider opacity-60">No Visual</span>
                    </div>
                )}
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#121214] via-transparent to-transparent opacity-80" />
                
                {/* Hover Action */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 backdrop-blur-[1px]">
                     <div className="bg-black/60 text-white text-[10px] font-bold px-3 py-1.5 rounded-full border border-white/20 backdrop-blur-md shadow-lg flex items-center gap-1.5">
                         <Sparkles size={12} className="text-cyan-400" /> Edit
                     </div>
                </div>
            </div>

            {/* Info Area */}
            <div className="p-4 flex-1 flex flex-col relative z-10 -mt-2">
                <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-gray-100 text-sm truncate flex-1 pr-2">{character.name}</h3>
                    {character.appearance?.gender && (
                        <span className="text-[9px] font-bold text-gray-500 bg-[#1a1a1c] px-1.5 py-0.5 rounded border border-[#27272a] uppercase">
                            {character.appearance.gender.substring(0, 1)}
                        </span>
                    )}
                </div>
                
                <p className="text-[10px] text-cyan-500/80 font-medium mb-2 uppercase tracking-wide">
                    {character.appearance?.ageGroup || 'Unknown Age'}
                </p>
                
                {character.personality?.traits && character.personality.traits.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 mt-auto">
                        {character.personality.traits.slice(0, 3).map(tag => (
                            <span key={tag} className="text-[9px] bg-[#1a1a1c] text-gray-400 px-2 py-0.5 rounded-md border border-[#27272a] group-hover:border-[#333] transition-colors">
                                {tag}
                            </span>
                        ))}
                    </div>
                ) : (
                    <p className="text-[10px] text-gray-600 line-clamp-2 mt-auto leading-relaxed italic">
                        {character.description || "No description provided."}
                    </p>
                )}
            </div>
        </div>
    );
};
