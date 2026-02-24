
import React, { useRef, useState, useEffect } from 'react';
import { CutClipTransform } from '../../entities/magicCut.entity';
import { usePlayerContext } from './UniversalPlayer';

interface TransformOverlayProps {
    transform: CutClipTransform;
    isSelected: boolean;
    onUpdateTransform: (transform: Partial<CutClipTransform>, isFinal: boolean) => void;
    onInteractionStart?: () => void;
    onInteractionEnd?: () => void;
    children?: React.ReactNode; // New: Content Proxy
}

type HandleType = 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'w' | 'e';
type InteractionMode = 'move' | 'rotate' | 'resize' | null;

const toRad = (deg: number) => (deg * Math.PI) / 180;

export const TransformOverlay: React.FC<TransformOverlayProps> = ({ 
    transform, isSelected, onUpdateTransform, onInteractionStart, onInteractionEnd, children
}) => {
    const { scale, projectResolution } = usePlayerContext();
    const containerWidth = projectResolution.width;
    const containerHeight = projectResolution.height;

    const [isDragging, setIsDragging] = useState(false);
    const [activeHandle, setActiveHandle] = useState<HandleType | null>(null);
    const [interactionMode, setInteractionMode] = useState<InteractionMode>(null);
    
    const [infoTooltip, setInfoTooltip] = useState<string | null>(null);
    const overlayRef = useRef<HTMLDivElement>(null);

    // Initial state snapshot for delta calculations
    const startState = useRef<{
        screenMouseX: number;
        screenMouseY: number;
        x: number; y: number; w: number; h: number; rotation: number;
        cx: number; cy: number;
    } | null>(null);

    const { x, y, width: w, height: h, rotation } = transform;

    const handleMouseDown = (e: React.MouseEvent, mode: InteractionMode, handle: HandleType | null = null) => {
        if (e.button !== 0) return; 
        e.preventDefault(); e.stopPropagation();
        
        setIsDragging(true);
        setInteractionMode(mode);
        setActiveHandle(handle);

        if (onInteractionStart) onInteractionStart();

        const cx = x + w / 2;
        const cy = y + h / 2;

        startState.current = {
            screenMouseX: e.clientX,
            screenMouseY: e.clientY,
            x, y, w, h, rotation,
            cx, cy
        };
        
        document.body.style.userSelect = 'none';
        document.body.style.cursor = mode === 'move' ? 'grabbing' : 'crosshair';
    };

    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e: MouseEvent) => {
            if (!startState.current) return;
            e.preventDefault();

            const start = startState.current;
            const screenDx = e.clientX - start.screenMouseX;
            const screenDy = e.clientY - start.screenMouseY;
            const dx = screenDx / scale;
            const dy = screenDy / scale;

            const isShiftDown = e.shiftKey; 
            const isAltDown = e.altKey;

            if (interactionMode === 'move') {
                const newX = start.x + dx;
                const newY = start.y + dy;
                onUpdateTransform({ x: Math.round(newX), y: Math.round(newY) }, false);
                setInfoTooltip(`X: ${Math.round(newX)} Y: ${Math.round(newY)}`);
            } 
            else if (interactionMode === 'resize' && activeHandle) {
                const rad = toRad(start.rotation);
                const cos = Math.cos(-rad); 
                const sin = Math.sin(-rad);
                
                const localDx = dx * cos - dy * sin;
                const localDy = dx * sin + dy * cos;

                let deltaW = 0; let deltaH = 0; let deltaX = 0; let deltaY = 0;

                if (activeHandle.includes('e')) { deltaW = localDx; }
                if (activeHandle.includes('w')) { deltaW = -localDx; deltaX = localDx; }
                if (activeHandle.includes('s')) { deltaH = localDy; }
                if (activeHandle.includes('n')) { deltaH = -localDy; deltaY = localDy; }

                if (isShiftDown) {
                    const ratio = start.w / start.h;
                    if (activeHandle.match(/^(n|s)$/)) {
                        deltaW = deltaH * ratio;
                        if (activeHandle === 'nw' || activeHandle === 'sw') deltaX = -deltaW; 
                        else deltaX = -deltaW / 2;
                    } else {
                        deltaH = deltaW / ratio;
                        if (activeHandle === 'nw' || activeHandle === 'ne') deltaY = -deltaH;
                    }
                }

                const MIN_SIZE = 10;
                const newW = Math.max(MIN_SIZE, start.w + deltaW);
                const newH = Math.max(MIN_SIZE, start.h + deltaH);

                let changeX = 0; let changeY = 0; let changeW = 0; let changeH = 0;
                
                if (activeHandle.includes('e')) changeW = localDx;
                if (activeHandle.includes('w')) { changeW = -localDx; changeX = localDx; }
                if (activeHandle.includes('s')) changeH = localDy;
                if (activeHandle.includes('n')) { changeH = -localDy; changeY = localDy; }

                if (start.w + changeW < MIN_SIZE) {
                    changeW = MIN_SIZE - start.w;
                    if (activeHandle.includes('w')) changeX = -changeW;
                }
                if (start.h + changeH < MIN_SIZE) {
                    changeH = MIN_SIZE - start.h;
                    if (activeHandle.includes('n')) changeY = -changeH;
                }

                if (isAltDown) {
                    changeX = -changeW; changeY = -changeH; changeW *= 2; changeH *= 2;
                }

                const finalW = start.w + changeW;
                const finalH = start.h + changeH;
                
                const radB = toRad(start.rotation);
                const worldShift = {
                    x: changeX * Math.cos(radB) - changeY * Math.sin(radB),
                    y: changeX * Math.sin(radB) + changeY * Math.cos(radB)
                };
                
                const finalX = start.x + worldShift.x;
                const finalY = start.y + worldShift.y;

                onUpdateTransform({
                    x: Math.round(finalX),
                    y: Math.round(finalY),
                    width: Math.round(finalW),
                    height: Math.round(finalH),
                    scale: 1 
                }, false);
                
                setInfoTooltip(`${Math.round(finalW)} x ${Math.round(finalH)}`);
            }
        };

        const handleMouseUp = (e: MouseEvent) => {
            e.stopPropagation();
            if (isDragging) {
                 onUpdateTransform({}, true);
                 if (onInteractionEnd) onInteractionEnd();
            }
            setIsDragging(false);
            setInteractionMode(null);
            setActiveHandle(null);
            startState.current = null;
            setInfoTooltip(null);
            document.body.style.userSelect = 'auto';
            document.body.style.cursor = 'default';
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, interactionMode, activeHandle, scale, onUpdateTransform, containerWidth, containerHeight, onInteractionEnd]);

    if (!isSelected) return null;

    const cssX = x * scale;
    const cssY = y * scale;
    const cssW = w * scale;
    const cssH = h * scale;

    return (
        <div 
            ref={overlayRef}
            className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-visible"
        >
            <div 
                className="absolute pointer-events-auto box-border group"
                style={{
                    left: cssX,
                    top: cssY,
                    width: cssW,
                    height: cssH,
                    transform: `rotate(${rotation}deg)`,
                    transformOrigin: '50% 50%',
                    cursor: interactionMode === 'move' ? 'grabbing' : 'move',
                    outline: '2px solid #3b82f6', 
                    boxShadow: '0 0 15px rgba(59, 130, 246, 0.3)' 
                }}
                onMouseDown={(e) => handleMouseDown(e, 'move')}
            >
                {/* Proxy Content (if provided) */}
                {children && (
                    <div className="w-full h-full absolute inset-0 overflow-hidden pointer-events-none">
                        {children}
                    </div>
                )}

                {infoTooltip && (
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs px-2 py-1 rounded shadow-lg pointer-events-none whitespace-nowrap z-50 font-mono">
                        {infoTooltip}
                    </div>
                )}
                
                {['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se'].map((h) => (
                     <div key={h} className={`absolute w-3 h-3 bg-white border border-blue-500 rounded-full z-10 
                         ${h === 'nw' ? '-top-1.5 -left-1.5 cursor-nw-resize' : ''}
                         ${h === 'n' ? '-top-1.5 left-1/2 -ml-1.5 cursor-n-resize' : ''}
                         ${h === 'ne' ? '-top-1.5 -right-1.5 cursor-ne-resize' : ''}
                         ${h === 'w' ? 'top-1/2 -mt-1.5 -left-1.5 cursor-w-resize' : ''}
                         ${h === 'e' ? 'top-1/2 -mt-1.5 -right-1.5 cursor-e-resize' : ''}
                         ${h === 'sw' ? '-bottom-1.5 -left-1.5 cursor-sw-resize' : ''}
                         ${h === 's' ? '-bottom-1.5 left-1/2 -ml-1.5 cursor-s-resize' : ''}
                         ${h === 'se' ? '-bottom-1.5 -right-1.5 cursor-se-resize' : ''}
                     `}
                     onMouseDown={(e) => handleMouseDown(e, 'resize', h as HandleType)}
                     />
                ))}
            </div>
        </div>
    );
};
