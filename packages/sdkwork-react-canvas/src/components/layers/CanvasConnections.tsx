
import React, { useMemo } from 'react';
import { useCanvasStore } from '../../store/canvasStore';
;
import { CanvasElement } from '../../entities/canvas.entity';
import { getSmartPath } from '../../utils/smartPath';

interface CanvasConnectionsProps {
    connectionRefs: React.MutableRefObject<Map<string, SVGPathElement>>;
}

export const CanvasConnections: React.FC<CanvasConnectionsProps> = React.memo(({ connectionRefs }) => {
    const elements = useCanvasStore(s => s.elements);
    const selectedIds = useCanvasStore(s => s.selectedIds);
    const selectElement = useCanvasStore(s => s.selectElement);
    const viewport = useCanvasStore(s => s.viewport);
    
    // Viewport Culling Logic
    const connections = useMemo(() => {
        const visibleX = -viewport.x / viewport.zoom;
        const visibleY = -viewport.y / viewport.zoom;
        const visibleW = window.innerWidth / viewport.zoom;
        const visibleH = window.innerHeight / viewport.zoom;
        
        const BUFFER = 1000;
        const vMinX = visibleX - BUFFER;
        const vMinY = visibleY - BUFFER;
        const vMaxX = visibleX + visibleW + BUFFER;
        const vMaxY = visibleY + visibleH + BUFFER;

        const elementMap = new Map<string, CanvasElement>();
        const connectors: CanvasElement[] = [];

        for (const el of elements) {
            if (el.type === 'connector') {
                connectors.push(el);
            } else {
                elementMap.set(el.id, el);
            }
        }
        
        const results: {
            id: string, 
            x1: number, y1: number, w1: number, h1: number, 
            x2: number, y2: number, w2: number, h2: number, 
            selected: boolean
        }[] = [];
        
        for (const conn of connectors) {
            const from = conn.data?.connection?.from;
            const to = conn.data?.connection?.to;
            
            if (from && to) {
                const source = elementMap.get(from);
                const target = elementMap.get(to);
                
                if (source && target) {
                    const minX = Math.min(source.x, target.x);
                    const minY = Math.min(source.y, target.y);
                    const maxX = Math.max(source.x + source.width, target.x + target.width);
                    const maxY = Math.max(source.y + source.height, target.y + target.height);
                    
                    if (maxX > vMinX && minX < vMaxX && maxY > vMinY && minY < vMaxY) {
                        results.push({
                            id: conn.id,
                            x1: source.x, y1: source.y, w1: source.width, h1: source.height,
                            x2: target.x, y2: target.y, w2: target.width, h2: target.height,
                            selected: selectedIds.has(conn.id)
                        });
                    }
                }
            }
        }
        return results;
    }, [elements, selectedIds, viewport]);

    const handleSelect = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        const multi = e.shiftKey || e.ctrlKey || e.metaKey;
        selectElement(id, multi);
    };

    return (
        <svg className="absolute top-0 left-0 overflow-visible pointer-events-auto" style={{ width: '1px', height: '1px' }}>
            <defs>
                <linearGradient id="gradient-line" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
                <marker id="arrowhead" markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto">
                    <circle cx="2" cy="2" r="1.5" fill="#52525b" />
                </marker>
                <marker id="arrowhead-active" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                     <path d="M0,0 L0,6 L6,3 z" fill="#3b82f6" />
                </marker>
                <marker id="arrowhead-selected" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                     <path d="M0,0 L0,6 L6,3 z" fill="#60a5fa" />
                </marker>
                <filter id="glow">
                    <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                    <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                </filter>
                <filter id="glow-strong">
                    <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                    <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                </filter>
            </defs>
            
            {connections.map((c) => {
                const d = getSmartPath(c.x1, c.y1, c.w1, c.h1, c.x2, c.y2, c.w2, c.h2);
                return (
                    <g key={c.id} onClick={(e) => handleSelect(e, c.id)} className="cursor-pointer group">
                        {/* Hit Area (Invisible wide stroke) */}
                        <path 
                            d={d}
                            stroke="transparent" 
                            strokeWidth="20" 
                            fill="none" 
                        />
                        
                        {/* Selection Glow Effect */}
                        {c.selected && (
                            <path 
                                d={d}
                                stroke="#3b82f6" 
                                strokeWidth="8" 
                                fill="none" 
                                strokeLinecap="round"
                                opacity="0.3"
                                filter="url(#glow-strong)"
                            />
                        )}
                        
                        {/* Visible Line */}
                        <path 
                            ref={el => { if(el) connectionRefs.current.set(c.id, el); else connectionRefs.current.delete(c.id); }}
                            d={d}
                            stroke={c.selected ? "#60a5fa" : "#52525b"} 
                            strokeWidth={c.selected ? "3" : "2"} 
                            fill="none" 
                            markerEnd={`url(#${c.selected ? 'arrowhead-selected' : 'arrowhead'})`}
                            className={`transition-all duration-200 ${c.selected ? 'filter url(#glow)' : 'group-hover:stroke-gray-400'}`}
                            strokeLinecap="round"
                        />
                        
                        {/* Selection indicator dots at endpoints */}
                        {c.selected && (
                            <>
                                <circle 
                                    cx={c.x1 + c.w1 / 2} 
                                    cy={c.y1 + c.h1 / 2} 
                                    r="4" 
                                    fill="#3b82f6" 
                                    stroke="#fff" 
                                    strokeWidth="1"
                                />
                                <circle 
                                    cx={c.x2 + c.w2 / 2} 
                                    cy={c.y2 + c.h2 / 2} 
                                    r="4" 
                                    fill="#3b82f6" 
                                    stroke="#fff" 
                                    strokeWidth="1"
                                />
                            </>
                        )}
                    </g>
                );
            })}
        </svg>
    );
});
