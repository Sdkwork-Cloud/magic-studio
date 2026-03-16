
import React, { useRef, useState, useEffect } from 'react';
import {
    Play,
    Pause,
    SkipBack,
    SkipForward,
    Maximize,
    Ratio,
    ZoomIn,
    ZoomOut,
    Repeat,
    ChevronLeft,
    ChevronRight,
    ArrowLeftToLine,
    ArrowRightToLine,
    X
} from 'lucide-react';
import { useMagicCutStore } from '../../store/magicCutStore';
import { audioEngine } from '../../engine/AudioEngine';

interface PlayerControlsProps {
    aspectRatio: string;
    viewScale: number;
    onSeek: (time: number) => void;
    onTogglePlay: () => void;
    onRatioChange: (ratio: string) => void;
    onViewScaleChange: (scale: number) => void;
    onFullscreen: () => void;
    duration: number;
    disabled?: boolean;
    onTimecodeRef: (el: HTMLElement | null) => void; 
    inPoint: number | null;
    outPoint: number | null;
    onStepBackward: () => void;
    onStepForward: () => void;
    onSetInPoint: () => void;
    onSetOutPoint: () => void;
    onJumpToInPoint: () => void;
    onJumpToOutPoint: () => void;
    onClearRange: () => void;
}

const formatTimecode = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
};

const VUMeter: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { useTransientState } = useMagicCutStore();
    const isPlaying = useTransientState(s => s.isPlaying);

    useEffect(() => {
        let rafId: number;
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');

        const draw = () => {
            if (!ctx || !canvas) return;
            
            // Get level (0.0 to 1.0)
            // If not playing, decay to 0
            const level = isPlaying ? audioEngine.getAudioLevels() : 0;
            
            // Draw
            const width = canvas.width;
            const height = canvas.height;
            const barWidth = width * Math.min(1, level);
            
            ctx.clearRect(0, 0, width, height);
            
            // Background
            ctx.fillStyle = '#1e1e1e';
            ctx.fillRect(0, 0, width, height);
            
            // Active Level (Gradient Green -> Yellow -> Red)
            const gradient = ctx.createLinearGradient(0, 0, width, 0);
            gradient.addColorStop(0, '#10b981');
            gradient.addColorStop(0.6, '#facc15');
            gradient.addColorStop(1, '#ef4444');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, barWidth, height);
            
            // Peak indicator line (simple)
            if (level > 0.01) {
                ctx.fillStyle = '#fff';
                ctx.fillRect(barWidth - 1, 0, 1, height);
            }

            rafId = requestAnimationFrame(draw);
        };
        
        draw();
        return () => cancelAnimationFrame(rafId);
    }, [isPlaying]);

    return (
        <div className="w-20 h-2 bg-[#121212] rounded overflow-hidden border border-[#333] ml-2">
            <canvas ref={canvasRef} width={80} height={8} className="block" />
        </div>
    );
};

export const PlayerControls: React.FC<PlayerControlsProps> = ({
    aspectRatio,
    viewScale,
    onSeek,
    onTogglePlay,
    onRatioChange,
    onViewScaleChange,
    onFullscreen,
    duration,
    disabled = false,
    onTimecodeRef,
    inPoint,
    outPoint,
    onStepBackward,
    onStepForward,
    onSetInPoint,
    onSetOutPoint,
    onJumpToInPoint,
    onJumpToOutPoint,
    onClearRange
}) => {
    const { isLooping, toggleLoop, useTransientState } = useMagicCutStore();
    const isPlaying = useTransientState(s => s.isPlaying);

    const [showRatioMenu, setShowRatioMenu] = useState(false);
    const ratioMenuRef = useRef<HTMLDivElement>(null);
    const timeRef = useRef<HTMLSpanElement | null>(null);

    const handleTimeRef = (el: HTMLElement | null) => {
        timeRef.current = el;
        onTimecodeRef(el);
    };

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (ratioMenuRef.current && !ratioMenuRef.current.contains(e.target as Node)) {
                setShowRatioMenu(false);
            }
        };
        if (showRatioMenu) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showRatioMenu]);

    const hasRange = inPoint !== null || outPoint !== null;

    return (
        <div className="h-12 bg-[#050505] border-t border-white/5 flex items-center justify-between px-4 z-30 flex-none relative select-none">
            {/* Left: Timecode */}
            <div className="flex items-center gap-4 w-1/3">
                <div className="flex items-center gap-2 px-2 py-1 bg-[#121212] border border-[#27272a] rounded-md font-mono shadow-inner text-blue-400">
                    <span ref={handleTimeRef} className="text-xs font-bold tracking-widest">
                        00:00.00
                    </span>
                </div>
                <div className="text-[10px] text-gray-600 font-mono">
                    / {formatTimecode(duration)}
                </div>
                {hasRange && (
                    <div className="hidden xl:flex items-center gap-1.5 px-2 py-1 rounded-md border border-blue-500/20 bg-blue-500/5 text-[10px] font-mono text-blue-200">
                        <button
                            onClick={onJumpToInPoint}
                            disabled={disabled || inPoint === null}
                            className={`flex items-center gap-1 rounded px-1.5 py-0.5 transition-colors ${inPoint === null ? 'opacity-40 cursor-not-allowed' : 'hover:bg-white/10'}`}
                            title="Jump to In Point"
                        >
                            <ArrowLeftToLine size={10} />
                            <span>{inPoint === null ? '--:--.--' : formatTimecode(inPoint)}</span>
                        </button>
                        <div className="w-px h-3 bg-white/10" />
                        <button
                            onClick={onJumpToOutPoint}
                            disabled={disabled || outPoint === null}
                            className={`flex items-center gap-1 rounded px-1.5 py-0.5 transition-colors ${outPoint === null ? 'opacity-40 cursor-not-allowed' : 'hover:bg-white/10'}`}
                            title="Jump to Out Point"
                        >
                            <ArrowRightToLine size={10} />
                            <span>{outPoint === null ? '--:--.--' : formatTimecode(outPoint)}</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Center: Transport & Meter */}
            <div className="flex items-center justify-center gap-3 w-1/3">
                <button 
                    onClick={() => onSeek(0)} 
                    disabled={disabled}
                    className={`text-gray-500 hover:text-white transition-colors p-1.5 hover:bg-[#27272a] rounded-md ${disabled ? 'opacity-30 cursor-not-allowed' : ''}`}
                >
                    <SkipBack size={16} fill="currentColor" />
                </button>
                <button
                    onClick={onStepBackward}
                    disabled={disabled}
                    className={`text-gray-500 hover:text-white transition-colors p-1.5 hover:bg-[#27272a] rounded-md ${disabled ? 'opacity-30 cursor-not-allowed' : ''}`}
                    title="Step Back One Frame"
                >
                    <ChevronLeft size={16} />
                </button>
                <button 
                    onClick={onTogglePlay} 
                    disabled={disabled}
                    className={`w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform shadow-lg shadow-white/10 active:scale-95 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
                </button>
                <button
                    onClick={onStepForward}
                    disabled={disabled}
                    className={`text-gray-500 hover:text-white transition-colors p-1.5 hover:bg-[#27272a] rounded-md ${disabled ? 'opacity-30 cursor-not-allowed' : ''}`}
                    title="Step Forward One Frame"
                >
                    <ChevronRight size={16} />
                </button>
                <button 
                    onClick={() => onSeek(duration)} 
                    disabled={disabled}
                    className={`text-gray-500 hover:text-white transition-colors p-1.5 hover:bg-[#27272a] rounded-md ${disabled ? 'opacity-30 cursor-not-allowed' : ''}`}
                >
                    <SkipForward size={16} fill="currentColor" />
                </button>
                
                <div className="w-px h-4 bg-[#27272a] mx-1" />
                
                <button 
                    onClick={toggleLoop} 
                    disabled={disabled}
                    className={`p-1.5 rounded-md transition-colors ${isLooping ? 'text-blue-400 bg-blue-500/10' : 'text-gray-500 hover:text-white hover:bg-[#27272a]'} ${disabled ? 'opacity-30 cursor-not-allowed' : ''}`}
                    title="Toggle Loop Playback"
                >
                    <Repeat size={14} />
                </button>

                {/* VU Meter */}
                <VUMeter />
            </div>
            
            {/* Right: View Controls */}
            <div className="flex items-center justify-end gap-3 w-1/3">
                <div className="hidden lg:flex items-center gap-1 rounded-lg border border-[#27272a] bg-[#121212] p-0.5">
                    <button
                        onClick={onSetInPoint}
                        disabled={disabled}
                        className={`px-2 py-1 text-[10px] font-bold rounded-md transition-colors ${inPoint !== null ? 'bg-blue-500/15 text-blue-300' : 'text-gray-400 hover:text-white hover:bg-[#27272a]'} ${disabled ? 'opacity-30 cursor-not-allowed' : ''}`}
                        title="Set In Point (I)"
                    >
                        I
                    </button>
                    <button
                        onClick={onSetOutPoint}
                        disabled={disabled}
                        className={`px-2 py-1 text-[10px] font-bold rounded-md transition-colors ${outPoint !== null ? 'bg-orange-500/15 text-orange-300' : 'text-gray-400 hover:text-white hover:bg-[#27272a]'} ${disabled ? 'opacity-30 cursor-not-allowed' : ''}`}
                        title="Set Out Point (O)"
                    >
                        O
                    </button>
                    <button
                        onClick={onClearRange}
                        disabled={disabled || !hasRange}
                        className={`p-1.5 rounded-md transition-colors ${hasRange ? 'text-gray-300 hover:text-white hover:bg-[#27272a]' : 'text-gray-600'} ${disabled || !hasRange ? 'opacity-30 cursor-not-allowed' : ''}`}
                        title="Clear In/Out Points"
                    >
                        <X size={12} />
                    </button>
                </div>
                <div className="relative" ref={ratioMenuRef}>
                    <button onClick={() => setShowRatioMenu(!showRatioMenu)} className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 hover:text-gray-300 transition-colors px-2 py-1.5 rounded hover:bg-[#27272a] uppercase border border-transparent hover:border-[#333]">
                        <Ratio size={14} />
                        <span>{aspectRatio}</span>
                    </button>
                    {showRatioMenu && (
                        <div className="absolute bottom-full right-0 mb-2 w-44 bg-[#18181b] border border-[#333] rounded-lg shadow-xl py-1 z-50 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                            <div className="px-3 py-1.5 text-[9px] font-bold text-gray-500 uppercase bg-[#222]">Settings</div>
                            {['16:9', '9:16', '1:1', '21:9', '4:3'].map(r => (
                                <button key={r} onClick={() => { onRatioChange(r); setShowRatioMenu(false); }} className="px-3 py-2 text-xs text-left hover:bg-[#27272a] text-gray-300 hover:text-white">{r}</button>
                            ))}
                        </div>
                    )}
                </div>
                <div className="w-px h-4 bg-[#27272a]" />
                <div className="flex items-center bg-[#121212] rounded-lg p-0.5 border border-[#27272a]">
                    <button onClick={() => onViewScaleChange(Math.max(0.1, viewScale - 0.1))} className="p-1 hover:bg-[#27272a] rounded text-gray-400 hover:text-white transition-colors">
                        <ZoomOut size={12} />
                    </button>
                    <button onClick={() => onViewScaleChange(1.0)} className={`px-2 text-[10px] font-mono min-w-[36px] text-center transition-colors cursor-pointer ${viewScale === 1.0 ? 'text-blue-400 font-bold' : 'text-gray-400 hover:text-white'}`}>
                        {viewScale === 1.0 ? 'FIT' : `${Math.round(viewScale * 100)}%`}
                    </button>
                    <button onClick={() => onViewScaleChange(Math.min(5, viewScale + 0.1))} className="p-1 hover:bg-[#27272a] rounded text-gray-400 hover:text-white transition-colors">
                        <ZoomIn size={12} />
                    </button>
                </div>
                 <div className="w-px h-4 bg-[#27272a]" />
                 <button onClick={onFullscreen} className="p-1.5 hover:bg-[#27272a] rounded text-gray-500 hover:text-white transition-colors" title="Fullscreen">
                    <Maximize size={16} />
                 </button>
            </div>
        </div>
    );
};

