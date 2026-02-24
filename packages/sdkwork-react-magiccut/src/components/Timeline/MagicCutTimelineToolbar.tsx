
import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import {
    Scissors, Trash2, MousePointer2, Magnet, ScanLine,
    Undo, Redo, ArrowLeftToLine, ArrowRightToLine, MapPin, Minimize2, ZoomIn, ZoomOut,
    Sparkles, Film, Mic, AudioWaveform, Music,
    ArrowRightLeft, MoveHorizontal, GitBranch, Eraser
} from 'lucide-react';
;
import { useMagicCutStore } from '../../store/magicCutStore';
import { useMagicCutBus } from '../../providers/MagicCutEventProvider';
import { MagicCutEvents, ZoomPayload, TimelineAddClipPayload } from '../../events';
import { ImageGeneratorModal } from 'sdkwork-react-image';
import { VideoGeneratorModal } from 'sdkwork-react-video';
import { AudioGeneratorModal } from 'sdkwork-react-audio';
import { SfxGeneratorModal } from 'sdkwork-react-sfx';
import { MusicGeneratorModal } from 'sdkwork-react-music';
import { TIMELINE_CONSTANTS } from '../../constants';
import { generateUUID } from '../../utils/uuid';
import { MediaResourceType } from 'sdkwork-react-commons';
import { EditTool } from '../../store/types';

// --- Constants & Math Helpers ---
const LOG_MIN = Math.log(TIMELINE_CONSTANTS.MIN_ZOOM);
const LOG_MAX = Math.log(TIMELINE_CONSTANTS.MAX_ZOOM);
const SCALE_RANGE = LOG_MAX - LOG_MIN;

// Convert Zoom Level (Real World) -> Slider Value (0-100)
const zoomToSlider = (zoom: number) => {
    const logZoom = Math.log(zoom);
    const percent = (logZoom - LOG_MIN) / SCALE_RANGE;
    return Math.max(0, Math.min(100, percent * 100));
};

// Convert Slider Value (0-100) -> Zoom Level (Real World)
const sliderToZoom = (val: number) => {
    const percent = val / 100;
    const logZoom = LOG_MIN + (percent * SCALE_RANGE);
    return Math.exp(logZoom);
};

// --- Custom High-Performance Zoom Control ---
const ZoomSlider: React.FC<{
    currentZoom: number;
    onZoomChange: (level: number) => void;
}> = ({ currentZoom, onZoomChange }) => {
    // Local state for buttery smooth UI updates, independent of parent render cycles
    const [localValue, setLocalValue] = useState(zoomToSlider(currentZoom));
    const [isDragging, setIsDragging] = useState(false);

    // Refs for drag logic
    const containerRef = useRef<HTMLDivElement>(null);
    const startX = useRef(0);
    const startVal = useRef(0);
    const rafRef = useRef<number | null>(null);

    // Sync local state when external zoom changes (e.g. from "Fit View" button)
    // Only update if NOT dragging to avoid fighting the user
    useEffect(() => {
        if (!isDragging) {
            setLocalValue(zoomToSlider(currentZoom));
        }
    }, [currentZoom, isDragging]);

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        setIsDragging(true);
        startX.current = e.clientX;
        startVal.current = localValue;

        // Critical UX: Lock cursor globally
        document.body.style.cursor = 'ew-resize';
        document.body.style.userSelect = 'none';

        const handleMouseMove = (ev: MouseEvent) => {
            if (!containerRef.current) return;

            const rect = containerRef.current.getBoundingClientRect();
            const width = rect.width;
            const dx = ev.clientX - startX.current;

            // Calculate delta percentage based on pixel movement
            // Adding Shift key support for precision zooming
            const sensitivity = ev.shiftKey ? 0.2 : 1.0;
            const deltaPercent = (dx / width) * 100 * sensitivity;

            let newValue = startVal.current + deltaPercent;
            newValue = Math.max(0, Math.min(100, newValue));

            // 1. Update Visuals Immediately (60fps)
            setLocalValue(newValue);

            // 2. Throttle the expensive Event Emission using RAF
            if (rafRef.current === null) {
                rafRef.current = requestAnimationFrame(() => {
                    onZoomChange(sliderToZoom(newValue));
                    rafRef.current = null;
                });
            }
        };

        const handleMouseUp = () => {
            setIsDragging(false);

            // Reset cursor
            document.body.style.cursor = '';
            document.body.style.userSelect = '';

            // Cleanup listeners
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);

            // Cleanup RAF
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
                rafRef.current = null;
            }

            // Ensure final value is committed
            // We use the state-setter version to get the latest value closure isn't an issue here usually but safe practice
            setLocalValue(prev => {
                onZoomChange(sliderToZoom(prev));
                return prev;
            });
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };

    // Calculate click-to-jump
    const handleClick = (e: React.MouseEvent) => {
        // Only trigger if not dragging (simple click)
        // But our mouseDown logic handles drag initiation immediately.
        // This is mainly for jumping to position if we clicked the track directly.
        // Implementing jump logic inside MouseDown is better for consistency.
        // So we skip onClick.
    };

    // Reset on double click
    const handleDoubleClick = () => {
        const defaultVal = zoomToSlider(1.0); // 100% zoom
        setLocalValue(defaultVal);
        onZoomChange(1.0);
    };

    return (
        <div
            className="group relative w-28 h-4 flex items-center cursor-ew-resize select-none"
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onDoubleClick={handleDoubleClick}
            title="Zoom Timeline (Drag to zoom, Shift+Drag for precision, DblClick to reset)"
        >
            {/* Track Background */}
            <div className="absolute left-0 right-0 h-1 bg-[#27272a] rounded-full overflow-hidden pointer-events-none group-hover:bg-[#333] transition-colors">
                {/* Active Fill */}
                <div
                    className={`h-full bg-blue-600 transition-all duration-75 ease-linear ${isDragging ? 'bg-blue-500' : ''}`}
                    style={{ width: `${localValue}%` }}
                />
            </div>

            {/* Thumb / Handle */}
            <div
                className={`
                    absolute top-1/2 -translate-y-1/2 h-3 w-3 
                    bg-[#e4e4e7] rounded-full shadow-md z-10 
                    border border-[#52525b] 
                    transform transition-transform duration-75 ease-out
                    ${isDragging ? 'scale-125 bg-white border-blue-400 cursor-grabbing' : 'scale-100 group-hover:scale-110 cursor-ew-resize'}
                `}
                style={{
                    left: `${localValue}%`,
                    transform: 'translate(-50%, -50%)'
                }}
            />

            {/* Invisible Hit Area expansion for easier grabbing */}
            <div className="absolute inset-0 -top-2 -bottom-2 bg-transparent z-20 cursor-ew-resize" />
        </div>
    );
};

// --- Custom Toolbar Button Component ---
const ToolbarButton: React.FC<{
    onClick?: () => void;
    icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
    title: string;
    disabled?: boolean;
    isActive?: boolean;
    hoverColor?: string;
    activeColor?: string;
}> = ({ onClick, icon: Icon, title, disabled, isActive, hoverColor, activeColor }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        title={title}
        className={`
            p-1.5 rounded-md transition-all duration-200 flex items-center justify-center
            ${disabled ? 'text-gray-600 cursor-not-allowed opacity-50' : ''}
            ${!disabled && !isActive ? `text-gray-400 hover:bg-[#27272a] hover:shadow-sm ${hoverColor || 'hover:text-white'}` : ''}
            ${isActive ? (activeColor || 'bg-[#27272a] text-white shadow-inner') : ''}
            active:scale-95
        `}
    >
        <Icon size={14} strokeWidth={2} />
    </button>
);

export const MagicCutTimelineToolbar: React.FC = React.memo(() => {
    const bus = useMagicCutBus();
    const [showImageGen, setShowImageGen] = useState(false);
    const [showVideoGen, setShowVideoGen] = useState(false);
    const [showAudioGen, setShowAudioGen] = useState(false);
    const [showSfxGen, setShowSfxGen] = useState(false);
    const [showMusicGen, setShowMusicGen] = useState(false);

    // Only subscribe to state needed for rendering (Selection, Enablement)
    const {
        isSnappingEnabled,
        isSkimmingEnabled,
        canUndo,
        canRedo,
        selectedClipId,
        selectedTrackId,
        state,
        store,
        useTransientState
    } = useMagicCutStore();

    const zoomLevel = useTransientState(s => s.zoomLevel);
    const editMode = useTransientState(s => s.editMode);
    const setEditTool = store.getState().setEditTool;

    const hasSelection = !!selectedClipId;

    const selectedTrack = selectedTrackId ? state.tracks[selectedTrackId] : null;
    const trackType = selectedTrack?.type;

    const isVisualTrack = trackType === 'video' || trackType === 'ai';
    const isAudioTrack = trackType === 'audio';

    const getVisualTooltip = (action: string) => {
        if (!selectedTrackId) return "Select a track first";
        if (!isVisualTrack) return `Cannot generate ${action} on an Audio track`;
        return `Generate AI ${action} at Playhead`;
    };

    const getAudioTooltip = (action: string) => {
        if (!selectedTrackId) return "Select a track first";
        if (!isAudioTrack) return `Cannot generate ${action} on a Video track`;
        return `Generate AI ${action} at Playhead`;
    };

    // --- Action Handlers (Pure Event Emitters) ---

    const handleUndo = () => bus.emit(MagicCutEvents.HISTORY_UNDO);
    const handleRedo = () => bus.emit(MagicCutEvents.HISTORY_REDO);

    const handleSplit = () => bus.emit(MagicCutEvents.CLIP_SPLIT);
    const handleDelete = () => bus.emit(MagicCutEvents.CLIP_DELETE);
    const handleTrimStart = () => bus.emit(MagicCutEvents.CLIP_TRIM_START);
    const handleTrimEnd = () => bus.emit(MagicCutEvents.CLIP_TRIM_END);
    const handleAddMarker = () => bus.emit(MagicCutEvents.TIMELINE_ADD_MARKER);

    const handleToggleSnap = () => bus.emit(MagicCutEvents.TIMELINE_SNAP_TOGGLE);
    const handleToggleSkim = () => bus.emit(MagicCutEvents.TIMELINE_SKIMMING_TOGGLE);
    const handleFit = () => bus.emit(MagicCutEvents.VIEW_FIT);

    const handleZoomChange = useCallback((level: number) => {
        const safeLevel = Math.max(TIMELINE_CONSTANTS.MIN_ZOOM, Math.min(TIMELINE_CONSTANTS.MAX_ZOOM, level));
        bus.emit<ZoomPayload>(MagicCutEvents.VIEW_ZOOM, { level: safeLevel });
    }, [bus]);

    const stepZoom = (direction: -1 | 1) => {
        const currentSliderVal = zoomToSlider(zoomLevel);
        const stepSize = 10;
        const newSliderVal = currentSliderVal + (direction * stepSize);
        handleZoomChange(sliderToZoom(newSliderVal));
    };

    // --- AI Generation Callbacks (Decoupled) ---

    const emitAddClip = (resource: any, duration: number) => {
        if (!selectedTrackId) return;
        const currentT = store.getState().currentTime; // Use live time from store
        bus.emit<TimelineAddClipPayload>(MagicCutEvents.TIMELINE_ADD_CLIP, {
            trackId: selectedTrackId,
            resource,
            start: currentT,
            duration
        });
    };

    const handleImageGenSuccess = (url: string) => {
        emitAddClip({
            id: generateUUID(),
            type: MediaResourceType.IMAGE,
            name: 'AI Generated Image',
            url: url,
            duration: 5,
            width: 1024,
            height: 1024,
            origin: 'ai'
        }, 5);
        setShowImageGen(false);
    };

    const handleVideoGenSuccess = (url: string) => {
        emitAddClip({
            id: generateUUID(),
            type: MediaResourceType.VIDEO,
            name: 'AI Generated Video',
            url: url,
            duration: 5,
            width: 1280,
            height: 720,
            origin: 'ai'
        }, 5);
        setShowVideoGen(false);
    };

    const handleAudioGenSuccess = (url: string, duration?: number) => {
        emitAddClip({
            id: generateUUID(),
            type: MediaResourceType.AUDIO,
            name: 'AI Generated Speech',
            url: url,
            duration: duration || 10,
            origin: 'ai'
        }, duration || 10);
        setShowAudioGen(false);
    };

    const handleSfxGenSuccess = (url: string, duration?: number) => {
        emitAddClip({
            id: generateUUID(),
            type: MediaResourceType.AUDIO,
            name: 'AI Generated SFX',
            url: url,
            duration: duration || 5,
            origin: 'ai'
        }, duration || 5);
        setShowSfxGen(false);
    };

    const handleMusicGenSuccess = (url: string, duration?: number) => {
        emitAddClip({
            id: generateUUID(),
            type: MediaResourceType.MUSIC,
            name: 'AI Generated Music',
            url: url,
            duration: duration || 120,
            origin: 'ai'
        }, duration || 120);
        setShowMusicGen(false);
    };

    return (
        <>
            <div className="h-10 border-b border-[#27272a] bg-[#09090b] flex items-center justify-between px-3 flex-none z-30 select-none shadow-sm relative">

                {/* Left Tools Group */}
                <div className="flex items-center gap-2">

                    <div className="flex items-center bg-[#18181b] rounded-lg p-0.5 border border-[#27272a]">
                        <ToolbarButton onClick={handleUndo} disabled={!canUndo} icon={Undo} title="Undo (Ctrl+Z)" />
                        <ToolbarButton onClick={handleRedo} disabled={!canRedo} icon={Redo} title="Redo (Ctrl+Shift+Z)" />
                    </div>

                    <div className="w-[1px] h-4 bg-[#27272a]" />

                    <div className="flex items-center bg-[#18181b] rounded-lg p-0.5 border border-[#27272a]">
                        <ToolbarButton
                            onClick={handleSplit}
                            icon={Scissors}
                            title="Split Clip (Ctrl+B)"
                            disabled={!hasSelection}
                            hoverColor="hover:text-blue-400"
                        />
                        <ToolbarButton
                            onClick={handleTrimStart}
                            icon={ArrowLeftToLine}
                            title="Trim Start to Playhead (Q)"
                            disabled={!hasSelection}
                        />
                        <ToolbarButton
                            onClick={handleTrimEnd}
                            icon={ArrowRightToLine}
                            title="Trim End to Playhead (W)"
                            disabled={!hasSelection}
                        />
                        <div className="w-[1px] h-3 bg-[#27272a] mx-1" />
                        <ToolbarButton
                            onClick={handleDelete}
                            icon={Trash2}
                            title="Delete Selected (Del)"
                            hoverColor="hover:text-red-400"
                            disabled={!hasSelection}
                        />
                    </div>

                    <div className="w-[1px] h-4 bg-[#27272a]" />

                    <div className="flex items-center bg-[#18181b] rounded-lg p-0.5 border border-[#27272a]">
                        <ToolbarButton
                            onClick={() => setEditTool('select')}
                            icon={MousePointer2}
                            title="Selection Tool (V)"
                            isActive={editMode.currentTool === 'select'}
                        />
                        <ToolbarButton
                            onClick={() => setEditTool('trim')}
                            icon={Scissors}
                            title="Trim Tool (T)"
                            isActive={editMode.currentTool === 'trim'}
                        />
                        <ToolbarButton
                            onClick={() => setEditTool('ripple')}
                            icon={GitBranch}
                            title="Ripple Edit (R)"
                            isActive={editMode.currentTool === 'ripple'}
                        />
                        <ToolbarButton
                            onClick={() => setEditTool('roll')}
                            icon={ArrowRightLeft}
                            title="Roll Edit (E)"
                            isActive={editMode.currentTool === 'roll'}
                        />
                        <ToolbarButton
                            onClick={() => setEditTool('slip')}
                            icon={MoveHorizontal}
                            title="Slip Tool (Y)"
                            isActive={editMode.currentTool === 'slip'}
                        />
                        <ToolbarButton
                            onClick={() => setEditTool('slide')}
                            icon={Eraser}
                            title="Slide Tool (U)"
                            isActive={editMode.currentTool === 'slide'}
                        />
                    </div>

                    <div className="w-[1px] h-4 bg-[#27272a]" />

                    <div className="flex items-center bg-[#18181b] rounded-lg p-0.5 border border-[#27272a]">
                        <ToolbarButton
                            onClick={handleAddMarker}
                            icon={MapPin}
                            title="Add Marker (M)"
                            hoverColor="hover:text-yellow-400"
                        />
                        <div className="w-[1px] h-3 bg-[#27272a] mx-1" />
                        <ToolbarButton
                            onClick={handleToggleSnap}
                            icon={Magnet}
                            title="Snapping (N)"
                            isActive={isSnappingEnabled}
                            activeColor="text-blue-400 bg-blue-500/10"
                        />
                        <ToolbarButton
                            onClick={handleToggleSkim}
                            icon={ScanLine}
                            title="Skimming (S)"
                            isActive={isSkimmingEnabled}
                            activeColor="text-pink-400 bg-pink-500/10"
                        />
                    </div>
                </div>

                {/* Center: AI Generation Tools */}
                <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
                    <button
                        onClick={() => setShowImageGen(true)}
                        disabled={!isVisualTrack}
                        className={`
                            flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold transition-all shadow-sm border
                            ${isVisualTrack
                                ? 'bg-[#18181b] text-white hover:border-purple-500 hover:text-purple-400 border-[#27272a] hover:bg-[#202023]'
                                : 'bg-[#18181b] text-gray-600 cursor-not-allowed border-[#27272a]'
                            }
                        `}
                        title={getVisualTooltip("Image")}
                    >
                        <Sparkles size={12} className={isVisualTrack ? "text-purple-500" : ""} />
                        Image
                    </button>

                    <button
                        onClick={() => setShowVideoGen(true)}
                        disabled={!isVisualTrack}
                        className={`
                            flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold transition-all shadow-sm border
                            ${isVisualTrack
                                ? 'bg-[#18181b] text-white hover:border-pink-500 hover:text-pink-400 border-[#27272a] hover:bg-[#202023]'
                                : 'bg-[#18181b] text-gray-600 cursor-not-allowed border-[#27272a]'
                            }
                        `}
                        title={getVisualTooltip("Video")}
                    >
                        <Film size={12} className={isVisualTrack ? "text-pink-500" : ""} />
                        Video
                    </button>

                    <button
                        onClick={() => setShowAudioGen(true)}
                        disabled={!isAudioTrack}
                        className={`
                            flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold transition-all shadow-sm border
                            ${isAudioTrack
                                ? 'bg-[#18181b] text-white hover:border-emerald-500 hover:text-emerald-400 border-[#27272a] hover:bg-[#202023]'
                                : 'bg-[#18181b] text-gray-600 cursor-not-allowed border-[#27272a]'
                            }
                        `}
                        title={getAudioTooltip("Speech")}
                    >
                        <Mic size={12} className={isAudioTrack ? "text-emerald-500" : ""} />
                        Speech
                    </button>

                    <button
                        onClick={() => setShowSfxGen(true)}
                        disabled={!isAudioTrack}
                        className={`
                            flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold transition-all shadow-sm border
                            ${isAudioTrack
                                ? 'bg-[#18181b] text-white hover:border-orange-500 hover:text-orange-400 border-[#27272a] hover:bg-[#202023]'
                                : 'bg-[#18181b] text-gray-600 cursor-not-allowed border-[#27272a]'
                            }
                        `}
                        title={getAudioTooltip("SFX")}
                    >
                        <AudioWaveform size={12} className={isAudioTrack ? "text-orange-500" : ""} />
                        SFX
                    </button>

                    <button
                        onClick={() => setShowMusicGen(true)}
                        disabled={!isAudioTrack}
                        className={`
                            flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold transition-all shadow-sm border
                            ${isAudioTrack
                                ? 'bg-[#18181b] text-white hover:border-indigo-500 hover:text-indigo-400 border-[#27272a] hover:bg-[#202023]'
                                : 'bg-[#18181b] text-gray-600 cursor-not-allowed border-[#27272a]'
                            }
                        `}
                        title={getAudioTooltip("Music")}
                    >
                        <Music size={12} className={isAudioTrack ? "text-indigo-500" : ""} />
                        Music
                    </button>
                </div>

                {/* Right Zoom Controls */}
                <div className="flex items-center gap-3 pr-1">
                    <button
                        onClick={handleFit}
                        className="flex items-center justify-center p-1.5 hover:bg-[#18181b] rounded-md text-gray-400 hover:text-white transition-colors border border-transparent hover:border-[#27272a]"
                        title="Fit to Screen (Shift+Z)"
                    >
                        <Minimize2 size={14} />
                    </button>

                    <div className="flex items-center bg-[#18181b] rounded-md border border-[#27272a] px-2 py-1 gap-2 h-7">
                        <button
                            onClick={() => stepZoom(-1)}
                            className="text-gray-500 hover:text-white transition-colors p-0.5 rounded hover:bg-[#27272a] active:scale-95"
                            title="Zoom Out"
                        >
                            <ZoomOut size={13} />
                        </button>

                        <ZoomSlider
                            currentZoom={zoomLevel}
                            onZoomChange={handleZoomChange}
                        />

                        <button
                            onClick={() => stepZoom(1)}
                            className="text-gray-500 hover:text-white transition-colors p-0.5 rounded hover:bg-[#27272a] active:scale-95"
                            title="Zoom In"
                        >
                            <ZoomIn size={13} />
                        </button>
                    </div>
                </div>
            </div>

            {showImageGen && <ImageGeneratorModal onClose={() => setShowImageGen(false)} onSuccess={handleImageGenSuccess} />}
            {showVideoGen && <VideoGeneratorModal onClose={() => setShowVideoGen(false)} onSuccess={handleVideoGenSuccess} />}
            {showAudioGen && <AudioGeneratorModal onClose={() => setShowAudioGen(false)} onSuccess={handleAudioGenSuccess} />}
            {showSfxGen && <SfxGeneratorModal onClose={() => setShowSfxGen(false)} onSuccess={handleSfxGenSuccess} />}
            {showMusicGen && <MusicGeneratorModal onClose={() => setShowMusicGen(false)} onSuccess={handleMusicGenSuccess} />}
        </>
    );
});

