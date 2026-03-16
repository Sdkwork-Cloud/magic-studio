
import React, { useState } from 'react';
import { AnyAsset } from '@sdkwork/react-assets';
import { Play, Pause, Heart, MoreHorizontal, Music } from 'lucide-react';
import { useAssetUrl } from '@sdkwork/react-assets';

interface MusicResourceListProps {
    assets: AnyAsset[];
    onDragStart: (e: React.DragEvent, item: AnyAsset) => void;
    onToggleFavorite: (id: string, isFavorite: boolean) => void;
    onPreview: (item: AnyAsset | null) => void;
}

export const MusicResourceList: React.FC<MusicResourceListProps> = React.memo(({
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

    return (
        <div className="flex flex-col gap-2 pb-10 px-1">
            {assets.map((item) => (
                <MusicItem 
                    key={item.id}
                    item={item}
                    isPlaying={playingId === item.id}
                    onPlayToggle={handlePlayToggle}
                    onDragStart={onDragStart}
                    onToggleFavorite={onToggleFavorite}
                />
            ))}
            
            <style>{`
                @keyframes music-bar {
                    0%, 100% { height: 20%; }
                    50% { height: 100%; }
                }
                .animate-music-bar {
                    animation: music-bar 0.6s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
});

const MusicItem: React.FC<{
    item: AnyAsset;
    isPlaying: boolean;
    onPlayToggle: (e: React.MouseEvent, item: AnyAsset) => void;
    onDragStart: (e: React.DragEvent, item: AnyAsset) => void;
    onToggleFavorite: (id: string, isFavorite: boolean) => void;
}> = ({ item, isPlaying, onPlayToggle, onDragStart, onToggleFavorite }) => {
    const duration = (item as any).duration || 0;
    
    // Resolve Cover Art
    const { url: thumbnail } = useAssetUrl(item.metadata?.thumbnailUrl ? { id: 'thumb', path: item.metadata.thumbnailUrl } as any : null);

    const formatTime = (seconds: number) => {
        if (!seconds) return '0:00';
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div 
            draggable
            onDragStart={(e) => onDragStart(e, item)}
            className={`
                group flex items-center gap-3 p-2 rounded-xl border transition-all cursor-grab active:cursor-grabbing select-none
                ${isPlaying 
                    ? 'bg-indigo-900/20 border-indigo-500/50' 
                    : 'bg-[#252526] border-transparent hover:border-[#333] hover:bg-[#2a2a2d]'
                }
            `}
        >
            {/* 1. Play/Cover */}
            <div 
                className={`
                    relative w-12 h-12 rounded-lg flex-shrink-0 cursor-pointer overflow-hidden group/cover mt-0.5
                    ${!thumbnail ? 'bg-[#252526] flex items-center justify-center' : ''}
                `}
                onClick={(e) => onPlayToggle(e, item)}
            >
                    {thumbnail ? (
                        <img src={thumbnail} className={`w-full h-full object-cover transition-opacity duration-300 ${isPlaying ? 'opacity-40' : 'opacity-100 group-hover/cover:opacity-60'}`} draggable={false} />
                    ) : (
                        <Music size={18} className={`transition-colors ${isPlaying ? 'text-indigo-400' : 'text-gray-600'}`} />
                    )}
                    
                    {/* Play Overlay */}
                    <div className={`absolute inset-0 flex items-center justify-center transition-all duration-200 ${isPlaying ? 'opacity-100' : 'opacity-0 group-hover/cover:opacity-100'}`}>
                        <div className="w-6 h-6 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white border border-white/20">
                            {isPlaying ? <Pause size={10} fill="currentColor" /> : <Play size={10} fill="currentColor" className="ml-0.5" />}
                        </div>
                    </div>
                    
                    {/* Playing EQ Animation */}
                    {isPlaying && (
                    <div className="absolute bottom-1 left-0 right-0 flex justify-center gap-[2px] h-3 items-end">
                        {[1,2,3,4].map(i => (
                            <div key={i} className="w-1 bg-indigo-500 animate-music-bar rounded-t-sm" style={{ animationDelay: `${i * 0.1}s` }} />
                        ))}
                    </div>
                    )}
            </div>

            {/* 2. Info */}
            <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                <div className="flex justify-between items-start">
                    <h4 className={`text-xs font-bold truncate leading-tight pr-2 ${isPlaying ? 'text-indigo-200' : 'text-gray-200 group-hover:text-white'}`} title={item.name}>
                        {item.name}
                    </h4>
                </div>
                
                <div className="flex items-center justify-between mt-auto">
                    <span className="text-[10px] text-gray-500 truncate max-w-[60%]">
                        {(item as any).artist || 'Unknown'}
                    </span>
                    <span className="text-[9px] font-mono text-gray-400 bg-[#252526] px-1.5 py-0.5 rounded border border-[#333]">
                        {formatTime(duration)}
                    </span>
                </div>
            </div>
            
            {/* 3. Favorite Action (Absolute top right) */}
            <button 
                onClick={(e) => { e.stopPropagation(); onToggleFavorite(item.id, !item.isFavorite); }}
                className={`absolute top-2 right-2 p-1 rounded-full transition-opacity hover:bg-[#333] ${item.isFavorite ? 'opacity-100 text-red-500' : 'opacity-0 group-hover:opacity-100 text-gray-500 hover:text-white'}`}
            >
                <Heart size={10} fill={item.isFavorite ? "currentColor" : "none"} />
            </button>
        </div>
    );
};

