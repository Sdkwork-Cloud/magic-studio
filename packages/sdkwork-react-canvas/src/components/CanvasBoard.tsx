
import React, { useRef, useEffect, useState, useMemo, useCallback, useLayoutEffect } from 'react';
import { useCanvasStore } from '../store';
import { CanvasNode, LODLevel } from './CanvasNode';
import { CanvasGroupPanel } from './CanvasGroupPanel';
import { CanvasDropMenu } from './CanvasDropMenu';
import { CanvasDrawer } from './CanvasDrawer';
;
import { CanvasEmptyState } from './CanvasEmptyState';
import { CanvasBackground } from './layers/CanvasBackground';
import { CanvasConnections } from './layers/CanvasConnections';
;
import { CanvasElement, CanvasElementType, ConnectionDraft, DropMenuState, MarqueeState, ContextMenuState } from '../entities';
import { QuadTree, Rect } from '@sdkwork/react-commons';
import { getSmartPath } from '../utils/smartPath';
import { zoomViewportAroundPoint } from '../utils/viewport';
import { CanvasContextMenu } from './CanvasContextMenu';
import { CanvasAlignmentToolbar } from './CanvasAlignmentToolbar';
import { CanvasMinimap } from './CanvasMinimap';
import { CanvasZoomControls } from './CanvasZoomControls';
import { SelectionOverlay } from './SelectionOverlay';
import {
    canvasBusinessService,
    NodeFactory,
    type AffectedConnection,
    type MoveElementStartPosition
} from '../services';

const {
    canvasInteractionService: {
        buildMoveCommitUpdates,
        computeConnectionPreviewPaths,
        computeGroupPreviewBounds,
        computeMoveDeltaWithSnap,
        hasMoveCommitChanges,
        initializeMoveSession
    }
} = canvasBusinessService;

export const Z_LAYERS = {
    BACKGROUND: 0,
    GROUPS: 50,         
    CONNECTIONS: 100,   
    NODES: 200,         
    ACTIVE_NODE: 500,   
    OVERLAYS: 1000,     
    UI: 2000            
};

export const CanvasBoard: React.FC = () => {
    const { 
        viewport, elements, selectedIds, snapLines,
        setViewport, addElement, addConnection, selectElement, 
        setSelectedIds, clearSelection, removeSelected, 
        updateElementsPosition, updateElement, getRenderList,
        setSnapLines, bringToFront, sendToBack, duplicateSelected,
        undo, redo, selectAll, copySelection, pasteSelection, 
        nudgeSelection, groupSelected, ungroupSelected,
        setHighlightedGroup
    } = useCanvasStore();

    const containerRef = useRef<HTMLDivElement>(null);
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
    const [isSpacePressed, setIsSpacePressed] = useState(false);
    const viewportWidth = containerSize.width > 0 ? containerSize.width : window.innerWidth;
    const viewportHeight = containerSize.height > 0 ? containerSize.height : window.innerHeight;
    
    // --- Direct DOM Refs for Transient Updates ---
    const nodeRefs = useRef<Map<string, HTMLDivElement>>(new Map());
    const groupRefs = useRef<Map<string, HTMLDivElement>>(new Map()); 
    const connectionRefs = useRef<Map<string, SVGPathElement>>(new Map());
    
    const worldLayerRef = useRef<HTMLDivElement>(null);

    // LOD Calculation
    const currentLOD: LODLevel = useMemo(() => {
        if (viewport.zoom > 0.6) return 'detail';
        if (viewport.zoom > 0.2) return 'simplified';
        return 'block';
    }, [viewport.zoom]);

    // Spatial Index - Rebuild when elements change (position, size, etc.)
    const spatialIndex = useMemo(function() {
        const bounds = { x: -50000, y: -50000, width: 100000, height: 100000 };
        const tree = new QuadTree(bounds);
        elements.forEach(function(el) { tree.insert(el, el); });
        return tree;
    }, [elements]); 

    // Viewport Culling
    const { visibleGroups, visibleNodes } = useMemo(() => {
        if (!containerSize.width) return { visibleGroups: [], visibleNodes: [] };

        const visibleX = -viewport.x / viewport.zoom;
        const visibleY = -viewport.y / viewport.zoom;
        const visibleW = containerSize.width / viewport.zoom;
        const visibleH = containerSize.height / viewport.zoom;

        const buffer = 1000; 
        const queryRect = {
            x: visibleX - buffer,
            y: visibleY - buffer,
            width: visibleW + (buffer * 2),
            height: visibleH + (buffer * 2)
        };

        const visibleRaw = spatialIndex.query(queryRect);
        
        // Ensure selected items are always visible/rendered to avoid glitch when dragging out of view
        // Use ID-based Set instead of object reference for correct comparison
        const visibleIds = new Set<string>();
        visibleRaw.forEach(el => visibleIds.add(el.id));
        selectedIds.forEach(id => visibleIds.add(id));
        
        const renderOrder = getRenderList();
        
        const visibleElements = renderOrder.filter(el => visibleIds.has(el.id)).map(el => ({
            ...el,
            selected: selectedIds.has(el.id)
        }));

        return {
            visibleGroups: visibleElements.filter(el => el.type === 'group'),
            visibleNodes: visibleElements.filter(el => el.type !== 'group' && el.type !== 'connector')
        };
    }, [spatialIndex, viewport, containerSize, selectedIds, elements, getRenderList]);

    // Selection Bounds
    const selectionBounds = useMemo<Rect | null>(() => {
        if (selectedIds.size <= 1) return null;
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        let hasItem = false;
        selectedIds.forEach(id => {
            const el = elements.find(e => e.id === id);
            if (el && el.type !== 'connector') { 
                hasItem = true;
                minX = Math.min(minX, el.x);
                minY = Math.min(minY, el.y);
                maxX = Math.max(maxX, el.x + el.width);
                maxY = Math.max(maxY, el.y + el.height);
            }
        });
        if (!hasItem) return null;
        const PADDING = 10;
        return { x: minX - PADDING, y: minY - PADDING, width: (maxX - minX) + (PADDING * 2), height: (maxY - minY) + (PADDING * 2) };
    }, [selectedIds, elements]);

    useEffect(() => {
        if (!containerRef.current) return;
        const observer = new ResizeObserver(entries => {
            for (const entry of entries) {
                setContainerSize({ width: entry.contentRect.width, height: entry.contentRect.height });
            }
        });
        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    // --- Interaction States ---
    const [connectionDraft, setConnectionDraft] = useState<ConnectionDraft | null>(null);
    const [dropMenu, setDropMenu] = useState<DropMenuState | null>(null);
    const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
    const [marquee, setMarquee] = useState<MarqueeState | null>(null);
    const [drawerElement, setDrawerElement] = useState<CanvasElement | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    // Physics Refs
    const velocityRef = useRef({ x: 0, y: 0 });
    const lastMoveTimeRef = useRef(0);
    const momentumRafRef = useRef<number | null>(null);
    const lastPosRef = useRef({ x: 0, y: 0 }); 

    const dragRef = useRef<{
        isDragging: boolean;
        startX: number;
        startY: number;
        currentX: number; 
        currentY: number;
        mode: 'pan' | 'move-node' | 'select' | 'rubber-band' | null;
        initialPositions: Map<string, MoveElementStartPosition>;
        pendingSelectionId?: string | null;
        affectedConnections: AffectedConnection[];
        parentGroups: Set<string>; 
    }>({ 
        isDragging: false, startX: 0, startY: 0, currentX: 0, currentY: 0, 
        mode: null, initialPositions: new Map(), pendingSelectionId: null, parentGroups: new Set(), affectedConnections: []
    });

    const viewportRef = useRef(viewport);
    viewportRef.current = viewport;
    const selectedIdsRef = useRef(selectedIds);
    selectedIdsRef.current = selectedIds;
    const spatialIndexRef = useRef(spatialIndex);
    spatialIndexRef.current = spatialIndex;
    const connectionDraftRef = useRef<ConnectionDraft | null>(connectionDraft);
    connectionDraftRef.current = connectionDraft;
    const marqueeRef = useRef<MarqueeState | null>(marquee);
    marqueeRef.current = marquee;

    const screenToWorld = useCallback((clientX: number, clientY: number) => {
        if (!containerRef.current) return { x: 0, y: 0 };
        const rect = containerRef.current.getBoundingClientRect();
        const currentViewport = viewportRef.current;
        return {
            x: (clientX - rect.left - currentViewport.x) / currentViewport.zoom,
            y: (clientY - rect.top - currentViewport.y) / currentViewport.zoom
        };
    }, []);

    const resetMovePreviewStyles = useCallback((elementsSnapshot: CanvasElement[]) => {
        const elementById = new Map<string, CanvasElement>();
        elementsSnapshot.forEach((element) => {
            elementById.set(element.id, element);
        });

        dragRef.current.initialPositions.forEach((_position, id) => {
            const domNode = nodeRefs.current.get(id);
            if (domNode) {
                domNode.style.transform = 'translate3d(0,0,0) scale(1)';
            }
            const groupNode = groupRefs.current.get(id);
            if (groupNode) {
                groupNode.style.transform = 'translate3d(0,0,0)';
            }
        });

        dragRef.current.parentGroups.forEach((groupId) => {
            const groupDom = groupRefs.current.get(groupId);
            const groupElement = elementById.get(groupId);
            if (!groupDom || !groupElement) return;
            groupDom.style.transform = 'translate3d(0,0,0)';
            groupDom.style.left = `${groupElement.x}px`;
            groupDom.style.top = `${groupElement.y}px`;
            groupDom.style.width = `${groupElement.width}px`;
            groupDom.style.height = `${groupElement.height}px`;
        });

        const baseConnectionPaths = computeConnectionPreviewPaths(dragRef.current.affectedConnections, 0, 0);
        baseConnectionPaths.forEach((preview) => {
            const pathEl = connectionRefs.current.get(preview.id);
            if (!pathEl) return;
            pathEl.setAttribute('d', preview.path);
        });
    }, []);

    useLayoutEffect(() => {
        if (worldLayerRef.current) {
             worldLayerRef.current.style.transform = `translate3d(${viewport.x}px, ${viewport.y}px, 0) scale(${viewport.zoom})`;
        }
    }, [viewport]);

    // Keyboard
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            if (['INPUT', 'TEXTAREA'].includes(target.tagName) || target.isContentEditable) return;
            const isCtrl = e.ctrlKey || e.metaKey;
            
            if (e.code === 'Space' && !e.repeat) {
                setIsSpacePressed(true); 
                if(containerRef.current) containerRef.current.style.cursor = 'grab';
            }
            if (isCtrl) {
                switch (e.key.toLowerCase()) {
                    case 'z': e.preventDefault(); e.shiftKey ? redo() : undo(); break;
                    case 'a': e.preventDefault(); selectAll(); break;
                    case 'd': e.preventDefault(); duplicateSelected(); break;
                    case 'c': e.preventDefault(); copySelection(); break;
                    case 'v': e.preventDefault(); pasteSelection(); break;
                    case 'g': e.preventDefault(); e.shiftKey ? ungroupSelected() : groupSelected(); break;
                }
            }
            if (e.key === 'Escape') { 
                clearSelection(); 
                setDropMenu(null);
                setContextMenu(null);
                setConnectionDraft(null);
                setMarquee(null);
            }
            if (e.key === 'Backspace' || e.key === 'Delete') { removeSelected(); }
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                e.preventDefault();
                const step = e.shiftKey ? 10 : 1;
                switch (e.key) {
                    case 'ArrowUp': nudgeSelection(0, -step); break;
                    case 'ArrowDown': nudgeSelection(0, step); break;
                    case 'ArrowLeft': nudgeSelection(-step, 0); break;
                    case 'ArrowRight': nudgeSelection(step, 0); break;
                }
            }
        };
        const handleKeyUp = (e: KeyboardEvent) => { 
            if (e.code === 'Space') {
                setIsSpacePressed(false);
                if(containerRef.current) containerRef.current.style.cursor = 'default';
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [removeSelected, undo, redo, selectAll, duplicateSelected, copySelection, pasteSelection, nudgeSelection, groupSelected, ungroupSelected, clearSelection]);

    // Momentum Scroll
    const startMomentum = useCallback(() => {
        let { x: vx, y: vy } = velocityRef.current;
        const FRICTION = 0.94; 
        const STOP_THRESHOLD = 0.05;
        if (Math.abs(vx) < 1 && Math.abs(vy) < 1) return;
        const loop = () => {
            if (Math.abs(vx) < STOP_THRESHOLD && Math.abs(vy) < STOP_THRESHOLD) { momentumRafRef.current = null; return; }
            vx *= FRICTION; vy *= FRICTION;
            const current = useCanvasStore.getState().viewport;
            setViewport({ x: current.x + vx, y: current.y + vy });
            momentumRafRef.current = requestAnimationFrame(loop);
        };
        momentumRafRef.current = requestAnimationFrame(loop);
    }, [setViewport]);

    const stopMomentum = () => { 
        if (momentumRafRef.current) { cancelAnimationFrame(momentumRafRef.current); momentumRafRef.current = null; } 
        velocityRef.current = { x: 0, y: 0 }; 
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopMomentum();
            nodeRefs.current.clear();
            groupRefs.current.clear();
            connectionRefs.current.clear();
        };
    }, []);

    // --- MOUSE HANDLERS ---

    const handleMouseDown = (e: React.MouseEvent) => {
        if (isDrawerOpen) return;
        
        setDropMenu(null); setContextMenu(null); stopMomentum();
        
        if (e.button === 1 || isSpacePressed) {
            e.preventDefault();
            dragRef.current = { 
                isDragging: true, 
                startX: e.clientX, startY: e.clientY, 
                currentX: e.clientX, currentY: e.clientY, 
                mode: 'pan', 
                initialPositions: new Map(),
                parentGroups: new Set(),
                affectedConnections: []
            };
            lastMoveTimeRef.current = performance.now();
            lastPosRef.current = { x: e.clientX, y: e.clientY };
            velocityRef.current = { x: 0, y: 0 };
            document.body.style.cursor = 'grabbing';
            return;
        }

        if (e.button === 0) {
            // Clicked empty space
            if (!e.shiftKey && !e.ctrlKey && !e.metaKey) { 
                clearSelection(); 
            }
            dragRef.current = { 
                isDragging: true, 
                startX: e.clientX, startY: e.clientY, 
                currentX: e.clientX, currentY: e.clientY, 
                mode: 'rubber-band', 
                initialPositions: new Map(),
                parentGroups: new Set(),
                affectedConnections: []
            };
        }
    };

    const handleNodeMouseDown = (e: React.MouseEvent, id: string, forceDeep = false) => {
        e.stopPropagation(); 
        setDropMenu(null); stopMomentum();
        
        if (isSpacePressed) { 
            handleMouseDown(e); 
            return; 
        }

        if (e.button === 0) {
            const isMultiSelect = e.shiftKey || e.metaKey || e.ctrlKey;
            const isAlreadySelected = selectedIds.has(id);
            
            if (isMultiSelect) { 
                selectElement(id, true, forceDeep); 
            } else { 
                if (!isAlreadySelected) { 
                    selectElement(id, false, forceDeep); 
                } else { 
                    dragRef.current.pendingSelectionId = id; 
                } 
            }
            
            dragRef.current = { 
                isDragging: true, 
                startX: e.clientX, startY: e.clientY, 
                currentX: e.clientX, currentY: e.clientY, 
                mode: 'move-node', 
                initialPositions: new Map(), 
                pendingSelectionId: !isMultiSelect && isAlreadySelected ? id : null,
                parentGroups: new Set(),
                affectedConnections: []
            };
        }
    };
    
    const handleNodeContextMenu = (e: React.MouseEvent, id: string) => {
        e.preventDefault(); e.stopPropagation();
        if (!selectedIds.has(id)) { selectElement(id, false, false); }
        setContextMenu({ x: e.clientX, y: e.clientY, targetId: id });
    };

    const handleNodeAltClick = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        const element = elements.find(el => el.id === id);
        if (element && (element.type === 'image' || element.type === 'video')) {
            // Ensure the element is selected
            if (!selectedIds.has(id)) {
                selectElement(id, false, false);
            }
            setDrawerElement(element);
            setIsDrawerOpen(true);
        }
    };

    const handlePortMouseDown = (e: React.MouseEvent, nodeId: string, type: 'in' | 'out') => {
        e.stopPropagation(); e.preventDefault(); setDropMenu(null);
        const element = elements.find(el => el.id === nodeId);
        if (!element) return;
        const worldMouse = screenToWorld(e.clientX, e.clientY);
        setConnectionDraft({ 
            sourceId: nodeId, 
            sourceRect: { x: element.x, y: element.y, w: element.width, h: element.height }, 
            portType: type, 
            currentX: worldMouse.x, 
            currentY: worldMouse.y 
        });
    };

    // Global Mouse Move
    useEffect(() => {
        const handleWindowMouseMove = (e: MouseEvent) => {
            dragRef.current.currentX = e.clientX;
            dragRef.current.currentY = e.clientY;
            
            if (connectionDraftRef.current) {
                const worldPos = screenToWorld(e.clientX, e.clientY);
                setConnectionDraft(prev => (prev ? { ...prev, currentX: worldPos.x, currentY: worldPos.y } : prev));
                return;
            }

            if (!dragRef.current.isDragging) return;

            const dx = e.clientX - dragRef.current.startX;
            const dy = e.clientY - dragRef.current.startY;
            
            if (Math.abs(dx) < 3 && Math.abs(dy) < 3 && dragRef.current.mode !== 'pan') return;
            
            // Drag Confirmed
            if (dragRef.current.pendingSelectionId) { 
                dragRef.current.pendingSelectionId = null; 
            }

            if (dragRef.current.mode === 'pan') {
                const now = performance.now();
                const dt = now - lastMoveTimeRef.current;
                const vDx = e.clientX - lastPosRef.current.x;
                const vDy = e.clientY - lastPosRef.current.y;
                
                const current = useCanvasStore.getState().viewport;
                setViewport({ x: current.x + vDx, y: current.y + vDy });
                
                if (dt > 10) { 
                    velocityRef.current = { x: vDx, y: vDy }; 
                    lastMoveTimeRef.current = now; 
                    lastPosRef.current = { x: e.clientX, y: e.clientY }; 
                }
                dragRef.current.startX = e.clientX;
                dragRef.current.startY = e.clientY;
            } 
            else if (dragRef.current.mode === 'rubber-band') {
                const startWorld = screenToWorld(dragRef.current.startX, dragRef.current.startY);
                const currentWorld = screenToWorld(e.clientX, e.clientY);
                setMarquee({ startX: startWorld.x, startY: startWorld.y, currentX: currentWorld.x, currentY: currentWorld.y });
            }
            else if (dragRef.current.mode === 'move-node') {
                if (dragRef.current.initialPositions.size === 0) {
                    const state = useCanvasStore.getState();
                    const initialized = initializeMoveSession(state.elements, state.selectedIds);
                    dragRef.current.initialPositions = initialized.initialPositions;
                    dragRef.current.parentGroups = initialized.parentGroups;
                    dragRef.current.affectedConnections = initialized.affectedConnections;
                }

                const state = useCanvasStore.getState();
                const moveDelta = computeMoveDeltaWithSnap({
                    pointerDelta: { x: dx, y: dy },
                    viewport: viewportRef.current,
                    viewportSize: { width: viewportWidth, height: viewportHeight },
                    selectedCount: state.selectedIds.size,
                    initialPositions: dragRef.current.initialPositions,
                    queryElementsInRect: (rect) => spatialIndexRef.current.query(rect) as CanvasElement[]
                });
                const { worldDx, worldDy, snapLines: nextSnapLines } = moveDelta;
                setSnapLines(nextSnapLines);
                
                dragRef.current.initialPositions.forEach((startPos, id) => {
                    const domNode = nodeRefs.current.get(id);
                    if (domNode) domNode.style.transform = `translate3d(${worldDx}px, ${worldDy}px, 0) scale(1)`; 
                    const groupNode = groupRefs.current.get(id);
                    if (groupNode) groupNode.style.transform = `translate3d(${worldDx}px, ${worldDy}px, 0)`;
                });
                
                const groupPreviewBounds = computeGroupPreviewBounds(
                    state.elements,
                    dragRef.current.parentGroups,
                    dragRef.current.initialPositions,
                    worldDx,
                    worldDy
                );
                groupPreviewBounds.forEach((bounds, groupId) => {
                    const groupDom = groupRefs.current.get(groupId);
                    if (!groupDom) return;
                    groupDom.style.transform = 'translate3d(0,0,0)';
                    groupDom.style.left = `${bounds.x}px`;
                    groupDom.style.top = `${bounds.y}px`;
                    groupDom.style.width = `${bounds.width}px`;
                    groupDom.style.height = `${bounds.height}px`;
                });

                const connectionPreviewPaths = computeConnectionPreviewPaths(
                    dragRef.current.affectedConnections,
                    worldDx,
                    worldDy
                );
                connectionPreviewPaths.forEach((preview) => {
                    const pathEl = connectionRefs.current.get(preview.id);
                    if (!pathEl) return;
                    pathEl.setAttribute('d', preview.path);
                });
            }
        };

        const handleWindowMouseUp = (e: MouseEvent) => {
            setSnapLines([]); 
            setHighlightedGroup(null); 
            
            const currentDraft = connectionDraftRef.current;
            if (currentDraft) {
                const target = document.elementFromPoint(e.clientX, e.clientY);
                const nodeEl = target?.closest('[data-node-id]');
                if (nodeEl) {
                    const targetNodeId = nodeEl.getAttribute('data-node-id');
                    if (targetNodeId && targetNodeId !== currentDraft.sourceId) {
                        const fromId = currentDraft.portType === 'out' ? currentDraft.sourceId : targetNodeId;
                        const toId = currentDraft.portType === 'in' ? currentDraft.sourceId : targetNodeId;
                        addConnection(fromId, toId);
                    }
                } else {
                    const worldPos = screenToWorld(e.clientX, e.clientY);
                    const mouseRect = { x: worldPos.x - 10, y: worldPos.y - 10, w: 20, h: 20 };
                    const draftLine = { x1: currentDraft.sourceRect.x, y1: currentDraft.sourceRect.y, w1: currentDraft.sourceRect.w, h1: currentDraft.sourceRect.h, x2: mouseRect.x, y2: mouseRect.y };
                    setDropMenu({ x: e.clientX, y: e.clientY, sourceId: currentDraft.sourceId, portType: currentDraft.portType, worldX: worldPos.x, worldY: worldPos.y, draftLine });
                }
                setConnectionDraft(null);
            }

            if (dragRef.current.isDragging) {
                if (dragRef.current.mode === 'pan') {
                    const now = performance.now();
                    if (now - lastMoveTimeRef.current < 50) startMomentum();
                }

                if (dragRef.current.mode === 'move-node') {
                     if (dragRef.current.pendingSelectionId) {
                         selectElement(dragRef.current.pendingSelectionId, false);
                     } else {
                         const dx = e.clientX - dragRef.current.startX;
                         const dy = e.clientY - dragRef.current.startY;
                         const state = useCanvasStore.getState();
                         const moveDelta = computeMoveDeltaWithSnap({
                             pointerDelta: { x: dx, y: dy },
                             viewport: viewportRef.current,
                             viewportSize: { width: viewportWidth, height: viewportHeight },
                             selectedCount: state.selectedIds.size,
                             initialPositions: dragRef.current.initialPositions,
                             queryElementsInRect: (rect) => spatialIndexRef.current.query(rect) as CanvasElement[]
                         });

                         const updates = buildMoveCommitUpdates(
                             dragRef.current.initialPositions,
                             moveDelta.worldDx,
                             moveDelta.worldDy
                         );
                         const hasChanges = hasMoveCommitChanges(dragRef.current.initialPositions, updates);
                         if (hasChanges) {
                             dragRef.current.initialPositions.forEach((_startPos, id) => {
                                 const domNode = nodeRefs.current.get(id);
                                 if (domNode) domNode.style.transform = 'translate3d(0,0,0) scale(1)';
                                 const groupNode = groupRefs.current.get(id);
                                 if (groupNode) groupNode.style.transform = 'translate3d(0,0,0)';
                             });
                             const parentGroupIds = Array.from(dragRef.current.parentGroups);
                             updateElementsPosition(updates, true, parentGroupIds);
                         } else {
                             resetMovePreviewStyles(state.elements);
                         }
                     }
                }
                
                const currentMarquee = marqueeRef.current;
                if (dragRef.current.mode === 'rubber-band' && currentMarquee) {
                    const x = Math.min(currentMarquee.startX, currentMarquee.currentX);
                    const y = Math.min(currentMarquee.startY, currentMarquee.currentY);
                    const width = Math.abs(currentMarquee.currentX - currentMarquee.startX);
                    const height = Math.abs(currentMarquee.currentY - currentMarquee.startY);
                    
                    const hitElements = spatialIndexRef.current.query({ x, y, width, height });
                    const hitIds: string[] = [];
                    hitElements.forEach(el => {
                        if (el.x < x + width && el.x + el.width > x && el.y < y + height && el.y + el.height > y && el.type !== 'connector') {
                            hitIds.push(el.id);
                        }
                    });
                    
                    if (hitIds.length > 0) {
                        if (e.shiftKey) { setSelectedIds(Array.from(new Set([...Array.from(selectedIdsRef.current), ...hitIds]))); } 
                        else { setSelectedIds(hitIds); }
                    } else if (!e.shiftKey) { clearSelection(); }
                    setMarquee(null);
                }
                
                dragRef.current.isDragging = false;
                dragRef.current.mode = null;
                dragRef.current.initialPositions.clear();
                dragRef.current.pendingSelectionId = null;
                dragRef.current.parentGroups.clear();
                dragRef.current.affectedConnections = [];
                document.body.style.cursor = 'default';
            }
        };

        window.addEventListener('mousemove', handleWindowMouseMove);
        window.addEventListener('mouseup', handleWindowMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleWindowMouseMove);
            window.removeEventListener('mouseup', handleWindowMouseUp);
        };
    }, [viewportHeight, viewportWidth, updateElementsPosition, addConnection, screenToWorld, setSnapLines, setHighlightedGroup, startMomentum, selectElement, clearSelection, setSelectedIds, resetMovePreviewStyles]);

    const handleWheel = (e: React.WheelEvent) => {
        if (isDrawerOpen) return;
        
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const zoomSensitivity = 0.001;
            const delta = -e.deltaY * zoomSensitivity;
            const nextZoom = viewport.zoom + delta;
            
            const rect = e.currentTarget.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            setViewport(zoomViewportAroundPoint({
                viewport,
                nextZoom,
                screenPoint: { x: mouseX, y: mouseY }
            }));
        } else {
            e.preventDefault();
            setViewport({ x: viewport.x - e.deltaX, y: viewport.y - e.deltaY });
        }
    };

    const handleContextMenuAction = (action: string) => {
        if (!contextMenu) return;
        if (action === 'paste') pasteSelection();
        if (action === 'select-all') selectAll();
        if (action === 'reset-view') setViewport({ x: 0, y: 0, zoom: 1 });
        if (action === 'duplicate') duplicateSelected();
        if (action === 'delete') removeSelected();
        if (action === 'front') bringToFront();
        if (action === 'back') sendToBack();
        setContextMenu(null);
    };

    const handleMenuSelect = async (type: string) => {
        if (!dropMenu) return;
        let nodeWidth = 240; let nodeHeight = 240;
        if (type === 'image' || type === 'video') { nodeWidth = 512; nodeHeight = 288; } 
        else if (type === 'text') { nodeWidth = 300; nodeHeight = 100; } 
        else if (type === 'shape') { nodeWidth = 200; nodeHeight = 200; }

        let x = dropMenu.worldX - (nodeWidth / 2);
        let y = dropMenu.worldY - (nodeHeight / 2);

        if (dropMenu.sourceId && dropMenu.portType) {
            if (dropMenu.portType === 'out') { x = dropMenu.worldX; y = dropMenu.worldY - (nodeHeight / 2); } 
            else { x = dropMenu.worldX - nodeWidth; y = dropMenu.worldY - (nodeHeight / 2); }
        }

        const newElement = NodeFactory.create({ type: type as CanvasElementType, x, y });
        addElement(newElement);

        if (dropMenu.sourceId && dropMenu.portType) {
            const fromId = dropMenu.portType === 'out' ? dropMenu.sourceId : newElement.id;
            const toId = dropMenu.portType === 'in' ? dropMenu.sourceId : newElement.id;
            addConnection(fromId, toId);
        }
        setDropMenu(null);
    };

    return (
        <div 
            ref={containerRef}
            id="canvas-container"
            className="w-full h-full bg-[#09090b] overflow-hidden relative select-none group/canvas focus:outline-none"
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onContextMenu={(e) => { 
                e.preventDefault(); 
                if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('canvas-background')) { 
                    setContextMenu({ x: e.clientX, y: e.clientY, targetId: null }); 
                } 
            }}
            tabIndex={0}
            style={{ cursor: isSpacePressed ? 'grab' : 'default' }}
        >
            <CanvasBackground viewport={viewport} />

            <div 
                ref={worldLayerRef}
                className="absolute origin-top-left w-full h-full pointer-events-none transform-gpu z-10"
                style={{ transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})` }}
            >
                 <div className="absolute inset-0 pointer-events-none" style={{ zIndex: Z_LAYERS.GROUPS }}>
                    {visibleGroups.map(el => (
                        <CanvasGroupPanel 
                            key={el.id}
                            ref={(node) => { if (node) groupRefs.current.set(el.id, node); else groupRefs.current.delete(el.id); }}
                            element={el}
                            onMouseDown={handleNodeMouseDown}
                            onContextMenu={(e, id) => handleNodeContextMenu(e, id)}
                        />
                    ))}
                 </div>

                 <div className="absolute inset-0 pointer-events-none" style={{ zIndex: Z_LAYERS.CONNECTIONS }}>
                    <CanvasConnections connectionRefs={connectionRefs} viewportSize={{ width: viewportWidth, height: viewportHeight }} />
                 </div>
                 
                 {connectionDraft && (
                     <svg className="absolute top-0 left-0 overflow-visible pointer-events-none" style={{ width: '1px', height: '1px', zIndex: Z_LAYERS.OVERLAYS }}>
                        <path d={getSmartPath(connectionDraft.sourceRect.x, connectionDraft.sourceRect.y, connectionDraft.sourceRect.w, connectionDraft.sourceRect.h, connectionDraft.currentX - 5, connectionDraft.currentY - 5, 10, 10)} stroke="url(#gradient-line)" strokeWidth="3" fill="none" markerEnd="url(#arrowhead-active)" strokeDasharray="8,4" className="animate-flow" strokeLinecap="round" />
                     </svg>
                 )}
                 {dropMenu?.draftLine && (
                     <svg className="absolute top-0 left-0 overflow-visible pointer-events-none" style={{ width: '1px', height: '1px', zIndex: Z_LAYERS.OVERLAYS }}>
                        <path d={getSmartPath(dropMenu.draftLine.x1, dropMenu.draftLine.y1, dropMenu.draftLine.w1, dropMenu.draftLine.h1, dropMenu.draftLine.x2, dropMenu.draftLine.y2, 10, 10)} stroke="#60a5fa" strokeWidth="3" fill="none" markerEnd="url(#arrowhead-active)" strokeLinecap="round" className="opacity-50" />
                     </svg>
                 )}

                 <div className="absolute inset-0 pointer-events-none" style={{ zIndex: Z_LAYERS.NODES }}>
                    {visibleNodes.map((el, index) => {
                        const isInteracting = selectedIds.has(el.id);
                        const computedZ = isInteracting ? Z_LAYERS.ACTIVE_NODE + index : undefined;

                        return (
                            <CanvasNode 
                                key={el.id}
                                ref={(node) => { if (node) nodeRefs.current.set(el.id, node); else nodeRefs.current.delete(el.id); }}
                                element={el}
                                onMouseDown={handleNodeMouseDown}
                                onOpenDrawer={handleNodeAltClick}
                                onConnectStart={handlePortMouseDown}
                                onContextMenu={(e, id) => handleNodeContextMenu(e, id)}
                                zIndex={computedZ}
                                lod={currentLOD} 
                            />
                        );
                    })}
                 </div>
                 
                 <div className="absolute inset-0 pointer-events-none" style={{ zIndex: Z_LAYERS.OVERLAYS }}>
                     {snapLines.map((line, idx) => (
                         <div key={idx} className="absolute bg-[#ec4899] shadow-[0_0_8px_rgba(236,72,153,0.8)] transition-opacity duration-75" style={{ left: line.type === 'vertical' ? line.position : line.start, top: line.type === 'horizontal' ? line.position : line.start, width: line.type === 'vertical' ? '1px' : (line.end - line.start), height: line.type === 'horizontal' ? '1px' : (line.end - line.start) }} />
                     ))}
                     {marquee && (
                         <div className="absolute bg-blue-500/10 border border-blue-500/50" style={{ left: Math.min(marquee.startX, marquee.currentX), top: Math.min(marquee.startY, marquee.currentY), width: Math.abs(marquee.currentX - marquee.startX), height: Math.abs(marquee.currentY - marquee.startY) }} />
                     )}
                     <SelectionOverlay bounds={selectionBounds} zoom={viewport.zoom} />
                 </div>
            </div>
            
            {elements.length === 0 && <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: Z_LAYERS.UI }}><CanvasEmptyState /></div>}
            {dropMenu && <CanvasDropMenu x={dropMenu.x} y={dropMenu.y} onClose={() => setDropMenu(null)} onSelect={handleMenuSelect} />}
            {contextMenu && <CanvasContextMenu x={contextMenu.x} y={contextMenu.y} targetId={contextMenu.targetId} onClose={() => setContextMenu(null)} onAction={handleContextMenuAction} />}
            {selectedIds.size > 1 && !selectionBounds && <div style={{ zIndex: Z_LAYERS.UI }}><CanvasAlignmentToolbar /></div>}
            
            <CanvasMinimap viewportSize={{ width: viewportWidth, height: viewportHeight }} />

            <CanvasZoomControls />

            <CanvasDrawer 
                element={drawerElement}
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                onUpdateElement={updateElement}
            />
        </div>
    );
};
