
import { FilmShot } from '@sdkwork/react-commons';
import React, { useRef, useEffect, useState } from 'react';
import { useFilmStore } from '../store/filmStore';
import { 
    Play, Pause, SkipBack, SkipForward, Clapperboard, 
    Image as ImageIcon, Video, Monitor, Volume2, VolumeX, 
    Captions, Edit2, Trash2 
} from 'lucide-react';
import { ShotModal } from './ShotModal';

// --- Sub-Component: Stage (Player) ---
const PreviewStage: React.FC = () => {
    const { currentPreviewItem, isPreviewPlaying, showSubtitles, isMuted } = useFilmStore();
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoRef.current) {
            if (isPreviewPlaying && currentPreviewItem?.shot.generation?.video?.url) {
                videoRef.current.play().catch(() => {});
            } else {
                videoRef.current.pause();
            }
        }
    }, [isPreviewPlaying, currentPreviewItem]);

    if (!currentPreviewItem) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-black text-gray-600">
                <Monitor size={48} className="opacity-20 mb-4" />
                <p className="text-sm font-medium">No active shot</p>
            </div>
        );
    }

    const { shot } = currentPreviewItem;
    const videoUrl = shot.generation?.video?.url;
    const imageUrl = shot.assets?.[0]?.url;
    
    const subtitleText = shot.dialogue?.items?.map(d => d.text).join(' ') || '';

    return (
        <div className="flex-1 bg-black flex items-center justify-center relative overflow-hidden">
            {videoUrl ? (
                <video 
                    ref={videoRef}
                    key={shot.uuid}
                    src={videoUrl}
                    className="max-h-full max-w-full object-contain"
                    loop
                    muted={isMuted}
                    playsInline
                />
            ) : imageUrl ? (
                <img 
                    src={imageUrl} 
                    className="max-h-full max-w-full object-contain" 
                    alt={`Shot ${shot.index}`} 
                />
            ) : (
                <div className="flex flex-col items-center justify-center text-gray-700">
                    <Clapperboard size={48} className="opacity-20 mb-2" />
                    <p className="text-xs">No media generated</p>
                    <p className="text-[10px] mt-1 opacity-50">{shot.description}</p>
                </div>
            )}
            
            <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-white text-xs z-10">
                <span className="font-bold text-gray-400 mr-2">SHOT {shot.index}</span>
                <span className="font-medium">{shot.duration}s</span>
            </div>

            {/* Subtitle Overlay */}
            {showSubtitles && subtitleText && (
                <div className="absolute bottom-8 left-0 right-0 flex justify-center z-20 px-8">
                    <div className="bg-black/70 backdrop-blur-md px-4 py-2 rounded-xl text-white text-sm font-medium text-center border border-white/10 shadow-lg max-w-2xl leading-relaxed">
                        {subtitleText}
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Sub-Component: Controls ---
const PreviewControls: React.FC<{ onEdit: () => void }> = ({ onEdit }) => {
    const { 
        isPreviewPlaying, togglePreviewPlay, seekPreview, 
        previewTime, previewTotalDuration,
        showSubtitles, toggleSubtitles,
        isMuted, toggleMute,
        currentPreviewItem, deleteShot
    } = useFilmStore();

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const handleDelete = () => {
        if (currentPreviewItem && confirm('Are you sure you want to delete this shot?')) {
             deleteShot(currentPreviewItem.shot.uuid);
        }
    };

    return (
        <div className="h-14 bg-[#18181b] border-t border-[#27272a] flex items-center justify-between px-6 shrink-0 z-20">
            {/* Left: Time & Toggles */}
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-4">
                    <span className="font-mono text-blue-400 text-sm font-bold w-16">
                        {formatTime(previewTime)}
                    </span>
                    <span className="text-gray-600 text-xs">/ {formatTime(previewTotalDuration)}</span>
                </div>
                
                <div className="h-4 w-px bg-[#333]" />

                <div className="flex items-center gap-2">
                    <button 
                        onClick={toggleSubtitles}
                        className={`p-2 rounded-lg transition-colors ${showSubtitles ? 'text-white bg-[#333]' : 'text-gray-500 hover:text-white hover:bg-[#252526]'}`}
                        title="Toggle Subtitles"
                    >
                        <Captions size={16} />
                    </button>
                    <button 
                        onClick={toggleMute}
                        className={`p-2 rounded-lg transition-colors ${isMuted ? 'text-red-400 bg-[#333]' : 'text-gray-400 hover:text-white hover:bg-[#252526]'}`}
                        title="Toggle Audio"
                    >
                        {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                    </button>
                </div>
            </div>

            {/* Center: Playback */}
            <div className="flex items-center gap-4">
                <button 
                    onClick={() => seekPreview(0)}
                    className="text-gray-400 hover:text-white transition-colors"
                >
                    <SkipBack size={20} />
                </button>
                <button 
                    onClick={togglePreviewPlay}
                    className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform shadow-lg shadow-white/10"
                >
                    {isPreviewPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
                </button>
                <button 
                    onClick={() => seekPreview(previewTotalDuration)}
                    className="text-gray-400 hover:text-white transition-colors"
                >
                    <SkipForward size={20} />
                </button>
            </div>

            {/* Right: Clip Actions */}
            <div className="flex items-center gap-2">
                <button 
                    onClick={onEdit}
                    disabled={!currentPreviewItem}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-300 hover:text-white hover:bg-[#252526] rounded-lg transition-colors disabled:opacity-50"
                >
                    <Edit2 size={14} /> Edit Shot
                </button>
                <button 
                    onClick={handleDelete}
                    disabled={!currentPreviewItem}
                    className="p-2 text-gray-500 hover:text-red-400 hover:bg-[#252526] rounded-lg transition-colors disabled:opacity-50"
                >
                    <Trash2 size={16} />
                </button>
            </div>
        </div>
    );
};

// --- Sub-Component: Timeline Track ---
const PreviewTimeline: React.FC = () => {
    const { 
        previewItems, previewTime, previewTotalDuration, 
        seekPreview, isPreviewPlaying 
    } = useFilmStore();
    
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const activeCardRef = useRef<HTMLDivElement>(null);
    const requestRef = useRef<number | null>(null);
    const lastTimeRef = useRef<number>(Date.now());

    // Playback Loop
    useEffect(() => {
        if (isPreviewPlaying) {
            lastTimeRef.current = Date.now();
            const loop = () => {
                const now = Date.now();
                const delta = (now - lastTimeRef.current) / 1000;
                lastTimeRef.current = now;

                let nextTime = previewTime + delta;
                if (nextTime >= previewTotalDuration) {
                    nextTime = 0; // Loop or stop? Let's loop for now
                }
                seekPreview(nextTime);
                requestRef.current = requestAnimationFrame(loop);
            };
            requestRef.current = requestAnimationFrame(loop);
        } else {
            if (requestRef.current) {
                cancelAnimationFrame(requestRef.current);
                requestRef.current = null;
            }
        }
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [isPreviewPlaying, previewTime, previewTotalDuration, seekPreview]);

    // Auto-scroll active card into view
    useEffect(() => {
        if (activeCardRef.current && scrollContainerRef.current) {
            const container = scrollContainerRef.current;
            const card = activeCardRef.current;
            
            const containerRect = container.getBoundingClientRect();
            const cardRect = card.getBoundingClientRect();
            
            // Only scroll if out of view to avoid jitter
            if (cardRect.left < containerRect.left || cardRect.right > containerRect.right) {
                card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }
        }
    }, [previewItems, Math.floor(previewTime)]); // Debounce slightly by flooring time

    return (
        <div className="h-48 bg-[#0a0a0a] border-t border-[#27272a] relative flex flex-col shrink-0 select-none">
            {/* Global Progress Line */}
            <div className="h-1 bg-[#27272a] w-full relative">
                 <div 
                    className="h-full bg-blue-600 transition-all duration-100 ease-linear"
                    style={{ width: `${(previewTime / Math.max(1, previewTotalDuration)) * 100}%` }}
                 />
            </div>

            {/* Scrollable Cards Strip */}
            <div 
                ref={scrollContainerRef}
                className="flex-1 overflow-x-auto overflow-y-hidden px-4 py-4 flex gap-3 items-center custom-scrollbar"
            >
                {previewItems.map((item) => {
                    const isActive = previewTime >= item.startTime && previewTime < item.endTime;
                    const hasVideo = !!item.shot.generation?.video?.url;
                    const hasImage = !!item.shot.assets?.[0]?.url;
                    const thumbUrl = hasImage ? item.shot.assets![0].url : null;
                    
                    return (
                        <div 
                            key={item.shot.uuid}
                            ref={isActive ? activeCardRef : null}
                            onClick={() => seekPreview(item.startTime)}
                            className={`
                                relative flex-shrink-0 aspect-video h-28 rounded-xl border-2 transition-all cursor-pointer overflow-hidden group
                                ${isActive 
                                    ? 'border-blue-500 ring-2 ring-blue-500/30 shadow-lg scale-105 z-10' 
                                    : 'border-[#27272a] hover:border-gray-500 hover:shadow-md'
                                }
                                bg-[#141414]
                            `}
                        >
                            {/* Thumbnail Content */}
                            {(hasVideo || hasImage) ? (
                                <div className="w-full h-full flex items-center justify-center bg-black relative">
                                    {/* Main Image - Contain Mode */}
                                    <img 
                                        src={thumbUrl || ''} 
                                        className="w-full h-full object-contain z-10" 
                                        draggable={false} 
                                        alt={`Shot ${item.shot.index}`}
                                    />
                                    {/* Background Fill - Blur */}
                                    <div className="absolute inset-0 overflow-hidden">
                                        <img 
                                            src={thumbUrl || ''} 
                                            className="w-full h-full object-cover opacity-30 blur-md scale-110" 
                                            draggable={false} 
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-gray-700">
                                    <Clapperboard size={24} className="opacity-20 mb-1" />
                                    <span className="text-[10px] font-mono opacity-50">SHOT {item.shot.index}</span>
                                </div>
                            )}

                            {/* Info Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2 z-20">
                                <div className="flex justify-between items-end">
                                     <span className="text-[10px] font-bold text-white truncate max-w-[80%]">
                                         S{item.scene.index}-{item.shot.index}
                                     </span>
                                     <div className="flex gap-1">
                                         {hasVideo && <Video size={10} className="text-green-400" />}
                                     </div>
                                </div>
                                <p className="text-[9px] text-gray-400 line-clamp-1">{item.shot.description}</p>
                            </div>
                            
                            {/* Active Indicator Dot */}
                            {isActive && (
                                <div className="absolute top-1.5 left-1.5 w-2 h-2 bg-blue-500 rounded-full shadow-sm animate-pulse z-30" />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export const FilmPreviewPanel: React.FC = () => {
    const { currentPreviewItem, updateShot, project } = useFilmStore();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const handleSaveShot = (data: Partial<FilmShot>) => {
        if (currentPreviewItem) {
            updateShot(currentPreviewItem.shot.sceneUuid, currentPreviewItem.shot.uuid, data);
        }
    };

    return (
        <div className="flex flex-col h-full w-full bg-[#0a0a0a]">
            {/* Top: Stage */}
            <PreviewStage />
            
            {/* Middle: Controls */}
            <PreviewControls onEdit={() => setIsEditModalOpen(true)} />
            
            {/* Bottom: Timeline */}
            <PreviewTimeline />

            {/* Modal */}
            <ShotModal 
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                initialData={currentPreviewItem?.shot}
                sceneIndex={currentPreviewItem?.scene.index}
                characters={project.characters}
                onSave={handleSaveShot}
            />
        </div>
    );
};
