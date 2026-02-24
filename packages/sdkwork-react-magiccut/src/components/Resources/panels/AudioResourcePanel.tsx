
import React, { useState } from 'react';
import { AnyAsset } from 'sdkwork-react-assets';
import { MediaResourceType } from 'sdkwork-react-commons';
import { Pause, Heart, FileAudio, Mic2, Trash2 } from 'lucide-react';

interface AudioResourcePanelProps {
    assets: AnyAsset[];
    onDragStart: (e: React.DragEvent, item: AnyAsset) => void;
    onToggleFavorite: (id: string, isFavorite: boolean) => void;
    onPreview: (item: AnyAsset) => void;
    onDelete?: (item: AnyAsset) => void;
}

export const AudioResourcePanel: React.FC<AudioResourcePanelProps> = React.memo(({
    assets,
    onDragStart,
    onToggleFavorite,
    onPreview,
    onDelete
}) => {
    const [playingId, setPlayingId] = useState<string | null>(null);

    return (
        <div className="grid grid-cols-4 gap-2 content-start pb-10 px-2">
            {assets.map((item) => (
                <AudioTile 
                    key={item.id}
                    item={item}
                    isPlaying={playingId === item.id}
                    onPlayToggle={(e) => {
                        e.stopPropagation();
                        setPlayingId(playingId === item.id ? null : item.id);
                    }}
                    onDragStart={onDragStart}
                    onToggleFavorite={onToggleFavorite}
                    onDelete={onDelete}
                />
            ))}
        </div>
    );
});

const AudioTile: React.FC<{
    item: AnyAsset;
    isPlaying: boolean;
    onPlayToggle: (e: React.MouseEvent) => void;
    onDragStart: (e: React.DragEvent, item: AnyAsset) => void;
    onToggleFavorite: (id: string, isFavorite: boolean) => void;
    onDelete?: (item: AnyAsset) => void;
}> = ({ item, isPlaying, onPlayToggle, onDragStart, onToggleFavorite, onDelete }) => {
    
    // Determine icon based on type hint
    const getIcon = () => {
        if (item.type === MediaResourceType.VOICE || item.type === MediaResourceType.SPEECH) return <Mic2 size={16} />;
        return <FileAudio size={16} />;
    };

    const formatDuration = (d?: number) => {
        if (!d) return '';
        const m = Math.floor(d / 60);
        const s = Math.floor(d % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const canDelete = item.origin !== 'stock' && item.origin !== 'system' && onDelete;

    return (
        <div 
            draggable
            onDragStart={(e) => onDragStart(e, item)}
            className={`
                group relative aspect-square bg-[#1e1e1e] border rounded-lg p-2 flex flex-col justify-between cursor-grab active:cursor-grabbing select-none transition-all
                ${isPlaying 
                    ? 'border-emerald-500 bg-emerald-900/10' 
                    : 'border-[#27272a] hover:border-[#444] hover:bg-[#252526]'
                }
            `}
            onClick={onPlayToggle}
        >
            {/* Top Row: Icon */}
            <div className="flex justify-between items-start">
                <div className={`p-1.5 rounded-md ${isPlaying ? 'bg-emerald-500 text-white' : 'bg-[#2a2a2c] text-emerald-600'}`}>
                    {isPlaying ? <Pause size={10} fill="currentColor" /> : getIcon()}
                </div>
                
                <div className="flex gap-1">
                     {canDelete && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); onDelete(item); }}
                            className="transition-opacity opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 p-1"
                        >
                            <Trash2 size={10} />
                        </button>
                    )}
                    <button 
                        onClick={(e) => { e.stopPropagation(); onToggleFavorite(item.id, !item.isFavorite); }}
                        className={`transition-opacity p-1 rounded-full hover:bg-[#333] ${item.isFavorite ? 'opacity-100 text-red-500' : 'opacity-0 group-hover:opacity-100 text-gray-500 hover:text-white'}`}
                    >
                        <Heart size={10} fill={item.isFavorite ? "currentColor" : "none"} />
                    </button>
                </div>
            </div>

            {/* Waveform Visualization (Fake) */}
            <div className="flex items-end gap-[1px] h-6 opacity-30 group-hover:opacity-50 transition-opacity">
                {[...Array(6)].map((_, i) => (
                    <div 
                        key={i} 
                        className={`w-full rounded-t-sm ${isPlaying ? 'bg-emerald-400 animate-pulse' : 'bg-gray-400'}`}
                        style={{ height: `${30 + Math.random() * 70}%` }}
                    />
                ))}
            </div>

            {/* Info */}
            <div className="min-w-0">
                 <div className="text-[9px] font-bold text-gray-300 truncate leading-tight mb-0.5">{item.name}</div>
                 <div className="text-[8px] text-gray-500 font-mono">
                     {formatDuration((item as any).duration)}
                 </div>
            </div>
        </div>
    );
};

