import { CanvasElement } from '../entities'
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Folder, FolderOpen } from 'lucide-react';
import { useCanvasStore } from '../store/canvasStore';
import { Z_LAYERS } from './CanvasBoard'; 
import { resolveCanvasEntityKey } from '../utils/canvasIdentity';

interface CanvasGroupPanelProps {
    element: CanvasElement;
    onMouseDown: (e: React.MouseEvent, nodeId: string, forceDeep?: boolean) => void;
    onContextMenu: (e: React.MouseEvent, nodeId: string) => void;
}

const setDocumentCursor = (cursor: string) => {
    document.body.style.cursor = cursor;
};

type ResizeHandleDirection = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

const RESIZE_HANDLES: ResizeHandleDirection[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];

const RESIZE_HANDLE_CLASSES: Record<ResizeHandleDirection, string> = {
    nw: '-top-1.5 -left-1.5 cursor-nwse-resize',
    n: '-top-1.5 left-1/2 -ml-1.5 cursor-ns-resize',
    ne: '-top-1.5 -right-1.5 cursor-nesw-resize',
    e: 'top-1/2 -mt-1.5 -right-1.5 cursor-ew-resize',
    se: '-bottom-1.5 -right-1.5 cursor-nwse-resize',
    s: '-bottom-1.5 left-1/2 -ml-1.5 cursor-ns-resize',
    sw: '-bottom-1.5 -left-1.5 cursor-nesw-resize',
    w: 'top-1/2 -mt-1.5 -left-1.5 cursor-ew-resize'
};

export const CanvasGroupPanel = React.memo(forwardRef<HTMLDivElement, CanvasGroupPanelProps>(({ 
    element, onMouseDown, onContextMenu
}, ref) => {
    const { type, x, y, width, height, data, selected } = element;
    const elementKey = resolveCanvasEntityKey(element);
    const internalRef = useRef<HTMLDivElement>(null);
    
    // Expose the internal div to the parent via the forwarded ref
    useImperativeHandle(ref, () => internalRef.current!);

    // Zustand Hooks
    const updateElement = useCanvasStore(s => s.updateElement);
    const viewport = useCanvasStore(s => s.viewport);
    const highlightedGroupId = useCanvasStore(s => s.highlightedGroupId);
    
    const isHighlighted = highlightedGroupId === elementKey;
    const isMedia = type === 'image' || type === 'video';

    const [isResizing, setIsResizing] = useState(false);
    const [resizeHandle, setResizeHandle] = useState<ResizeHandleDirection | null>(null);
    const [editingLabelValue, setEditingLabelValue] = useState<string | null>(null);
    const [previewRect, setPreviewRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
    
    const resizeStartRef = useRef<{ x: number, y: number, w: number, h: number, mouseX: number, mouseY: number, ratio: number } | null>(null);
    const previewRectRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null);
    const labelInputRef = useRef<HTMLInputElement>(null);
    const committedLabel = data?.label || 'Group';
    const isEditingLabel = editingLabelValue !== null;
    const draftLabel = editingLabelValue ?? committedLabel;
    const displayRect = isResizing && previewRect ? previewRect : { x, y, width, height };

    useEffect(() => {
        previewRectRef.current = previewRect;
    }, [previewRect]);

    useEffect(() => {
        if (isEditingLabel && labelInputRef.current) {
            labelInputRef.current.focus();
            labelInputRef.current.select();
        }
    }, [isEditingLabel]);

    const handleLabelCommit = () => {
        const nextLabel = draftLabel.trim() || 'Group';
        if (nextLabel !== committedLabel) {
            updateElement(elementKey, { data: { ...data, label: nextLabel } }, true);
        }
        setEditingLabelValue(null);
    };

    // Resizing Logic
    useEffect(() => {
        if (!isResizing || !resizeHandle) return;

        const handleGlobalMouseMove = (e: MouseEvent) => {
            if (!resizeStartRef.current) return;
            const start = resizeStartRef.current;
            
            // Calculate delta in Canvas Units (accounting for zoom)
            const dx = (e.clientX - start.mouseX) / viewport.zoom;
            const dy = (e.clientY - start.mouseY) / viewport.zoom;

            let newX = start.x;
            let newY = start.y;
            let newW = start.w;
            let newH = start.h;
            
            // Minimum size constraint
            const MIN_SIZE = 50;

            // Aspect Ratio Logic: Media defaults to LOCKED (shift to unlock). Others default to UNLOCKED (shift to lock).
            const shouldLockRatio = isMedia ? !e.shiftKey : e.shiftKey;
            
            if (shouldLockRatio) {
                // Constrained Resize logic
                if (resizeHandle.includes('e') || resizeHandle.includes('w')) {
                     // Width driver
                     let deltaW = dx;
                     if (resizeHandle.includes('w')) deltaW = -dx;
                     
                     newW = Math.max(MIN_SIZE, start.w + deltaW);
                     newH = newW / start.ratio;
                     
                     if (resizeHandle.includes('w')) newX = start.x + (start.w - newW);
                     if (resizeHandle.includes('n')) newY = start.y + (start.h - newH);
                     if (resizeHandle.includes('s')) { /* height grows down, nothing to adjust for y unless using center resize which we don't have here */ }
                } else {
                     // Height driver (n/s handles)
                     let deltaH = dy;
                     if (resizeHandle.includes('n')) deltaH = -dy;
                     
                     newH = Math.max(MIN_SIZE, start.h + deltaH);
                     newW = newH * start.ratio;
                     
                     if (resizeHandle.includes('n')) newY = start.y + (start.h - newH);
                     if (resizeHandle.includes('w')) newX = start.x + (start.w - newW); // Corner case logic handled below more generally?
                }
                
                // Correction for corners to keep anchor stable
                if (resizeHandle === 'nw') {
                    newY = start.y + (start.h - newH);
                    newX = start.x + (start.w - newW);
                } else if (resizeHandle === 'ne') {
                    newY = start.y + (start.h - newH);
                } else if (resizeHandle === 'sw') {
                    newX = start.x + (start.w - newW);
                }
                
            } else {
                // Free Resize
                if (resizeHandle.includes('e')) {
                    newW = Math.max(MIN_SIZE, start.w + dx);
                } else if (resizeHandle.includes('w')) {
                    const maxDelta = start.w - MIN_SIZE;
                    const clampedDx = Math.min(dx, maxDelta);
                    newX = start.x + clampedDx;
                    newW = start.w - clampedDx;
                }

                if (resizeHandle.includes('s')) {
                    newH = Math.max(MIN_SIZE, start.h + dy);
                } else if (resizeHandle.includes('n')) {
                    const maxDelta = start.h - MIN_SIZE;
                    const clampedDy = Math.min(dy, maxDelta);
                    newY = start.y + clampedDy;
                    newH = start.h - clampedDy;
                }
            }
            
            setPreviewRect({ x: newX, y: newY, width: newW, height: newH });
        };

        const handleGlobalMouseUp = () => {
            const nextRect = previewRectRef.current;
            setIsResizing(false);
            setResizeHandle(null);
            resizeStartRef.current = null;
            setDocumentCursor('default');
            if (
                nextRect &&
                (
                    nextRect.x !== x ||
                    nextRect.y !== y ||
                    nextRect.width !== width ||
                    nextRect.height !== height
                )
            ) {
                updateElement(elementKey, nextRect, true);
            }
            setPreviewRect(null);
        };

        window.addEventListener('mousemove', handleGlobalMouseMove);
        window.addEventListener('mouseup', handleGlobalMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleGlobalMouseMove);
            window.removeEventListener('mouseup', handleGlobalMouseUp);
        };
    }, [isResizing, resizeHandle, elementKey, updateElement, viewport.zoom, isMedia]);

    const handleResizeStart = (e: React.MouseEvent, handle: ResizeHandleDirection) => {
        e.stopPropagation();
        e.preventDefault();
        setIsResizing(true);
        setResizeHandle(handle);
        
        resizeStartRef.current = {
            x, y, w: width, h: height,
            mouseX: e.clientX,
            mouseY: e.clientY,
            ratio: width / height
        };
        setPreviewRect({ x, y, width, height });
        
        let cursor = 'default';
        if (handle === 'nw' || handle === 'se') cursor = 'nwse-resize';
        else if (handle === 'ne' || handle === 'sw') cursor = 'nesw-resize';
        else if (handle === 'n' || handle === 's') cursor = 'ns-resize';
        else if (handle === 'w' || handle === 'e') cursor = 'ew-resize';
        
        setDocumentCursor(cursor);
    };
    
    const handleDragStart = (e: React.MouseEvent) => {
        if (!isEditingLabel) {
            onMouseDown(e, elementKey, false);
        }
    };
    
    const computedZIndex = Z_LAYERS.GROUPS;

    return (
        <div
            ref={internalRef}
            className="absolute select-none group/group pointer-events-auto will-change-transform"
            style={{ 
                left: displayRect.x, top: displayRect.y, width: displayRect.width, height: displayRect.height, 
                zIndex: computedZIndex,
                transform: 'translate3d(0,0,0)' 
            }}
            onContextMenu={(e) => onContextMenu(e, elementKey)}
            data-node-id={elementKey}
            data-group-id={elementKey}
        >
            <div 
                className={`
                    absolute inset-0 flex flex-col pointer-events-auto
                    transition-colors duration-200
                    ${selected 
                        ? 'border-[1px] border-blue-500' // Thinner border for selected state
                        : (type === 'group' ? 'border-2 border-dashed border-gray-600/40 hover:border-gray-500/60 bg-gray-500/5 rounded-lg' : '') // Only groups show unselected border
                    }
                    ${isHighlighted 
                        ? 'ring-4 ring-blue-500/50 bg-blue-500/20 border-blue-400 border-solid rounded-lg' 
                        : ''
                    }
                `}
                onMouseDown={(e) => handleDragStart(e)}
            >
                {/* Header / Label Area (Only for Groups) */}
                {type === 'group' && (
                    <div 
                        className="absolute -top-8 left-0 flex items-center gap-2 group/label max-w-full z-10"
                        onMouseDown={(e) => {
                            e.stopPropagation(); 
                            handleDragStart(e);
                        }} 
                    >
                        <div 
                            className={`
                                inline-flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors cursor-grab active:cursor-grabbing
                                ${selected ? 'text-blue-400 font-bold' : 'text-gray-500 group-hover/group:text-gray-300 font-medium'}
                            `}
                            onDoubleClick={(e) => {
                                e.stopPropagation();
                                setEditingLabelValue(committedLabel);
                            }}
                            onMouseDown={(e) => e.stopPropagation()} 
                        >
                            {selected ? <FolderOpen size={16} /> : <Folder size={16} />}
                            
                            {isEditingLabel ? (
                                <input 
                                    ref={labelInputRef}
                                    className="bg-[#18181b] border border-blue-500 rounded px-1 outline-none text-xs font-bold text-white min-w-[60px] w-auto max-w-[200px]"
                                    value={draftLabel}
                                    onChange={(e) => setEditingLabelValue(e.target.value)}
                                    onBlur={handleLabelCommit}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleLabelCommit();
                                        if (e.key === 'Escape') {
                                            setEditingLabelValue(null);
                                        }
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    onMouseDown={(e) => e.stopPropagation()}
                                />
                            ) : (
                                <span className="text-xs truncate max-w-[150px] select-none">{data?.label || 'Group'}</span>
                            )}
                        </div>
                    </div>
                )}

                {/* Resize Handles */}
                {selected && (
                    <>
                        {RESIZE_HANDLES.map((handle) => (
                            <div
                                key={handle}
                                className={`absolute w-3 h-3 bg-white border border-blue-500 rounded-sm z-50 flex items-center justify-center pointer-events-auto hover:scale-125 transition-transform ${RESIZE_HANDLE_CLASSES[handle]}`}
                                onMouseDown={(e) => handleResizeStart(e, handle)}
                            />
                        ))}
                    </>
                )}
            </div>
        </div>
    );
}));
