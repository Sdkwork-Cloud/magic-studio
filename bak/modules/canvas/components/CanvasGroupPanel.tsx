
import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { CanvasElement } from '../entities/canvas.entity';
import { Folder, FolderOpen } from 'lucide-react';
import { ElementToolbar } from './ElementToolbar'; // This now uses the new service
import { useCanvasStore } from '../store/canvasStore';
import { Z_LAYERS } from './CanvasBoard'; 

interface CanvasGroupPanelProps {
    element: CanvasElement;
    onMouseDown: (e: React.MouseEvent, nodeId: string, forceDeep?: boolean) => void;
    onContextMenu: (e: React.MouseEvent, nodeId: string) => void;
}

export const CanvasGroupPanel = React.memo(forwardRef<HTMLDivElement, CanvasGroupPanelProps>(({ 
    element, onMouseDown, onContextMenu
}, ref) => {
    const { id, type, x, y, width, height, data, selected } = element;
    const internalRef = useRef<HTMLDivElement>(null);
    
    // Expose the internal div to the parent via the forwarded ref
    useImperativeHandle(ref, () => internalRef.current!);

    // Zustand Hooks
    const updateElement = useCanvasStore(s => s.updateElement);
    const viewport = useCanvasStore(s => s.viewport);
    const highlightedGroupId = useCanvasStore(s => s.highlightedGroupId);
    
    const isHighlighted = highlightedGroupId === id;
    const isMedia = type === 'image' || type === 'video';

    const [isResizing, setIsResizing] = useState(false);
    const [resizeHandle, setResizeHandle] = useState<string | null>(null);
    const [isEditingLabel, setIsEditingLabel] = useState(false);
    
    const resizeStartRef = useRef<{ x: number, y: number, w: number, h: number, mouseX: number, mouseY: number, ratio: number } | null>(null);
    const labelInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEditingLabel && labelInputRef.current) {
            labelInputRef.current.focus();
            labelInputRef.current.select();
        }
    }, [isEditingLabel]);

    const handleLabelCommit = () => {
        setIsEditingLabel(false);
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
            
            updateElement(id, { x: newX, y: newY, width: newW, height: newH }, false);
        };

        const handleGlobalMouseUp = () => {
            setIsResizing(false);
            setResizeHandle(null);
            resizeStartRef.current = null;
            document.body.style.cursor = 'default';
            updateElement(id, {}, true); // Commit history
        };

        window.addEventListener('mousemove', handleGlobalMouseMove);
        window.addEventListener('mouseup', handleGlobalMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleGlobalMouseMove);
            window.removeEventListener('mouseup', handleGlobalMouseUp);
        };
    }, [isResizing, resizeHandle, id, updateElement, viewport.zoom, isMedia]);

    const handleResizeStart = (e: React.MouseEvent, handle: string) => {
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
        
        let cursor = 'default';
        if (handle === 'nw' || handle === 'se') cursor = 'nwse-resize';
        else if (handle === 'ne' || handle === 'sw') cursor = 'nesw-resize';
        else if (handle === 'n' || handle === 's') cursor = 'ns-resize';
        else if (handle === 'w' || handle === 'e') cursor = 'ew-resize';
        
        document.body.style.cursor = cursor;
    };
    
    const handleDragStart = (e: React.MouseEvent) => {
        if (!isEditingLabel) {
            onMouseDown(e, id, false);
        }
    };

    const computedZIndex = Z_LAYERS.GROUPS;

    const ResizeHandle = ({ h }: { h: string }) => {
        let posClass = '';
        let cursorClass = '';
        
        switch (h) {
            case 'nw': posClass = '-top-1.5 -left-1.5'; cursorClass = 'cursor-nwse-resize'; break;
            case 'n':  posClass = '-top-1.5 left-1/2 -ml-1.5'; cursorClass = 'cursor-ns-resize'; break;
            case 'ne': posClass = '-top-1.5 -right-1.5'; cursorClass = 'cursor-nesw-resize'; break;
            case 'e':  posClass = 'top-1/2 -mt-1.5 -right-1.5'; cursorClass = 'cursor-ew-resize'; break;
            case 'se': posClass = '-bottom-1.5 -right-1.5'; cursorClass = 'cursor-nwse-resize'; break;
            case 's':  posClass = '-bottom-1.5 left-1/2 -ml-1.5'; cursorClass = 'cursor-ns-resize'; break;
            case 'sw': posClass = '-bottom-1.5 -left-1.5'; cursorClass = 'cursor-nesw-resize'; break;
            case 'w':  posClass = 'top-1/2 -mt-1.5 -left-1.5'; cursorClass = 'cursor-ew-resize'; break;
        }

        return (
            <div 
                className={`absolute w-3 h-3 bg-white border border-blue-500 rounded-sm z-50 flex items-center justify-center pointer-events-auto hover:scale-125 transition-transform ${posClass} ${cursorClass}`}
                onMouseDown={(e) => handleResizeStart(e, h)} 
            />
        );
    };

    return (
        <div
            ref={internalRef}
            className="absolute select-none group/group pointer-events-auto will-change-transform"
            style={{ 
                left: x, top: y, width, height, 
                zIndex: computedZIndex,
                transform: 'translate3d(0,0,0)' 
            }}
            onContextMenu={(e) => onContextMenu(e, id)}
            data-node-id={id}
            data-group-id={id}
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
                            onDoubleClick={(e) => { e.stopPropagation(); setIsEditingLabel(true); }}
                            onMouseDown={(e) => e.stopPropagation()} 
                        >
                            {selected ? <FolderOpen size={16} /> : <Folder size={16} />}
                            
                            {isEditingLabel ? (
                                <input 
                                    ref={labelInputRef}
                                    className="bg-[#18181b] border border-blue-500 rounded px-1 outline-none text-xs font-bold text-white min-w-[60px] w-auto max-w-[200px]"
                                    value={data?.label || 'Group'}
                                    onChange={(e) => updateElement(id, { data: { ...data, label: e.target.value } }, false)}
                                    onBlur={handleLabelCommit}
                                    onKeyDown={(e) => e.key === 'Enter' && handleLabelCommit()}
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
                        <ResizeHandle h="nw" />
                        <ResizeHandle h="n" />
                        <ResizeHandle h="ne" />
                        <ResizeHandle h="e" />
                        <ResizeHandle h="se" />
                        <ResizeHandle h="s" />
                        <ResizeHandle h="sw" />
                        <ResizeHandle h="w" />
                    </>
                )}
            </div>
        </div>
    );
}));
