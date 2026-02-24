
import React, { useState } from 'react';
import { MapPin, ArrowRight, Sparkles, Plus, Loader2 } from 'lucide-react';
import { FilmLocation } from '../../entities/film.entity';
import { LocationCard } from './LocationCard';
import { filmService } from '../../services/filmService';
import { useFilmStore } from '../../store/filmStore';
import { generateUUID } from '../../../../utils';

interface LocationListPanelProps {
    locations: FilmLocation[];
    onEdit: (loc: FilmLocation) => void;
    onAdd: () => void;
    onViewAll: () => void;
    variant?: 'dashboard' | 'grid'; // New prop
}

export const LocationListPanel: React.FC<LocationListPanelProps> = ({ 
    locations, onEdit, onAdd, onViewAll, variant = 'grid' 
}) => {
    const { updateLocation } = useFilmStore();
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerateAll = async () => {
        if (isGenerating) return;
        setIsGenerating(true);
        
        for (const loc of locations) {
            if (loc.image?.url) continue;
            const prompt = `Location concept art, ${loc.name}, ${loc.indoor ? 'interior' : 'exterior'}, ${loc.timeOfDay?.toLowerCase() || 'day'}, ${loc.visualDescription || ''}, cinematic lighting, wide shot, 8k`;
            try {
                const url = await filmService.generateImage(prompt, '16:9');
                updateLocation(loc.uuid, { 
                    image: { 
                        id: generateUUID(), 
                        url, 
                        type: 'IMAGE', 
                        name: `${loc.name}_concept` 
                    } as any 
                });
            } catch (e) {
                console.error(`Failed to generate location ${loc.name}`, e);
            }
        }
        setIsGenerating(false);
    };

    const isDashboard = variant === 'dashboard';

    return (
        <div className={`space-y-4 ${isDashboard ? 'bg-[#121214] border border-[#27272a] rounded-xl p-5' : ''}`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${isDashboard ? 'bg-amber-500/10 text-amber-400' : 'text-amber-400'}`}>
                        <MapPin size={16} />
                    </div>
                    <span className="text-sm font-bold text-gray-200 uppercase tracking-wider">
                        场景列表 (Locations)
                    </span>
                    <span className="text-xs text-gray-500 font-mono bg-[#252526] px-1.5 py-0.5 rounded ml-2">
                        {locations.length}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={handleGenerateAll}
                        disabled={isGenerating}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#252526] hover:bg-[#333] text-amber-400 text-[10px] font-bold rounded-lg border border-[#333] hover:border-amber-500/30 transition-all disabled:opacity-50"
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
                    {locations.map(loc => (
                        <div key={loc.uuid} className="flex-none w-[240px] snap-start">
                            <LocationCard 
                                location={loc} 
                                onClick={() => onEdit(loc)} 
                            />
                        </div>
                    ))}
                    
                    <button 
                        onClick={onAdd}
                        className="flex-none w-[240px] aspect-video bg-[#1a1a1c] border border-dashed border-[#333] hover:border-amber-500/50 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-500 hover:text-amber-400 transition-all group snap-start"
                    >
                         <div className="w-10 h-10 rounded-full bg-[#252526] group-hover:bg-[#2a2a2d] flex items-center justify-center transition-transform group-hover:scale-110">
                            <Plus size={20} />
                        </div>
                        <span className="text-[10px] font-bold uppercase">Add New</span>
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                    {locations.map(loc => (
                        <LocationCard 
                            key={loc.uuid} 
                            location={loc} 
                            onClick={() => onEdit(loc)} 
                        />
                    ))}
                    <button 
                        onClick={onAdd}
                        className="aspect-video bg-[#121212] border-2 border-dashed border-[#27272a] hover:border-amber-500/50 rounded-xl flex flex-col items-center justify-center text-gray-500 hover:text-amber-400 transition-colors group"
                    >
                         <div className="w-8 h-8 rounded-full bg-[#1e1e1e] flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                            <Plus size={16} />
                        </div>
                        <span className="text-[10px] font-bold uppercase">Add Location</span>
                    </button>
                </div>
            )}
        </div>
    );
};
