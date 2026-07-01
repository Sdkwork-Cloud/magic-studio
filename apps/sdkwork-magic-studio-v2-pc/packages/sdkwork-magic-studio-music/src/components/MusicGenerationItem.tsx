import React, { useState } from 'react';
import { resolveEntityKey } from '@sdkwork/magic-studio-types/entity';
import {
    Play, Pause, Trash2, Heart, MoreHorizontal,
    Repeat2, Music, AlertCircle
} from 'lucide-react';
import {
    resolveGeneratedMusicResultCoverUrl,
    resolveGeneratedMusicResultUrl,
    type MusicTask,
    type GeneratedMusicResult,
} from '../entities';

interface MusicGenerationItemProps {
    task: MusicTask;
    onDelete: (id: string) => void;
    onReuse: (task: MusicTask) => void;
    onToggleFavorite: (id: string) => void;
}

const MUSIC_VISUALIZER_BAR_HEIGHTS = Array.from({ length: 40 }, (_, index) => 24 + ((index * 17) % 64));

export const MusicGenerationItem: React.FC<MusicGenerationItemProps> = ({ task, onDelete, onReuse, onToggleFavorite }) => {
    if (task.status === 'pending') {
        return (
            <div className="w-full h-32 bg-[#18181b] border border-[#27272a] border-dashed rounded-xl flex flex-col items-center justify-center text-indigo-400 gap-3 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center">
                     <Music size={16} className="animate-bounce" />
                </div>
                <span className="text-xs font-medium">Creating your music...</span>
            </div>
        );
    }

    if (task.status === 'failed') {
        return (
            <div className="w-full bg-red-900/10 border border-red-900/30 rounded-xl p-4 flex items-center gap-3 text-red-400">
                <AlertCircle size={20} />
                <span className="text-xs font-medium">{task.error || 'Generation failed'}</span>
                <div className="flex-1" />
                <button onClick={() => onDelete(resolveEntityKey(task))} className="p-1.5 hover:bg-red-900/30 rounded">
                    <Trash2 size={14} />
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3">
            {(task as any).results?.map((result: any) => (
                <MusicCard
                    key={resolveEntityKey(result)}
                    result={result}
                    task={task}
                    onReuse={() => onReuse(task)}
                    onToggleFavorite={() => onToggleFavorite(resolveEntityKey(task))}
                    isFavorite={!!(task as any).isFavorite}
                />
            ))}
        </div>
    );
};

const MusicCard: React.FC<{ 
    result: GeneratedMusicResult; 
    task: MusicTask;
    onReuse: () => void;
    onToggleFavorite: () => void;
    isFavorite: boolean;
}> = ({ result, task, onReuse, onToggleFavorite, isFavorite }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = React.useRef<HTMLAudioElement>(null);
    const coverUrl = resolveGeneratedMusicResultCoverUrl(result);
    const audioUrl = resolveGeneratedMusicResultUrl(result);

    const togglePlay = () => {
        if (!audioRef.current || !audioUrl) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    return (
        <div className="group relative bg-[#18181b] border border-[#27272a] hover:border-[#3f3f46] rounded-xl p-3 flex gap-4 transition-all hover:shadow-lg">
            <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-black flex-shrink-0 group/cover">
                <img src={coverUrl || ''} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="Cover" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover/cover:opacity-100 transition-opacity">
                     <button 
                        onClick={togglePlay}
                        className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform"
                    >
                         {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
                     </button>
                </div>
            </div>

            <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className="flex justify-between items-start">
                    <h3 className="font-bold text-gray-200 text-base truncate pr-4">{(result as any).title || 'Untitled'}</h3>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button onClick={onToggleFavorite} className={`p-1.5 rounded-md hover:bg-[#333] transition-colors ${isFavorite ? 'text-yellow-500' : 'text-gray-500'}`}>
                             <Heart size={14} fill={isFavorite ? "currentColor" : "none"} />
                         </button>
                         <button onClick={onReuse} className="p-1.5 rounded-md hover:bg-[#333] text-gray-500 hover:text-white transition-colors" title="Extend/Remix">
                             <Repeat2 size={14} />
                         </button>
                         <button className="p-1.5 rounded-md hover:bg-[#333] text-gray-500 hover:text-white transition-colors">
                             <MoreHorizontal size={14} />
                         </button>
                    </div>
                </div>
                
                <div className="text-xs text-gray-500 mt-1 line-clamp-1 font-mono">
                    {(result as any).style || (task as any).config?.prompt}
                </div>

                <div className="mt-3 h-8 bg-[#252526] rounded flex items-center px-2 gap-1 overflow-hidden">
                    {MUSIC_VISUALIZER_BAR_HEIGHTS.map((height, i) => (
                        <div 
                            key={i} 
                            className={`w-1 rounded-full transition-all duration-300 ${isPlaying ? 'bg-indigo-500 animate-pulse' : 'bg-[#333]'}`}
                            style={{ 
                                height: `${height}%`,
                                animationDelay: `${i * 0.05}s`
                            }}
                        />
                    ))}
                </div>
            </div>

            <audio ref={audioRef} src={audioUrl || undefined} onEnded={() => setIsPlaying(false)} />
        </div>
    );
};
