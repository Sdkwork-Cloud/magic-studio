
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useMagicCutStore } from '../../store/magicCutStore';
import { TransformOverlay } from './TransformOverlay';
import { TextOverlayEditor } from './TextOverlayEditor';

import { useMagicCutBus } from '../../providers/MagicCutEventProvider';
import { MagicCutEvents, SeekPayload } from '../../events';
import { UniversalPlayer, UniversalPlayerHandle, RenderData } from './UniversalPlayer';
import { PlayerControls } from './PlayerControls';
import { CutClip, CutLayer } from '../../entities/magicCut.entity';
import { generateUUID } from 'sdkwork-react-commons';
import { usePlayerPreviewSync } from '../../hooks/usePlayerPreviewSync';
import { audioEngine } from '../../engine/AudioEngine';

import { MediaResourceType } from 'sdkwork-react-commons';
import { MagicCutErrorBoundary } from '../ErrorBoundary/MagicCutErrorBoundary';

const getResolutionFromRatio = (ratio: string): string => {
    switch (ratio) {
        case '16:9': return '1920x1080';
        case '9:16': return '1080x1920';
        case '1:1': return '1080x1080';
        case '4:3': return '1440x1080';
        case '3:4': return '1080x1440';
        case '21:9': return '2560x1080';
        default: return '1920x1080';
    }
};

const isPointInRotatedRect = (pointX: number, pointY: number, rectX: number, rectY: number, width: number, height: number, rotation: number) => {
    const rad = -rotation * (Math.PI / 180);
    const cx = rectX + width / 2;
    const cy = rectY + height / 2;
    const dx = pointX - cx;
    const dy = pointY - cy;
    const localX = dx * Math.cos(rad) - dy * Math.sin(rad);
    const localY = dx * Math.sin(rad) + dy * Math.cos(rad);
    const halfW = width / 2;
    const halfH = height / 2;
    return localX >= -halfW && localX <= halfW && localY >= -halfH && localY <= halfH;
};

export const MagicCutPlayer: React.FC = React.memo(() => {
    const bus = useMagicCutBus();
    const {
        totalDuration,
        activeTimeline, state, project, updateProjectSettings,
        selectClip, selectedClipId, getClip,
        updateClipTransform, updateClip, beginTransaction, commitTransaction,
        useSkimmingResource,
        usePreviewEffect,
        getClipResource,
        playerController,
        useTransientState,
        store
    } = useMagicCutStore();

    // Use reactive hooks for preview state
    const skimmingResource = useSkimmingResource();
    const previewEffect = usePreviewEffect();

    // Subscribe to high-frequency state
    const isInteracting = useTransientState(s => s.interaction.type !== 'idle');
    const isDraggingResource = useTransientState(s => !!s.dragOperation);
    const isPlaying = useTransientState(s => s.isPlaying);
    // Optimization: Only subscribe to currentTime updates when PAUSED.
    // When playing, the engine is driven directly by PlayerController loop (60fps).
    // Avoiding React re-renders during playback eliminates main-thread jitter and flickering.
    const currentTime = useTransientState(s => s.isPlaying ? -1 : s.currentTime);

    const rootRef = useRef<HTMLDivElement>(null);
    const playerRef = useRef<UniversalPlayerHandle>(null);
    const [viewScale, setViewScale] = useState(1.0);

    // Text Editing State
    const [isEditingText, setIsEditingText] = useState(false);

    // Transform Drag State (To show DOM proxy and hide WebGL)
    const [isTransforming, setIsTransforming] = useState(false);

    const projectResolution = useMemo(() => {
        if (!project?.settings?.resolution) return { width: 1920, height: 1080 };
        const parts = project.settings.resolution.split('x').map(Number);
        return { width: parts[0] || 1920, height: parts[1] || 1080 };
    }, [project.settings.resolution]);

    usePlayerPreviewSync(playerRef, playerController, store);

    // Calculate Hidden Clips (to prevent double rendering/ghosting)
    // We hide the WebGL version when:
    // 1. Editing Text (TextOverlayEditor is active)
    // 2. Transforming/Dragging (TransformOverlay Proxy is active)
    //    If we are NOT interacting, we show WebGL (perfect WYSIWYG) and NO DOM proxy.
    const hiddenClipIds = useMemo(() => {
        if (selectedClipId && (isEditingText || isTransforming)) {
            return new Set([selectedClipId]);
        }
        return undefined;
    }, [isEditingText, isTransforming, selectedClipId]);

    const renderData: RenderData = useMemo(() => {
        let resources = state.resources;
        let clips = state.clips;
        let layers = state.layers;

        const currentDrag = store.getState().dragOperation;
        if (currentDrag && currentDrag.payload) {
            resources = {
                ...state.resources,
                [currentDrag.payload.id]: currentDrag.payload
            };
        }

        if (previewEffect && activeTimeline) {
            const currTime = playerController.getCurrentTime();
            const sortedTracks = activeTimeline.tracks
                .map(ref => state.tracks[ref.id])
                .filter(t => t && t.visible !== false && (t.type === 'video'))
                .sort((a, b) => a.order - b.order);

            let targetClip: CutClip | null = null;
            for (const track of sortedTracks) {
                const found = track.clips
                    .map(ref => clips[ref.id])
                    .find(c => c && currTime >= c.start && currTime < c.start + c.duration);
                if (found) {
                    targetClip = found;
                    break;
                }
            }

            if (targetClip) {
                clips = { ...clips };
                layers = { ...layers };
                const tempLayerId = `preview-layer-${previewEffect.id}`;
                const tempLayer: CutLayer = {
                    id: tempLayerId,
                    uuid: generateUUID(),
                    clip: { id: targetClip.id, uuid: targetClip.uuid, type: 'CutClip' },
                    type: 'filter',
                    enabled: true,
                    order: targetClip.layers.length,
                    params: { definitionId: previewEffect.id },
                    createdAt: Date.now(),
                    updatedAt: Date.now()
                };
                layers[tempLayerId] = tempLayer;
                clips[targetClip.id] = {
                    ...targetClip,
                    layers: [...targetClip.layers, { id: tempLayerId, type: 'CutLayer', uuid: tempLayer.uuid }]
                };
            }
        }

        return {
            timeline: activeTimeline,
            resources: resources,
            tracks: state.tracks,
            clips: clips,
            layers: layers
        };
    }, [activeTimeline, state, isDraggingResource, previewEffect]);

    const handleStageClick = (e: React.MouseEvent, point: { x: number, y: number, time: number }) => {
        if (e.button !== 0 || e.defaultPrevented || skimmingResource) return;

        if (isEditingText) {
            setIsEditingText(false);
        }

        if (!activeTimeline) return;

        if (playerController.getIsPlaying()) {
            playerController.pause();
        }

        const { x: projX, y: projY, time: hitTime } = point;
        const candidates: { clip: CutClip, zIndex: number }[] = [];
        const tracks = activeTimeline.tracks
            .map(ref => state.tracks[ref.id])
            .filter(t => t && t.visible !== false && !t.locked);

        for (const track of tracks) {
            for (const clipRef of track.clips) {
                const clip = state.clips[clipRef.id];
                if (!clip) continue;
                if (hitTime >= clip.start && hitTime < clip.start + clip.duration) {
                    candidates.push({ clip, zIndex: track.order });
                }
            }
        }

        candidates.sort((a, b) => a.zIndex - b.zIndex);
        let hitClipId: string | null = null;

        for (const candidate of candidates) {
            const { clip } = candidate;
            const tf = clip.transform || { x: 0, y: 0, width: projectResolution.width, height: projectResolution.height, rotation: 0, scale: 1, opacity: 1 };
            if (isPointInRotatedRect(projX, projY, tf.x, tf.y, tf.width * (tf.scale || 1), tf.height * (tf.scale || 1), tf.rotation || 0)) {
                hitClipId = clip.id;
                break;
            }
        }

        if (hitClipId) {
            e.stopPropagation();
            selectClip(hitClipId);
        } else {
            selectClip(null);
            setIsEditingText(false);
        }
    };

    const handleStageDoubleClick = (e: React.MouseEvent) => {
        if (selectedClipId) {
            const clip = getClip(selectedClipId);
            const res = getClipResource(selectedClipId);
            if (clip && res && (res.type === MediaResourceType.TEXT || res.type === MediaResourceType.SUBTITLE)) {
                setIsEditingText(true);
            }
        }
    };

    const handleTogglePlay = () => {
        audioEngine.resume();
        bus.emit(MagicCutEvents.PLAYBACK_TOGGLE);
    };

    const handleSeek = (time: number) => bus.emit<SeekPayload>(MagicCutEvents.PLAYBACK_SEEK, { time });

    const handleAspectRatioSelect = (ratio: string) => {
        const newRes = getResolutionFromRatio(ratio);
        updateProjectSettings({ resolution: newRes, aspectRatio: ratio });
        setViewScale(1.0);
    };

    const toggleFullscreen = async () => {
        if (!rootRef.current) return;
        try {
            if (!document.fullscreenElement) await rootRef.current.requestFullscreen();
            else await document.exitFullscreen();
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        if (!playerController) return;
        const renderFrame = (time: number) => {
            if (playerRef.current) {
                const isControllerPlaying = playerController.getIsPlaying();
                playerRef.current.renderNow(time, isControllerPlaying);
            }
        };
        playerController.setEngineRenderer(renderFrame);
        return () => playerController.setEngineRenderer(() => { });
    }, [playerController]);

    const selectedClip = selectedClipId ? getClip(selectedClipId) : null;
    const selectedResource = selectedClipId ? getClipResource(selectedClipId) : null;

    const transform = selectedClip?.transform
        ? {
            ...selectedClip.transform,
            width: selectedClip.transform.width * (selectedClip.transform.scale || 1),
            height: selectedClip.transform.height * (selectedClip.transform.scale || 1)
        }
        : { x: 0, y: 0, width: 0, height: 0, rotation: 0, scale: 1, opacity: 1 };

    const isTextSelected = selectedResource?.type === MediaResourceType.TEXT || selectedResource?.type === MediaResourceType.SUBTITLE;

    return (
        <div ref={rootRef} className="h-full flex flex-col bg-[#09090b] text-gray-200 select-none overflow-hidden group/player">
            <MagicCutErrorBoundary componentName="MagicCut Player">
                <div
                    className="flex-1 relative overflow-hidden bg-[#121214] flex flex-col"
                    onMouseDown={() => { selectClip(null); setIsEditingText(false); }}
                    onDoubleClick={handleStageDoubleClick}
                >
                    <UniversalPlayer
                        ref={playerRef}
                        store={store}
                        data={renderData}
                        currentTime={currentTime} // Pass live current time
                        isPlaying={isPlaying}
                        projectResolution={projectResolution}
                        previewResource={skimmingResource}
                        previewResourceTime={0}
                        viewScale={viewScale}
                        onStageClick={handleStageClick}
                        hiddenClipIds={hiddenClipIds}
                    >
                        {!skimmingResource && selectedClipId && !isEditingText && (
                            <TransformOverlay
                                transform={transform}
                                isSelected={true}
                                onUpdateTransform={(newTf, isFinal) => {
                                    updateClipTransform(selectedClipId, newTf, !isFinal);
                                }}
                                onInteractionStart={() => {
                                    beginTransaction();
                                    setIsTransforming(true); // Hide WebGL, Show Proxy
                                }}
                                onInteractionEnd={() => {
                                    commitTransaction();
                                    setIsTransforming(false); // Restore WebGL
                                }}
                            >
                                {/* DOM Proxy for Text is ONLY rendered during Drag/Transform to prevent static ghosting */}
                                {isTransforming && isTextSelected && selectedResource && (
                                    <div style={{
                                        width: '100%',
                                        height: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: selectedResource.metadata?.textAlign === 'left' ? 'flex-start' : selectedResource.metadata?.textAlign === 'right' ? 'flex-end' : 'center',
                                        color: selectedResource.metadata?.color || '#ffffff',
                                        fontFamily: selectedResource.metadata?.fontFamily || 'Inter, sans-serif',
                                        fontSize: `${selectedResource.metadata?.fontSize || 60}px`,
                                        fontWeight: selectedResource.metadata?.fontWeight || 'bold',
                                        whiteSpace: 'pre-wrap',
                                        textAlign: selectedResource.metadata?.textAlign as any || 'center',
                                        lineHeight: 1.2,
                                        pointerEvents: 'none',
                                        textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                                        padding: `${selectedResource.metadata?.padding || 20}px`
                                    }}>
                                        {selectedClip?.content || selectedResource.metadata?.text || 'Text'}
                                    </div>
                                )}
                            </TransformOverlay>
                        )}

                        {!skimmingResource && selectedClipId && isEditingText && selectedClip && (
                            <TextOverlayEditor
                                clip={selectedClip}
                                onChange={(txt) => updateClip(selectedClip.id, { content: txt })}
                                onBlur={() => setIsEditingText(false)}
                            />
                        )}
                    </UniversalPlayer>
                </div>
            </MagicCutErrorBoundary>

            <PlayerControls
                aspectRatio={project.settings.aspectRatio}
                viewScale={viewScale}
                duration={totalDuration}
                onSeek={handleSeek}
                onTogglePlay={handleTogglePlay}
                onRatioChange={handleAspectRatioSelect}
                onViewScaleChange={setViewScale}
                onFullscreen={toggleFullscreen}
                disabled={!!skimmingResource}
                onTimecodeRef={playerController.setTimecodeDOM}
            />
        </div>
    );
});

