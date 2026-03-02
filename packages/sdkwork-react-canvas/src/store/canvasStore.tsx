
import { create } from 'zustand';
import { produceWithPatches, applyPatches, enablePatches, Patch } from 'immer';
import { CanvasBoard, CanvasElement, Viewport, SnapLine, CanvasNodeData } from '../entities';
import { generateUUID } from '@sdkwork/react-commons';
import { canvasService } from '../services/canvasService';
import {
    collectSelectedGroupRoots,
    collectSelectionWithHierarchyAndConnectors,
    detachChildrenFromGroups,
    detectGroupCycles
} from '../services/canvasHierarchyService';

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
    updateElementsPosition: (
        updates: { id: string; x: number; y: number }[],
        isFinal: boolean,
        groupIdsToFit?: string[]
    ) => void;
    
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

const isCanvasDevMode = (): boolean => {
    if (typeof process !== 'undefined' && process?.env) {
        return process.env.NODE_ENV !== 'production';
    }
    if (typeof window !== 'undefined') {
        const hostname = window.location?.hostname ?? '';
        return hostname === 'localhost' || hostname === '127.0.0.1';
    }
    return false;
};

const SHOULD_RUN_CANVAS_INVARIANTS = isCanvasDevMode();

const normalizeElementRelations = (draft: CanvasElement[], removedIds: Set<string>): void => {
    for (let i = draft.length - 1; i >= 0; i -= 1) {
        if (removedIds.has(draft[i].id)) {
            draft.splice(i, 1);
        }
    }

    const existingIds = new Set(draft.map((element) => element.id));

    for (let i = draft.length - 1; i >= 0; i -= 1) {
        const element = draft[i];

        if (element.type === 'connector') {
            const from = element.data?.connection?.from;
            const to = element.data?.connection?.to;
            if (!from || !to || !existingIds.has(from) || !existingIds.has(to)) {
                draft.splice(i, 1);
            }
            continue;
        }

        if (element.groupId && !existingIds.has(element.groupId)) {
            element.groupId = undefined;
        }

        if (element.type === 'group' && element.groupChildren) {
            const nextChildren: string[] = [];
            const dedupe = new Set<string>();
            element.groupChildren.forEach((childId) => {
                if (childId === element.id) return;
                if (!existingIds.has(childId)) return;
                if (dedupe.has(childId)) return;
                dedupe.add(childId);
                nextChildren.push(childId);
            });
            element.groupChildren = nextChildren;
        }
    }
};

const cloneElementWithMappedIds = (
    element: CanvasElement,
    idMap: Map<string, string>,
    offsetX: number,
    offsetY: number
): CanvasElement | null => {
    const cloneId = idMap.get(element.id) ?? generateUUID();
    const clone: CanvasElement = {
        ...element,
        id: cloneId,
        x: element.x + offsetX,
        y: element.y + offsetY
    };

    if (clone.resource) {
        clone.resource = { ...clone.resource, id: generateUUID(), uuid: generateUUID() };
    }

    if (clone.groupId) {
        clone.groupId = idMap.get(clone.groupId);
    }

    if (clone.type === 'group' && clone.groupChildren) {
        clone.groupChildren = Array.from(
            new Set(
                clone.groupChildren
                    .map((childId) => idMap.get(childId))
                    .filter((childId): childId is string => !!childId)
            )
        ).filter((childId) => childId !== cloneId);
    }

    if (clone.type === 'connector') {
        const from = element.data?.connection?.from;
        const to = element.data?.connection?.to;
        // Copy only closed topology: both endpoints must exist in the copied set.
        if (!from || !to || !idMap.has(from) || !idMap.has(to)) {
            return null;
        }
        const mappedFrom = idMap.get(from);
        const mappedTo = idMap.get(to);
        if (!mappedFrom || !mappedTo) return null;
        clone.data = {
            ...clone.data,
            connection: { from: mappedFrom, to: mappedTo }
        };
    }

    return clone;
};

const isConnectableElement = (element: CanvasElement | undefined): boolean => {
    if (!element) return false;
    return element.type !== 'connector' && element.type !== 'group';
};

const collectCanvasIntegrityIssues = (elements: CanvasElement[]): string[] => {
    const issues: string[] = [];
    const elementById = new Map<string, CanvasElement>();
    const groupById = new Map<string, CanvasElement>();
    const connectorPairs = new Set<string>();

    elements.forEach((element) => {
        if (elementById.has(element.id)) {
            issues.push(`Duplicate element id: ${element.id}`);
            return;
        }
        elementById.set(element.id, element);
        if (element.type === 'group') {
            groupById.set(element.id, element);
        }
    });

    elements.forEach((element) => {
        if (element.type === 'connector') {
            const from = element.data?.connection?.from;
            const to = element.data?.connection?.to;
            if (!from || !to) {
                issues.push(`Connector ${element.id} missing from/to endpoint.`);
                return;
            }
            if (from === to) {
                issues.push(`Connector ${element.id} has self-loop endpoint ${from}.`);
            }
            const fromElement = elementById.get(from);
            const toElement = elementById.get(to);
            if (!isConnectableElement(fromElement) || !isConnectableElement(toElement)) {
                issues.push(`Connector ${element.id} points to invalid endpoint(s): ${from} -> ${to}.`);
            }
            const pairKey = `${from}->${to}`;
            if (connectorPairs.has(pairKey)) {
                issues.push(`Duplicate connector pair detected: ${pairKey}.`);
            } else {
                connectorPairs.add(pairKey);
            }
            return;
        }

        if (element.groupId) {
            const parent = groupById.get(element.groupId);
            if (!parent) {
                issues.push(`Element ${element.id} references missing group ${element.groupId}.`);
            } else if (!parent.groupChildren?.includes(element.id)) {
                issues.push(`Element ${element.id} groupId ${element.groupId} missing in parent's children.`);
            }
        }

        if (element.type === 'group' && element.groupChildren) {
            const childDedupe = new Set<string>();
            element.groupChildren.forEach((childId) => {
                if (childId === element.id) {
                    issues.push(`Group ${element.id} includes itself as child.`);
                    return;
                }
                if (childDedupe.has(childId)) {
                    issues.push(`Group ${element.id} has duplicate child ${childId}.`);
                    return;
                }
                childDedupe.add(childId);
                const child = elementById.get(childId);
                if (!child) {
                    issues.push(`Group ${element.id} references missing child ${childId}.`);
                    return;
                }
                if (child.groupId && child.groupId !== element.id) {
                    issues.push(`Child ${childId} linked to different group ${child.groupId} (expected ${element.id}).`);
                }
            });
        }
    });

    detectGroupCycles(elements).forEach((cycle) => {
        issues.push(`Group cycle detected: ${cycle}`);
    });

    return issues;
};

const reportCanvasIntegrity = (elements: CanvasElement[], context: string): void => {
    if (!SHOULD_RUN_CANVAS_INVARIANTS) return;
    const issues = collectCanvasIntegrityIssues(elements);
    if (issues.length === 0) return;
    const preview = issues.slice(0, 12);
    console.error(`[CanvasStore][Integrity] ${context} detected ${issues.length} issue(s).`, preview);
};

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
        if (patches.length === 0) return;
        reportCanvasIntegrity(nextElements, 'addElement');
        
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
        if (patches.length === 0) return;
        if (isFinal) reportCanvasIntegrity(nextElements, 'updateElement');
        
        set(state => ({
            elements: nextElements,
            ...(isFinal && patches.length > 0 ? {
                past: state.past.length >= 50 ? [...state.past.slice(1), { patches, inversePatches }] : [...state.past, { patches, inversePatches }],
                future: []
            } : {})
        }));
    },

    updateElementsPosition: (updates, isFinal, groupIdsToFit = []) => {
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

            if (groupIdsToFit.length > 0) {
                const targetGroupIds = new Set(groupIdsToFit);
                const elementMap = new Map<string, CanvasElement>();
                draft.forEach((element) => {
                    elementMap.set(element.id, element);
                });

                const PADDING = 20;
                targetGroupIds.forEach((groupId) => {
                    const group = elementMap.get(groupId);
                    if (!group || group.type !== 'group' || !group.groupChildren || group.groupChildren.length === 0) {
                        return;
                    }

                    let minX = Infinity;
                    let minY = Infinity;
                    let maxX = -Infinity;
                    let maxY = -Infinity;
                    let hasChild = false;

                    group.groupChildren.forEach((childId) => {
                        const child = elementMap.get(childId);
                        if (!child) return;
                        hasChild = true;
                        minX = Math.min(minX, child.x);
                        minY = Math.min(minY, child.y);
                        maxX = Math.max(maxX, child.x + child.width);
                        maxY = Math.max(maxY, child.y + child.height);
                    });

                    if (!hasChild) return;
                    group.x = minX - PADDING;
                    group.y = minY - PADDING;
                    group.width = (maxX - minX) + (PADDING * 2);
                    group.height = (maxY - minY) + (PADDING * 2);
                });
            }
        });
        if (patches.length === 0) return;
        if (isFinal) reportCanvasIntegrity(nextElements, 'updateElementsPosition');
        
        set(state => ({
            elements: nextElements,
            ...(isFinal && patches.length > 0 ? {
                past: state.past.length >= 50 ? [...state.past.slice(1), { patches, inversePatches }] : [...state.past, { patches, inversePatches }],
                future: []
            } : {})
        }));
    },
    
    deleteElement: (id) => {
        const removedIds = new Set([id]);
        const [nextElements, patches, inversePatches] = produceWithPatches(get().elements, draft => {
            normalizeElementRelations(draft, removedIds);
        });
        if (patches.length === 0) return;
        reportCanvasIntegrity(nextElements, 'deleteElement');
        const existingIds = new Set(nextElements.map(el => el.id));
        
        set(state => ({
            elements: nextElements,
            selectedIds: new Set(Array.from(state.selectedIds).filter(sid => existingIds.has(sid))),
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
        const removedIds = new Set(get().selectedIds);
        if (removedIds.size === 0) return;
        const [nextElements, patches, inversePatches] = produceWithPatches(get().elements, draft => {
            normalizeElementRelations(draft, removedIds);
        });
        if (patches.length === 0) return;
        reportCanvasIntegrity(nextElements, 'removeSelected');
        
        set(state => ({
            elements: nextElements,
            selectedIds: new Set(),
            past: state.past.length >= 50 ? [...state.past.slice(1), { patches, inversePatches }] : [...state.past, { patches, inversePatches }],
            future: []
        }));
    },

    addConnection: (fromId, toId) => {
        if (!fromId || !toId || fromId === toId) return;
        const elements = get().elements;
        const fromElement = elements.find(el => el.id === fromId);
        const toElement = elements.find(el => el.id === toId);
        if (!isConnectableElement(fromElement) || !isConnectableElement(toElement)) return;

        const duplicate = elements.some((el) => {
            if (el.type !== 'connector') return false;
            const from = el.data?.connection?.from;
            const to = el.data?.connection?.to;
            return from === fromId && to === toId;
        });
        if (duplicate) return;

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
        if (patches.length === 0) return;
        reportCanvasIntegrity(nextElements, 'addConnection');
        
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
        if (state.selectedIds.size === 0) return;
        const [nextElements, patches, inversePatches] = produceWithPatches(state.elements, draft => {
            const selected = draft.filter(e => state.selectedIds.has(e.id));
            const others = draft.filter(e => !state.selectedIds.has(e.id));
            draft.length = 0;
            draft.push(...others, ...selected);
        });
        if (patches.length === 0) return;
        
        set(state => ({
            elements: nextElements,
            past: state.past.length >= 50 ? [...state.past.slice(1), { patches, inversePatches }] : [...state.past, { patches, inversePatches }],
            future: []
        }));
    },
    
    sendToBack: () => {
        const state = get();
        if (state.selectedIds.size === 0) return;
        const [nextElements, patches, inversePatches] = produceWithPatches(state.elements, draft => {
            const selected = draft.filter(e => state.selectedIds.has(e.id));
            const others = draft.filter(e => !state.selectedIds.has(e.id));
            draft.length = 0;
            draft.push(...selected, ...others);
        });
        if (patches.length === 0) return;
        
        set(state => ({
            elements: nextElements,
            past: state.past.length >= 50 ? [...state.past.slice(1), { patches, inversePatches }] : [...state.past, { patches, inversePatches }],
            future: []
        }));
    },
    
    duplicateSelected: () => {
        const state = get();
        const selectedRoots = new Set(state.selectedIds);
        const selectedElements = collectSelectionWithHierarchyAndConnectors(state.elements, selectedRoots);
        if (selectedElements.length === 0) return;

        const idMap = new Map<string, string>();
        selectedElements.forEach((element) => {
            idMap.set(element.id, generateUUID());
        });

        const createdIds: string[] = [];
        const [nextElements, patches, inversePatches] = produceWithPatches(state.elements, draft => {
            selectedElements.forEach((element) => {
                const clone = cloneElementWithMappedIds(element, idMap, 20, 20);
                if (!clone) return;
                draft.push(clone);
                createdIds.push(clone.id);
            });
        });
        if (patches.length === 0 || createdIds.length === 0) return;
        reportCanvasIntegrity(nextElements, 'duplicateSelected');

        const selectedDuplicatedIds = Array.from(selectedRoots)
            .map((id) => idMap.get(id))
            .filter((id): id is string => !!id);
        
        set(state => ({
            elements: nextElements,
            selectedIds: new Set(selectedDuplicatedIds.length > 0 ? selectedDuplicatedIds : createdIds),
            past: state.past.length >= 50 ? [...state.past.slice(1), { patches, inversePatches }] : [...state.past, { patches, inversePatches }],
            future: []
        }));
    },
    
    copySelection: () => {
        const state = get();
        if (state.selectedIds.size === 0) {
            set({ _clipboard: [] });
            return;
        }
        const selectionWithTopology = collectSelectionWithHierarchyAndConnectors(state.elements, state.selectedIds);
        set({ _clipboard: selectionWithTopology });
    },
    
    pasteSelection: () => {
        const state = get();
        if (state._clipboard.length === 0) return;

        const idMap = new Map<string, string>();
        state._clipboard.forEach((element) => {
            idMap.set(element.id, generateUUID());
        });

        const createdIds: string[] = [];
        
        const [nextElements, patches, inversePatches] = produceWithPatches(state.elements, draft => {
            state._clipboard.forEach((element) => {
                const clone = cloneElementWithMappedIds(element, idMap, 20, 20);
                if (!clone) return;
                draft.push(clone);
                createdIds.push(clone.id);
            });
        });
        if (patches.length === 0 || createdIds.length === 0) return;
        reportCanvasIntegrity(nextElements, 'pasteSelection');
        
        set(state => ({
            elements: nextElements,
            selectedIds: new Set(createdIds),
            past: state.past.length >= 50 ? [...state.past.slice(1), { patches, inversePatches }] : [...state.past, { patches, inversePatches }],
            future: []
        }));
    },
    
    nudgeSelection: (dx, dy) => {
        const state = get();
        if (state.selectedIds.size === 0) return;
        const [nextElements, patches, inversePatches] = produceWithPatches(get().elements, draft => {
            draft.forEach(el => {
                if (state.selectedIds.has(el.id)) {
                    el.x += dx;
                    el.y += dy;
                }
            });
        });
        if (patches.length === 0) return;
        
        set(state => ({
            elements: nextElements,
            past: state.past.length >= 50 ? [...state.past.slice(1), { patches, inversePatches }] : [...state.past, { patches, inversePatches }],
            future: []
        }));
    },
    
    groupSelected: () => {
        const state = get();
        if (state.selectedIds.size < 2) return;
        const rootIds = collectSelectedGroupRoots(state);
        if (rootIds.length < 2) return;
        const rootIdSet = new Set(rootIds);
        
        const [nextElements, patches, inversePatches] = produceWithPatches(state.elements, draft => {
            const selectedEls = draft.filter(e => rootIdSet.has(e.id));
            if (selectedEls.length < 2) return;

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
                groupChildren: Array.from(rootIdSet)
            };

            detachChildrenFromGroups(draft, rootIdSet);

            draft.forEach(el => {
                if (rootIdSet.has(el.id)) {
                    el.groupId = group.id;
                }
            });
            
            draft.push(group);
        });
        if (patches.length === 0) return;
        reportCanvasIntegrity(nextElements, 'groupSelected');
        
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
        const childrenIds = Array.from(new Set(groups.flatMap(g => g!.groupChildren || [])));
        
        const [nextElements, patches, inversePatches] = produceWithPatches(state.elements, draft => {
            detachChildrenFromGroups(draft, groupIds);

            for (let i = draft.length - 1; i >= 0; i--) {
                if (groupIds.has(draft[i].id)) {
                    draft.splice(i, 1);
                } else {
                    const parentGroupId = draft[i].groupId;
                    if (childrenIds.includes(draft[i].id) && parentGroupId && groupIds.has(parentGroupId)) {
                        draft[i].groupId = undefined;
                    }
                }
            }
        });
        if (patches.length === 0) return;
        reportCanvasIntegrity(nextElements, 'ungroupSelected');
        
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
            if (patches.length === 0) return;
            reportCanvasIntegrity(nextElements, 'fitGroupToChildren');
            
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
        if (patches.length === 0) return;
        
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
            const nextPositionMap = new Map<string, number>();
            if (direction === 'horizontal') {
                const totalSpan = (last.x + last.width) - first.x;
                const sumWidths = sorted.reduce((sum, el) => sum + el.width, 0);
                const gap = (totalSpan - sumWidths) / (sorted.length - 1);
                let currentX = first.x;
                sorted.forEach((el, idx) => {
                    if (idx === 0) {
                        nextPositionMap.set(el.id, first.x);
                        return;
                    }
                    currentX += sorted[idx - 1].width + gap;
                    nextPositionMap.set(el.id, currentX);
                });
            } else {
                const totalSpan = (last.y + last.height) - first.y;
                const sumHeights = sorted.reduce((sum, el) => sum + el.height, 0);
                const gap = (totalSpan - sumHeights) / (sorted.length - 1);
                let currentY = first.y;

                sorted.forEach((el, idx) => {
                    if (idx === 0) {
                        nextPositionMap.set(el.id, first.y);
                        return;
                    }
                    currentY += sorted[idx - 1].height + gap;
                    nextPositionMap.set(el.id, currentY);
                });
            }

            draft.forEach((element) => {
                const nextValue = nextPositionMap.get(element.id);
                if (nextValue === undefined) return;
                if (direction === 'horizontal') {
                    element.x = nextValue;
                } else {
                    element.y = nextValue;
                }
            });
        });
        if (patches.length === 0) return;
        
        set(state => ({
            elements: nextElements,
            past: state.past.length >= 50 ? [...state.past.slice(1), { patches, inversePatches }] : [...state.past, { patches, inversePatches }],
            future: []
        }));
    },

    setHighlightedGroup: (id) => set({ highlightedGroupId: id }),
}));
