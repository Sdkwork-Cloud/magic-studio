
import React from 'react';
import { MapPin, Sun, Moon, Cloud, Home, Edit3 } from 'lucide-react';
import { FilmLocation } from '../../entities/film.entity';
import { useAssetUrl } from '../../../../hooks/useAssetUrl';
import { MediaScene } from '../../../../types';

export interface LocationCardProps {
    location: FilmLocation;
    onClick?: () => void;
    isSelected?: boolean;
}

export const LocationCard: React.FC<LocationCardProps> = ({ location, onClick, isSelected }) => {
    const faceImageUrl = location.faceImage?.url;
    const visualAsset = location.refAssets?.find(a => a.scene === MediaScene.LOCATION_VISUAL);
    const imageUrl = faceImageUrl || visualAsset?.url || visualAsset?.image?.url;
    const { url: displayUrl } = useAssetUrl(imageUrl || null);

    const getTimeIcon = (t?: string) => {
        switch (t) {
            case 'DAY': return <Sun size={12} className="text-amber-400" />;
            case 'NIGHT': return <Moon size={12} className="text-blue-400" />;
            case 'DAWN': 
            case 'DUSK': return <Cloud size={12} className="text-pink-400" />;
            default: return <Sun size={12} className="text-gray-400" />;
        }
    };

    return (
        <div 
            onClick={onClick}
            className={`
                group relative bg-[#121214] border rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 flex flex-col h-full
                ${isSelected ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-[#27272a] hover:border-amber-500/40'}
            `}
        >
            {/* Visual Area - 16:9 Aspect for Environments */}
            <div className="aspect-video bg-[#0a0a0a] relative overflow-hidden">
                {displayUrl ? (
                    <img 
                        src={displayUrl} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                        alt={location.name} 
                        loading="lazy"
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-700 bg-[#161618]">
                        <MapPin size={32} className="opacity-20 mb-2" />
                        <span className="text-[9px] font-bold uppercase tracking-wider opacity-60">No Concept</span>
                    </div>
                )}
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#121214] via-transparent to-transparent opacity-90" />

                {/* Badges (Top Right) */}
                <div className="absolute top-2 right-2 flex gap-1.5 pointer-events-none">
                     <div className="bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[9px] font-bold text-gray-200 border border-white/10 flex items-center gap-1 shadow-sm">
                        {location.indoor ? <Home size={10} /> : <MapPin size={10} />}
                        <span>{location.indoor ? 'INT' : 'EXT'}</span>
                    </div>
                </div>
                
                {/* Hover Action */}
                 <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 backdrop-blur-[1px]">
                     <div className="bg-black/60 text-white text-[10px] font-bold px-3 py-1.5 rounded-full border border-white/20 backdrop-blur-md shadow-lg flex items-center gap-1.5">
                         <Edit3 size={12} className="text-amber-400" /> Edit Details
                     </div>
                </div>
            </div>

            {/* Info Area */}
            <div className="p-4 flex-1 flex flex-col relative z-10 -mt-2">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-gray-100 text-sm truncate flex-1 pr-2">{location.name}</h3>
                    {location.timeOfDay && (
                        <div className="flex items-center gap-1 bg-[#1a1a1c] px-2 py-0.5 rounded border border-[#27272a]">
                            {getTimeIcon(location.timeOfDay)}
                            <span className="text-[9px] font-medium text-gray-400">{location.timeOfDay}</span>
                        </div>
                    )}
                </div>
                
                <p className="text-[10px] text-gray-500 line-clamp-2 leading-relaxed mb-3 h-8">
                    {location.visualDescription || "No description provided."}
                </p>

                {location.atmosphereTags && location.atmosphereTags.length > 0 && (
                     <div className="mt-auto flex flex-wrap gap-1.5">
                        {location.atmosphereTags.slice(0, 3).map((tag, i) => (
                            <span key={i} className="text-[9px] bg-[#1a1a1c] text-amber-500/80 px-2 py-0.5 rounded border border-[#27272a] font-medium">
                                {tag}
                            </span>
                        ))}
                     </div>
                )}
            </div>
        </div>
    );
};
