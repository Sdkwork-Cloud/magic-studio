
import { useAssetUrl } from '@sdkwork/react-commons'
import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Upload, Loader2, RefreshCw } from 'lucide-react';
;

interface VideoNodeProps {
    src: string | null;
    isSelected: boolean;
    isGenerating: boolean;
    onUpload: () => void;
}

const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
};

export const VideoNode: React.FC<VideoNodeProps> = ({ src, isSelected, isGenerating, onUpload }) => {
    // Resolve asset URL (assets:// -> blob:/http:)
    const { url: resolvedSrc, loading: isResolving } = useAssetUrl(src);

    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [isBuffering, setIsBuffering] = useState(false);
    
    // Scrubbing State
    const [isScrubbing, setIsScrubbing] = useState(false);
    const scrubberRef = useRef<HTMLDivElement>(null);
    
    // Use RAF for smooth progress update without state thrashing
    const rafRef = useRef<number | null>(null);

    // CRITICAL: Reload video when RESOLVED SRC changes
    useEffect(() => {
        if (videoRef.current && resolvedSrc) {
            // Force reload to ensure decoder picks up the stream/file
            videoRef.current.load();
            // Auto-pause when mounted/changed
            videoRef.current.pause();
            setIsPlaying(false);
        }
    }, [resolvedSrc]);

    // Sync Play State
    const togglePlay = (e: React.MouseEvent) => {
        e.stopPropagation(); // Critical: Prevent dragging when clicking play
        if (!videoRef.current) return;
        
        if (videoRef.current.paused) {
            videoRef.current.play().catch((err) => {
                console.warn("Video playback failed", err);
            });
            setIsPlaying(true);
        } else {
            videoRef.current.pause();
            setIsPlaying(false);
        }
    };

    const toggleMute = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!videoRef.current) return;
        videoRef.current.muted = !videoRef.current.muted;
        setIsMuted(videoRef.current.muted);
    };

    const updateScrub = (clientX: number) => {
        if (!videoRef.current || !scrubberRef.current) return;
        const rect = scrubberRef.current.getBoundingClientRect();
        const x = clientX - rect.left;
        const ratio = Math.max(0, Math.min(1, x / rect.width));
        
        videoRef.current.currentTime = ratio * videoRef.current.duration;
        setProgress(ratio * 100);
    };

    const handleScrubStart = (e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
        e.preventDefault(); // Prevent text selection
        setIsScrubbing(true);
        
        // Pause while scrubbing if playing
        if (!videoRef.current?.paused) {
            videoRef.current?.pause();
            setIsPlaying(false);
        }
        
        updateScrub(e.clientX);
        
        const handleWindowMove = (ev: MouseEvent) => {
            updateScrub(ev.clientX);
        };
        
        const handleWindowUp = () => {
            setIsScrubbing(false);
            window.removeEventListener('mousemove', handleWindowMove);
            window.removeEventListener('mouseup', handleWindowUp);
        };
        
        window.addEventListener('mousemove', handleWindowMove);
        window.addEventListener('mouseup', handleWindowUp);
    };

    // Update loop
    useEffect(() => {
        const update = () => {
            if (isScrubbing) return; // Don't auto-update while scrubbing
            
            if (videoRef.current && !videoRef.current.paused) {
                const val = (videoRef.current.currentTime / videoRef.current.duration) * 100;
                setProgress(val || 0);
                rafRef.current = requestAnimationFrame(update);
            } else {
                setIsPlaying(false);
            }
        };

        if (isPlaying) {
            rafRef.current = requestAnimationFrame(update);
        } else {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        }

        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [isPlaying, isScrubbing]);

    // Metadata & Events
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const onWaiting = () => setIsBuffering(true);
        const onPlaying = () => setIsBuffering(false);
        const onLoadedMetadata = () => setDuration(video.duration);
        const onEnded = () => setIsPlaying(false);

        video.addEventListener('waiting', onWaiting);
        video.addEventListener('playing', onPlaying);
        video.addEventListener('loadedmetadata', onLoadedMetadata);
        video.addEventListener('ended', onEnded);

        return () => {
            video.removeEventListener('waiting', onWaiting);
            video.removeEventListener('playing', onPlaying);
            video.removeEventListener('loadedmetadata', onLoadedMetadata);
            video.removeEventListener('ended', onEnded);
        };
    }, []);
    
    // --- 1. Empty / Upload State ---
    if (!src) {
        return (
            <div 
                className="w-full h-full flex flex-col items-center justify-center pointer-events-auto bg-[#18181b] rounded-lg group border-2 border-dashed border-[#27272a] hover:border-[#3f3f46] transition-colors relative overflow-hidden"
                onDoubleClick={(e) => { e.stopPropagation(); onUpload(); }}
            >
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10 pointer-events-none" 
                     style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '16px 16px' }} 
                />

                {isGenerating ? (
                    <div className="flex flex-col items-center gap-3 text-pink-500 z-10">
                        <Loader2 size={32} className="animate-spin" />
                        <span className="text-[10px] font-bold tracking-widest uppercase animate-pulse">Generating</span>
                    </div>
                ) : (
                    <div className="flex flex-col items-center z-10">
                        <button 
                            onClick={(e) => { e.stopPropagation(); onUpload(); }}
                            className="p-4 rounded-full bg-[#27272a] hover:bg-[#333] border border-[#333] text-gray-500 hover:text-white mb-3 transition-all duration-300 shadow-xl group-hover:scale-110 group-active:scale-95"
                        >
                            <Upload size={24} />
                        </button>
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest group-hover:text-gray-400 transition-colors">
                            Upload Video
                        </span>
                        <span className="text-[9px] text-gray-600 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            Double click to browse
                        </span>
                    </div>
                )}
            </div>
        );
    }

    // --- 2. Player State ---
    return (
        <div 
            className="relative w-full h-full group/video bg-black rounded-lg overflow-hidden"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Resolution Loader */}
            {isResolving && !resolvedSrc && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
                    <Loader2 className="animate-spin text-white/50" />
                </div>
            )}

            {resolvedSrc && (
                <video 
                    ref={videoRef}
                    src={resolvedSrc}
                    className="w-full h-full object-contain pointer-events-none select-none" 
                    loop
                    playsInline
                    preload="auto"
                    // Ensure initial frame is rendered
                    onLoadedData={(e) => (e.target as HTMLVideoElement).currentTime = 0}
                />
            )}
            
            {/* Top Right Controls (Replace) */}
            <div className={`absolute top-2 right-2 z-30 transition-all duration-200 ${isHovered || isSelected ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}>
                <button 
                    onClick={(e) => { e.stopPropagation(); onUpload(); }}
                    onMouseDown={(e) => e.stopPropagation()}
                    className="flex items-center gap-1.5 px-2 py-1 bg-black/60 hover:bg-blue-600 text-white/80 hover:text-white rounded-md backdrop-blur-md border border-white/10 transition-colors shadow-sm"
                    title="Replace Video"
                >
                    <RefreshCw size={12} />
                    <span className="text-[9px] font-bold pr-0.5">Replace</span>
                </button>
            </div>

            {/* Center Play/Loading Overlay */}
            <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                 {isBuffering || isResolving ? (
                     <div className="bg-black/50 p-3 rounded-full backdrop-blur-sm">
                         <Loader2 size={24} className="text-white animate-spin" />
                     </div>
                 ) : !isPlaying && (
                    <button 
                        onClick={togglePlay}
                        // FIX: Stop propagation to prevent drag start on canvas when clicking play
                        onMouseDown={(e) => e.stopPropagation()}
                        className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-2xl transition-transform transform scale-90 group-hover/video:scale-100 pointer-events-auto hover:bg-white/20"
                    >
                        <Play size={20} fill="currentColor" className="ml-1" />
                    </button>
                 )}
            </div>

            {/* Bottom Controls Overlay */}
            <div 
                className={`
                    absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 via-black/40 to-transparent transition-opacity duration-300 flex flex-col gap-2 z-20
                    ${(isHovered || !isPlaying || isScrubbing) ? 'opacity-100' : 'opacity-0'}
                `}
                onMouseDown={(e) => e.stopPropagation()} 
                onDoubleClick={(e) => e.stopPropagation()}
            >
                {/* Scrubber */}
                <div 
                    ref={scrubberRef}
                    className="h-1.5 bg-white/20 rounded-full cursor-pointer relative group/scrubber hover:h-2 transition-all flex items-center"
                    onMouseDown={handleScrubStart}
                >
                    <div 
                        className="absolute left-0 top-0 bottom-0 bg-pink-500 rounded-full pointer-events-none" 
                        style={{ width: `${progress}%` }} 
                    />
                    <div 
                        className={`absolute w-3 h-3 bg-white rounded-full shadow-md transition-opacity pointer-events-none transform -translate-x-1/2 ${isHovered || isScrubbing ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}
                        style={{ left: `${progress}%` }}
                    />
                </div>

                {/* Buttons Row */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={togglePlay}
                            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-md transition-colors"
                        >
                            {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                        </button>
                        
                        <div className="flex items-center gap-1 group/vol">
                             <button 
                                onClick={toggleMute}
                                className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-md transition-colors"
                            >
                                {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                            </button>
                        </div>

                        <span className="text-[10px] font-mono text-gray-300 select-none ml-1">
                            {formatTime(videoRef.current?.currentTime || 0)} / {formatTime(duration)}
                        </span>
                    </div>
                </div>
            </div>
            
            {/* Selection Border (Inner) */}
            {isSelected && (
                <div className="absolute inset-0 border-2 border-blue-500 pointer-events-none z-20 rounded-lg"></div>
            )}
        </div>
    );
};
