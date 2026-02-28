
import { create } from 'zustand';
import { produceWithPatches, applyPatches, enablePatches, Patch } from 'immer';
import { CanvasBoard, CanvasElement, Viewport, SnapLine, CanvasNodeData } from '../entities';
import { generateUUID } from '@sdkwork/react-commons';
import { canvasService } from '../services/canvasService';

enablePatches();

interface HistoryEntry {
    patches: Patch[];
    inversePatches: Patch[];
}

interface CanvasState {
    boards: CanvasBoard[];
    activeBoardId: string | null;
    activeBoard: CanvasBoard | null;
    
    viewport: Viewport;
    elements: CanvasElement[];
    selectedIds: Set<string>;
    snapLines: SnapLine[];
    highlightedGroupId: string | null;

    past: HistoryEntry[]; 
    future: HistoryEntry[];
    _clipboard: CanvasElement[];

    setViewport: (viewport: Partial<Viewport>) => void;
    
    createBoard: (title: string) => void;
    selectBoard: (id: string) => void;
    deleteBoard: (id: string) => void;
    importBoard: (board: CanvasBoard) => void; 
    
    addElement: (element: CanvasElement) => void;
    deleteElement: (id: string) => void;
    updateElement: (id: string, updates: Partial<CanvasElement>, isFinal?: boolean) => void;
    updateElementsPosition: (updates: { id: string; x: number; y: number }[], isFinal: boolean) => void;
    
    selectElement: (id: string | null, multi?: boolean, deep?: boolean) => void;
    setSelectedIds: (ids: string[]) => void;
    clearSelection: () => void;
    selectAll: () => void;
    removeSelected: () => void;
    
    addConnection: (fromId: string, toId: string) => void;
    
    undo: () => void;
    redo: () => void;
    
    groupSelected: () => void;
    ungroupSelected: () => void;
    fitGroupToChildren: (groupId: string) => void; 
    setHighlightedGroup: (id: string | null) => void;
    
    bringToFront: () => void;
    sendToBack: () => void;
    
    copySelection: () => void;
    pasteSelection: () => void;
    duplicateSelected: () => void;
    
    alignSelected: (alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => void;
    distributeSelected: (direction: 'horizontal' | 'vertical') => void;
    nudgeSelection: (dx: number, dy: number) => void;
    
    getRenderList: () => CanvasElement[];
    setSnapLines: (lines: SnapLine[]) => void;
    
    canUndo: () => boolean;
    canRedo: () => boolean;
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
    boards: [],
    activeBoardId: null,
    activeBoard: null,
    viewport: { x: 0, y: 0, zoom: 1 },
    elements: [],
    selectedIds: new Set(),
    snapLines: [],
    highlightedGroupId: null,
    past: [],
    future: [],
    _clipboard: [],

    setViewport: (v) => set(state => ({ viewport: { ...state.viewport, ...v } })),
    
    canUndo: () => get().past.length > 0,
    canRedo: () => get().future.length > 0,

    createBoard: async (title) => {
        const result = await canvasService.save({ title, elements: [] });
        if (result.success && result.data) {
             const newBoard = result.data;
             set(state => ({ 
                 boards: [...state.boards, newBoard],
                 activeBoardId: newBoard.id,
                 activeBoard: newBoard,
                 elements: [],
                 selectedIds: new Set(),
                 past: [],
                 future: []
             }));
        }
    },

    selectBoard: async (id) => {
        const result = await canvasService.findById(id);
        if (result.success && result.data) {
            set(state => ({
                activeBoardId: id,
                activeBoard: result.data!,
                elements: result.data!.elements,
                selectedIds: new Set(),
                past: [],
                future: [],
                viewport: { x: 0, y: 0, zoom: 1 }
            }));
        }
    },

    deleteBoard: async (id) => {
        await canvasService.deleteById(id);
        set(state => {
            const nextBoards = state.boards.filter(b => b.id !== id);
            return { 
                boards: nextBoards,
                activeBoardId: state.activeBoardId === id ? null : state.activeBoardId,
                activeBoard: state.activeBoardId === id ? null : state.activeBoard
            };
        });
    },

    importBoard: (board) => {
        set(state => ({
            boards: [...state.boards, board],
            activeBoardId: board.id,
            activeBoard: board,
            elements: board.elements,
            selectedIds: new Set(),
            past: [],
            future: [],
            viewport: { x: 0, y: 0, zoom: 1 }
        }));
    },

    undo: () => {
        const state = get();
        if (state.past.length === 0) return;
        
        const lastEntry = state.past[state.past.length - 1];
        const newPast = state.past.slice(0, -1);
        
        const previousElements = applyPatches(state.elements, lastEntry.inversePatches);
        
        set({
            past: newPast,
            future: [lastEntry, ...state.future],
            elements: previousElements,
            selectedIds: new Set()
        });
    },

    redo: () => {
        const state = get();
        if (state.future.length === 0) return;
        
        const nextEntry = state.future[0];
        const newFuture = state.future.slice(1);
        
        const nextElements = applyPatches(state.elements, nextEntry.patches);
        
        set({
            past: [...state.past, nextEntry],
            future: newFuture,
            elements: nextElements,
            selectedIds: new Set()
        });
    },

    addElement: (element) => {
        const [nextElements, patches, inversePatches] = produceWithPatches(get().elements, draft => {
            draft.push(element);
        });
        
        const entry: HistoryEntry = { patches, inversePatches };
        
        set(state => ({
            elements: nextElements,
            selectedIds: new Set([element.id]),
            past: state.past.length >= 50 ? [...state.past.slice(1), entry] : [...state.past, entry],
            future: []
        }));
    },
    
    updateElement: (id, updates, isFinal = true) => {
        const [nextElements, patches, inversePatches] = produceWithPatches(get().elements, draft => {
            const idx = draft.findIndex(el => el.id === id);
            if (idx !== -1) {
                Object.assign(draft[idx], updates);
            }
        });
        
        set(state => ({
            elements: nextElements,
            ...(isFinal && patches.length > 0 ? {
                past: state.past.length >= 50 ? [...state.past.slice(1), { patches, inversePatches }] : [...state.past, { patches, inversePatches }],
                future: []
            } : {})
        }));
    },

    updateElementsPosition: (updates, isFinal) => {
        const [nextElements, patches, inversePatches] = produceWithPatches(get().elements, draft => {
            const map = new Map<string, { x: number, y: number }>();
            updates.forEach(u => map.set(u.id, u));
            draft.forEach(el => {
                const upd = map.get(el.id);
                if (upd) {
                    el.x = upd.x;
                    el.y = upd.y;
                }
            });
        });
        
        set(state => ({
            elements: nextElements,
            ...(isFinal && patches.length > 0 ? {
                past: state.past.length >= 50 ? [...state.past.slice(1), { patches, inversePatches }] : [...state.past, { patches, inversePatches }],
                future: []
            } : {})
        }));
    },
    
    deleteElement: (id) => {
        const [nextElements, patches, inversePatches] = produceWithPatches(get().elements, draft => {
            const idx = draft.findIndex(el => el.id === id);
            if (idx !== -1) {
                draft.splice(idx, 1);
            }
        });
        
        set(state => ({
            elements: nextElements,
            selectedIds: new Set(Array.from(state.selectedIds).filter(sid => sid !== id)),
            past: state.past.length >= 50 ? [...state.past.slice(1), { patches, inversePatches }] : [...state.past, { patches, inversePatches }],
            future: []
        }));
    },

    selectElement: (id, multi = false, deep = false) => {
        set(state => {
            if (!id) {
                if (!multi) return { selectedIds: new Set() };
                return {};
            }
            
            const targetId = id;
            
            if (multi) {
                const newSelection = new Set(state.selectedIds);
                if (newSelection.has(targetId)) {
                    newSelection.delete(targetId);
                } else {
                    newSelection.add(targetId);
                }
                return { selectedIds: newSelection };
            } else {
                if (state.selectedIds.size === 1 && state.selectedIds.has(targetId)) {
                    return {};
                }
                return { selectedIds: new Set([targetId]) };
            }
        });
    },

    setSelectedIds: (ids) => set({ selectedIds: new Set(ids) }),
    
    clearSelection: () => set({ selectedIds: new Set() }),
    
    selectAll: () => set(state => ({ selectedIds: new Set(state.elements.map(e => e.id)) })),
    
    removeSelected: () => {
        const [nextElements, patches, inversePatches] = produceWithPatches(get().elements, draft => {
            const state = get();
            for (let i = draft.length - 1; i >= 0; i--) {
                if (state.selectedIds.has(draft[i].id)) {
                    draft.splice(i, 1);
                }
            }
        });
        
        set(state => ({
            elements: nextElements,
            selectedIds: new Set(),
            past: state.past.length >= 50 ? [...state.past.slice(1), { patches, inversePatches }] : [...state.past, { patches, inversePatches }],
            future: []
        }));
    },

    addConnection: (fromId, toId) => {
        const conn: CanvasElement = {
            id: generateUUID(),
            type: 'connector',
            x: 0, y: 0, width: 0, height: 0, 
            data: { connection: { from: fromId, to: toId } },
            color: '#666'
        };
        
        const [nextElements, patches, inversePatches] = produceWithPatches(get().elements, draft => {
            draft.push(conn);
        });
        
        set(state => ({
            elements: nextElements,
            past: state.past.length >= 50 ? [...state.past.slice(1), { patches, inversePatches }] : [...state.past, { patches, inversePatches }],
            future: []
        }));
    },
    
    setSnapLines: (lines) => set({ snapLines: lines }),
    
    getRenderList: () => {
        return get().elements;
    },
    
    bringToFront: () => {
        const state = get();
        const [nextElements, patches, inversePatches] = produceWithPatches(state.elements, draft => {
            const selected = draft.filter(e => state.selectedIds.has(e.id));
            const others = draft.filter(e => !state.selectedIds.has(e.id));
            draft.length = 0;
            draft.push(...others, ...selected);
        });
        
        set(state => ({
            elements: nextElements,
            past: state.past.length >= 50 ? [...state.past.slice(1), { patches, inversePatches }] : [...state.past, { patches, inversePatches }],
            future: []
        }));
    },
    
    sendToBack: () => {
        const state = get();
        const [nextElements, patches, inversePatches] = produceWithPatches(state.elements, draft => {
            const selected = draft.filter(e => state.selectedIds.has(e.id));
            const others = draft.filter(e => !state.selectedIds.has(e.id));
            draft.length = 0;
            draft.push(...selected, ...others);
        });
        
        set(state => ({
            elements: nextElements,
            past: state.past.length >= 50 ? [...state.past.slice(1), { patches, inversePatches }] : [...state.past, { patches, inversePatches }],
            future: []
        }));
    },
    
    duplicateSelected: () => {
        const state = get();
        const [nextElements, patches, inversePatches] = produceWithPatches(state.elements, draft => {
            state.elements.forEach(el => {
                if (state.selectedIds.has(el.id)) {
                    const clone = { ...el, id: generateUUID(), x: el.x + 20, y: el.y + 20 };
                    if (clone.resource) {
                        clone.resource = { ...clone.resource, id: generateUUID(), uuid: generateUUID() };
                    }
                    draft.push(clone);
                }
            });
        });
        
        const newIds = new Set<string>();
        nextElements.forEach(el => {
            if (!state.elements.some(e => e.id === el.id)) {
                newIds.add(el.id);
            }
        });
        
        set(state => ({
            elements: nextElements,
            selectedIds: newIds,
            past: state.past.length >= 50 ? [...state.past.slice(1), { patches, inversePatches }] : [...state.past, { patches, inversePatches }],
            future: []
        }));
    },
    
    copySelection: () => {
        const state = get();
        const selected = state.elements.filter(e => state.selectedIds.has(e.id));
        set({ _clipboard: selected });
    },
    
    pasteSelection: () => {
        const state = get();
        if (state._clipboard.length === 0) return;
        
        const [nextElements, patches, inversePatches] = produceWithPatches(state.elements, draft => {
            state._clipboard.forEach(el => {
                draft.push({
                    ...el,
                    id: generateUUID(),
                    x: el.x + 20,
                    y: el.y + 20,
                    resource: el.resource ? { ...el.resource, id: generateUUID(), uuid: generateUUID() } : undefined
                });
            });
        });
        
        const newIds = new Set<string>();
        nextElements.forEach(el => {
            if (!state.elements.some(e => e.id === el.id)) {
                newIds.add(el.id);
            }
        });
        
        set(state => ({
            elements: nextElements,
            selectedIds: newIds,
            past: state.past.length >= 50 ? [...state.past.slice(1), { patches, inversePatches }] : [...state.past, { patches, inversePatches }],
            future: []
        }));
    },
    
    nudgeSelection: (dx, dy) => {
        const [nextElements, patches, inversePatches] = produceWithPatches(get().elements, draft => {
            const state = get();
            draft.forEach(el => {
                if (state.selectedIds.has(el.id)) {
                    el.x += dx;
                    el.y += dy;
                }
            });
        });
        
        set(state => ({
            elements: nextElements,
            past: state.past.length >= 50 ? [...state.past.slice(1), { patches, inversePatches }] : [...state.past, { patches, inversePatches }],
            future: []
        }));
    },
    
    groupSelected: () => {
        const state = get();
        if (state.selectedIds.size < 2) return;
        
        const [nextElements, patches, inversePatches] = produceWithPatches(state.elements, draft => {
            const selectedEls = draft.filter(e => state.selectedIds.has(e.id));
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            selectedEls.forEach(el => {
                minX = Math.min(minX, el.x);
                minY = Math.min(minY, el.y);
                maxX = Math.max(maxX, el.x + el.width);
                maxY = Math.max(maxY, el.y + el.height);
            });
            
            const padding = 20;
            const group: CanvasElement = {
                id: generateUUID(),
                type: 'group',
                x: minX - padding,
                y: minY - padding,
                width: (maxX - minX) + (padding * 2),
                height: (maxY - minY) + (padding * 2),
                data: { label: 'Group' },
                groupChildren: Array.from(state.selectedIds)
            };
            
            draft.forEach(el => {
                if (state.selectedIds.has(el.id)) {
                    el.groupId = group.id;
                }
            });
            
            draft.push(group);
        });
        
        const newGroupId = nextElements.find(el => el.type === 'group' && !get().elements.some(e => e.id === el.id))?.id;
        
        set(state => ({
            elements: nextElements,
            selectedIds: newGroupId ? new Set([newGroupId]) : state.selectedIds,
            past: state.past.length >= 50 ? [...state.past.slice(1), { patches, inversePatches }] : [...state.past, { patches, inversePatches }],
            future: []
        }));
    },
    
    ungroupSelected: () => {
        const state = get();
        const groups = Array.from(state.selectedIds).map(id => state.elements.find(e => e.id === id)).filter(e => e && e.type === 'group');
        if (groups.length === 0) return;
        
        const groupIds = new Set(groups.map(g => g!.id));
        const childrenIds = groups.flatMap(g => g!.groupChildren || []);
        
        const [nextElements, patches, inversePatches] = produceWithPatches(state.elements, draft => {
            for (let i = draft.length - 1; i >= 0; i--) {
                if (groupIds.has(draft[i].id)) {
                    draft.splice(i, 1);
                } else if (childrenIds.includes(draft[i].id)) {
                    draft[i].groupId = undefined;
                }
            }
        });
        
        set(state => ({
            elements: nextElements,
            selectedIds: new Set(childrenIds),
            past: state.past.length >= 50 ? [...state.past.slice(1), { patches, inversePatches }] : [...state.past, { patches, inversePatches }],
            future: []
        }));
    },
    
    fitGroupToChildren: (groupId: string) => {
        const state = get();
        const group = state.elements.find(e => e.id === groupId);
        if (!group || !group.groupChildren || group.groupChildren.length === 0) return;
        
        const children = state.elements.filter(e => group.groupChildren!.includes(e.id));
        if (children.length === 0) return;
        
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        children.forEach(el => {
            minX = Math.min(minX, el.x);
            minY = Math.min(minY, el.y);
            maxX = Math.max(maxX, el.x + el.width);
            maxY = Math.max(maxY, el.y + el.height);
        });
        
        const padding = 20;
        const newX = minX - padding;
        const newY = minY - padding;
        const newW = (maxX - minX) + (padding * 2);
        const newH = (maxY - minY) + (padding * 2);
        
        if (
            Math.abs(newX - group.x) > 1 || 
            Math.abs(newY - group.y) > 1 || 
            Math.abs(newW - group.width) > 1 || 
            Math.abs(newH - group.height) > 1
        ) {
            const [nextElements, patches, inversePatches] = produceWithPatches(state.elements, draft => {
                const idx = draft.findIndex(el => el.id === groupId);
                if (idx !== -1) {
                    draft[idx].x = newX;
                    draft[idx].y = newY;
                    draft[idx].width = newW;
                    draft[idx].height = newH;
                }
            });
            
            set(state => ({
                elements: nextElements,
                past: state.past.length >= 50 ? [...state.past.slice(1), { patches, inversePatches }] : [...state.past, { patches, inversePatches }],
                future: []
            }));
        }
    },
    
    alignSelected: (alignment) => {
        const state = get();
        const selected = state.elements.filter(e => state.selectedIds.has(e.id));
        if (selected.length < 2) return;
        
        let targetVal = 0;
        if (alignment === 'left') targetVal = Math.min(...selected.map(e => e.x));
        if (alignment === 'right') targetVal = Math.max(...selected.map(e => e.x + e.width));
        if (alignment === 'top') targetVal = Math.min(...selected.map(e => e.y));
        if (alignment === 'bottom') targetVal = Math.max(...selected.map(e => e.y + e.height));
        if (alignment === 'center') {
            const min = Math.min(...selected.map(e => e.x));
            const max = Math.max(...selected.map(e => e.x + e.width));
            targetVal = (min + max) / 2;
        }
        if (alignment === 'middle') {
            const min = Math.min(...selected.map(e => e.y));
            const max = Math.max(...selected.map(e => e.y + e.height));
            targetVal = (min + max) / 2;
        }
        
        const [nextElements, patches, inversePatches] = produceWithPatches(state.elements, draft => {
            draft.forEach(el => {
                if (!state.selectedIds.has(el.id)) return;
                if (alignment === 'left') el.x = targetVal;
                if (alignment === 'right') el.x = targetVal - el.width;
                if (alignment === 'top') el.y = targetVal;
                if (alignment === 'bottom') el.y = targetVal - el.height;
                if (alignment === 'center') el.x = targetVal - el.width / 2;
                if (alignment === 'middle') el.y = targetVal - el.height / 2;
            });
        });
        
        set(state => ({
            elements: nextElements,
            past: state.past.length >= 50 ? [...state.past.slice(1), { patches, inversePatches }] : [...state.past, { patches, inversePatches }],
            future: []
        }));
    },
    
    distributeSelected: (direction) => {
        const state = get();
        const selected = state.elements.filter(e => state.selectedIds.has(e.id));
        if (selected.length < 3) return;

        const sorted = [...selected].sort((a, b) => direction === 'horizontal' ? a.x - b.x : a.y - b.y);
        const first = sorted[0];
        const last = sorted[sorted.length - 1];

        const [nextElements, patches, inversePatches] = produceWithPatches(state.elements, draft => {
            if (direction === 'horizontal') {
                const totalSpan = (last.x + last.width) - first.x;
                const sumWidths = sorted.reduce((sum, el) => sum + el.width, 0);
                const gap = (totalSpan - sumWidths) / (sorted.length - 1);
                let currentX = first.x;
                
                draft.forEach(el => {
                    const idx = sorted.findIndex(s => s.id === el.id);
                    if (idx === -1) return;
                    if (idx === 0) { currentX += el.width + gap; return; }
                    el.x = currentX;
                    currentX += el.width + gap;
                });
            } else {
                const totalSpan = (last.y + last.height) - first.y;
                const sumHeights = sorted.reduce((sum, el) => sum + el.height, 0);
                const gap = (totalSpan - sumHeights) / (sorted.length - 1);
                let currentY = first.y;
                
                draft.forEach(el => {
                    const idx = sorted.findIndex(s => s.id === el.id);
                    if (idx === -1) return;
                    if (idx === 0) { currentY += el.height + gap; return; }
                    el.y = currentY;
                    currentY += el.height + gap;
                });
            }
        });
        
        set(state => ({
            elements: nextElements,
            past: state.past.length >= 50 ? [...state.past.slice(1), { patches, inversePatches }] : [...state.past, { patches, inversePatches }],
            future: []
        }));
    },

    setHighlightedGroup: (id) => set({ highlightedGroupId: id }),
}));
