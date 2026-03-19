
import React, { useState } from 'react';
import { AnyAsset } from '@sdkwork/react-assets';
import { Play, Pause, Heart, MoreHorizontal } from 'lucide-react';
import { resolveNextFavoriteState } from '../../../domain/assets/favoriteToggle';
import { buildDeterministicBarHeights } from '../../../domain/assets/audioVisualization';

interface AudioResourceListProps {
    assets: AnyAsset[];
    onDragStart: (e: React.DragEvent, item: AnyAsset) => void;
    onToggleFavorite: (id: string, isFavorite: boolean) => void;
    onPreview: (item: AnyAsset | null) => void;
}

export const AudioResourceList: React.FC<AudioResourceListProps> = React.memo(({
    assets,
    onDragStart,
    onToggleFavorite,
    onPreview
}) => {
    const [playingId, setPlayingId] = useState<string | null>(null);

    const handlePlayToggle = (e: React.MouseEvent, item: AnyAsset) => {
        e.stopPropagation();
        const nextPlayingId = playingId === item.id ? null : item.id;
        setPlayingId(nextPlayingId);
        onPreview(nextPlayingId ? item : null);
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="flex flex-col gap-2 pb-10 px-1">
            {assets.map((item) => {
                const duration = (item as any).duration || 0;
                const isPlaying = playingId === item.id;
                const waveformBars = buildDeterministicBarHeights(item.id, 8, 0.2, 1);
                
                return (
                    <div 
                        key={item.id}
                        draggable
                        onDragStart={(e) => onDragStart(e, item)}
                        className="group relative bg-[#252526] border border-[#333] hover:border-[#555] rounded-lg p-2.5 flex flex-col gap-2 cursor-grab active:cursor-grabbing transition-all hover:shadow-md select-none"
                    >
                        {/* Top: Icon & Play */}
                        <div className="flex justify-between items-start">
                             <div 
                                className="w-8 h-8 rounded-md bg-[#1e1e1e] flex items-center justify-center text-emerald-500 cursor-pointer hover:bg-emerald-500 hover:text-white transition-colors border border-[#333]"
                                onClick={(e) => handlePlayToggle(e, item)}
                             >
                                 {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" className="ml-0.5" />}
                             </div>
                            
                             <button 
                                onClick={(e) => { e.stopPropagation(); onToggleFavorite(item.id, resolveNextFavoriteState(item.isFavorite)); }}
                                className={`transition-colors p-1 rounded-full hover:bg-[#333] ${item.isFavorite ? 'text-red-500' : 'text-gray-600 hover:text-red-400'}`}
                            >
                                <Heart size={12} fill={item.isFavorite ? "currentColor" : "none"} />
                            </button>
                        </div>
                        
                        {/* Middle: Waveform Visual */}
                        <div className="h-6 flex items-center gap-0.5 opacity-50 overflow-hidden">
                             {waveformBars.map((height, i) => (
                                <div 
                                    key={i} 
                                    className={`w-1 rounded-full ${isPlaying ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'}`}
                                    style={{ height: `${height * 100}%` }}
                                />
                             ))}
                        </div>

                        {/* Bottom: Info */}
                        <div className="min-w-0">
                            <div className="text-[10px] font-medium text-gray-200 truncate" title={item.name}>{item.name}</div>
                            <div className="text-[9px] text-gray-500 font-mono mt-0.5 flex justify-between">
                                <span>{formatTime(duration)}</span>
                                <MoreHorizontal size={10} className="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:text-white" />
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
});

