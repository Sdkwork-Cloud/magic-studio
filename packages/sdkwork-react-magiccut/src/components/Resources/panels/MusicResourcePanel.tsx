
import React, { useState } from 'react';
import { AnyAsset } from 'sdkwork-react-assets';
import { Play, Heart, Music, Trash2 } from 'lucide-react';
import { useAssetUrl } from 'sdkwork-react-assets';

interface MusicResourcePanelProps {
    assets: AnyAsset[];
    onDragStart: (e: React.DragEvent, item: AnyAsset) => void;
    onToggleFavorite: (id: string, isFavorite: boolean) => void;
    onPreview: (item: AnyAsset) => void;
    onDelete?: (item: AnyAsset) => void;
}

export const MusicResourcePanel: React.FC<MusicResourcePanelProps> = React.memo(({
    assets,
    onDragStart,
    onToggleFavorite,
    onPreview,
    onDelete
}) => {
    const [playingId, setPlayingId] = useState<string | null>(null);

    const handlePlayToggle = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setPlayingId(playingId === id ? null : id);
        // In a real app, integrate with an audio player service here
    };

    return (
        <div className="grid grid-cols-4 gap-2 content-start pb-10 px-2">
            {assets.map((item) => (
                <MusicCard 
                    key={item.id}
                    item={item}
                    isPlaying={playingId === item.id}
                    onPlayToggle={handlePlayToggle}
                    onDragStart={onDragStart}
                    onToggleFavorite={onToggleFavorite}
                    onDelete={onDelete}
                />
            ))}
        </div>
    );
});

const MusicCard: React.FC<{
    item: AnyAsset;
    isPlaying: boolean;
    onPlayToggle: (e: React.MouseEvent, id: string) => void;
    onDragStart: (e: React.DragEvent, item: AnyAsset) => void;
    onToggleFavorite: (id: string, isFavorite: boolean) => void;
    onDelete?: (item: AnyAsset) => void;
}> = ({ item, isPlaying, onPlayToggle, onDragStart, onToggleFavorite, onDelete }) => {
    const { url: thumbnail } = useAssetUrl(item.metadata?.thumbnailUrl ? { id: 'thumb', path: item.metadata.thumbnailUrl } as any : null);
    
    // Fallback gradient if no thumb
    const gradient = `linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)`; // Indigo theme
    const canDelete = item.origin !== 'stock' && item.origin !== 'system' && onDelete;

    return (
        <div 
            draggable
            onDragStart={(e) => onDragStart(e, item)}
            className={`
                group relative aspect-square rounded-lg overflow-hidden cursor-grab active:cursor-grabbing select-none border transition-all
                ${isPlaying ? 'border-indigo-500 ring-1 ring-indigo-500/50' : 'border-[#27272a] hover:border-[#444]'}
                bg-[#18181b]
            `}
            onClick={(e) => onPlayToggle(e, item.id)}
            title={item.name}
        >
            {/* Background / Cover */}
            <div className="absolute inset-0">
                {thumbnail ? (
                    <img src={thumbnail} className={`w-full h-full object-cover transition-opacity duration-300 ${isPlaying ? 'opacity-40' : 'opacity-80 group-hover:opacity-100'}`} draggable={false} />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-indigo-400/50" style={{ background: gradient }}>
                        <Music size={24} />
                    </div>
                )}
            </div>

            {/* Playing Animation Overlay */}
            {isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center gap-0.5 bg-black/40 backdrop-blur-[1px]">
                     {[...Array(4)].map((_, i) => (
                        <div 
                            key={i} 
                            className="w-1 bg-indigo-400 rounded-full animate-music-bar"
                            style={{ 
                                height: '40%',
                                animationDuration: '0.6s',
                                animationDelay: `${i * 0.1}s` 
                            }} 
                        />
                     ))}
                </div>
            )}

            {/* Hover Play Button */}
            {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                    <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30 shadow-lg hover:scale-110 transition-transform">
                        <Play size={12} fill="currentColor" className="ml-0.5" />
                    </div>
                </div>
            )}

            {/* Info Overlay (Bottom) */}
            <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-black/90 to-transparent">
                <div className="text-[9px] font-bold text-gray-200 truncate leading-tight shadow-black drop-shadow-md">
                    {item.name}
                </div>
                <div className="text-[8px] text-gray-400 truncate opacity-80">
                    {(item as any).artist || 'Music'}
                </div>
            </div>

            {/* Top Right Actions */}
            <div className="absolute top-1 right-1 flex gap-1">
                 {canDelete && (
                     <button 
                        onClick={(e) => { e.stopPropagation(); onDelete(item); }}
                        className="p-1 rounded-full bg-black/40 text-gray-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                     >
                         <Trash2 size={10} />
                     </button>
                 )}
                <button 
                    onClick={(e) => { e.stopPropagation(); onToggleFavorite(item.id, !item.isFavorite); }}
                    className={`
                        p-1 rounded-full transition-all
                        ${item.isFavorite 
                            ? 'text-red-500 opacity-100' 
                            : 'text-white/50 hover:text-white opacity-0 group-hover:opacity-100 hover:bg-black/40'
                        }
                    `}
                >
                    <Heart size={10} fill={item.isFavorite ? "currentColor" : "none"} />
                </button>
            </div>

            <style>{`
                @keyframes music-bar {
                    0%, 100% { height: 20%; }
                    50% { height: 60%; }
                }
                .animate-music-bar {
                    animation-name: music-bar;
                    animation-iteration-count: infinite;
                    animation-timing-function: ease-in-out;
                }
            `}</style>
        </div>
    );
};

