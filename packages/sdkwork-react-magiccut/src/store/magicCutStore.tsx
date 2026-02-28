
import {
    assetBusinessFacade,
    mapUnifiedAssetToAnyAsset,
    readWorkspaceScope,
    type AssetMutationResult
} from '@sdkwork/react-assets';
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef, useMemo } from 'react';
import { produce, enableMapSet, enablePatches, applyPatches, Patch } from 'immer';
import { useStore } from 'zustand';

import { CutProject, CutTimeline, CutTrack, CutClip, CutLayer, CutTrackType, TemplateMetadata, CutClipTransform, CutProjectSettings } from '../entities';
import { MediaResourceType, AnyMediaResource, generateUUID, pathUtils } from '@sdkwork/react-commons';
import { createTimelineStore, TimelineStore } from './transientStore';
import { PlayerController } from '../controllers/PlayerController';
import { NormalizedState, InteractionState, DragOperation } from './types';
import { TrackRulesFactory } from '../domain/dnd/TrackRulesFactory';
import { TrackFactory } from '../services/TrackFactory';
import { timelineOperationService } from '../services/TimelineOperationService';
import { magicCutProjectService } from '../services/magicCutProjectService';
import { templateService } from '../services/templateService';
;
import { TIMELINE_CONSTANTS } from '../constants';
;
import { uploadHelper, platform } from '@sdkwork/react-core';
import type { AssetContentKey } from '@sdkwork/react-types';
import { storageConfig } from '@sdkwork/react-fs';
import { textRenderer, DEFAULT_TEXT_STYLE } from '../engine/text/TextRenderer';
import {
    normalizeProjectAssetReferences,
    normalizeResourceForTimeline,
    normalizeStateAssetReferences
} from '../utils/assetReferenceNormalization';
;
;

// Local type definition for asset types
type AssetType = 'image' | 'video' | 'audio' | 'music' | 'voice' | 'text' | 'effect' | 'transition' | 'subtitle' | 'character' | 'sfx';
export type DeleteMode = 'lift' | 'ripple';
export type PasteMode = 'normal' | 'insert' | 'overwrite';

type AssetImportSource = {
    data?: Uint8Array;
    sourcePath?: string;
    remoteUrl?: string;
};

const ASSET_PROTOCOL_PREFIX = 'assets://';

// Re-export types for consumers
export * from './types';
export * from './transientStore';

enableMapSet();
enablePatches();

function updateTrackOrders(draft: NormalizedState, timelineId: string) {
    const tl = draft.timelines[timelineId];
    if (!tl) return;
    tl.tracks.forEach((ref, idx) => {
        const tr = draft.tracks[ref.id];
        if (tr) tr.order = idx;
    });
}

const resolveMagiccutScope = (): { workspaceId: string; projectId?: string } => {
    const scope = readWorkspaceScope();
    return {
        workspaceId: scope.workspaceId,
        projectId: scope.projectId
    };
};

const toMagiccutResource = (result: AssetMutationResult): AnyMediaResource => {
    const resource = mapUnifiedAssetToAnyAsset(result.asset);
    if (!resource) {
        throw new Error('Invalid asset payload: primary media resource is missing.');
    }
    return normalizeResourceForTimeline(resource as AnyMediaResource);
};

const isAbsoluteFsPath = (value: string): boolean => {
    return /^[a-zA-Z]:\\/.test(value) || value.startsWith('/');
};

const toAbsoluteAssetPath = async (path: string): Promise<string> => {
    if (!path.startsWith(ASSET_PROTOCOL_PREFIX)) {
        return path;
    }
    const documentsDir = await platform.getPath('documents');
    const libraryRoot = pathUtils.join(documentsDir, storageConfig.library.root);
    const relativePath = path.slice(ASSET_PROTOCOL_PREFIX.length);
    return pathUtils.join(libraryRoot, relativePath);
};

const tryExtractInlineData = async (source: string): Promise<Uint8Array | undefined> => {
    if (!source.startsWith('data:') && !source.startsWith('blob:')) {
        return undefined;
    }
    const response = await fetch(source);
    return new Uint8Array(await response.arrayBuffer());
};

const resolveResourceImportSource = async (resource: AnyMediaResource): Promise<AssetImportSource> => {
    const candidates = [resource.path, resource.url]
        .filter((item): item is string => typeof item === 'string' && item.length > 0);

    for (const source of candidates) {
        if (source.startsWith('http://') || source.startsWith('https://')) {
            return { remoteUrl: source };
        }
        if (source.startsWith(ASSET_PROTOCOL_PREFIX)) {
            return { sourcePath: await toAbsoluteAssetPath(source) };
        }
        if (isAbsoluteFsPath(source)) {
            return { sourcePath: source };
        }
        const inlineData = await tryExtractInlineData(source);
        if (inlineData) {
            return { data: inlineData };
        }
    }

    throw new Error(`Unable to resolve import source for resource ${resource.id}`);
};

const resolveAssetNameExtension = (resource: AnyMediaResource): string => {
    const fromName = pathUtils.extname(resource.name || '');
    if (fromName && fromName !== '.') {
        return fromName;
    }
    const sourcePath = resource.path || resource.url || '';
    const fromPath = pathUtils.extname(sourcePath);
    if (fromPath && fromPath !== '.') {
        return fromPath;
    }
    return '.mp4';
};

class ClipTransformFactory {
    static calculate(resource: AnyMediaResource, resolutionStr: string): CutClipTransform {
        const [projW, projH] = resolutionStr.split('x').map(Number);
        const pW = isNaN(projW) ? 1920 : projW;
        const pH = isNaN(projH) ? 1080 : projH;
        
        const isVisual = resource.type === MediaResourceType.VIDEO || resource.type === MediaResourceType.IMAGE;
        const isTextOrSubtitle = resource.type === MediaResourceType.TEXT || resource.type === MediaResourceType.SUBTITLE;
        
        if (isTextOrSubtitle) {
            const text = resource.metadata?.text || resource.name;
            const dims = textRenderer.measure(text, DEFAULT_TEXT_STYLE);
            return {
                x: Math.round((pW - dims.width) / 2),
                y: Math.round((pH - dims.height) / 2),
                width: dims.width,
                height: dims.height,
                rotation: 0,
                scale: 1,
                opacity: 1
            };
        }
        
        if (!isVisual) {
            return { x: 0, y: 0, width: 0, height: 0, rotation: 0, scale: 1, opacity: 1 };
        }

        let mediaW = 1000;
        let mediaH = 1000;
        
        if ((resource as any).width && (resource as any).height) {
            mediaW = (resource as any).width;
            mediaH = (resource as any).height;
        } else if (resource.metadata?.width && resource.metadata?.height) {
            mediaW = resource.metadata.width;
            mediaH = resource.metadata.height;
        }

        const mediaRatio = mediaW / mediaH;
        const projRatio = pW / pH;
        
        let finalW = pW;
        let finalH = pH;

        if (mediaRatio > projRatio) {
            finalW = pW;
            finalH = pW / mediaRatio;
        } else {
            finalH = pH;
            finalW = pH * mediaRatio;
        }
        
        const x = (pW - finalW) / 2;
        const y = (pH - finalH) / 2;

        return {
            x: Math.round(x),
            y: Math.round(y),
            width: Math.round(finalW),
            height: Math.round(finalH),
            rotation: 0,
            scale: 1,
            opacity: 1
        };
    }
}

export interface MagicCutStoreContextType {
    project: CutProject;
    state: NormalizedState;
    activeTimelineId: string | null;
    activeTimeline: CutTimeline | null;
    
    switchProject: (id: string) => Promise<void>;
    loadLastProject: () => Promise<void>;
    saveAsTemplate: (metadata: TemplateMetadata) => Promise<void>;
    loadTemplate: (template: any) => Promise<void>;
    
    addTrack: (type: CutTrackType, name?: string, isMain?: boolean, index?: number) => string | undefined;
    removeTrack: (trackId: string) => void;
    updateTrack: (trackId: string, updates: Partial<CutTrack>) => void;
    resizeTrack: (trackId: string, height: number) => void;
    selectTrack: (trackId: string | null) => void;
    
    addClip: (trackId: string, resource: AnyMediaResource, start: number, duration?: number) => string | undefined;
    updateClip: (clipId: string, updates: Partial<CutClip>) => void;
    updateClipTransform: (clipId: string, transform: Partial<CutClipTransform>, isFinal: boolean) => void;
    updateClipLayers: (clipId: string, layers: CutLayer[]) => void;
    moveClip: (clipId: string, targetTrackId: string, newStart: number) => void;
    splitClip: (time?: number) => void;
    trimStart: (time?: number) => void;
    trimEnd: (time?: number) => void;
    trimClip: (clipId: string, start: number, duration: number, offset: number) => void;
    copyClip: (clipId: string) => void;
    pasteClip: (trackId: string | null, time: number, mode?: PasteMode) => void;
    deleteSelected: (mode?: DeleteMode) => void;
    selectClip: (id: string | null, multi?: boolean) => void;
    detachAudio: (clipId: string) => Promise<void>;

    updateResource: (id: string, updates: Partial<AnyMediaResource>) => void;
    
    addEffectToClip: (clipId: string, effectId: string) => void;
    
    addKeyframe: (clipId: string, property: string, value: number) => void;
    removeKeyframe: (clipId: string, property: string) => void;

    insertTrackAndMoveClip: (clipId: string, insertIndex: number, newStart: number, trackType?: CutTrackType) => void;
    insertTrackAndAddClip: (resource: AnyMediaResource, insertIndex: number, start: number, duration: number, trackType?: CutTrackType) => void;
    
    play: () => void;
    pause: () => void;
    seek: (time: number) => void;
    
    undo: () => void;
    redo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    commitHistory: () => void;
    beginTransaction: () => void;
    commitTransaction: () => void;

    toggleSnapping: () => void;
    toggleSkimming: () => void;
    addMarker: () => void;
    isSkimmingEnabled: boolean;
    isSnappingEnabled: boolean;
    previewRange: { start: number; end: number } | null;
    
    getResource: (id: string) => AnyMediaResource | undefined;
    getClip: (id: string) => CutClip | undefined;
    getClipResource: (id: string) => AnyMediaResource | undefined;
    totalDuration: number;
    
    selectedClipId: string | null;
    selectedTrackId: string | null;
    selectedClipIds: Set<string>;
    clipboard: CutClip | null;
    
    stepForward: () => void;
    stepBackward: () => void;
    selectAllClips: () => void;
    clearSelection: () => void;
    deleteSelectedClips: (mode?: DeleteMode) => void;
    copySelectedClips: () => void;
    pasteClips: (trackId: string | null, time: number, mode?: PasteMode) => void;
    nudgeSelectedClips: (delta: number) => void;
    setInPoint: (time: number) => void;
    setOutPoint: (time: number) => void;
    clearInOutPoints: () => void;
    inPoint: number | null;
    outPoint: number | null;
    selectClipsInRegion: (start: number, end: number, trackIds?: string[]) => void;
    updateClips: (updates: Array<{ id: string; changes: Partial<CutClip> }>) => void;
    isProcessing: boolean;
    useSkimmingResource: () => AnyMediaResource | null;
    usePreviewEffect: () => any | null;
    
    store: TimelineStore;
    useTransientState: <T>(selector: (state: import('./transientStore').TimelineState) => T) => T;
    playerController: PlayerController;
    setDragOperation: (op: DragOperation | null) => void;
    setInteraction: (interaction: InteractionState | ((prev: InteractionState) => InteractionState)) => void;
    canSeek: () => boolean;
    
    validateTrackDrop: (trackId: string, resourceType: string) => boolean;
    checkCollision: (trackId: string, start: number, duration: number, exclude: Set<string>) => boolean;
    getGlobalSnapPoints: () => number[];
    
    importFileObjects: (files: File[]) => Promise<AnyMediaResource[]>;
    importAssets: (accept?: string, forcedType?: AssetType) => Promise<AnyMediaResource[]>;

    updateProjectSettings: (settings: Partial<CutProjectSettings>) => void;
    updateProjectMetadata: (data: Partial<CutProject>) => void;
    
    skimmingResource: AnyMediaResource | null;
    setSkimmingResource: (resource: AnyMediaResource | null) => void;
    setPreviewSource: (resource: AnyMediaResource | null) => void;
    previewEffect: any | null;
    setPreviewEffect: (effect: any | null) => void;
    isLooping: boolean;
    toggleLoop: () => void;

    setActiveTimelineId: (id: string) => void;
    addTimeline: (name: string) => void;
    removeTimeline: (id: string) => void;
    updateTimeline: (id: string, updates: Partial<CutTimeline>) => void;

    setClipSpeed: (clipId: string, speed: number) => void;
}

const MagicCutStoreContext = createContext<MagicCutStoreContextType | undefined>(undefined);

interface MagicCutStoreProviderProps {
    children: ReactNode;
    initialProject?: CutProject;
    onSave?: (project: CutProject) => void;
}

export const MagicCutStoreProvider: React.FC<MagicCutStoreProviderProps> = ({ 
    children, 
    initialProject, 
    onSave 
}) => {
    const resolvedInitialProject = useMemo<CutProject>(() => {
        if (initialProject) {
            return normalizeProjectAssetReferences(initialProject);
        }
        return createDefaultProject();
    }, [initialProject]);

    const storeRef = useRef<TimelineStore>(createTimelineStore());
    const useTransientState = useCallback(<T,>(selector: (state: import('./transientStore').TimelineState) => T): T => {
        return useStore(storeRef.current, selector);
    }, []);

    const [project, setProject] = useState<CutProject>(resolvedInitialProject);
    const [activeTimelineId, setActiveTimelineId] = useState<string | null>(null);
    
    const [state, setState] = useState<NormalizedState>(() => {
        if (resolvedInitialProject.normalizedState) {
            return normalizeStateAssetReferences(resolvedInitialProject.normalizedState as NormalizedState);
        }
        return normalizeStateAssetReferences(normalizeProject(resolvedInitialProject));
    });

    const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
    const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
    const [selectedClipIds, setSelectedClipIds] = useState<Set<string>>(new Set());
    const [clipboard, setClipboard] = useState<CutClip | null>(null);
    const clipboardClipsRef = useRef<CutClip[]>([]);
    const [inPoint, setInPointState] = useState<number | null>(null);
    const [outPoint, setOutPointState] = useState<number | null>(null);
    const [isProcessing, _setIsProcessing] = useState(false);
    
    const [isSnappingEnabled, setIsSnappingEnabled] = useState(true);
    const [isSkimmingEnabled, setIsSkimmingEnabled] = useState(true);
    const [isLooping, setIsLooping] = useState(false);
    
    const [previewEffect, setPreviewEffect] = useState<any | null>(null);
    const [previewRange, _setPreviewRange] = useState<{ start: number; end: number } | null>(null);

    const playerControllerRef = useRef(new PlayerController(storeRef.current));
    
    // History Management
    const [history, setHistory] = useState<{ undo: Patch[], redo: Patch[] }[]>([]);
    const [future, setFuture] = useState<{ undo: Patch[], redo: Patch[] }[]>([]);
    
    // Transaction Buffer
    const isTransactionRef = useRef(false);
    const transactionPatches = useRef<{ undo: Patch[], redo: Patch[] }>({ undo: [], redo: [] });

    // Cleanup playback on unmount
    useEffect(() => {
        const controller = playerControllerRef.current;
        return () => {
            controller.pause();
        };
    }, []);

    useEffect(() => {
        if (project.timelines.length > 0 && !activeTimelineId) {
            setActiveTimelineId(project.timelines[0].id);
        }
    }, [project.timelines]);

    useEffect(() => {
        playerControllerRef.current.syncState(state, activeTimelineId);
        playerControllerRef.current.setLooping(isLooping);
    }, [state, activeTimelineId, isLooping]);

    const activeTimeline = activeTimelineId ? state.timelines[activeTimelineId] : null;

    const totalDuration = useMemo(() => {
        if (!activeTimeline) return 30;
        let maxEndTime = 0;
        
        activeTimeline.tracks.forEach(trackRef => {
            const track = state.tracks[trackRef.id];
            if (!track) return;
            track.clips.forEach(clipRef => {
                const clip = state.clips[clipRef.id];
                if (clip) {
                    const end = clip.start + clip.duration;
                    if (end > maxEndTime) maxEndTime = end;
                }
            });
        });
        return maxEndTime > 0 ? maxEndTime : 30;
    }, [activeTimeline, state.tracks, state.clips]);

    useEffect(() => {
        if (activeTimelineId) {
            playerControllerRef.current.setTotalDuration(totalDuration);
        }
    }, [totalDuration]);

    const updateState = useCallback((recipe: (draft: NormalizedState) => void, isTransientChange = false) => {
        setState(current => {
            const safeRecipe = (draft: NormalizedState) => {
                recipe(draft);
                return undefined;
            };

            const next = produce(current, safeRecipe, (patches, inversePatches) => {
                if (!isTransientChange) {
                    if (isTransactionRef.current) {
                        // Buffer patches during transaction
                        transactionPatches.current.undo.push(...inversePatches);
                        transactionPatches.current.redo.push(...patches);
                    } else {
                        // Direct commit
                        setHistory(prev => [...prev, { undo: inversePatches, redo: patches }].slice(-20));
                        setFuture([]);
                    }
                }
            });
            return next;
        });
    }, []);
    
    const beginTransaction = () => {
        isTransactionRef.current = true;
        transactionPatches.current = { undo: [], redo: [] };
    };

    const commitTransaction = () => {
        isTransactionRef.current = false;
        if (transactionPatches.current.undo.length > 0) {
            // Important: Undo patches must be applied in reverse order of generation
            // to correctly revert a sequence of changes.
            const combinedUndo = [...transactionPatches.current.undo].reverse();
            const combinedRedo = [...transactionPatches.current.redo];
            
            setHistory(prev => [...prev, { undo: combinedUndo, redo: combinedRedo }].slice(-20));
            setFuture([]);
            transactionPatches.current = { undo: [], redo: [] };
        }
    };
    
    const commitHistory = () => {
        // Alias to ensure any pending transaction or state is finalized if needed
        if (isTransactionRef.current) commitTransaction();
    };

    useEffect(() => {
        const timer = setTimeout(() => {
             const normalizedState = normalizeStateAssetReferences(state);
             const updatedProject: CutProject = {
                ...project,
                normalizedState,
                timelines: Object.keys(normalizedState.timelines).map(id => ({ id, uuid: normalizedState.timelines[id].uuid, type: 'CutTimeline' })),
                mediaResources: Object.keys(normalizedState.resources).map((id) => ({
                    id,
                    uuid: normalizedState.resources[id]?.uuid,
                    type: 'MediaResource'
                }))
            };
            if (onSave) onSave(updatedProject);
        }, 2000);
        return () => clearTimeout(timer);
    }, [state, project]);

    const addTrack = (type: CutTrackType, name?: string, isMain?: boolean, index?: number) => {
        const id = generateUUID();
        updateState(draft => {
            if (!activeTimelineId) return;
            const tl = draft.timelines[activeTimelineId];
            if (!tl) return;
            
            const config = TrackFactory.getTrackConfig(type, isMain);
            
            const newTrack: CutTrack = {
                id, uuid: generateUUID(), 
                type: 'CutTrack',
                trackType: type,
                name: name || config.name,
                order: 0,
                clips: [], visible: true, locked: false, muted: false,
                isMain, 
                height: config.height,
                createdAt: Date.now(), updatedAt: Date.now()
            };
            
            draft.tracks[id] = newTrack;
            
            if (typeof index === 'number' && index >= 0 && index <= tl.tracks.length) {
                tl.tracks.splice(index, 0, { id, uuid: newTrack.uuid, type: 'CutTrack' });
            } else {
                tl.tracks.push({ id, uuid: newTrack.uuid, type: 'CutTrack' });
            }
            
            updateTrackOrders(draft, activeTimelineId);
        });
        return id;
    };
    
    const removeTrack = (trackId: string) => {
        updateState(draft => {
            if (!activeTimelineId) return;
            const tl = draft.timelines[activeTimelineId];
            if (!tl) return;
            const idx = tl.tracks.findIndex(t => t.id === trackId);
            if (idx !== -1) {
                tl.tracks.splice(idx, 1);
                const track = draft.tracks[trackId];
                if (track) {
                    track.clips.forEach(c => delete draft.clips[c.id]);
                }
                delete draft.tracks[trackId];
                updateTrackOrders(draft, activeTimelineId);
            }
        });
    };
    const updateTrack = (trackId: string, updates: Partial<CutTrack>) => {
        updateState(draft => {
            if (draft.tracks[trackId]) {
                Object.assign(draft.tracks[trackId], updates);
                draft.tracks[trackId].updatedAt = Date.now();
            }
        });
    };
    const resizeTrack = (trackId: string, height: number) => {
        updateTrack(trackId, { height: Math.max(30, height) });
    };
    
    const addClip = (trackId: string, resource: AnyMediaResource, start: number, duration?: number) => {
        const id = generateUUID();
        updateState(draft => {
            const track = draft.tracks[trackId];
            if (!track) return;

            const normalizedResource = normalizeResourceForTimeline(resource);
            if (!draft.resources[normalizedResource.id]) {
                draft.resources[normalizedResource.id] = normalizedResource;
            }
            let finalDuration = duration;
            if (finalDuration === undefined || finalDuration <= 0) {
                if (normalizedResource.metadata?.duration && typeof normalizedResource.metadata.duration === 'number') {
                    finalDuration = normalizedResource.metadata.duration;
                } else {
                    switch(normalizedResource.type) {
                        case 'VIDEO':
                        case 'AUDIO':
                            finalDuration = 10;
                            break;
                        default:
                            finalDuration = 5;
                    }
                }
            }
            if (!finalDuration) finalDuration = 5;
            const transform: CutClipTransform = ClipTransformFactory.calculate(normalizedResource, project.settings.resolution);

            const newClip: CutClip = {
                id,
                uuid: generateUUID(),
                type: 'CutClip',
                track: { id: trackId, uuid: track.uuid, type: 'CutTrack' },
                resource: { id: normalizedResource.id, uuid: normalizedResource.uuid, type: 'MediaResource' },
                start: Math.max(0, start),
                duration: finalDuration,
                offset: 0,
                layers: [],
                speed: 1,
                volume: 1,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                transform: transform,
                content: (normalizedResource.type === MediaResourceType.TEXT || normalizedResource.type === MediaResourceType.SUBTITLE)
                    ? (normalizedResource.metadata?.text || normalizedResource.name)
                    : undefined
            };
            draft.clips[id] = newClip;
            track.clips.push({ id, uuid: newClip.uuid, type: 'CutClip' });

            track.updatedAt = Date.now();

            if (activeTimelineId) {
                const tl = draft.timelines[activeTimelineId];
                if (tl) tl.duration = Math.max(tl.duration, newClip.start + newClip.duration + 5);
            }
        });
        return id;
    };

    const updateClip = (clipId: string, updates: Partial<CutClip>) => {
        updateState(draft => {
            if (draft.clips[clipId]) {
                Object.assign(draft.clips[clipId], updates);
                const trackId = draft.clips[clipId].track.id;
                if(draft.tracks[trackId]) draft.tracks[trackId].updatedAt = Date.now();
            }
        }, true);
    };

    const updateClipTransform = (clipId: string, transform: Partial<CutClipTransform>, isFinal: boolean) => {
        updateState(draft => {
            if (draft.clips[clipId]) {
                draft.clips[clipId].transform = { ...draft.clips[clipId].transform!, ...transform };
            }
        }, !isFinal);
    };
    const updateClipLayers = (clipId: string, layers: CutLayer[]) => {
        updateState(draft => {
            if (draft.clips[clipId]) {
                draft.clips[clipId].layers = layers.map(l => ({ id: l.id, uuid: l.uuid, type: 'CutLayer' }));
                layers.forEach(l => {
                    draft.layers[l.id] = l;
                });
            }
        });
    };
    
    const moveClip = (clipId: string, targetTrackId: string, newStart: number) => {
        updateState(draft => {
            const clip = draft.clips[clipId];
            if (!clip) return;
            const oldTrack = draft.tracks[clip.track.id];
            const newTrack = draft.tracks[targetTrackId];

            oldTrack.clips = oldTrack.clips.filter(c => c.id !== clipId);
            newTrack.clips.push({ id: clipId, uuid: clip.uuid, type: 'CutClip' });
            clip.track = { id: targetTrackId, uuid: newTrack.uuid, type: 'CutTrack' };
            clip.start = Math.max(0, newStart);

            oldTrack.updatedAt = Date.now();
            newTrack.updatedAt = Date.now();

            if (activeTimelineId) {
                const tl = draft.timelines[activeTimelineId];
                if (tl) tl.duration = Math.max(tl.duration, clip.start + clip.duration + 5);
            }
        });
    };
    
    const trimClip = (clipId: string, start: number, duration: number, offset: number) => {
        updateState(draft => {
            const clip = draft.clips[clipId];
            if (!clip) return;
            clip.start = start;
            clip.duration = duration;
            clip.offset = offset;
            if(draft.tracks[clip.track.id]) draft.tracks[clip.track.id].updatedAt = Date.now();
        });
    };

    const insertTrackAndAddClip = (resource: AnyMediaResource, insertIndex: number, start: number, duration: number, trackType: CutTrackType = 'video') => {
        updateState(draft => {
            if (!activeTimelineId) return;
            const tl = draft.timelines[activeTimelineId];
            if (!tl) return;
            const trackId = generateUUID();
            const config = TrackFactory.getTrackConfig(trackType, false);
            const newTrack: CutTrack = {
                id: trackId,
                uuid: generateUUID(),
                type: 'CutTrack',
                trackType: trackType,
                name: config.name,
                order: 0,
                clips: [],
                visible: true,
                locked: false,
                muted: false,
                height: config.height,
                isMain: false,
                createdAt: Date.now(),
                updatedAt: Date.now()
            };
            draft.tracks[trackId] = newTrack;
            if (typeof insertIndex === 'number' && insertIndex >= 0 && insertIndex <= tl.tracks.length) {
                tl.tracks.splice(insertIndex, 0, { id: trackId, uuid: newTrack.uuid, type: 'CutTrack' });
            } else {
                tl.tracks.push({ id: trackId, uuid: newTrack.uuid, type: 'CutTrack' });
            }
            updateTrackOrders(draft, activeTimelineId);
            const normalizedResource = normalizeResourceForTimeline(resource);
            if (!draft.resources[normalizedResource.id]) {
                draft.resources[normalizedResource.id] = normalizedResource;
            }
            const clipId = generateUUID();
            const transform: CutClipTransform = ClipTransformFactory.calculate(normalizedResource, project.settings.resolution);
            const newClip: CutClip = {
                id: clipId,
                uuid: generateUUID(),
                type: 'CutClip',
                track: { id: trackId, uuid: newTrack.uuid, type: 'CutTrack' },
                resource: { id: normalizedResource.id, uuid: normalizedResource.uuid, type: 'MediaResource' },
                start: Math.max(0, start),
                duration: duration,
                offset: 0,
                layers: [],
                speed: 1,
                volume: 1,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                transform: transform,
                content: (normalizedResource.type === MediaResourceType.TEXT || normalizedResource.type === MediaResourceType.SUBTITLE)
                    ? (normalizedResource.metadata?.text || normalizedResource.name)
                    : undefined
            };
            draft.clips[clipId] = newClip;
            newTrack.clips.push({ id: clipId, uuid: newClip.uuid, type: 'CutClip' });
        });
    };
    
    const insertTrackAndMoveClip = (clipId: string, insertIndex: number, newStart: number, trackType: CutTrackType = 'video') => {
        updateState(draft => {
            if (!activeTimelineId) return;
            const tl = draft.timelines[activeTimelineId];
            const trackId = generateUUID();
            const config = TrackFactory.getTrackConfig(trackType, false);
            const newTrack: CutTrack = {
                id: trackId,
                uuid: generateUUID(),
                type: 'CutTrack',
                trackType: trackType,
                name: config.name,
                order: 0,
                clips: [],
                visible: true,
                locked: false,
                muted: false,
                height: config.height,
                isMain: false,
                createdAt: Date.now(),
                updatedAt: Date.now()
            };
            draft.tracks[trackId] = newTrack;
            if (typeof insertIndex === 'number' && insertIndex >= 0 && insertIndex <= tl.tracks.length) {
                tl.tracks.splice(insertIndex, 0, { id: trackId, uuid: newTrack.uuid, type: 'CutTrack' });
            } else {
                tl.tracks.push({ id: trackId, uuid: newTrack.uuid, type: 'CutTrack' });
            }
            updateTrackOrders(draft, activeTimelineId);
            const clip = draft.clips[clipId];
            if (!clip) return;
            const oldTrack = draft.tracks[clip.track.id];
            oldTrack.clips = oldTrack.clips.filter(c => c.id !== clipId);
            newTrack.clips.push({ id: clipId, uuid: clip.uuid, type: 'CutClip' });
            clip.track = { id: trackId, uuid: newTrack.uuid, type: 'CutTrack' };
            clip.start = Math.max(0, newStart);
            oldTrack.updatedAt = Date.now();
        });
    };
    
    const splitClip = (time?: number) => {
        const t = time ?? storeRef.current.getState().currentTime;
        if (!selectedClipId) return;
        updateState(draft => {
            const clip = draft.clips[selectedClipId];
            if (!clip) return;
            if (t <= clip.start || t >= clip.start + clip.duration) return;
            const splitPoint = t - clip.start;
            const originalDuration = clip.duration;
            clip.duration = splitPoint;
            const newId = generateUUID();
            const newClip: CutClip = {
                ...clip,
                id: newId,
                uuid: generateUUID(),
                start: t,
                duration: originalDuration - splitPoint,
                offset: (clip.offset || 0) + (splitPoint * (clip.speed || 1.0)),
                layers: [...clip.layers],
                createdAt: Date.now(),
                updatedAt: Date.now()
            };
            draft.clips[newId] = newClip;
            const track = draft.tracks[clip.track.id];
            track.clips.push({ id: newId, uuid: newClip.uuid, type: 'CutClip' });
            track.updatedAt = Date.now();
            setSelectedClipId(newId);
            setSelectedClipIds(new Set([newId]));
        });
    };

    const trimStart = (time?: number) => {
        const t = time ?? storeRef.current.getState().currentTime;
        if (!selectedClipId) return;
        updateState(draft => {
            const clip = draft.clips[selectedClipId];
            if (!clip) return;
            if (t <= clip.start || t >= clip.start + clip.duration) return;
            const delta = t - clip.start;
            clip.start = t;
            clip.duration -= delta;
            clip.offset = (clip.offset || 0) + (delta * (clip.speed || 1.0));
            if(draft.tracks[clip.track.id]) draft.tracks[clip.track.id].updatedAt = Date.now();
        });
    };

    const trimEnd = (time?: number) => {
        const t = time ?? storeRef.current.getState().currentTime;
        if (!selectedClipId) return;
        updateState(draft => {
            const clip = draft.clips[selectedClipId];
            if (!clip) return;
            if (t <= clip.start || t >= clip.start + clip.duration) return;
            clip.duration = t - clip.start;
            if(draft.tracks[clip.track.id]) draft.tracks[clip.track.id].updatedAt = Date.now();
        });
    };

    const getSelectedClipSet = (): Set<string> => {
        const ids = new Set<string>();
        selectedClipIds.forEach((id) => {
            if (state.clips[id]) ids.add(id);
        });
        if (ids.size === 0 && selectedClipId && state.clips[selectedClipId]) {
            ids.add(selectedClipId);
        }
        return ids;
    };

    const getPrimarySelectedClipId = (clipIds?: Set<string>): string | null => {
        const ids = clipIds || getSelectedClipSet();
        if (selectedClipId && ids.has(selectedClipId) && state.clips[selectedClipId]) {
            return selectedClipId;
        }
        for (const id of ids) {
            if (state.clips[id]) return id;
        }
        return null;
    };

    const copyFromSelection = () => {
        const selectedIds = getSelectedClipSet();
        if (selectedIds.size === 0) return;

        const clips = Array.from(selectedIds)
            .map((id) => state.clips[id])
            .filter((clip): clip is CutClip => !!clip);
        if (clips.length === 0) return;

        clips.sort((a, b) => {
            const trackOrderA = state.tracks[a.track.id]?.order ?? Number.MAX_SAFE_INTEGER;
            const trackOrderB = state.tracks[b.track.id]?.order ?? Number.MAX_SAFE_INTEGER;
            if (trackOrderA !== trackOrderB) return trackOrderA - trackOrderB;
            if (Math.abs(a.start - b.start) > 0.0001) return a.start - b.start;
            return a.id.localeCompare(b.id);
        });

        const primaryClipId = getPrimarySelectedClipId(selectedIds);
        if (primaryClipId) {
            const primaryIndex = clips.findIndex((clip) => clip.id === primaryClipId);
            if (primaryIndex > 0) {
                const [primaryClip] = clips.splice(primaryIndex, 1);
                clips.unshift(primaryClip);
            }
        }

        clipboardClipsRef.current = clips;
        setClipboard(clips[0] || null);
    };

    const pasteFromClipboard = (trackId: string | null, time: number, mode: PasteMode = 'normal') => {
        const clipboardClips =
            clipboardClipsRef.current.length > 0
                ? clipboardClipsRef.current
                : (clipboard ? [clipboard] : []);
        if (clipboardClips.length === 0 || !activeTimelineId) return;

        const primaryClipboardClip = clipboardClips[0];
        const primaryClipboardClipId = primaryClipboardClip.id;
        const normalizedPasteStart = Math.max(0, time);
        const earliestStart = Math.min(...clipboardClips.map((clip) => clip.start));

        let pastedClipIds: string[] = [];
        let primaryPastedClipId: string | null = null;
        let finalTrackId: string | null = null;

        updateState(draft => {
            const timeline = draft.timelines[activeTimelineId];
            if (!timeline) return;

            let hasTrackStructureChange = false;

            const inferClipTrackType = (clip: CutClip): CutTrackType => {
                const sourceTrack = draft.tracks[clip.track.id];
                if (sourceTrack) return sourceTrack.trackType;
                const sourceResource = draft.resources[clip.resource.id];
                return sourceResource ? TrackFactory.inferTrackType(sourceResource.type) : 'video';
            };

            const createTrack = (trackType: CutTrackType, insertIndex?: number): string => {
                const newTrackId = generateUUID();
                const config = TrackFactory.getTrackConfig(trackType, false);
                const newTrack: CutTrack = {
                    id: newTrackId,
                    uuid: generateUUID(),
                    type: 'CutTrack',
                    trackType,
                    name: config.name,
                    order: 0,
                    clips: [],
                    visible: true,
                    locked: false,
                    muted: false,
                    height: config.height,
                    isMain: false,
                    createdAt: Date.now(),
                    updatedAt: Date.now()
                };
                draft.tracks[newTrackId] = newTrack;

                const index = typeof insertIndex === 'number'
                    ? Math.max(0, Math.min(insertIndex, timeline.tracks.length))
                    : timeline.tracks.length;
                timeline.tracks.splice(index, 0, { id: newTrackId, uuid: newTrack.uuid, type: 'CutTrack' });
                hasTrackStructureChange = true;
                return newTrackId;
            };

            const isTrackCompatibleForClip = (candidateTrackId: string | null, clip: CutClip): candidateTrackId is string => {
                if (!candidateTrackId) return false;
                const candidateTrack = draft.tracks[candidateTrackId];
                if (!candidateTrack) return false;
                const resource = draft.resources[clip.resource.id];
                if (!resource) return true;
                return TrackFactory.isCompatible(candidateTrack.trackType, resource.type);
            };

            const sourceTrackIds = Array.from(new Set(clipboardClips.map((clip) => clip.track.id))).sort((a, b) => {
                const orderA = draft.tracks[a]?.order ?? Number.MAX_SAFE_INTEGER;
                const orderB = draft.tracks[b]?.order ?? Number.MAX_SAFE_INTEGER;
                if (orderA !== orderB) return orderA - orderB;
                return a.localeCompare(b);
            });

            const sourceToTargetTrackMap = new Map<string, string>();
            const primarySourceTrackId = primaryClipboardClip.track.id;

            let primaryTargetTrackId: string | null = null;
            if (isTrackCompatibleForClip(trackId, primaryClipboardClip)) {
                primaryTargetTrackId = trackId;
            } else if (isTrackCompatibleForClip(selectedTrackId, primaryClipboardClip)) {
                primaryTargetTrackId = selectedTrackId;
            } else {
                primaryTargetTrackId =
                    timeline.tracks.map((ref) => ref.id).find((id) => isTrackCompatibleForClip(id, primaryClipboardClip)) || null;
            }

            if (!primaryTargetTrackId) {
                primaryTargetTrackId = createTrack(inferClipTrackType(primaryClipboardClip));
            }

            sourceToTargetTrackMap.set(primarySourceTrackId, primaryTargetTrackId);
            const usedTargetTrackIds = new Set<string>([primaryTargetTrackId]);

            let insertIndex = timeline.tracks.findIndex((ref) => ref.id === primaryTargetTrackId);
            insertIndex = insertIndex === -1 ? timeline.tracks.length : insertIndex + 1;
            const existingTrackIds = timeline.tracks.map((ref) => ref.id);

            sourceTrackIds.forEach((sourceTrackId) => {
                if (sourceToTargetTrackMap.has(sourceTrackId)) return;
                const representativeClip = clipboardClips.find((clip) => clip.track.id === sourceTrackId);
                if (!representativeClip) return;

                const reusableTrackId = existingTrackIds.find((candidateTrackId) => {
                    if (usedTargetTrackIds.has(candidateTrackId)) return false;
                    return isTrackCompatibleForClip(candidateTrackId, representativeClip);
                });

                if (reusableTrackId) {
                    sourceToTargetTrackMap.set(sourceTrackId, reusableTrackId);
                    usedTargetTrackIds.add(reusableTrackId);
                    return;
                }

                const mappedTrackId = createTrack(inferClipTrackType(representativeClip), insertIndex);
                sourceToTargetTrackMap.set(sourceTrackId, mappedTrackId);
                usedTargetTrackIds.add(mappedTrackId);
                insertIndex += 1;
            });

            if (hasTrackStructureChange) {
                updateTrackOrders(draft, activeTimelineId);
            }

            const targetTrackIds = Array.from(new Set(sourceToTargetTrackMap.values()));
            const pasteSpan = Math.max(
                0,
                Math.max(...clipboardClips.map((clip) => clip.start + clip.duration)) - earliestStart
            );

            if (mode === 'insert' && pasteSpan > 0) {
                targetTrackIds.forEach((targetTrackId) => {
                    const targetTrack = draft.tracks[targetTrackId];
                    if (!targetTrack) return;

                    targetTrack.clips.forEach((clipRef) => {
                        const clip = draft.clips[clipRef.id];
                        if (!clip) return;
                        if (clip.start >= normalizedPasteStart) {
                            clip.start += pasteSpan;
                            clip.updatedAt = Date.now();
                        }
                    });
                    targetTrack.updatedAt = Date.now();
                });
            }

            const clipsForPaste = [...clipboardClips].sort((a, b) => {
                if (Math.abs(a.start - b.start) > 0.0001) return a.start - b.start;
                const orderA = draft.tracks[a.track.id]?.order ?? Number.MAX_SAFE_INTEGER;
                const orderB = draft.tracks[b.track.id]?.order ?? Number.MAX_SAFE_INTEGER;
                if (orderA !== orderB) return orderA - orderB;
                return a.id.localeCompare(b.id);
            });

            if (mode === 'overwrite') {
                const overwriteRangesByTrack = new Map<string, Array<{ start: number; end: number }>>();

                clipsForPaste.forEach((sourceClip) => {
                    const targetTrackId = sourceToTargetTrackMap.get(sourceClip.track.id) || primaryTargetTrackId;
                    if (!targetTrackId) return;
                    const rangeStart = normalizedPasteStart + (sourceClip.start - earliestStart);
                    const rangeEnd = rangeStart + sourceClip.duration;
                    const ranges = overwriteRangesByTrack.get(targetTrackId) || [];
                    ranges.push({ start: rangeStart, end: rangeEnd });
                    overwriteRangesByTrack.set(targetTrackId, ranges);
                });

                overwriteRangesByTrack.forEach((ranges, targetTrackId) => {
                    const targetTrack = draft.tracks[targetTrackId];
                    if (!targetTrack || ranges.length === 0) return;

                    const sortedRanges = [...ranges].sort((a, b) => a.start - b.start);
                    const mergedRanges: Array<{ start: number; end: number }> = [];
                    sortedRanges.forEach((range) => {
                        const lastRange = mergedRanges[mergedRanges.length - 1];
                        if (lastRange && range.start <= lastRange.end) {
                            lastRange.end = Math.max(lastRange.end, range.end);
                        } else {
                            mergedRanges.push({ ...range });
                        }
                    });

                    const shouldRemove = (clip: CutClip): boolean => {
                        const clipStart = clip.start;
                        const clipEnd = clip.start + clip.duration;
                        return mergedRanges.some((range) => clipStart < range.end && clipEnd > range.start);
                    };

                    targetTrack.clips = targetTrack.clips.filter((clipRef) => {
                        const clip = draft.clips[clipRef.id];
                        if (!clip) return false;
                        if (!shouldRemove(clip)) return true;
                        delete draft.clips[clipRef.id];
                        return false;
                    });
                    targetTrack.updatedAt = Date.now();
                });
            }

            const createdClipIds: string[] = [];

            clipsForPaste.forEach((sourceClip) => {
                const targetTrackId = sourceToTargetTrackMap.get(sourceClip.track.id) || primaryTargetTrackId;
                if (!targetTrackId) return;
                const targetTrack = draft.tracks[targetTrackId];
                if (!targetTrack) return;

                const newClipId = generateUUID();
                const newClip: CutClip = {
                    ...sourceClip,
                    id: newClipId,
                    uuid: generateUUID(),
                    track: { id: targetTrackId, uuid: targetTrack.uuid, type: 'CutTrack' },
                    start: normalizedPasteStart + (sourceClip.start - earliestStart),
                    createdAt: Date.now(),
                    updatedAt: Date.now()
                } as CutClip;

                draft.clips[newClipId] = newClip;
                targetTrack.clips.push({ id: newClipId, uuid: newClip.uuid, type: 'CutClip' });
                targetTrack.updatedAt = Date.now();

                createdClipIds.push(newClipId);
                if (sourceClip.id === primaryClipboardClipId && !primaryPastedClipId) {
                    primaryPastedClipId = newClipId;
                }
            });

            if (createdClipIds.length > 0) {
                pastedClipIds = createdClipIds;
                finalTrackId = primaryTargetTrackId;
                if (!primaryPastedClipId) {
                    primaryPastedClipId = createdClipIds[0];
                }
            }
        });

        if (finalTrackId) setSelectedTrackId(finalTrackId);
        if (pastedClipIds.length > 0) {
            setSelectedClipId(primaryPastedClipId || pastedClipIds[0]);
            setSelectedClipIds(new Set(pastedClipIds));
        }
    };

    const deleteSelectedClipSet = (mode: DeleteMode = 'lift'): boolean => {
        const selectedIds = getSelectedClipSet();
        if (selectedIds.size === 0) return false;

        updateState(draft => {
            const removedRangesByTrack = new Map<string, Array<{ start: number; end: number }>>();

            selectedIds.forEach((clipId) => {
                const clip = draft.clips[clipId];
                if (!clip) return;

                const track = draft.tracks[clip.track.id];
                if (track) {
                    const ranges = removedRangesByTrack.get(track.id) || [];
                    ranges.push({ start: clip.start, end: clip.start + clip.duration });
                    removedRangesByTrack.set(track.id, ranges);
                    track.clips = track.clips.filter(c => c.id !== clipId);
                    track.updatedAt = Date.now();
                }
                delete draft.clips[clipId];
            });

            if (mode !== 'ripple') return;

            removedRangesByTrack.forEach((ranges, trackId) => {
                const track = draft.tracks[trackId];
                if (!track || ranges.length === 0) return;

                const sortedRanges = [...ranges].sort((a, b) => a.start - b.start);
                const mergedRanges: Array<{ start: number; end: number }> = [];
                sortedRanges.forEach((range) => {
                    const lastRange = mergedRanges[mergedRanges.length - 1];
                    if (lastRange && range.start <= lastRange.end) {
                        lastRange.end = Math.max(lastRange.end, range.end);
                    } else {
                        mergedRanges.push({ ...range });
                    }
                });

                const removedBeforeTime = (t: number): number => {
                    return mergedRanges.reduce((sum, range) => {
                        if (t <= range.start) return sum;
                        return sum + (Math.min(t, range.end) - range.start);
                    }, 0);
                };

                track.clips.forEach((clipRef) => {
                    const clip = draft.clips[clipRef.id];
                    if (!clip) return;
                    const removedBefore = removedBeforeTime(clip.start);
                    if (removedBefore <= 0) return;
                    clip.start = Math.max(0, clip.start - removedBefore);
                    clip.updatedAt = Date.now();
                });

                track.updatedAt = Date.now();
            });
        });

        setSelectedClipIds(new Set());
        setSelectedClipId(null);
        return true;
    };

    const copyClip = (clipId: string) => {
        const clip = state.clips[clipId];
        if (!clip) return;
        setSelectedClipId(clipId);
        setSelectedClipIds(new Set([clipId]));
        setSelectedTrackId(clip.track.id);
        clipboardClipsRef.current = [clip];
        setClipboard(clip);
    };
    
    const pasteClip = (trackId: string | null, time: number, mode: PasteMode = 'normal') => {
        pasteFromClipboard(trackId, time, mode);
    };
    
    const deleteSelected = (mode: DeleteMode = 'lift') => {
        if (deleteSelectedClipSet(mode)) return;
        if (selectedTrackId) {
            removeTrack(selectedTrackId);
            setSelectedTrackId(null);
        }
    };

    const detachAudio = async (clipId: string) => {
        const clip = state.clips[clipId];
        if (!clip) {
            return;
        }
        const resource = state.resources[clip.resource.id];
        if (!resource) {
            return;
        }

        const extension = resolveAssetNameExtension(resource);
        const baseName = resource.name && resource.name.endsWith(extension)
            ? resource.name.slice(0, Math.max(0, resource.name.length - extension.length))
            : (resource.name || 'audio');
        const source = await resolveResourceImportSource(resource);
        const imported = await assetBusinessFacade.importMagiccutAsset({
            scope: resolveMagiccutScope(),
            type: 'audio',
            name: `${baseName}_audio${extension}`,
            ...source,
            metadata: {
                ...(resource.metadata || {}),
                origin: 'system',
                source: `derived:${resource.id}`
            }
        });
        const audioResource = toMagiccutResource(imported);

        const result = timelineOperationService.calculateDetachAudio(state, clipId, audioResource.id);
        
        if (result) {
            updateState(draft => {
                if (!draft.resources[audioResource.id]) {
                    draft.resources[audioResource.id] = audioResource;
                }
                if (draft.clips[clipId]) {
                    Object.assign(draft.clips[clipId], result.updatedVideoClip);
                }
                let finalTrackId = result.targetTrackId;

                if (result.shouldCreateNewTrack) {
                    const trackId = generateUUID();
                    const timeline = draft.timelines[activeTimelineId!];
                    const videoTrackRef = timeline.tracks.find(t => t.id === clip.track.id);
                    const videoTrackIdx = timeline.tracks.indexOf(videoTrackRef!);
                    
                    const config = TrackFactory.getTrackConfig('audio', false);
                    const newTrack: CutTrack = {
                        id: trackId, uuid: generateUUID(), type: 'CutTrack', trackType: 'audio',
                        name: config.name, order: 0, clips: [], isMain: false,
                        visible: true, locked: false, muted: false, height: config.height,
                        createdAt: Date.now(), updatedAt: Date.now()
                    };
                    draft.tracks[trackId] = newTrack;
                    timeline.tracks.splice(videoTrackIdx + 1, 0, { id: trackId, uuid: newTrack.uuid, type: 'CutTrack' });
                    
                    timeline.tracks.forEach((ref, idx) => {
                        const tr = draft.tracks[ref.id];
                        if (tr) tr.order = idx;
                    });
                    
                    finalTrackId = trackId;
                }

                const newClipId = result.newAudioClip.id;
                const newClip: CutClip = {
                     ...result.newAudioClip,
                     track: { id: finalTrackId, uuid: draft.tracks[finalTrackId].uuid, type: 'CutTrack' }
                } as CutClip;
                
                 draft.clips[newClipId] = newClip;
                 draft.tracks[finalTrackId].clips.push({ id: newClipId, uuid: newClip.uuid, type: 'CutClip' });
                 draft.tracks[finalTrackId].updatedAt = Date.now();

                 setSelectedClipId(newClipId);
                 setSelectedClipIds(new Set([newClipId]));
             });
         }
     };
    
    const selectClip = (id: string | null, multi = false) => {
        if (!id) {
            setSelectedClipId(null);
            setSelectedClipIds(new Set());
            setSelectedTrackId(null);
            return;
        }

        const clip = state.clips[id];
        if (!clip) return;
        setSelectedTrackId(clip.track.id);

        if (!multi) {
            setSelectedClipId(id);
            setSelectedClipIds(new Set([id]));
            return;
        }

        const nextSelectedClipIds = new Set(selectedClipIds);
        if (nextSelectedClipIds.has(id)) {
            nextSelectedClipIds.delete(id);
            if (nextSelectedClipIds.size === 0) {
                setSelectedClipId(null);
            } else if (selectedClipId === id) {
                let fallbackId: string | null = null;
                for (const candidateId of nextSelectedClipIds) {
                    fallbackId = candidateId;
                }
                setSelectedClipId(fallbackId);
            }
        } else {
            nextSelectedClipIds.add(id);
            setSelectedClipId(id);
        }
        setSelectedClipIds(nextSelectedClipIds);
    };
    const selectTrack = (id: string | null) => {
        setSelectedTrackId(id);
        setSelectedClipId(null);
        setSelectedClipIds(new Set());
    };

    const updateResource = (id: string, updates: Partial<AnyMediaResource>) => {
        updateState(draft => {
            if (draft.resources[id]) {
                Object.assign(draft.resources[id], updates);
            }
        });
    };

    const addEffectToClip = (clipId: string, effectId: string) => {
        const id = generateUUID();
        updateState(draft => {
            const clip = draft.clips[clipId];
            if (!clip) return;
            const newLayer: CutLayer = {
                id,
                uuid: generateUUID(),
                clip: { id: clipId, uuid: clip.uuid, type: 'CutClip' },
                type: 'CutLayer',
                layerType: 'filter',
                enabled: true,
                order: clip.layers.length,
                params: { definitionId: effectId },
                createdAt: Date.now(),
                updatedAt: Date.now()
            };
            draft.layers[id] = newLayer;
            clip.layers.push({ id, uuid: newLayer.uuid, type: 'CutLayer' });
        });
    };
    const addKeyframe = (clipId: string, property: string, value: number) => {
        const time = storeRef.current.getState().currentTime;
        updateState(draft => {
            const clip = draft.clips[clipId];
            if (!clip) return;
            if (!clip.keyframes) clip.keyframes = {};
            if (!clip.keyframes[property]) clip.keyframes[property] = [];
            const relTime = Math.max(0, time - clip.start);
            const existingIdx = clip.keyframes[property].findIndex(k => Math.abs(k.time - relTime) < 0.05);
            if (existingIdx !== -1) {
                clip.keyframes[property][existingIdx].value = value;
            } else {
                clip.keyframes[property].push({
                    id: generateUUID(),
                    time: relTime,
                    value,
                    easing: 'linear'
                });
                clip.keyframes[property].sort((a, b) => a.time - b.time);
            }
        });
    };
    const removeKeyframe = (clipId: string, property: string) => {
        const time = storeRef.current.getState().currentTime;
        updateState(draft => {
            const clip = draft.clips[clipId];
            if (!clip || !clip.keyframes || !clip.keyframes[property]) return;
            const relTime = Math.max(0, time - clip.start);
            clip.keyframes[property] = clip.keyframes[property].filter(k => Math.abs(k.time - relTime) >= 0.05);
        });
    };
    const undo = useCallback(() => {
        if (history.length === 0) return;
        const { undo: undoPatches, redo: redoPatches } = history[history.length - 1];
        setHistory(prev => prev.slice(0, -1));
        setFuture(prev => [{ undo: undoPatches, redo: redoPatches }, ...prev]);
        setState(curr => applyPatches(curr, undoPatches));
    }, [history]);
    const redo = useCallback(() => {
        if (future.length === 0) return;
        const { undo: undoPatches, redo: redoPatches } = future[0];
        setFuture(prev => prev.slice(1));
        setHistory(prev => [...prev, { undo: undoPatches, redo: redoPatches }]);
        setState(curr => applyPatches(curr, redoPatches));
    }, [future]);
    
    // --- SNAP POINTS ---
    const getGlobalSnapPoints = useCallback(() => {
         const points: number[] = [0];
         Object.values(state.clips).forEach(c => {
             points.push(c.start);
             points.push(c.start + c.duration);
         });
         return points;
    }, [state.clips]);
    
    // --- Validation Helpers ---
    const validateTrackDrop = useCallback((trackId: string, resourceType: string) => {
        const track = state.tracks[trackId];
        if (!track) return false;
        const rules = TrackRulesFactory.getRules(track.trackType);
        return rules.isCompatible(resourceType as MediaResourceType);
    }, [state.tracks]);

    const checkCollision = useCallback((trackId: string, start: number, duration: number, exclude: Set<string>) => {
        const track = state.tracks[trackId];
        if (!track) return false;

        const end = start + duration;
        const EPSILON = 0.001;

        for (const clipRef of track.clips) {
            if (exclude.has(clipRef.id)) continue;
            
            const clip = state.clips[clipRef.id];
            if (!clip) continue;

            const cStart = clip.start;
            const cEnd = clip.start + clip.duration;

            if (start < cEnd - EPSILON && end > cStart + EPSILON) {
                return true;
            }
        }
        return false;
    }, [state.tracks, state.clips]);

    const importFileObjects = async (files: File[]) => {
        const resources: AnyMediaResource[] = [];
        for (const file of files) {
            const buffer = new Uint8Array(await file.arrayBuffer());
            let typeStr = file.type;
            if (!typeStr || typeStr === '') {
                const ext = file.name.split('.').pop()?.toLowerCase();
                if (['mp4', 'mov', 'webm', 'mkv', 'avi'].includes(ext || '')) typeStr = 'video/mp4';
                else if (['mp3', 'wav', 'ogg', 'flac', 'm4a'].includes(ext || '')) typeStr = 'audio/mpeg';
                else if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext || '')) typeStr = 'image/png';
            }
            let type: AssetContentKey = 'file';
            if (typeStr.startsWith('video')) type = 'video';
            else if (typeStr.startsWith('audio')) type = 'audio';
            else if (typeStr.startsWith('image')) type = 'image';
            else if (typeStr.startsWith('text')) type = 'text';
            const sourcePath = (file as any).path;
            const imported = await assetBusinessFacade.importMagiccutAsset({
                scope: resolveMagiccutScope(),
                type,
                name: file.name,
                data: buffer,
                sourcePath: sourcePath ? await toAbsoluteAssetPath(sourcePath) : undefined,
                metadata: {
                    origin: 'upload',
                    source: 'magiccut-dnd-import'
                }
            });
            const resource = toMagiccutResource(imported);
            resources.push(resource);
            updateState(draft => {
                draft.resources[resource.id] = resource;
            });
        }
        return resources;
    };
    const importAssets = async (accept?: string, forcedType?: AssetType): Promise<AnyMediaResource[]> => {
        try {
            const files = await uploadHelper.pickFiles(true, accept || '*');
            if (files.length === 0) return [];
            const importedResources: AnyMediaResource[] = [];
            for (const f of files) {
                const ext = f.name.split('.').pop()?.toLowerCase();
                let type: AssetContentKey = 'image';
                if (forcedType) {
                    type = forcedType as AssetContentKey;
                } else {
                    if (['mp4', 'mov', 'webm', 'mkv', 'avi'].includes(ext || '')) type = 'video';
                    else if (['mp3', 'wav', 'ogg', 'flac', 'm4a'].includes(ext || '')) type = 'audio';
                }
                const imported = await assetBusinessFacade.importMagiccutAsset({
                    scope: resolveMagiccutScope(),
                    type,
                    name: f.name,
                    data: f.data,
                    sourcePath: f.path ? await toAbsoluteAssetPath(f.path) : undefined,
                    metadata: {
                        origin: 'upload',
                        source: 'magiccut-picker-import'
                    }
                });
                const resource = toMagiccutResource(imported);
                importedResources.push(resource);
                updateState(draft => {
                    draft.resources[resource.id] = resource;
                });
            }
            return importedResources;
        } catch (e) {
            console.error("Import failed", e);
            return [];
        }
    };
    const switchProject = async (id: string) => {
        const res = await magicCutProjectService.findById(id);
        if (res.success && res.data) {
            const normalizedProject = normalizeProjectAssetReferences(res.data);
            setProject(normalizedProject);
            if (normalizedProject.normalizedState) {
                setState(normalizeStateAssetReferences(normalizedProject.normalizedState as NormalizedState));
            } else {
                setState(normalizeStateAssetReferences(normalizeProject(normalizedProject)));
            }
            if (normalizedProject.timelines.length > 0) setActiveTimelineId(normalizedProject.timelines[0].id);
            setSelectedClipId(null);
            setSelectedClipIds(new Set());
            setSelectedTrackId(null);
            setClipboard(null);
            clipboardClipsRef.current = [];
        }
    };
    const loadLastProject = async () => {
        const res = await magicCutProjectService.findAll({ page: 0, size: 1, sort: ['updatedAt,desc'] });
        if (res.success && res.data && res.data.content.length > 0) {
            await switchProject(res.data.content[0].id);
        } else {
            const newP = createDefaultProject();
            await magicCutProjectService.save(newP);
            setProject(newP);
            setState(normalizeStateAssetReferences(normalizeProject(newP)));
            setActiveTimelineId(newP.timelines[0].id);
            setSelectedClipId(null);
            setSelectedClipIds(new Set());
            setSelectedTrackId(null);
            setClipboard(null);
            clipboardClipsRef.current = [];
        }
    };
    const addMarker = () => {
        const t = storeRef.current.getState().currentTime;
        updateState(draft => {
            if (activeTimelineId) {
                const tl = draft.timelines[activeTimelineId];
                if (tl) {
                    if (!tl.markers) tl.markers = [];
                    tl.markers.push({ id: generateUUID(), time: t, label: '', color: '#f59e0b' });
                }
            }
        });
    };
    const toggleLoop = () => setIsLooping(!isLooping);
    const updateProjectMetadata = (data: Partial<CutProject>) => {
        setProject(prev => ({ ...prev, ...data }));
    };
    const updateProjectSettings = (settings: Partial<CutProjectSettings>) => {
        setProject(prev => ({ ...prev, settings: { ...prev.settings, ...settings } }));
    };
    const setPreviewSource = (_resource: AnyMediaResource | null) => { };
    
    // Updated setClipSpeed
    const setClipSpeed = (clipId: string, newSpeed: number) => {
        updateState(draft => {
            const clip = draft.clips[clipId];
            if (!clip) return;

            const resource = draft.resources[clip.resource.id];
            const oldSpeed = clip.speed || 1.0;
            const ratio = oldSpeed / newSpeed;
            let finalDuration = clip.duration * ratio;

            if (resource && (resource as any).duration) {
                const sourceDuration = (resource as any).duration;
                const offset = clip.offset || 0;
                const requiredContentLength = finalDuration * newSpeed;

                if (offset + requiredContentLength > sourceDuration + 0.01) {
                    finalDuration = (sourceDuration - offset) / newSpeed;
                }
            }

            clip.speed = newSpeed;
            clip.duration = finalDuration;
            if(draft.tracks[clip.track.id]) draft.tracks[clip.track.id].updatedAt = Date.now();
        });
    };

    const saveAsTemplate = async (metadata: TemplateMetadata) => {
        const normalizedState = normalizeStateAssetReferences(state);
        await templateService.saveTemplate(metadata, project, normalizedState);
    };
    const loadTemplate = async (template: any) => {
        const { project: newP, state: newS } = templateService.instantiateTemplate(template);
        const normalizedProject = normalizeProjectAssetReferences(newP);
        setProject(normalizedProject);
        setState(normalizeStateAssetReferences(newS));
        if (normalizedProject.timelines.length > 0) setActiveTimelineId(normalizedProject.timelines[0].id);
        setSelectedClipId(null);
        setSelectedClipIds(new Set());
        setSelectedTrackId(null);
        setClipboard(null);
        clipboardClipsRef.current = [];
    };
    const setDragOperation = (op: DragOperation | null) => storeRef.current.setState({ dragOperation: op });
    const setInteraction = (interaction: InteractionState | ((prev: InteractionState) => InteractionState)) =>
        storeRef.current.setState(prev => ({ interaction: typeof interaction === 'function' ? interaction(prev.interaction) : interaction }));
    const setSkimmingResource = (res: AnyMediaResource | null) => storeRef.current.setState({ skimmingResource: res });
    const canSeek = () => {
        const s = storeRef.current.getState();
        return s.interaction.type === 'idle' && !s.dragOperation;
    };
    const addTimeline = (name: string) => {
        updateState(draft => {
            const id = generateUUID();
            const newTl: CutTimeline = {
                id,
                uuid: generateUUID(),
                type: 'CutTimeline',
                name,
                fps: 30,
                duration: 60,
                tracks: [],
                createdAt: Date.now(),
                updatedAt: Date.now()
            };
            const tid = generateUUID();
            const config = TrackFactory.getTrackConfig('video', true);
            const track: CutTrack = {
                id: tid,
                uuid: generateUUID(),
                type: 'CutTrack',
                trackType: 'video',
                name: 'Main',
                order: 0,
                isMain: true,
                clips: [],
                height: config.height,
                visible: true,
                locked: false,
                muted: false,
                createdAt: Date.now(),
                updatedAt: Date.now()
            };
            draft.tracks[tid] = track;
            newTl.tracks.push({ id: tid, uuid: track.uuid, type: 'CutTrack' });
            draft.timelines[id] = newTl;
        });
    };
    const removeTimeline = (id: string) => {
        updateState(draft => { delete draft.timelines[id]; });
        if (activeTimelineId === id) {
            const remaining = Object.keys(state.timelines).filter(tid => tid !== id);
            setActiveTimelineId(remaining.length > 0 ? remaining[0] : null);
        }
    };
    const updateTimeline = (id: string, updates: Partial<CutTimeline>) => {
        updateState(draft => {
            if (draft.timelines[id]) Object.assign(draft.timelines[id], updates);
        });
    };
    const setActiveTimelineIdHandler = (id: string) => {
        setActiveTimelineId(id);
    };

    // Additional methods for shortcuts
    const stepForward = () => {
        const currentTime = storeRef.current.getState().currentTime;
        playerControllerRef.current.seek(currentTime + 1/30);
    };
    
    const stepBackward = () => {
        const currentTime = storeRef.current.getState().currentTime;
        playerControllerRef.current.seek(Math.max(0, currentTime - 1/30));
    };
    
    const selectAllClips = () => {
        if (!activeTimeline) return;
        const allClipIds = new Set<string>();
        activeTimeline.tracks.forEach(tr => {
            const track = state.tracks[tr.id];
            if (track) {
                track.clips.forEach(cr => allClipIds.add(cr.id));
            }
        });
        setSelectedClipIds(allClipIds);
        const firstId = allClipIds.values().next().value ?? null;
        setSelectedClipId(firstId);
        if (firstId) {
            const firstClip = state.clips[firstId];
            if (firstClip) setSelectedTrackId(firstClip.track.id);
        }
    };
    
    const clearSelection = () => {
        setSelectedClipIds(new Set());
        setSelectedClipId(null);
    };
    
    const deleteSelectedClips = (mode: DeleteMode = 'lift') => {
        deleteSelectedClipSet(mode);
    };
    
    const copySelectedClips = () => {
        copyFromSelection();
    };
    
    const pasteClips = (trackId: string | null, time: number, mode: PasteMode = 'normal') => {
        pasteFromClipboard(trackId, time, mode);
    };
    
    const nudgeSelectedClips = (delta: number) => {
        const selectedIds = getSelectedClipSet();
        if (selectedIds.size === 0) return;
        updateState(draft => {
            selectedIds.forEach(clipId => {
                const clip = draft.clips[clipId];
                if (clip) {
                    clip.start = Math.max(0, clip.start + delta);
                }
            });
        });
    };
    
    const setInPoint = (time: number) => setInPointState(time);
    const setOutPoint = (time: number) => setOutPointState(time);
    const clearInOutPoints = () => {
        setInPointState(null);
        setOutPointState(null);
    };
    
    const selectClipsInRegion = (start: number, end: number, trackIds?: string[]) => {
        if (!activeTimeline) return;
        const ids = new Set<string>();
        const tracksToCheck = trackIds || activeTimeline.tracks.map(t => t.id);
        tracksToCheck.forEach(trackId => {
            const track = state.tracks[trackId];
            if (track) {
                track.clips.forEach(cr => {
                    const clip = state.clips[cr.id];
                    if (clip && clip.start < end && clip.start + clip.duration > start) {
                        ids.add(clip.id);
                    }
                });
            }
        });
        setSelectedClipIds(ids);
        const firstId = ids.values().next().value ?? null;
        setSelectedClipId(firstId);
        if (firstId) {
            const firstClip = state.clips[firstId];
            if (firstClip) setSelectedTrackId(firstClip.track.id);
        }
    };
    
    const updateClips = (updates: Array<{ id: string; changes: Partial<CutClip> }>) => {
        updateState(draft => {
            updates.forEach(({ id, changes }) => {
                const clip = draft.clips[id];
                if (clip) {
                    Object.assign(clip, changes);
                }
            });
        });
    };
    
    const useSkimmingResource = () => storeRef.current.getState().skimmingResource;
    const usePreviewEffect = () => previewEffect;

    return (
        <MagicCutStoreContext.Provider value={{
            project, state, activeTimelineId, activeTimeline,
            switchProject, loadLastProject, saveAsTemplate, loadTemplate,
            addTrack, removeTrack, updateTrack, resizeTrack, selectTrack,
            addClip, updateClip, updateClipTransform, updateClipLayers, moveClip, splitClip, trimStart, trimEnd, trimClip, copyClip, pasteClip, deleteSelected, selectClip,
            updateResource,
            addEffectToClip, addKeyframe, removeKeyframe,
            insertTrackAndMoveClip, insertTrackAndAddClip,
            play: playerControllerRef.current.play,
            pause: playerControllerRef.current.pause,
            seek: playerControllerRef.current.seek,
            undo, redo, canUndo: history.length > 0, canRedo: future.length > 0,
            commitHistory, beginTransaction, commitTransaction,
            toggleSnapping: () => setIsSnappingEnabled(p => !p),
            toggleSkimming: () => setIsSkimmingEnabled(p => !p),
            addMarker,
            getResource: (id) => state.resources[id],
            getClip: (id) => state.clips[id],
            getClipResource: (id) => {
                const clip = state.clips[id];
                return clip ? state.resources[clip.resource.id] : undefined;
            },
            totalDuration,
            selectedClipId, selectedTrackId, selectedClipIds, clipboard,
            stepForward, stepBackward,
            selectAllClips, clearSelection, deleteSelectedClips,
            copySelectedClips, pasteClips, nudgeSelectedClips,
            setInPoint, setOutPoint, clearInOutPoints,
            inPoint, outPoint,
            selectClipsInRegion, updateClips,
            isProcessing,
            useSkimmingResource, usePreviewEffect,
            store: storeRef.current,
            useTransientState,
            playerController: playerControllerRef.current,
            validateTrackDrop, checkCollision, getGlobalSnapPoints,
            importFileObjects,
            updateProjectSettings, updateProjectMetadata,
            skimmingResource: storeRef.current.getState().skimmingResource,
            setSkimmingResource,
            previewEffect, setPreviewEffect,
            isLooping, toggleLoop,
            setClipSpeed,
            setDragOperation,
            setInteraction,
            importAssets,
            setPreviewSource,
            isSkimmingEnabled,
            canSeek,
            isSnappingEnabled,
            previewRange,
            setActiveTimelineId: setActiveTimelineIdHandler,
            addTimeline,
            removeTimeline,
            updateTimeline,
            detachAudio
        }}>
            {children}
        </MagicCutStoreContext.Provider>
    );
};

export const useMagicCutStore = () => {
    const context = useContext(MagicCutStoreContext);
    if (!context) throw new Error("useMagicCutStore must be used within MagicCutStoreProvider");
    return context;
};

// --- Initializer Helpers ---
function createDefaultProject(): CutProject {
    const pid = generateUUID();
    const tid = generateUUID();
    const mainTrack: CutTrack = {
        id: generateUUID(), uuid: generateUUID(), type: 'CutTrack', trackType: 'video', name: 'Main Track', order: 0, isMain: true,
        clips: [], height: TIMELINE_CONSTANTS.TRACK_HEIGHT_VIDEO, visible: true, locked: false, muted: false, volume: 1.0, createdAt: Date.now(), updatedAt: Date.now()
    };
    
    return {
        id: pid, uuid: pid, name: 'Untitled Project', version: 1,
        type: 'CUT_PROJECT',
        timelines: [{ id: tid, uuid: tid, type: 'CutTimeline' }],
        mediaResources: [],
        settings: { resolution: '1920x1080', fps: 30, aspectRatio: '16:9' },
        createdAt: Date.now(), updatedAt: Date.now(),
        normalizedState: {
            resources: {},
            timelines: {
                [tid]: { id: tid, uuid: tid, type: 'CutTimeline', name: 'Sequence 1', fps: 30, duration: 60, tracks: [{ id: mainTrack.id, uuid: mainTrack.uuid, type: 'CutTrack' }], createdAt: Date.now(), updatedAt: Date.now() }
            },
            tracks: { [mainTrack.id]: mainTrack },
            clips: {},
            layers: {}
        }
    };
}

function normalizeProject(project: CutProject): NormalizedState {
    if (project.normalizedState) return project.normalizedState as NormalizedState;
    return { resources: {}, timelines: {}, tracks: {}, clips: {}, layers: {} };
}
