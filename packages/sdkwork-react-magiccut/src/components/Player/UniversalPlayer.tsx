
import React, { useRef, useState, useMemo, useLayoutEffect, forwardRef, useImperativeHandle, useContext, createContext, useEffect } from 'react';
import { WebGLEngine, RenderOverrideClip, RenderData } from '../../engine/WebGLEngine';
import { MediaResourceType, AnyMediaResource } from '@sdkwork/react-commons';
import { playerPreviewService } from '../../services';
import { Monitor } from 'lucide-react';
import { useMagicCutStore as TimelineStore } from '../../store/magicCutStore';
;

// Export RenderData for consumers (like MagicCutPlayer)
export type { RenderData };

// --- 1. Player Context Definition ---
interface PlayerContextType {
    projectResolution: { width: number, height: number };
    stageDimensions: { width: number, height: number };
    scale: number; // Project to Screen scale
    containerRef: React.RefObject<HTMLDivElement>;
    // Helpers
    projectToScreen: (x: number, y: number) => { x: number, y: number };
    screenToProject: (x: number, y: number) => { x: number, y: number };
}

const PlayerContext = createContext<PlayerContextType | null>(null);

export const usePlayerContext = () => {
    const context = useContext(PlayerContext);
    if (!context) {
        throw new Error('usePlayerContext must be used within a UniversalPlayer');
    }
    return context;
};

// --- 2. Props Definition ---
export interface UniversalPlayerProps {
    data: RenderData;
    currentTime: number;
    isPlaying: boolean;
    projectResolution: { width: number, height: number };
    previewResource?: AnyMediaResource | null; 
    previewResourceTime?: number;
    viewScale?: number;
    onStageClick?: (e: React.MouseEvent, point: { x: number, y: number, time: number }) => void;
    children?: React.ReactNode; 
    store: TimelineStore; 
    hiddenClipIds?: Set<string>;
}

export interface UniversalPlayerHandle {
    resize: (width: number, height: number) => void;
    getEngine: () => WebGLEngine;
    renderNow: (time: number, forcePlaying?: boolean) => void;
    setPreviewTime: (time: number) => void;
    setPreviewResource: (resource: AnyMediaResource | null) => void;
    renderPreview: (resource: AnyMediaResource, time: number) => void;
}

// Singleton Engine instance to persist across re-renders
const engine = new WebGLEngine();

export const UniversalPlayer = forwardRef<UniversalPlayerHandle, UniversalPlayerProps>(({
    data,
    currentTime, isPlaying, projectResolution,
    previewResource, previewResourceTime = 0,
    viewScale = 1.0,
    onStageClick,
    children,
    store,
    hiddenClipIds
}, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const stageRef = useRef<HTMLDivElement>(null);
    
    const [containerSize, setContainerSize] = useState<{width: number, height: number}>({ width: 0, height: 0 });
    
    // Stable Refs for render callback to avoid closure staleness
    const dataRef = useRef(data);
    const previewResourceRef = useRef(previewResource);
    const previewResourceTimeRef = useRef(previewResourceTime);
    const isPlayingRef = useRef(isPlaying);
    const hiddenClipIdsRef = useRef(hiddenClipIds);
    
    const lastRenderTimeRef = useRef(currentTime);
    const isRenderScheduledRef = useRef(false);
    const renderVersionRef = useRef(0);

    dataRef.current = data;
    
    if (previewResource !== undefined) {
         previewResourceRef.current = previewResource;
    }
    previewResourceTimeRef.current = previewResourceTime;
    isPlayingRef.current = isPlaying;
    hiddenClipIdsRef.current = hiddenClipIds;

    const playerHandleRef = useRef<UniversalPlayerHandle | null>(null);

    useLayoutEffect(() => {
        if (!canvasRef.current || !containerRef.current) return;
        
        try {
            engine.attach(canvasRef.current);
            
            engine.setRenderCallback(() => {
                // This callback is used when the engine needs to trigger a render
                // We should allow this to happen during playback as well
                // since it can be used for other rendering purposes
                
                if (isRenderScheduledRef.current) return;
                isRenderScheduledRef.current = true;
                
                requestAnimationFrame(() => {
                    isRenderScheduledRef.current = false;
                    renderVersionRef.current++;
                    renderFrame(lastRenderTimeRef.current);
                });
            });
        } catch (e) {
            console.error("Failed to attach WebGL engine", e);
        }
        
        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                setContainerSize({ width, height });
            }
        });
        observer.observe(containerRef.current);

        return () => {
            observer.disconnect();
            engine.detach();
        };
    }, []);

    useEffect(() => {
        if (playerHandleRef.current) {
            playerPreviewService.registerPlayer({ current: playerHandleRef.current } as React.RefObject<UniversalPlayerHandle>);
        }
        return () => {
            playerPreviewService.unregisterPlayer();
        };
    }, []);

    // --- Layout Calculation ---
    const projectRes = useMemo(() => {
        const { width, height } = projectResolution;
        // Ensure non-zero
        const safeW = width || 1920;
        const safeH = height || 1080;
        const ratio = safeW / safeH;
        return { width: safeW, height: safeH, ratio };
    }, [projectResolution.width, projectResolution.height]);

    const stageLayout = useMemo(() => {
        if (containerSize.width === 0 || containerSize.height === 0) return { width: 0, height: 0, scale: 1 };

        const PADDING = 24; 
        const availableW = Math.max(1, containerSize.width - PADDING * 2);
        const availableH = Math.max(1, containerSize.height - PADDING * 2);
        const containerRatio = availableW / availableH;
        let displayW: number, displayH: number;

        // Fit logic: Contain within available space
        if (containerRatio > projectRes.ratio) {
            displayH = availableH;
            displayW = displayH * projectRes.ratio;
        } else {
            displayW = availableW;
            displayH = displayW / projectRes.ratio;
        }

        // Apply visual zoom scale (User UI zoom)
        displayW *= viewScale;
        displayH *= viewScale;

        const scale = displayW / projectRes.width;

        return { width: displayW, height: displayH, scale };
    }, [containerSize, projectRes.ratio, projectRes.width, viewScale]);

    useLayoutEffect(() => {
        if (stageLayout.width === 0) return;
        engine.setProjectResolution(projectRes.width, projectRes.height);
        
        const dpr = window.devicePixelRatio || 1;
        const canvasW = Math.floor(stageLayout.width * dpr);
        const canvasH = Math.floor(stageLayout.height * dpr);
        
        engine.resize(canvasW, canvasH);
    }, [stageLayout.width, stageLayout.height, projectRes.width, projectRes.height]);

    // --- Dynamic Override Logic (Direct Store Access) ---
    const getRenderOverride = (): RenderOverrideClip | null => {
        const state = store.getState();
        const { interaction, dragOperation } = state;
        
        // Handle Trimming Preview
        if (interaction.type !== 'idle' && interaction.clipId) {
            const clip = dataRef.current.clips[interaction.clipId];
            const resource = dataRef.current.resources[clip?.resource.id];
            
            if (resource && clip) {
                return {
                    id: clip.id,
                    resource,
                    start: interaction.currentTime, 
                    duration: interaction.type === 'trim-end' || interaction.type === 'trim-start' 
                        ? (interaction.initialDuration + (interaction.type === 'trim-end' ? (interaction.currentTime - (interaction.initialStartTime + interaction.initialDuration)) : (interaction.initialStartTime - interaction.currentTime))) 
                        : clip.duration,
                    offset: interaction.type === 'trim-start' 
                        ? (interaction.initialOffset + (interaction.currentTime - interaction.initialStartTime))
                        : (clip.offset || 0),
                    type: interaction.type as any
                };
            }
        } 
        // Handle Drag Ghosting
        else if (dragOperation) {
            const startTime = interaction.type === 'move' ? interaction.currentTime : 0;
            return {
                id: 'ghost-drop',
                resource: dragOperation.payload,
                start: startTime,
                duration: dragOperation.duration,
                offset: 0,
                type: 'move' 
            };
        }
        return null;
    };

    const renderFrame = (time: number, forcePlayingState?: boolean, previewTimeOverride?: number) => {
        if (engine.isEngineDestroyed()) return;
        
        lastRenderTimeRef.current = time; 
        
        const res = previewResourceRef.current;
        const resTime = previewTimeOverride !== undefined ? previewTimeOverride : previewResourceTimeRef.current;
        const hidden = hiddenClipIdsRef.current;
        
        const effectiveIsPlaying = forcePlayingState !== undefined ? forcePlayingState : isPlayingRef.current;
        
        if (res) {
            const isAudioOnly = res.type === MediaResourceType.AUDIO || 
                                res.type === MediaResourceType.MUSIC || 
                                res.type === MediaResourceType.VOICE || 
                                res.type === MediaResourceType.SPEECH;

            if (!isAudioOnly) {
                engine.renderSingleResource(res, resTime);
            }
        } else if (dataRef.current && dataRef.current.timeline) {
            const override = getRenderOverride();
            
            engine.render(
                time, 
                dataRef.current.timeline, 
                dataRef.current.resources, 
                dataRef.current.tracks, 
                dataRef.current.clips, 
                effectiveIsPlaying, 
                override,
                dataRef.current.layers,
                hidden
            );
        }
    };

        useImperativeHandle(ref, () => {
        const handle: UniversalPlayerHandle = {
            resize: (w, h) => engine.resize(w, h),
            getEngine: () => engine,
            renderNow: (time: number, forcePlaying?: boolean) => {
                // Always call renderFrame regardless of playing state
                // This ensures the player updates properly during playback
                renderFrame(time, forcePlaying);
            },
            setPreviewTime: (time: number) => {
                previewResourceTimeRef.current = time;
            },
            setPreviewResource: (resource: AnyMediaResource | null) => {
                previewResourceRef.current = resource;
            },
            renderPreview: (resource: AnyMediaResource, time: number) => {
                previewResourceRef.current = resource;
                previewResourceTimeRef.current = time;
                renderFrame(time, false, time);
            }
        };
        playerHandleRef.current = handle;
        return handle;
    });

    // --- Interaction Handling ---
    const handleMouseDown = (e: React.MouseEvent) => {
        if (!onStageClick || !stageRef.current) return;
        
        const rect = stageRef.current.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;
        
        const projX = clickX / stageLayout.scale;
        const projY = clickY / stageLayout.scale;

        onStageClick(e, { x: projX, y: projY, time: lastRenderTimeRef.current });
    };

    // --- Context Value Helpers ---
    const projectToScreen = (x: number, y: number) => ({
        x: x * stageLayout.scale,
        y: y * stageLayout.scale
    });

    const screenToProject = (x: number, y: number) => ({
        x: x / stageLayout.scale,
        y: y / stageLayout.scale
    });

    const contextValue: PlayerContextType = {
        projectResolution: projectRes,
        stageDimensions: { width: stageLayout.width, height: stageLayout.height },
        scale: stageLayout.scale,
        containerRef,
        projectToScreen,
        screenToProject
    };

    const lastCurrentTimeRef = useRef(-1);
    useLayoutEffect(() => {
        // Always update when currentTime changes, regardless of playback state
        // During playback, PlayerController will call renderNow directly
        // But we still need to update when seeking or when playback stops
        if (currentTime === lastCurrentTimeRef.current) return;
        lastCurrentTimeRef.current = currentTime;
        
        if (currentTime >= 0) {
            renderVersionRef.current++;
            renderFrame(currentTime);
        }
    }, [currentTime, isPlaying, hiddenClipIds]);

    return (
        <PlayerContext.Provider value={contextValue}>
            <div className="flex-1 w-full h-full relative flex items-center justify-center overflow-auto custom-scrollbar bg-[#09090b]" ref={containerRef}>
                <div 
                    ref={stageRef}
                    style={{ 
                        width: stageLayout.width, 
                        height: stageLayout.height,
                        boxShadow: '0 0 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)', 
                        backgroundImage: `linear-gradient(45deg, #1e1e1e 25%, transparent 25%),
                                          linear-gradient(-45deg, #1e1e1e 25%, transparent 25%),
                                          linear-gradient(45deg, transparent 75%, #1e1e1e 75%),
                                          linear-gradient(-45deg, transparent 75%, #1e1e1e 75%)`,
                        backgroundSize: '20px 20px',
                        backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                        backgroundColor: '#121212'
                    }}
                    className="relative group shrink-0 ease-out cursor-default select-none" 
                    onMouseDown={handleMouseDown}
                >
                    <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block pointer-events-none" style={{ width: '100%', height: '100%' }} />
                    
                    {!previewResourceRef.current && !previewResource && (
                        <div className="absolute inset-0 z-20 overflow-visible pointer-events-none">
                            <div className="pointer-events-auto w-full h-full">
                                {children}
                            </div>
                        </div>
                    )}
                    
                    {(previewResource || previewResourceRef.current) && (
                        <div className="absolute top-2 left-2 z-30 pointer-events-none">
                            <div className="bg-red-500/90 text-white text-[10px] px-2 py-1 rounded font-bold uppercase shadow-lg border border-white/20">
                                Preview: {(previewResource || previewResourceRef.current)?.name}
                            </div>
                        </div>
                    )}

                    {(!data.timeline || data.timeline.tracks.length === 0) && !previewResource && !previewResourceRef.current && !store.getState().dragOperation && (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-600 pointer-events-none">
                            <div className="text-center">
                                <Monitor size={48} className="mx-auto mb-2 opacity-20" />
                                <p className="text-xs opacity-50 font-medium">Empty Sequence</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </PlayerContext.Provider>
    );
});

