
import { FilmShot, useAssetUrl } from 'sdkwork-react-commons'
import React, { useState } from 'react';
import { Clapperboard, Video, Image as ImageIcon, Sparkles, Play, Mic, AlertCircle, Trash2 } from 'lucide-react';

export interface ShotCardProps {
    shot: FilmShot;
    onClick: () => void;
    onGenerate: () => void;
    onDelete?: () => void;
}

export const ShotCard: React.FC<ShotCardProps> = ({ shot, onClick, onGenerate, onDelete }) => {
    const [showDelete, setShowDelete] = useState(false);
    const hasVideo = !!shot.generation?.video?.url;
    const hasImage = !!(shot.assets && shot.assets.length > 0);
    const hasAudio = !!(shot.dialogue?.items && shot.dialogue.items.length > 0); 
    const isGenerating = shot.generation?.status === 'GENERATING';
    const isError = shot.generation?.status === 'FAILED';
    
    const rawSource = hasVideo ? shot.generation.video?.url : (hasImage ? shot.assets?.[0]?.url : null);
    
    const { url: displayUrl } = useAssetUrl(rawSource);

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete?.();
    };

    return (
        <div 
            onMouseEnter={() => setShowDelete(true)}
            onMouseLeave={() => setShowDelete(false)}
            onClick={onClick}
            className={`
                group relative flex flex-col h-full bg-[#121212] rounded-xl overflow-hidden 
                border border-[#27272a] hover:border-[#52525b] cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1
            `}
        >
            <div className="relative w-full aspect-video bg-[#050505] overflow-hidden">
                {displayUrl ? (
                    <div className="w-full h-full relative">
                        {hasVideo ? (
                            <video src={displayUrl} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" muted loop />
                        ) : (
                            <img src={displayUrl} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity transform group-hover:scale-105 duration-700" alt="Shot" loading="lazy" />
                        )}
                        
                        {hasVideo && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-transparent transition-colors">
                                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-lg">
                                    <Play size={16} fill="currentColor" className="ml-0.5" />
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-gray-700 bg-[#161618]">
                        {isGenerating ? (
                            <div className="flex flex-col items-center gap-2 text-purple-500 animate-pulse">
                                <Sparkles size={20} />
                                <span className="text-[9px] font-bold uppercase tracking-widest">Generating...</span>
                            </div>
                        ) : isError ? (
                            <div className="flex flex-col items-center gap-1 text-red-500">
                                <AlertCircle size={20} />
                                <span className="text-[9px] font-bold">Generation Failed</span>
                            </div>
                        ) : (
                            <>
                                <Clapperboard size={24} className="opacity-20" />
                                <span className="text-[9px] font-bold opacity-40 uppercase tracking-wider">Empty Shot</span>
                            </>
                        )}
                    </div>
                )}
                
                <div className="absolute top-2 left-2 flex flex-col gap-1 pointer-events-none z-10">
                    <span className="px-1.5 py-0.5 bg-black/60 backdrop-blur-md rounded border border-white/10 text-[8px] font-bold text-gray-300 uppercase shadow-sm">
                        #{shot.index}
                    </span>
                </div>

                <div className="absolute top-2 right-2 flex gap-1 z-10">
                     <StatusDot active={hasImage} icon={ImageIcon} color="text-purple-400" bg="bg-black/60" />
                     <StatusDot active={hasVideo} icon={Video} color="text-pink-400" bg="bg-black/60" />
                     <StatusDot active={hasAudio} icon={Mic} color="text-orange-400" bg="bg-black/60" />
                </div>
                
                <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/80 backdrop-blur-md rounded text-[9px] font-mono text-gray-300 border border-white/10 shadow-sm z-10">
                    {shot.duration}s
                </div>
                
                {onDelete && (
                    <button
                        onClick={handleDelete}
                        className={`
                            absolute bottom-2 left-2 w-7 h-7 rounded-lg bg-black/80 backdrop-blur-md border border-white/10 
                            flex items-center justify-center z-20 transition-all
                            ${showDelete ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}
                            hover:bg-red-500/80 hover:border-red-500/50 text-gray-400 hover:text-white
                        `}
                    >
                        <Trash2 size={12} />
                    </button>
                )}
            </div>

            <div className="p-3 border-t border-[#27272a] bg-[#121212] flex-1 flex flex-col justify-between group-hover:bg-[#18181b] transition-colors">
                <div>
                     <p className="text-[10px] text-gray-300 line-clamp-2 leading-relaxed">
                         {shot.description || <span className="italic text-gray-600">No visual description.</span>}
                     </p>
                </div>
                
                {hasAudio && (
                    <div className="mt-3 pt-2 border-t border-[#27272a] flex items-start gap-1.5">
                        <Mic size={10} className="text-gray-500 mt-0.5 shrink-0" />
                        <p className="text-[9px] text-gray-400 line-clamp-1 italic">"{shot.dialogue?.items?.[0]?.text}"</p>
                    </div>
                )}
            </div>
        </div>
    );

function StatusDot({ active, icon: Icon, color, bg }: { active: boolean; icon: React.ElementType; color: string; bg: string }) {
    return (
        <div className={`${bg} rounded p-1 ${active ? 'opacity-100' : 'opacity-30'}`}>
            <Icon size={10} className={active ? color : 'text-gray-500'} />
        </div>
    );
}
};
