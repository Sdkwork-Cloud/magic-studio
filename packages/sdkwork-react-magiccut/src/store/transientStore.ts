
import { createStore } from 'zustand/vanilla';
import { DragOperation, InteractionState, SelectionState, MarqueeState, EditTool, EditModeState } from './types';
import { AnyMediaResource } from '@sdkwork/react-commons';

export interface TimelineState {
    currentTime: number;
    isPlaying: boolean;
    playbackRate: number;
    playbackDirection: 1 | -1;
    
    scrollLeft: number;
    scrollTop: number;
    zoomLevel: number;
    containerWidth: number;
    containerHeight: number;
    
    dragOperation: DragOperation | null;
    interaction: InteractionState;
    isDragOverTimeline: boolean;
    
    skimmingResource: AnyMediaResource | null;
    
    selection: SelectionState;
    marquee: MarqueeState | null;
    
    inPoint: number | null;
    outPoint: number | null;
    
    editMode: EditModeState;
    
    setTime: (time: number) => void;
    setScroll: (left: number, top: number) => void;
    setZoom: (zoom: number) => void;
    setContainerSize: (width: number, height: number) => void;
    setDragOperation: (op: DragOperation | null) => void;
    setInteraction: (interaction: InteractionState | ((prev: InteractionState) => InteractionState)) => void;
    setDragOverTimeline: (isOver: boolean) => void;
    setPlaying: (isPlaying: boolean) => void;
    setSkimmingResource: (res: AnyMediaResource | null) => void;
    setPlaybackRate: (rate: number) => void;
    setPlaybackDirection: (dir: 1 | -1) => void;
    setSelection: (selection: SelectionState | ((prev: SelectionState) => SelectionState)) => void;
    setMarquee: (marquee: MarqueeState | null) => void;
    setInPoint: (time: number | null) => void;
    setOutPoint: (time: number | null) => void;
    clearSelection: () => void;
    addToSelection: (clipId: string) => void;
    removeFromSelection: (clipId: string) => void;
    toggleSelection: (clipId: string) => void;
    selectAll: (clipIds: string[]) => void;
    setEditTool: (tool: EditTool) => void;
    toggleRippleMode: () => void;
    toggleLinkedSelection: () => void;
}

export type TimelineStore = ReturnType<typeof createTimelineStore>;

const DEFAULT_SELECTION: SelectionState = {
    selectedClipIds: new Set<string>(),
    selectedTrackId: null,
    lastSelectedClipId: null,
    selectionAnchorTime: null
};

const DEFAULT_EDIT_MODE: EditModeState = {
    currentTool: 'select',
    rippleMode: false,
    linkedSelection: true,
};

export const createTimelineStore = () => {
    return createStore<TimelineState>((set, get) => ({
        currentTime: 0,
        isPlaying: false,
        playbackRate: 1.0,
        playbackDirection: 1,
        scrollLeft: 0,
        scrollTop: 0,
        zoomLevel: 1,
        containerWidth: 0,
        containerHeight: 0,
        dragOperation: null,
        interaction: {
            type: 'idle', 
            clipId: null, 
            initialX: 0, 
            initialY: 0, 
            initialStartTime: 0, 
            initialDuration: 0, 
            initialTrackId: '', 
            initialOffset: 0, 
            currentTrackId: null, 
            currentTime: 0, 
            isSnapping: false, 
            snapLines: [], 
            validDrop: true, 
            hasCollision: false, 
            insertTrackIndex: null,
            editTool: 'select'
        },
        isDragOverTimeline: false,
        skimmingResource: null,
        selection: DEFAULT_SELECTION,
        marquee: null,
        inPoint: null,
        outPoint: null,
        editMode: DEFAULT_EDIT_MODE,

        setTime: (time) => set({ currentTime: time }),
        setScroll: (left, top) => set({ scrollLeft: left, scrollTop: top }),
        setZoom: (zoom) => set({ zoomLevel: zoom }),
        setContainerSize: (width, height) => set({ containerWidth: width, containerHeight: height }),
        setDragOperation: (op) => set({ dragOperation: op }),
        setInteraction: (interaction) => set((state) => ({ 
            interaction: typeof interaction === 'function' ? interaction(state.interaction) : interaction 
        })),
        setDragOverTimeline: (isOver) => set({ isDragOverTimeline: isOver }),
        setPlaying: (isPlaying) => set({ isPlaying }),
        setSkimmingResource: (res) => set({ skimmingResource: res }),
        setPlaybackRate: (rate) => set({ playbackRate: Math.max(0.1, Math.min(8, rate)) }),
        setPlaybackDirection: (dir) => set({ playbackDirection: dir }),
        setSelection: (selection) => set((state) => ({ 
            selection: typeof selection === 'function' ? selection(state.selection) : selection 
        })),
        setMarquee: (marquee) => set({ marquee }),
        setInPoint: (time) => set({ inPoint: time }),
        setOutPoint: (time) => set({ outPoint: time }),
        clearSelection: () => set({ selection: DEFAULT_SELECTION }),
        addToSelection: (clipId) => set((state) => {
            const newIds = new Set(state.selection.selectedClipIds);
            newIds.add(clipId);
            return { 
                selection: { 
                    ...state.selection, 
                    selectedClipIds: newIds,
                    lastSelectedClipId: clipId 
                } 
            };
        }),
        removeFromSelection: (clipId) => set((state) => {
            const newIds = new Set(state.selection.selectedClipIds);
            newIds.delete(clipId);
            return { 
                selection: { 
                    ...state.selection, 
                    selectedClipIds: newIds,
                    lastSelectedClipId: state.selection.lastSelectedClipId === clipId 
                        ? null 
                        : state.selection.lastSelectedClipId
                } 
            };
        }),
        toggleSelection: (clipId) => {
            const state = get();
            if (state.selection.selectedClipIds.has(clipId)) {
                state.removeFromSelection(clipId);
            } else {
                state.addToSelection(clipId);
            }
        },
        selectAll: (clipIds) => set({ 
            selection: { 
                selectedClipIds: new Set(clipIds), 
                selectedTrackId: null, 
                lastSelectedClipId: clipIds.length > 0 ? clipIds[clipIds.length - 1] : null,
                selectionAnchorTime: null 
            } 
        }),
        setEditTool: (tool) => set((state) => ({ 
            editMode: { ...state.editMode, currentTool: tool },
            interaction: { ...state.interaction, editTool: tool }
        })),
        toggleRippleMode: () => set((state) => ({ 
            editMode: { ...state.editMode, rippleMode: !state.editMode.rippleMode }
        })),
        toggleLinkedSelection: () => set((state) => ({ 
            editMode: { ...state.editMode, linkedSelection: !state.editMode.linkedSelection }
        }))
    }));
};

