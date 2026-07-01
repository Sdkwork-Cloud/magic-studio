
import {
    assetCenterService,
    isExplicitLocalAssetLocator,
    isLocalFilePath,
    isManagedAssetLocator,
    readWorkspaceScope,
} from '@sdkwork/magic-studio-assets/asset-center';
import {
    importAssetBySdk,
    importAssetFromUrlBySdk,
    resolveAssetPrimaryUrlBySdk,
} from '@sdkwork/magic-studio-assets/services';
import type { Asset } from '@sdkwork/magic-studio-assets/entities';
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef, useMemo } from 'react';
import { produce, enableMapSet, enablePatches, applyPatches, Patch } from 'immer';
import { useStore } from 'zustand';

import { CutProject, CutTimeline, CutTrack, CutClip, CutLayer, CutTrackType, TemplateMetadata, CutClipTransform, CutProjectSettings } from '../entities';
import { generateUUID, pathUtils } from '@sdkwork/magic-studio-commons/utils/helpers';
import type { AssetDomainReference } from '@sdkwork/magic-studio-types/asset-center';
import { resolveEntityKey } from '@sdkwork/magic-studio-types/entity';
import type { AnyMediaResource, AssetContentKey } from '@sdkwork/magic-studio-types/media';
import {
    createCutClip,
    createCutClipRef,
    createCutLayer,
    createCutLayerRef,
    createCutTimeline,
    createCutTimelineRef,
    createCutTrack,
    createCutTrackRef,
    createKeyframePoint,
    createTimelineMarker,
} from '@sdkwork/magic-studio-types/magiccut';
import { MediaResourceType } from '@sdkwork/magic-studio-types/vocabulary';
import { createTimelineStore, TimelineStore } from './transientStore';
import { PlayerController } from '../controllers/PlayerController';
import { NormalizedState, InteractionState, DragOperation } from './types';
import { createDefaultMagicCutProject } from './defaultProject';
import { buildMagicCutPersistedProject } from './projectGraph';
import { normalizeMagicCutProjectState } from './projectState';
import {
    findMagicCutClipByKey,
    findMagicCutClipByRef,
    findMagicCutClipResourceByKey,
    findMagicCutResourceByKey,
    findMagicCutResourceByRef,
    findMagicCutTimelineByKey,
    findMagicCutTrackByKey,
    findMagicCutTrackByRef,
    resolveMagicCutCanonicalClipKey,
    resolveMagicCutCanonicalTrackKey
} from './stateIdentity';
import { TrackRulesFactory } from '../domain/dnd/TrackRulesFactory';
import { TrackFactory, magicCutBusinessService } from '../services';
import type { EditOperationResult } from '../services/TimelineEditService';
import type { LinkedClipMove } from '../domain/timeline/linkedMove';
;
import { inlineDataService, uploadHelper } from '@sdkwork/magic-studio-core/services';
import { textRenderer, DEFAULT_TEXT_STYLE } from '../engine/text/TextRenderer';
import {
    normalizeProjectAssetReferences,
    normalizeResourceForTimeline,
    normalizeStateAssetReferences
} from '../utils/assetReferenceNormalization';
import {
    buildMagicCutAssetRef,
    buildMagicCutAssetRegistrationInput,
    buildMagicCutResourceView,
    isMagicCutAssetInUse,
    type MagicCutMaterialStorageMode,
    decideMagicCutImportRoute,
    normalizeMagicCutAssetState,
    removeMagicCutAssetFromState
} from '../domain/assets/magicCutAssetState';
import { buildMagicCutImportScope } from '../domain/assets/magicCutImportScope';
import { setPlaybackInPoint as resolvePlaybackInPoint, setPlaybackOutPoint as resolvePlaybackOutPoint } from '../domain/playback/playbackRange';
import { resolveLinkedSelectionState } from '../domain/timeline/linkedSelection';
import { settingsBusinessService } from '@sdkwork/magic-studio-settings';
;
;

// Local type definition for asset types
type AssetType = 'image' | 'video' | 'audio' | 'music' | 'voice' | 'text' | 'effect' | 'transition' | 'subtitle' | 'character' | 'sfx';
export type DeleteMode = 'lift' | 'ripple';
export type PasteMode = 'normal' | 'insert' | 'overwrite';

type AssetImportSource = {
    data?: Uint8Array;
    remoteUrl?: string;
};

const DEFAULT_MAGICCUT_STORAGE_MODE: MagicCutMaterialStorageMode = 'local-first-sync';

const {
    timelineOperationService,
    magicCutProjectService,
    templateService
} = magicCutBusinessService;

// Re-export types for consumers
export * from './types';
export * from './transientStore';

enableMapSet();
enablePatches();

function updateTrackOrders(draft: NormalizedState, timelineId: string) {
    const tl = findMagicCutTimelineByKey(draft, timelineId);
    if (!tl) return;
    tl.tracks.forEach((ref, idx) => {
        const tr = findMagicCutTrackByRef(draft, ref);
        if (tr) tr.order = idx;
    });
}

function sortTrackClips(draft: NormalizedState, trackId: string) {
    const track = findMagicCutTrackByKey(draft, trackId);
    if (!track) return;

    track.clips.sort((leftRef, rightRef) => {
        const leftClip = findMagicCutClipByRef(draft, leftRef);
        const rightClip = findMagicCutClipByRef(draft, rightRef);

        if (!leftClip && !rightClip) return 0;
        if (!leftClip) return 1;
        if (!rightClip) return -1;
        if (Math.abs(leftClip.start - rightClip.start) > 0.0001) {
            return leftClip.start - rightClip.start;
        }
        return resolveEntityKey(leftClip).localeCompare(resolveEntityKey(rightClip));
    });
}

const resolveTrackStateKeyFromRef = (
    state: Pick<NormalizedState, 'tracks'>,
    ref: Pick<CutClip['track'], 'id' | 'uuid'>
): string => resolveMagicCutCanonicalTrackKey(state, resolveEntityKey(ref)) || resolveEntityKey(ref);

const resolveClipStateKeyFromRef = (
    state: Pick<NormalizedState, 'clips'>,
    ref: { id: string | null; uuid: string }
): string => resolveMagicCutCanonicalClipKey(state, resolveEntityKey(ref)) || resolveEntityKey(ref);

function syncDraftResourceState(draft: NormalizedState, resource: AnyMediaResource): AnyMediaResource {
    const normalizedResource = normalizeResourceForTimeline(resource);
    const resourceKey = resolveEntityKey(normalizedResource);
    const nextState = normalizeMagicCutAssetState({
        assets: draft.assets,
        resourceViews: draft.resourceViews,
        resources: {
            ...draft.resources,
            [resourceKey]: normalizedResource
        }
    });
    draft.assets = nextState.assets;
    draft.resourceViews = nextState.resourceViews;
    draft.resources = nextState.resources;
    return draft.resources[resourceKey] || normalizedResource;
}

function applyClipMovesToDraft(
    draft: NormalizedState,
    moves: LinkedClipMove[],
    activeTimelineId: string | null
) {
    const touchedTrackIds = new Set<string>();
    let movedMaxEnd = 0;

    moves.forEach(({ clipId, targetTrackId, newStart }) => {
        const clip = findMagicCutClipByKey(draft, clipId);
        const targetTrack = findMagicCutTrackByKey(draft, targetTrackId);
        if (!clip || !targetTrack) return;

        const previousTrackId = resolveTrackStateKeyFromRef(draft, clip.track);
        const previousTrack = findMagicCutTrackByRef(draft, clip.track);

        if (previousTrackId !== targetTrackId) {
            if (previousTrack) {
                previousTrack.clips = previousTrack.clips.filter((ref) => resolveClipStateKeyFromRef(draft, ref) !== clipId);
                previousTrack.updatedAt = Date.now();
                touchedTrackIds.add(previousTrackId);
            }

            if (!targetTrack.clips.some((ref) => resolveClipStateKeyFromRef(draft, ref) === clipId)) {
                targetTrack.clips.push(createCutClipRef(clip));
            }

            clip.track = createCutTrackRef(targetTrack);
        }

        clip.start = Math.max(0, newStart);
        clip.updatedAt = Date.now();
        targetTrack.updatedAt = Date.now();
        touchedTrackIds.add(targetTrackId);
        movedMaxEnd = Math.max(movedMaxEnd, clip.start + clip.duration);
    });

    touchedTrackIds.forEach((trackId) => sortTrackClips(draft, trackId));

    if (activeTimelineId && movedMaxEnd > 0) {
        const timeline = draft.timelines[activeTimelineId];
        if (timeline) {
            timeline.duration = Math.max(timeline.duration, movedMaxEnd + 5);
        }
    }
}

const toMagiccutResource = async (
    uploaded: Asset,
    scope = buildMagicCutImportScope(readWorkspaceScope())
): Promise<AnyMediaResource> => {
    const uploadedKey = resolveEntityKey(uploaded);
    const resolvedUrl =
        (uploaded.id ? await resolveAssetPrimaryUrlBySdk(uploaded.id) : '') ||
        uploaded.path ||
        `assets://${uploadedKey}`;
    await assetCenterService.initialize();
    const existingAsset = uploaded.id ? await assetCenterService.findById(uploaded.id) : null;
    const unifiedAsset = existingAsset || await assetCenterService.registerExistingAsset(
        buildMagicCutAssetRegistrationInput(
            {
                id: uploaded.id,
                uuid: uploaded.uuid,
                name: uploaded.name,
                type: uploaded.type,
                path: uploaded.path,
                size: uploaded.size,
                origin: uploaded.origin,
                metadata: (uploaded.metadata || {}) as Record<string, unknown>,
                createdAt: uploaded.createdAt,
                updatedAt: uploaded.updatedAt
            },
            resolvedUrl,
            scope
        )
    );
    return buildMagicCutResourceView(unifiedAsset);
};

const resolveResourceImportSource = async (resource: AnyMediaResource): Promise<AssetImportSource> => {
    if (resource?.id) {
        const fromAssetId = await resolveAssetPrimaryUrlBySdk(resource.id);
        if (fromAssetId) {
            return { remoteUrl: fromAssetId };
        }
    }

    const candidates = [resource.path, resource.url]
        .filter((item): item is string => typeof item === 'string' && item.length > 0);

    for (const source of candidates) {
        if (source.startsWith('http://') || source.startsWith('https://')) {
            return { remoteUrl: source };
        }

        if (isManagedAssetLocator(source) || isExplicitLocalAssetLocator(source) || isLocalFilePath(source)) {
            const resolvedLocatorUrl = await assetCenterService.resolveLocatorUrl(source);
            if (resolvedLocatorUrl) {
                return { remoteUrl: resolvedLocatorUrl };
            }
        }
        const inlineData = await inlineDataService.tryExtractInlineData(source);
        if (inlineData) {
            return { data: inlineData };
        }
    }

    throw new Error(`Unable to resolve import source for resource ${resolveEntityKey(resource)}`);
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

const resolveMagicCutStorageMode = async (): Promise<MagicCutMaterialStorageMode> => {
    try {
        const result = await settingsBusinessService.getSettings();
        const mode = result.success ? result.data?.materialStorage?.mode : undefined;
        if (mode === 'local-first-sync' || mode === 'local-only' || mode === 'server-only') {
            return mode;
        }
    } catch (error) {
        console.warn('[MagicCutStore] Failed to resolve material storage mode, falling back to local-first-sync', error);
    }

    return DEFAULT_MAGICCUT_STORAGE_MODE;
};

const resolveCurrentMagicCutImportScope = (projectId?: string) =>
    buildMagicCutImportScope(readWorkspaceScope(), projectId);

const resolveCurrentMagicCutProjectReference = (
    projectId?: string
): AssetDomainReference | undefined => {
    if (!projectId) {
        return undefined;
    }

    return {
        domain: 'magiccut',
        entityType: 'project',
        entityId: projectId,
        relation: 'reference',
        slot: 'media-resource'
    };
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
                scaleX: 1,
                scaleY: 1,
                opacity: 1
            };
        }
        
        if (!isVisual) {
            return { x: 0, y: 0, width: 0, height: 0, rotation: 0, scale: 1, scaleX: 1, scaleY: 1, opacity: 1 };
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
        
        const { finalW, finalH } = mediaRatio > projRatio
            ? { finalW: pW, finalH: pW / mediaRatio }
            : { finalW: pH * mediaRatio, finalH: pH };
        
        const x = (pW - finalW) / 2;
        const y = (pH - finalH) / 2;

        return {
            x: Math.round(x),
            y: Math.round(y),
            width: Math.round(finalW),
            height: Math.round(finalH),
            rotation: 0,
            scale: 1,
            scaleX: 1,
            scaleY: 1,
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
    applyClipMoves: (moves: LinkedClipMove[]) => void;
    splitClip: (time?: number) => void;
    splitClipAt: (clipId: string, time: number) => void;
    trimStart: (time?: number) => void;
    trimEnd: (time?: number) => void;
    trimClip: (clipId: string, start: number, duration: number, offset: number) => void;
    copyClip: (clipId: string) => void;
    pasteClip: (trackId: string | null, time: number, mode?: PasteMode) => void;
    deleteSelected: (mode?: DeleteMode) => void;
    selectClip: (id: string | null, multi?: boolean) => void;
    detachAudio: (clipId: string) => Promise<void>;
    applyTimelineEditResult: (result: EditOperationResult) => void;

    updateResource: (id: string, updates: Partial<AnyMediaResource>) => void;
    isAssetInUse: (assetId: string) => boolean;
    removeAssetFromProjectState: (assetId: string) => void;
    
    addEffectToClip: (clipId: string, effectId: string) => void;
    addTransitionToClip: (clipId: string, transitionId: string, duration?: number) => void;
    
    addKeyframe: (clipId: string, property: string, value: number) => void;
    removeKeyframe: (clipId: string, property: string) => void;

    insertTrackAndMoveClip: (clipId: string, insertIndex: number, newStart: number, trackType?: CutTrackType) => void;
    insertTrackAndMoveClipGroup: (primaryClipId: string, insertIndex: number, newStart: number, linkedMoves?: LinkedClipMove[], trackType?: CutTrackType) => void;
    insertTrackAndAddClip: (resource: AnyMediaResource, insertIndex: number, start: number, duration: number, trackType?: CutTrackType) => string | undefined;
    
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
        return createDefaultMagicCutProject();
    }, [initialProject]);

    const storeRef = useRef<TimelineStore>(createTimelineStore());
    const useTransientState = <T,>(selector: (state: import('./transientStore').TimelineState) => T): T =>
        useStore(storeRef.current, selector);

    const [project, setProject] = useState<CutProject>(resolvedInitialProject);
    const [activeTimelineId, setActiveTimelineId] = useState<string | null>(null);
    
    const [state, setState] = useState<NormalizedState>(() => {
        return normalizeStateAssetReferences(normalizeMagicCutProjectState(resolvedInitialProject));
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

    const importMagicCutUpload = useCallback(async (
        file: { name: string; data: Uint8Array; path?: string },
        type: AssetContentKey
    ): Promise<AnyMediaResource> => {
        const scope = resolveCurrentMagicCutImportScope(project.uuid);
        const projectReference = resolveCurrentMagicCutProjectReference(scope.projectId);
        const storageMode = await resolveMagicCutStorageMode();
        const route = decideMagicCutImportRoute({
            storageMode,
            filePath: file.path,
            hasBinaryData: file.data.length > 0
        });

        if (route.kind === 'managed-local') {
            await assetCenterService.initialize();
            const imported = await assetCenterService.importAsset({
                scope,
                type,
                name: file.name,
                sourcePath: file.path,
                data: file.path ? undefined : file.data,
                metadata: {
                    origin: 'upload',
                    storageMode,
                    syncQueued: route.shouldQueueSync
                },
                references: projectReference ? [projectReference] : undefined,
                status: 'imported'
            });
            return buildMagicCutResourceView(imported.asset);
        }

        const uploaded = await importAssetBySdk(
            {
                name: file.name,
                data: file.data
            },
            type,
            { domain: 'magiccut' }
        );
        const resource = await toMagiccutResource(uploaded, scope);
        if (projectReference && uploaded.id) {
            await assetCenterService.bindReference(uploaded.id, projectReference);
        }
        return resource;
    }, [project.uuid]);
    
    // History Management
    const [history, setHistory] = useState<{ undo: Patch[], redo: Patch[] }[]>([]);
    const [future, setFuture] = useState<{ undo: Patch[], redo: Patch[] }[]>([]);
    
    // Transaction Buffer
    const isTransactionRef = useRef(false);
    const transactionPatches = useRef<{ undo: Patch[], redo: Patch[] }>({ undo: [], redo: [] });
    const skipNextAutoSaveRef = useRef(true);
    const queuedPersistedProjectRef = useRef<CutProject | null>(null);
    const isPersistingProjectRef = useRef(false);

    const applyProjectSnapshot = useCallback((
        nextProject: CutProject,
        nextState?: NormalizedState
    ) => {
        const normalizedProject = normalizeProjectAssetReferences(nextProject);
        const normalizedEditorState = normalizeStateAssetReferences(
            nextState ?? normalizeMagicCutProjectState(normalizedProject)
        );

        skipNextAutoSaveRef.current = true;
        setProject(normalizedProject);
        setState(normalizedEditorState);
        setActiveTimelineId(
            normalizedProject.timelines.length > 0
                ? resolveEntityKey(normalizedProject.timelines[0])
                : null
        );
        setSelectedClipId(null);
        setSelectedClipIds(new Set());
        setSelectedTrackId(null);
        setClipboard(null);
        clipboardClipsRef.current = [];

        return {
            project: normalizedProject,
            state: normalizedEditorState
        };
    }, []);

    const persistProjectSnapshot = useCallback(async (
        nextProject: CutProject,
        nextState: NormalizedState
    ): Promise<CutProject> => {
        const persistedProject = buildMagicCutPersistedProject(
            nextProject,
            normalizeStateAssetReferences(nextState)
        );
        const result = await magicCutProjectService.save(persistedProject);

        if (!result.success || !result.data) {
            throw new Error(result.message || 'Failed to persist MagicCut project');
        }

        return normalizeProjectAssetReferences(result.data);
    }, []);

    const flushQueuedProjectPersistence = useCallback(() => {
        if (isPersistingProjectRef.current) {
            return;
        }

        isPersistingProjectRef.current = true;
        void (async () => {
            try {
                while (queuedPersistedProjectRef.current) {
                    const projectToPersist = queuedPersistedProjectRef.current;
                    queuedPersistedProjectRef.current = null;

                    const result = await magicCutProjectService.save(projectToPersist);
                    if (!result.success || !result.data) {
                        console.error('[MagicCutStore] Failed to auto-save project', result.message);
                        continue;
                    }

                    if (onSave) {
                        onSave(result.data);
                    }
                }
            } finally {
                isPersistingProjectRef.current = false;
                if (queuedPersistedProjectRef.current) {
                    flushQueuedProjectPersistence();
                }
            }
        })();
    }, [onSave]);

    const queueProjectPersistence = useCallback((nextProject: CutProject) => {
        queuedPersistedProjectRef.current = nextProject;
        flushQueuedProjectPersistence();
    }, [flushQueuedProjectPersistence]);

    // Cleanup playback on unmount
    useEffect(() => {
        const controller = playerControllerRef.current;
        return () => {
            controller.pause();
        };
    }, []);

    useEffect(() => {
        if (project.timelines.length > 0 && !activeTimelineId) {
            setActiveTimelineId(resolveEntityKey(project.timelines[0]));
        }
    }, [project.timelines]);

    useEffect(() => {
        playerControllerRef.current.syncState(state, activeTimelineId);
        playerControllerRef.current.setLooping(isLooping);
    }, [state, activeTimelineId, isLooping]);

    const activeTimeline = activeTimelineId ? findMagicCutTimelineByKey(state, activeTimelineId) : null;

    const totalDuration = useMemo(() => {
        if (!activeTimeline) return 30;
        let maxEndTime = 0;
        
        activeTimeline.tracks.forEach(trackRef => {
            const track = findMagicCutTrackByRef(state, trackRef);
            if (!track) return;
            track.clips.forEach(clipRef => {
                const clip = findMagicCutClipByRef(state, clipRef);
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

    useEffect(() => {
        playerControllerRef.current.setPlaybackRange(inPoint, outPoint);
    }, [inPoint, outPoint]);

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
        if (skipNextAutoSaveRef.current) {
            skipNextAutoSaveRef.current = false;
            return;
        }

        const timer = setTimeout(() => {
            const normalizedState = normalizeStateAssetReferences(state);
            const updatedProject = buildMagicCutPersistedProject(project, normalizedState);
            queueProjectPersistence(updatedProject);
        }, 2000);
        return () => clearTimeout(timer);
    }, [state, project, queueProjectPersistence]);

    const addTrack = (type: CutTrackType, name?: string, isMain?: boolean, index?: number) => {
        const trackKey = generateUUID();
        updateState(draft => {
            if (!activeTimelineId) return;
            const tl = draft.timelines[activeTimelineId];
            if (!tl) return;
            
            const config = TrackFactory.getTrackConfig(type, isMain);
            
            const newTrack: CutTrack = createCutTrack({
                id: null,
                uuid: trackKey,
                trackType: type,
                name: name || config.name,
                order: 0,
                clips: [],
                visible: true,
                locked: false,
                muted: false,
                isMain, 
                height: config.height,
                createdAt: Date.now(),
                updatedAt: Date.now()
            });
            
            draft.tracks[trackKey] = newTrack;
            
            if (typeof index === 'number' && index >= 0 && index <= tl.tracks.length) {
                tl.tracks.splice(index, 0, createCutTrackRef(newTrack));
            } else {
                tl.tracks.push(createCutTrackRef(newTrack));
            }
            
            updateTrackOrders(draft, activeTimelineId);
        });
        return trackKey;
    };
    
    const removeTrack = (trackId: string) => {
        updateState(draft => {
            if (!activeTimelineId) return;
            const tl = draft.timelines[activeTimelineId];
            if (!tl) return;
            const canonicalTrackId = resolveMagicCutCanonicalTrackKey(draft, trackId) || trackId;
            const idx = tl.tracks.findIndex((trackRef) => resolveTrackStateKeyFromRef(draft, trackRef) === canonicalTrackId);
            if (idx !== -1) {
                tl.tracks.splice(idx, 1);
                const track = draft.tracks[canonicalTrackId];
                if (track) {
                    track.clips.forEach((clipRef) => {
                        delete draft.clips[resolveClipStateKeyFromRef(draft, clipRef)];
                    });
                }
                delete draft.tracks[canonicalTrackId];
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
        const clipKey = generateUUID();
        updateState(draft => {
            const track = draft.tracks[trackId];
            if (!track) return;

            const normalizedResource = syncDraftResourceState(draft, resource);
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

            const newClip: CutClip = createCutClip({
                id: null,
                uuid: clipKey,
                track: createCutTrackRef(track),
                resource: buildMagicCutAssetRef(normalizedResource),
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
            });
            draft.clips[clipKey] = newClip;
            track.clips.push(createCutClipRef(newClip));

            track.updatedAt = Date.now();

            if (activeTimelineId) {
                const tl = draft.timelines[activeTimelineId];
                if (tl) tl.duration = Math.max(tl.duration, newClip.start + newClip.duration + 5);
            }
        });
        return clipKey;
    };

    const updateClip = (clipId: string, updates: Partial<CutClip>) => {
        updateState(draft => {
            if (draft.clips[clipId]) {
                Object.assign(draft.clips[clipId], updates);
                const trackKey = resolveTrackStateKeyFromRef(draft, draft.clips[clipId].track);
                if(draft.tracks[trackKey]) draft.tracks[trackKey].updatedAt = Date.now();
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
                draft.clips[clipId].layers = layers.map((layer) => createCutLayerRef(layer));
                layers.forEach((layer) => {
                    draft.layers[resolveEntityKey(layer)] = layer;
                });
            }
        });
    };
    
    const moveClip = (clipId: string, targetTrackId: string, newStart: number) => {
        updateState(draft => {
            applyClipMovesToDraft(draft, [{ clipId, targetTrackId, newStart }], activeTimelineId);
        });
    };

    const applyClipMoves = (moves: LinkedClipMove[]) => {
        if (moves.length === 0) return;
        updateState(draft => {
            applyClipMovesToDraft(draft, moves, activeTimelineId);
        });
    };
    
    const trimClip = (clipId: string, start: number, duration: number, offset: number) => {
        updateState(draft => {
            const clip = draft.clips[clipId];
            if (!clip) return;
            clip.start = start;
            clip.duration = duration;
            clip.offset = offset;
            const trackKey = resolveTrackStateKeyFromRef(draft, clip.track);
            if(draft.tracks[trackKey]) {
                draft.tracks[trackKey].updatedAt = Date.now();
                sortTrackClips(draft, trackKey);
            }
        });
    };

    const insertTrackAndAddClip = (resource: AnyMediaResource, insertIndex: number, start: number, duration: number, trackType: CutTrackType = 'video') => {
        const insertedTrackKey = generateUUID();
        updateState(draft => {
            if (!activeTimelineId) return;
            const tl = draft.timelines[activeTimelineId];
            if (!tl) return;
            const config = TrackFactory.getTrackConfig(trackType, false);
            const newTrack: CutTrack = createCutTrack({
                id: null,
                uuid: insertedTrackKey,
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
            });
            draft.tracks[insertedTrackKey] = newTrack;
            if (typeof insertIndex === 'number' && insertIndex >= 0 && insertIndex <= tl.tracks.length) {
                tl.tracks.splice(insertIndex, 0, createCutTrackRef(newTrack));
            } else {
                tl.tracks.push(createCutTrackRef(newTrack));
            }
            updateTrackOrders(draft, activeTimelineId);
            const normalizedResource = syncDraftResourceState(draft, resource);
            const insertedClipKey = generateUUID();
            const transform: CutClipTransform = ClipTransformFactory.calculate(normalizedResource, project.settings.resolution);
            const newClip: CutClip = createCutClip({
                id: null,
                uuid: insertedClipKey,
                track: createCutTrackRef(newTrack),
                resource: buildMagicCutAssetRef(normalizedResource),
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
            });
            draft.clips[insertedClipKey] = newClip;
            newTrack.clips.push(createCutClipRef(newClip));
        });
        return insertedTrackKey;
    };
    
    const insertTrackAndMoveClipGroup = (
        primaryClipId: string,
        insertIndex: number,
        newStart: number,
        linkedMoves: LinkedClipMove[] = [],
        trackType: CutTrackType = 'video'
    ) => {
        updateState(draft => {
            if (!activeTimelineId) return;
            const tl = draft.timelines[activeTimelineId];
            const trackId = generateUUID();
            const config = TrackFactory.getTrackConfig(trackType, false);
            const newTrack: CutTrack = createCutTrack({
                id: null,
                uuid: trackId,
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
            });
            draft.tracks[trackId] = newTrack;
            if (typeof insertIndex === 'number' && insertIndex >= 0 && insertIndex <= tl.tracks.length) {
                tl.tracks.splice(insertIndex, 0, createCutTrackRef(newTrack));
            } else {
                tl.tracks.push(createCutTrackRef(newTrack));
            }
            updateTrackOrders(draft, activeTimelineId);

            const dedupedLinkedMoves = linkedMoves.filter((move) => move.clipId !== primaryClipId);
            applyClipMovesToDraft(
                draft,
                [
                    { clipId: primaryClipId, targetTrackId: trackId, newStart },
                    ...dedupedLinkedMoves
                ],
                activeTimelineId
            );
        });
    };

    const insertTrackAndMoveClip = (clipId: string, insertIndex: number, newStart: number, trackType: CutTrackType = 'video') => {
        insertTrackAndMoveClipGroup(clipId, insertIndex, newStart, [], trackType);
    };
    
    const splitClipAt = (clipId: string, time: number) => {
        const t = Math.max(0, time);
        updateState(draft => {
            const clip = draft.clips[clipId];
            if (!clip) return;
            if (t <= clip.start || t >= clip.start + clip.duration) return;
            const splitPoint = t - clip.start;
            const originalDuration = clip.duration;
            clip.duration = splitPoint;
            const splitClipKey = generateUUID();
            const newClip: CutClip = {
                ...clip,
                id: null,
                uuid: splitClipKey,
                start: t,
                duration: originalDuration - splitPoint,
                offset: (clip.offset || 0) + (splitPoint * (clip.speed || 1.0)),
                layers: [...clip.layers],
                createdAt: Date.now(),
                updatedAt: Date.now()
            };
            draft.clips[splitClipKey] = newClip;
            const trackKey = resolveTrackStateKeyFromRef(draft, clip.track);
            const track = draft.tracks[trackKey];
            if (!track) return;
            const clipIndex = track.clips.findIndex((ref) => resolveClipStateKeyFromRef(draft, ref) === clipId);
            if (clipIndex === -1) {
                track.clips.push(createCutClipRef(newClip));
            } else {
                track.clips.splice(clipIndex + 1, 0, createCutClipRef(newClip));
            }
            sortTrackClips(draft, trackKey);
            track.updatedAt = Date.now();
            setSelectedClipId(splitClipKey);
            setSelectedClipIds(new Set([splitClipKey]));
            setSelectedTrackId(trackKey);
        });
    };

    const splitClip = (time?: number) => {
        const t = time ?? storeRef.current.getState().currentTime;
        if (!selectedClipId) return;
        splitClipAt(selectedClipId, t);
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
            const trackKey = resolveTrackStateKeyFromRef(draft, clip.track);
            if(draft.tracks[trackKey]) draft.tracks[trackKey].updatedAt = Date.now();
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
            const trackKey = resolveTrackStateKeyFromRef(draft, clip.track);
            if(draft.tracks[trackKey]) draft.tracks[trackKey].updatedAt = Date.now();
        });
    };

    const getSelectedClipSet = (): Set<string> => {
        const ids = new Set<string>();
        selectedClipIds.forEach((id) => {
            const canonicalClipKey = resolveMagicCutCanonicalClipKey(state, id);
            if (canonicalClipKey) ids.add(canonicalClipKey);
        });
        if (ids.size === 0 && selectedClipId) {
            const canonicalClipKey = resolveMagicCutCanonicalClipKey(state, selectedClipId);
            if (canonicalClipKey) ids.add(canonicalClipKey);
        }
        return ids;
    };

    const getPrimarySelectedClipId = (clipIds?: Set<string>): string | null => {
        const ids = clipIds || getSelectedClipSet();
        if (selectedClipId) {
            const canonicalSelectedClipKey = resolveMagicCutCanonicalClipKey(state, selectedClipId);
            if (canonicalSelectedClipKey && ids.has(canonicalSelectedClipKey)) {
                return canonicalSelectedClipKey;
            }
        }
        for (const id of ids) {
            if (findMagicCutClipByKey(state, id)) return id;
        }
        return null;
    };

    const copyFromSelection = () => {
        const selectedIds = getSelectedClipSet();
        if (selectedIds.size === 0) return;

        const clips = Array.from(selectedIds)
            .map((id) => findMagicCutClipByKey(state, id))
            .filter((clip): clip is CutClip => !!clip);
        if (clips.length === 0) return;

        clips.sort((a, b) => {
            const trackOrderA = findMagicCutTrackByRef(state, a.track)?.order ?? Number.MAX_SAFE_INTEGER;
            const trackOrderB = findMagicCutTrackByRef(state, b.track)?.order ?? Number.MAX_SAFE_INTEGER;
            if (trackOrderA !== trackOrderB) return trackOrderA - trackOrderB;
            if (Math.abs(a.start - b.start) > 0.0001) return a.start - b.start;
            return resolveEntityKey(a).localeCompare(resolveEntityKey(b));
        });

        const primaryClipId = getPrimarySelectedClipId(selectedIds);
        if (primaryClipId) {
            const primaryIndex = clips.findIndex((clip) => resolveEntityKey(clip) === primaryClipId);
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
        const primaryClipboardClipId = resolveEntityKey(primaryClipboardClip);
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
                const sourceTrack = findMagicCutTrackByRef(draft, clip.track);
                if (sourceTrack) return sourceTrack.trackType;
                const sourceResource = findMagicCutResourceByRef(draft, clip.resource);
                return sourceResource ? TrackFactory.inferTrackType(sourceResource.type) : 'video';
            };

            const createTrack = (trackType: CutTrackType, insertIndex?: number): string => {
                const pastedTrackKey = generateUUID();
                const config = TrackFactory.getTrackConfig(trackType, false);
                const newTrack: CutTrack = createCutTrack({
                    id: null,
                    uuid: pastedTrackKey,
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
                });
                draft.tracks[pastedTrackKey] = newTrack;

                const index = typeof insertIndex === 'number'
                    ? Math.max(0, Math.min(insertIndex, timeline.tracks.length))
                    : timeline.tracks.length;
                timeline.tracks.splice(index, 0, createCutTrackRef(newTrack));
                hasTrackStructureChange = true;
                return pastedTrackKey;
            };

            const isTrackCompatibleForClip = (candidateTrackId: string | null, clip: CutClip): candidateTrackId is string => {
                if (!candidateTrackId) return false;
                const candidateTrack = findMagicCutTrackByKey(draft, candidateTrackId);
                if (!candidateTrack) return false;
                const resource = findMagicCutResourceByRef(draft, clip.resource);
                if (!resource) return true;
                return TrackFactory.isCompatible(candidateTrack.trackType, resource.type);
            };

            const sourceTrackIds = Array.from(new Set(clipboardClips.map((clip) => (
                resolveTrackStateKeyFromRef(draft, clip.track)
            )))).sort((a, b) => {
                const orderA = findMagicCutTrackByKey(draft, a)?.order ?? Number.MAX_SAFE_INTEGER;
                const orderB = findMagicCutTrackByKey(draft, b)?.order ?? Number.MAX_SAFE_INTEGER;
                if (orderA !== orderB) return orderA - orderB;
                return a.localeCompare(b);
            });

            const sourceToTargetTrackMap = new Map<string, string>();
            const primarySourceTrackId = resolveTrackStateKeyFromRef(draft, primaryClipboardClip.track);

            let primaryTargetTrackId: string | null = null;
            if (isTrackCompatibleForClip(trackId, primaryClipboardClip)) {
                primaryTargetTrackId = trackId;
            } else if (isTrackCompatibleForClip(selectedTrackId, primaryClipboardClip)) {
                primaryTargetTrackId = selectedTrackId;
            } else {
                primaryTargetTrackId =
                    timeline.tracks
                        .map((ref) => resolveMagicCutCanonicalTrackKey(draft, ref.id) || ref.uuid || ref.id)
                        .find((id) => isTrackCompatibleForClip(id, primaryClipboardClip)) || null;
            }

            if (!primaryTargetTrackId) {
                primaryTargetTrackId = createTrack(inferClipTrackType(primaryClipboardClip));
            }

            sourceToTargetTrackMap.set(primarySourceTrackId, primaryTargetTrackId);
            const usedTargetTrackIds = new Set<string>([primaryTargetTrackId]);

            let insertIndex = timeline.tracks.findIndex((ref) => (
                (resolveMagicCutCanonicalTrackKey(draft, ref.id) ?? ref.uuid ?? ref.id ?? '') === primaryTargetTrackId
            ));
            insertIndex = insertIndex === -1 ? timeline.tracks.length : insertIndex + 1;
            const existingTrackIds = timeline.tracks.map((ref) => (
                resolveMagicCutCanonicalTrackKey(draft, ref.id) ?? ref.uuid ?? ref.id ?? ''
            ));

            sourceTrackIds.forEach((sourceTrackId) => {
                if (sourceToTargetTrackMap.has(sourceTrackId)) return;
                const representativeClip = clipboardClips.find((clip) => (
                    resolveTrackStateKeyFromRef(draft, clip.track) === sourceTrackId
                ));
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
                        const clip = draft.clips[resolveClipStateKeyFromRef(draft, clipRef)];
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
                const orderA = findMagicCutTrackByRef(draft, a.track)?.order ?? Number.MAX_SAFE_INTEGER;
                const orderB = findMagicCutTrackByRef(draft, b.track)?.order ?? Number.MAX_SAFE_INTEGER;
                if (orderA !== orderB) return orderA - orderB;
                return resolveEntityKey(a).localeCompare(resolveEntityKey(b));
            });

            if (mode === 'overwrite') {
                const overwriteRangesByTrack = new Map<string, Array<{ start: number; end: number }>>();

                clipsForPaste.forEach((sourceClip) => {
                    const targetTrackId = sourceToTargetTrackMap.get(resolveTrackStateKeyFromRef(draft, sourceClip.track)) || primaryTargetTrackId;
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
                        const clip = draft.clips[resolveClipStateKeyFromRef(draft, clipRef)];
                        if (!clip) return false;
                        if (!shouldRemove(clip)) return true;
                        delete draft.clips[resolveClipStateKeyFromRef(draft, clipRef)];
                        return false;
                    });
                    targetTrack.updatedAt = Date.now();
                });
            }

            const createdClipIds: string[] = [];

            clipsForPaste.forEach((sourceClip) => {
                const sourceTrackKey = resolveTrackStateKeyFromRef(draft, sourceClip.track);
                const targetTrackId = sourceToTargetTrackMap.get(sourceTrackKey) || primaryTargetTrackId;
                if (!targetTrackId) return;
                const targetTrack = findMagicCutTrackByKey(draft, targetTrackId);
                if (!targetTrack) return;

                const pastedClipKey = generateUUID();
                const newClip: CutClip = {
                    ...sourceClip,
                    id: null,
                    uuid: pastedClipKey,
                    track: createCutTrackRef(targetTrack),
                    start: normalizedPasteStart + (sourceClip.start - earliestStart),
                    createdAt: Date.now(),
                    updatedAt: Date.now()
                } as CutClip;

                draft.clips[pastedClipKey] = newClip;
                targetTrack.clips.push(createCutClipRef(newClip));
                targetTrack.updatedAt = Date.now();

                createdClipIds.push(pastedClipKey);
                if (resolveEntityKey(sourceClip) === primaryClipboardClipId && !primaryPastedClipId) {
                    primaryPastedClipId = pastedClipKey;
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

                const trackKey = resolveTrackStateKeyFromRef(draft, clip.track);
                const track = draft.tracks[trackKey];
                if (track) {
                    const ranges = removedRangesByTrack.get(trackKey) || [];
                    ranges.push({ start: clip.start, end: clip.start + clip.duration });
                    removedRangesByTrack.set(trackKey, ranges);
                    track.clips = track.clips.filter((clipRef) => resolveClipStateKeyFromRef(draft, clipRef) !== clipId);
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
                    const clip = draft.clips[resolveClipStateKeyFromRef(draft, clipRef)];
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
        setSelectedTrackId(resolveTrackStateKeyFromRef(state, clip.track));
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
        const resource = findMagicCutResourceByRef(state, clip.resource);
        if (!resource) {
            return;
        }

        const extension = resolveAssetNameExtension(resource);
        const baseName = resource.name && resource.name.endsWith(extension)
            ? resource.name.slice(0, Math.max(0, resource.name.length - extension.length))
            : (resource.name || 'audio');
        const source = await resolveResourceImportSource(resource);
        const fileName = `${baseName}_audio${extension}`;
        const uploaded = source.data
            ? await importAssetBySdk(
                {
                    name: fileName,
                    data: source.data
                },
                'audio',
                { domain: 'magiccut' }
            )
            : await importAssetFromUrlBySdk(
                String(source.remoteUrl || ''),
                'audio',
                {
                    name: fileName,
                    domain: 'magiccut'
                }
            );
        const audioResource = await toMagiccutResource(uploaded, resolveCurrentMagicCutImportScope(project.uuid));

        const result = timelineOperationService.calculateDetachAudio(state, clipId, audioResource);
        
        if (result) {
            updateState(draft => {
                syncDraftResourceState(draft, audioResource);
                if (draft.clips[clipId]) {
                    Object.assign(draft.clips[clipId], result.updatedVideoClip);
                }
                let finalTrackId = result.targetTrackId;

                if (result.shouldCreateNewTrack) {
                    const detachedAudioTrackKey = generateUUID();
                    const timeline = draft.timelines[activeTimelineId!];
                    const sourceTrackKey = resolveTrackStateKeyFromRef(draft, clip.track);
                    const videoTrackRef = timeline.tracks.find((trackRef) => resolveTrackStateKeyFromRef(draft, trackRef) === sourceTrackKey);
                    const videoTrackIdx = timeline.tracks.indexOf(videoTrackRef!);
                    
                    const config = TrackFactory.getTrackConfig('audio', false);
                    const newTrack: CutTrack = createCutTrack({
                        id: null,
                        uuid: detachedAudioTrackKey,
                        trackType: 'audio',
                        name: config.name,
                        order: 0,
                        clips: [],
                        isMain: false,
                        visible: true,
                        locked: false,
                        muted: false,
                        height: config.height,
                        createdAt: Date.now(),
                        updatedAt: Date.now()
                    });
                    draft.tracks[detachedAudioTrackKey] = newTrack;
                    timeline.tracks.splice(videoTrackIdx + 1, 0, createCutTrackRef(newTrack));
                    
                    timeline.tracks.forEach((ref, idx) => {
                        const tr = findMagicCutTrackByRef(draft, ref);
                        if (tr) tr.order = idx;
                    });
                    
                    finalTrackId = detachedAudioTrackKey;
                }

                const newClipId = resolveEntityKey(result.newAudioClip);
                const newClip: CutClip = {
                     ...result.newAudioClip,
                     track: createCutTrackRef(draft.tracks[finalTrackId])
                } as CutClip;
                
                 draft.clips[newClipId] = newClip;
                 draft.tracks[finalTrackId].clips.push(createCutClipRef(newClip));
                 draft.tracks[finalTrackId].updatedAt = Date.now();

                 setSelectedClipId(newClipId);
                 setSelectedClipIds(new Set([newClipId]));
             });
         }
     };
    const applyTimelineEditResult = (result: EditOperationResult) => {
        updateState(draft => {
            const touchedTrackIds = new Set<string>();

            result.clipsToUpdate.forEach(({ id, updates }) => {
                const clip = draft.clips[id];
                if (!clip) return;

                Object.assign(clip, updates);
                clip.updatedAt = Date.now();
                touchedTrackIds.add(resolveTrackStateKeyFromRef(draft, clip.track));

                const track = draft.tracks[resolveTrackStateKeyFromRef(draft, clip.track)];
                if (track) {
                    track.updatedAt = Date.now();
                }
            });

            result.clipsToDelete?.forEach((clipId) => {
                const clip = draft.clips[clipId];
                if (!clip) return;

                const trackKey = resolveTrackStateKeyFromRef(draft, clip.track);
                const track = draft.tracks[trackKey];
                if (track) {
                    track.clips = track.clips.filter((ref) => resolveClipStateKeyFromRef(draft, ref) !== clipId);
                    track.updatedAt = Date.now();
                    touchedTrackIds.add(trackKey);
                }

                delete draft.clips[clipId];
            });

            touchedTrackIds.forEach((trackId) => {
                sortTrackClips(draft, trackId);
            });
        });
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

        const nextSelection = resolveLinkedSelectionState({
            clipId: id,
            state,
            linkedSelectionEnabled: storeRef.current.getState().editMode.linkedSelection,
            multi,
            selectedClipId,
            selectedClipIds
        });

        setSelectedTrackId(nextSelection.selectedTrackId);
        setSelectedClipId(nextSelection.selectedClipId);
        setSelectedClipIds(nextSelection.selectedClipIds);
    };
    const selectTrack = (id: string | null) => {
        setSelectedTrackId(id);
        setSelectedClipId(null);
        setSelectedClipIds(new Set());
    };

    const updateResource = (id: string, updates: Partial<AnyMediaResource>) => {
        updateState(draft => {
            if (draft.resources[id]) {
                const nextResource = {
                    ...draft.resources[id],
                    ...updates,
                    metadata: {
                        ...(draft.resources[id].metadata || {}),
                        ...(updates.metadata || {})
                    }
                } as AnyMediaResource;
                syncDraftResourceState(draft, nextResource);
            }
        });
    };

    const isAssetInUse = useCallback((assetId: string) => {
        return isMagicCutAssetInUse(state, assetId);
    }, [state]);

    const removeAssetFromProjectState = useCallback((assetId: string) => {
        updateState(draft => {
            const nextState = removeMagicCutAssetFromState(draft, assetId);
            draft.assets = nextState.assets;
            draft.resourceViews = nextState.resourceViews;
            draft.resources = nextState.resources;
        });
    }, [updateState]);

    const addEffectToClip = (clipId: string, effectId: string) => {
        const effectLayerKey = generateUUID();
        updateState(draft => {
            const clip = draft.clips[clipId];
            if (!clip) return;
            const newLayer: CutLayer = createCutLayer({
                id: null,
                uuid: effectLayerKey,
                clip: createCutClipRef(clip),
                layerType: 'filter',
                enabled: true,
                order: clip.layers.length,
                params: { definitionId: effectId },
                createdAt: Date.now(),
                updatedAt: Date.now()
            });
            draft.layers[effectLayerKey] = newLayer;
            clip.layers.push(createCutLayerRef(newLayer));
        });
    };
    const addTransitionToClip = (clipId: string, transitionId: string, duration: number = 0.5) => {
        updateState(draft => {
            const clip = draft.clips[clipId];
            if (!clip) return;

            const track = draft.tracks[resolveTrackStateKeyFromRef(draft, clip.track)];
            if (!track) return;

            const orderedClips = track.clips
                .map((ref) => draft.clips[resolveClipStateKeyFromRef(draft, ref)])
                .filter((candidate): candidate is CutClip => !!candidate)
                .sort((a, b) => a.start - b.start);

            const clipIndex = orderedClips.findIndex((candidate) => resolveEntityKey(candidate) === clipId);
            if (clipIndex === -1 || clipIndex >= orderedClips.length - 1) return;

            const nextClip = orderedClips[clipIndex + 1];
            const clipResource = findMagicCutResourceByRef(draft, clip.resource);
            const nextResource = findMagicCutResourceByRef(draft, nextClip.resource);
            const compatibleTypes = new Set([
                MediaResourceType.VIDEO,
                MediaResourceType.IMAGE,
                MediaResourceType.CHARACTER,
                MediaResourceType.LOTTIE
            ]);

            if (!clipResource || !nextResource || !compatibleTypes.has(clipResource.type) || !compatibleTypes.has(nextResource.type)) {
                return;
            }

            const effectiveDuration = Math.max(
                0.1,
                Math.min(duration, clip.duration, nextClip.duration)
            );

            const nextClipId = resolveEntityKey(nextClip);
            const existingTransitionRefs = clip.layers.filter(ref => {
                const layer = draft.layers[resolveEntityKey(ref)];
                return layer && (layer.layerType === 'transition' || layer.layerType === 'transition_out');
            });

            existingTransitionRefs.forEach(ref => {
                delete draft.layers[resolveEntityKey(ref)];
            });

            clip.layers = clip.layers.filter((ref) => !existingTransitionRefs.some((existing) => resolveEntityKey(existing) === resolveEntityKey(ref)));

            const transitionLayerKey = generateUUID();
            const transitionLayer: CutLayer = createCutLayer({
                id: null,
                uuid: transitionLayerKey,
                clip: createCutClipRef(clip),
                layerType: 'transition_out',
                enabled: true,
                order: clip.layers.length,
                params: {
                    definitionId: transitionId,
                    duration: effectiveDuration,
                    nextClipId
                },
                createdAt: Date.now(),
                updatedAt: Date.now()
            });

            draft.layers[transitionLayerKey] = transitionLayer;
            clip.layers.push(createCutLayerRef(transitionLayer));
            track.updatedAt = Date.now();
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
                clip.keyframes[property].push(createKeyframePoint({
                    time: relTime,
                    value,
                    easing: 'linear'
                }));
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
            if (exclude.has(resolveEntityKey(clipRef))) continue;
            
            const clip = state.clips[resolveEntityKey(clipRef)];
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
            const fileWithPath = file as File & { path?: string };
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
            const resource = await importMagicCutUpload({
                name: file.name,
                data: buffer,
                path: fileWithPath.path
            }, type);
            resources.push(resource);
            updateState(draft => {
                syncDraftResourceState(draft, resource);
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
                const resource = await importMagicCutUpload({
                    name: f.name,
                    data: f.data,
                    path: f.path
                }, type);
                importedResources.push(resource);
                updateState(draft => {
                    syncDraftResourceState(draft, resource);
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
        if (!res.success) {
            throw new Error(res.message || `Failed to load MagicCut project ${id}`);
        }

        if (!res.data) {
            throw new Error(`MagicCut project ${id} was not found`);
        }

        applyProjectSnapshot(res.data);
    };
    const loadLastProject = async () => {
        const res = await magicCutProjectService.findAll({ page: 0, size: 1, sort: ['updatedAt,desc'] });
        if (res.success && res.data && res.data.content.length > 0) {
            await switchProject(resolveEntityKey(res.data.content[0]));
        } else {
            const newP = createDefaultMagicCutProject();
            const newState = normalizeStateAssetReferences(normalizeMagicCutProjectState(newP));
            const persistedProject = await persistProjectSnapshot(newP, newState);
            applyProjectSnapshot(persistedProject, newState);
        }
    };
    const addMarker = () => {
        const t = storeRef.current.getState().currentTime;
        updateState(draft => {
            if (activeTimelineId) {
                const tl = draft.timelines[activeTimelineId];
                if (tl) {
                    if (!tl.markers) tl.markers = [];
                    tl.markers.push(createTimelineMarker({ time: t, label: '', color: '#f59e0b' }));
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
    const setPreviewSource = (resource: AnyMediaResource | null) => {
        if (resource) {
            playerControllerRef.current.pause();
            setPreviewEffect(null);
            storeRef.current.setState({
                isPlaying: false,
                currentTime: playerControllerRef.current.getCurrentTime(),
                skimmingResource: resource
            });
            return;
        }

        storeRef.current.setState({ skimmingResource: null });
    };
    
    // Updated setClipSpeed
    const setClipSpeed = (clipId: string, newSpeed: number) => {
        updateState(draft => {
            const clip = draft.clips[clipId];
            if (!clip) return;

            const resource = findMagicCutResourceByRef(draft, clip.resource);
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
            const trackKey = resolveTrackStateKeyFromRef(draft, clip.track);
            if(draft.tracks[trackKey]) draft.tracks[trackKey].updatedAt = Date.now();
        });
    };

    const saveAsTemplate = async (metadata: TemplateMetadata) => {
        const normalizedState = normalizeStateAssetReferences(state);
        await templateService.saveTemplate(metadata, project, normalizedState);
    };
    const loadTemplate = async (template: any) => {
        const instantiatedProject = await templateService.instantiateById(resolveEntityKey(template));
        applyProjectSnapshot(instantiatedProject);
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
            const timelineKey = generateUUID();
            const newTl: CutTimeline = createCutTimeline({
                id: null,
                uuid: timelineKey,
                name,
                fps: 30,
                duration: 60,
                tracks: [],
                createdAt: Date.now(),
                updatedAt: Date.now()
            });
            const timelineMainTrackKey = generateUUID();
            const config = TrackFactory.getTrackConfig('video', true);
            const track: CutTrack = createCutTrack({
                id: null,
                uuid: timelineMainTrackKey,
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
            });
            draft.tracks[timelineMainTrackKey] = track;
            newTl.tracks.push(createCutTrackRef(track));
            draft.timelines[timelineKey] = newTl;
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
            const track = findMagicCutTrackByRef(state, tr);
            if (track) {
                track.clips.forEach(cr => {
                    const canonicalClipKey = resolveMagicCutCanonicalClipKey(state, resolveEntityKey(cr)) || resolveEntityKey(cr);
                    allClipIds.add(canonicalClipKey);
                });
            }
        });
        setSelectedClipIds(allClipIds);
        const firstId = allClipIds.values().next().value ?? null;
        setSelectedClipId(firstId);
        if (firstId) {
            const firstClip = findMagicCutClipByKey(state, firstId);
            if (firstClip) {
                setSelectedTrackId(resolveTrackStateKeyFromRef(state, firstClip.track));
            }
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
    
    const setInPoint = (time: number) => {
        const nextRange = resolvePlaybackInPoint({ inPoint, outPoint }, time, totalDuration);
        setInPointState(nextRange.inPoint);
        setOutPointState(nextRange.outPoint);
    };
    const setOutPoint = (time: number) => {
        const nextRange = resolvePlaybackOutPoint({ inPoint, outPoint }, time, totalDuration);
        setInPointState(nextRange.inPoint);
        setOutPointState(nextRange.outPoint);
    };
    const clearInOutPoints = () => {
        setInPointState(null);
        setOutPointState(null);
    };
    
    const selectClipsInRegion = (start: number, end: number, trackIds?: string[]) => {
        if (!activeTimeline) return;
        const ids = new Set<string>();
        const tracksToCheck = trackIds || activeTimeline.tracks.map((trackRef) => resolveTrackStateKeyFromRef(state, trackRef));
        tracksToCheck.forEach(trackId => {
            const track = findMagicCutTrackByKey(state, trackId);
            if (track) {
                track.clips.forEach(cr => {
                    const clip = findMagicCutClipByRef(state, cr);
                    if (clip && clip.start < end && clip.start + clip.duration > start) {
                        ids.add(resolveEntityKey(clip));
                    }
                });
            }
        });
        setSelectedClipIds(ids);
        const firstId = ids.values().next().value ?? null;
        setSelectedClipId(firstId);
        if (firstId) {
            const firstClip = findMagicCutClipByKey(state, firstId);
            if (firstClip) {
                setSelectedTrackId(resolveTrackStateKeyFromRef(state, firstClip.track));
            }
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
    
    const useSkimmingResource = () => useStore(storeRef.current, s => s.skimmingResource);
    const usePreviewEffect = () => previewEffect;

    return (
        <MagicCutStoreContext.Provider value={{
            project, state, activeTimelineId, activeTimeline,
            switchProject, loadLastProject, saveAsTemplate, loadTemplate,
            addTrack, removeTrack, updateTrack, resizeTrack, selectTrack,
            addClip, updateClip, updateClipTransform, updateClipLayers, moveClip, applyClipMoves, splitClip, trimStart, trimEnd, trimClip, copyClip, pasteClip, deleteSelected, selectClip,
            updateResource,
            isAssetInUse,
            removeAssetFromProjectState,
            addEffectToClip, addTransitionToClip, addKeyframe, removeKeyframe,
            insertTrackAndMoveClip, insertTrackAndMoveClipGroup, insertTrackAndAddClip,
            play: playerControllerRef.current.play,
            pause: playerControllerRef.current.pause,
            seek: playerControllerRef.current.seek,
            undo, redo, canUndo: history.length > 0, canRedo: future.length > 0,
            commitHistory, beginTransaction, commitTransaction,
            toggleSnapping: () => setIsSnappingEnabled(p => !p),
            toggleSkimming: () => setIsSkimmingEnabled(p => !p),
            addMarker,
            getResource: (id) => findMagicCutResourceByKey(state, id) || undefined,
            getClip: (id) => findMagicCutClipByKey(state, id) || undefined,
            getClipResource: (id) => findMagicCutClipResourceByKey(state, id) || undefined,
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
            splitClipAt,
            applyTimelineEditResult,
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
