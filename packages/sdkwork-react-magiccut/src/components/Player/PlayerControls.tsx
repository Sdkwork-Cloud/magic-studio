
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
import { useMagicCutTranslation } from '../../hooks/useMagicCutTranslation';

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
        <div className="app-toolbar-group ml-2 h-2 w-20 overflow-hidden rounded-full">
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
    const { tp } = useMagicCutTranslation();
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
        <div className="app-toolbar-strip flex h-12 flex-none items-center justify-between border-t px-4 relative select-none z-30">
            {/* Left: Timecode */}
            <div className="flex w-1/3 items-center gap-4">
                <div className="app-toolbar-group flex items-center gap-2 rounded-xl px-2.5 py-1 font-mono text-primary-500 shadow-inner">
                    <span ref={handleTimeRef} className="text-xs font-bold tracking-widest">
                        00:00.00
                    </span>
                </div>
                <div className="font-mono text-[10px] text-[var(--text-muted)]">
                    / {formatTimecode(duration)}
                </div>
                {hasRange && (
                    <div className="app-toolbar-group hidden xl:flex items-center gap-1.5 rounded-xl px-2 py-1 text-[10px] font-mono text-primary-500">
                        <button
                            onClick={onJumpToInPoint}
                            disabled={disabled || inPoint === null}
                            className={`app-toolbar-button flex items-center gap-1 rounded-lg px-1.5 py-0.5 ${inPoint === null ? '' : ''}`}
                            title={tp('controls.jumpToInPoint')}
                        >
                            <ArrowLeftToLine size={10} />
                            <span>{inPoint === null ? '--:--.--' : formatTimecode(inPoint)}</span>
                        </button>
                        <div className="app-toolbar-divider h-3 w-px" />
                        <button
                            onClick={onJumpToOutPoint}
                            disabled={disabled || outPoint === null}
                            className="app-toolbar-button flex items-center gap-1 rounded-lg px-1.5 py-0.5"
                            title={tp('controls.jumpToOutPoint')}
                        >
                            <ArrowRightToLine size={10} />
                            <span>{outPoint === null ? '--:--.--' : formatTimecode(outPoint)}</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Center: Transport & Meter */}
            <div className="flex w-1/3 items-center justify-center gap-3">
                <button 
                    onClick={() => onSeek(0)} 
                    disabled={disabled}
                    className="app-toolbar-button rounded-xl p-1.5"
                    title={tp('controls.jumpToStart')}
                >
                    <SkipBack size={16} fill="currentColor" />
                </button>
                <button
                    onClick={onStepBackward}
                    disabled={disabled}
                    className="app-toolbar-button rounded-xl p-1.5"
                    title={tp('controls.stepBackFrame')}
                >
                    <ChevronLeft size={16} />
                </button>
                <button 
                    onClick={onTogglePlay} 
                    disabled={disabled}
                    className={`flex h-8 w-8 items-center justify-center rounded-full bg-[var(--text-primary)] text-[var(--bg-panel-strong)] shadow-lg transition-transform active:scale-95 ${disabled ? 'cursor-not-allowed opacity-50' : 'hover:scale-105 hover:bg-primary-600 hover:text-white'}`}
                    title={isPlaying ? tp('pause') : tp('play')}
                >
                    {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
                </button>
                <button
                    onClick={onStepForward}
                    disabled={disabled}
                    className="app-toolbar-button rounded-xl p-1.5"
                    title={tp('controls.stepForwardFrame')}
                >
                    <ChevronRight size={16} />
                </button>
                <button 
                    onClick={() => onSeek(duration)} 
                    disabled={disabled}
                    className="app-toolbar-button rounded-xl p-1.5"
                    title={tp('controls.jumpToEnd')}
                >
                    <SkipForward size={16} fill="currentColor" />
                </button>
                
                <div className="app-toolbar-divider mx-1 h-4 w-px" />
                
                <button 
                    onClick={toggleLoop} 
                    disabled={disabled}
                    className={`app-toolbar-button rounded-xl p-1.5 ${isLooping ? 'bg-[color-mix(in_srgb,var(--theme-primary-500)_10%,transparent)] text-primary-500' : ''}`}
                    title={tp('controls.toggleLoopPlayback')}
                >
                    <Repeat size={14} />
                </button>

                {/* VU Meter */}
                <VUMeter />
            </div>
            
            {/* Right: View Controls */}
            <div className="flex w-1/3 items-center justify-end gap-3">
                <div className="app-toolbar-group hidden items-center gap-1 rounded-xl p-0.5 lg:flex">
                    <button
                        onClick={onSetInPoint}
                        disabled={disabled}
                        className={`app-toolbar-button rounded-lg px-2 py-1 text-[10px] font-bold ${inPoint !== null ? 'bg-[color-mix(in_srgb,var(--theme-primary-500)_10%,transparent)] text-primary-500' : ''}`}
                        title={tp('controls.setInPoint')}
                    >
                        I
                    </button>
                    <button
                        onClick={onSetOutPoint}
                        disabled={disabled}
                        className={`app-toolbar-button rounded-lg px-2 py-1 text-[10px] font-bold ${outPoint !== null ? 'bg-[color-mix(in_srgb,var(--status-warning-fg)_10%,transparent)] text-[var(--status-warning-fg)]' : ''}`}
                        title={tp('controls.setOutPoint')}
                    >
                        O
                    </button>
                    <button
                        onClick={onClearRange}
                        disabled={disabled || !hasRange}
                        className={`app-toolbar-button rounded-lg p-1.5 ${hasRange ? '' : ''}`}
                        title={tp('controls.clearInOutPoints')}
                    >
                        <X size={12} />
                    </button>
                </div>
                <div className="relative" ref={ratioMenuRef}>
                    <button onClick={() => setShowRatioMenu(!showRatioMenu)} className="app-toolbar-button flex items-center gap-1.5 rounded-xl px-2 py-1.5 text-[10px] font-bold uppercase">
                        <Ratio size={14} />
                        <span>{aspectRatio}</span>
                    </button>
                    {showRatioMenu && (
                        <div className="app-floating-panel absolute bottom-full right-0 z-50 mb-2 flex w-44 flex-col overflow-hidden rounded-2xl py-1 animate-in fade-in zoom-in-95 duration-100">
                            <div className="app-surface-subtle px-3 py-1.5 text-[9px] font-bold uppercase text-[var(--text-muted)]">{tp('controls.settings')}</div>
                            {['16:9', '9:16', '1:1', '21:9', '4:3'].map(r => (
                                <button key={r} onClick={() => { onRatioChange(r); setShowRatioMenu(false); }} className="app-toolbar-button mx-1 rounded-xl px-3 py-2 text-left text-xs">{r}</button>
                            ))}
                        </div>
                    )}
                </div>
                <div className="app-toolbar-divider h-4 w-px" />
                <div className="app-toolbar-group flex items-center rounded-xl p-0.5">
                    <button onClick={() => onViewScaleChange(Math.max(0.1, viewScale - 0.1))} className="app-toolbar-button rounded-lg p-1">
                        <ZoomOut size={12} />
                    </button>
                    <button onClick={() => onViewScaleChange(1.0)} className={`app-toolbar-button min-w-[36px] px-2 text-center font-mono text-[10px] ${viewScale === 1.0 ? 'font-bold text-primary-500' : ''}`}>
                        {viewScale === 1.0 ? tp('controls.fit') : `${Math.round(viewScale * 100)}%`}
                    </button>
                    <button onClick={() => onViewScaleChange(Math.min(5, viewScale + 0.1))} className="app-toolbar-button rounded-lg p-1">
                        <ZoomIn size={12} />
                    </button>
                </div>
                 <div className="app-toolbar-divider h-4 w-px" />
                 <button onClick={onFullscreen} className="app-toolbar-button rounded-xl p-1.5" title={tp('controls.fullscreen')}>
                    <Maximize size={16} />
                 </button>
            </div>
        </div>
    );
};

