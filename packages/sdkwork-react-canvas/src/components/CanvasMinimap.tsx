
import { CanvasElement } from '../entities/canvas.entity'
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useCanvasStore } from '../store/canvasStore'; 

// --- Smart Path Logic (Keep existing helpers) ---
type Point = { x: number; y: number };
type Rect = { x: number; y: number; w: number; h: number };
type Direction = 'n' | 's' | 'e' | 'w';

const getCenter = (r: Rect): Point => ({
    x: r.x + r.w / 2,
    y: r.y + r.h / 2
});

const getHandlePoint = (r: Rect, dir: Direction): Point => {
    switch (dir) {
        case 'n': return { x: r.x + r.w / 2, y: r.y };
        case 's': return { x: r.x + r.w / 2, y: r.y + r.h };
        case 'e': return { x: r.x + r.w, y: r.y + r.h / 2 };
        case 'w': return { x: r.x, y: r.y + r.h / 2 };
    }
};

const getBestDirections = (source: Rect, target: Rect): { startDir: Direction, endDir: Direction } => {
    const sC = getCenter(source);
    const tC = getCenter(target);
    const dx = tC.x - sC.x;
    const dy = tC.y - sC.y;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (absDx > absDy) {
        return {
            startDir: dx > 0 ? 'e' : 'w',
            endDir: dx > 0 ? 'w' : 'e'
        };
    } else {
        return {
            startDir: dy > 0 ? 's' : 'n',
            endDir: dy > 0 ? 'n' : 's'
        };
    }
};

const drawSmartConnection = (ctx: CanvasRenderingContext2D, source: Rect, target: Rect) => {
    const { startDir, endDir } = getBestDirections(source, target);
    const p1 = getHandlePoint(source, startDir);
    const p2 = getHandlePoint(target, endDir);

    const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    const controlDist = Math.max(dist * 0.5, 5);

    let cp1 = { ...p1 };
    let cp2 = { ...p2 };

    switch (startDir) {
        case 'n': cp1.y -= controlDist; break;
        case 's': cp1.y += controlDist; break;
        case 'e': cp1.x += controlDist; break;
        case 'w': cp1.x -= controlDist; break;
    }

    switch (endDir) {
        case 'n': cp2.y -= controlDist; break;
        case 's': cp2.y += controlDist; break;
        case 'e': cp2.x += controlDist; break;
        case 'w': cp2.x -= controlDist; break;
    }

    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, p2.x, p2.y);
    ctx.stroke();
};

// Professional "Wireframe / Hollow" Theme
const PRO_THEME = {
    bg: 'rgba(9, 9, 11, 0.6)',        
    border: 'rgba(255, 255, 255, 0.08)',
    
    nodeFill: 'rgba(0, 0, 0, 0.4)',
    nodeStrokeDefault: 'rgba(161, 161, 170, 0.5)',
    
    selectedStroke: '#ffffff',
    selectedFill: 'rgba(255, 255, 255, 0.1)',

    groupBorder: 'rgba(255, 255, 255, 0.3)',
    groupFill: 'rgba(255, 255, 255, 0.03)',

    connector: 'rgba(255, 255, 255, 0.4)', 
    
    viewportBorder: '#3b82f6', 
    viewportBg: 'rgba(59, 130, 246, 0.1)',
};

const getNodeColor = (type: string) => {
    switch (type) {
        case 'image':
        case 'video':
            return '#3b82f6'; // Blue
        case 'note':
            return '#eab308'; // Yellow
        case 'text':
            return '#a1a1aa'; // Zinc
        case 'shape':
            return '#22c55e'; // Green
        default:
            return PRO_THEME.nodeStrokeDefault;
    }
};

// --- Helper: Semantic Symbol Drawing ---
const drawSemanticContent = (ctx: CanvasRenderingContext2D, type: string, x: number, y: number, w: number, h: number) => {
    // Only draw details if the node is large enough
    if (w < 8 || h < 8) return;

    const cx = x + w / 2;
    const cy = y + h / 2;
    const size = Math.min(w, h) * 0.4;

    ctx.strokeStyle = getNodeColor(type);
    ctx.fillStyle = ctx.strokeStyle;
    ctx.lineWidth = 1;

    if (type === 'text' || type === 'note') {
        // Draw "Lines of text"
        const lineH = Math.max(1, h * 0.1);
        const gap = lineH * 1.5;
        const rows = 3;
        
        ctx.beginPath();
        for (let i = 0; i < rows; i++) {
            let lw = w * 0.7;
            if (i === rows - 1) lw = w * 0.4; // Last line shorter
            const ly = cy - (rows * gap)/2 + (i * gap);
            ctx.rect(cx - w*0.35, ly, lw, lineH);
        }
        ctx.fill();
    } 
    else if (type === 'image') {
        // Draw "Mountain" icon abstract
        ctx.beginPath();
        // Triangle 1
        ctx.moveTo(cx - size, cy + size/2);
        ctx.lineTo(cx - size/2, cy - size/2);
        ctx.lineTo(cx, cy + size/2);
        // Triangle 2
        ctx.lineTo(cx + size/2, cy - size/4);
        ctx.lineTo(cx + size, cy + size/2);
        ctx.closePath();
        ctx.stroke();
        // Sun
        ctx.beginPath();
        ctx.arc(cx + size/2, cy - size/2, size/4, 0, Math.PI * 2);
        ctx.stroke();
    }
    else if (type === 'video') {
        // Draw "Play" triangle
        ctx.beginPath();
        ctx.moveTo(cx - size/2, cy - size/2);
        ctx.lineTo(cx - size/2, cy + size/2);
        ctx.lineTo(cx + size/2, cy);
        ctx.closePath();
        ctx.fill();
    }
};

export const CanvasMinimap: React.FC = () => {
    const { elements, viewport, setViewport } = useCanvasStore();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    const WIDTH = 220; 
    const HEIGHT = 140;
    const _PADDING = 5000; 

    // Helper to calculate world bounds of all elements
    const getBounds = useCallback(() => {
        const viewX = -viewport.x / viewport.zoom;
        const viewY = -viewport.y / viewport.zoom;
        const viewW = window.innerWidth / viewport.zoom;
        const viewH = window.innerHeight / viewport.zoom;

        // Default bounds if empty
        let minX = viewX;
        let minY = viewY;
        let maxX = viewX + viewW;
        let maxY = viewY + viewH;

        if (elements.length > 0) {
            minX = Infinity; minY = Infinity; maxX = -Infinity; maxY = -Infinity;
            let hasNodes = false;
            
            elements.forEach(el => {
                if (el.type === 'connector') return;
                hasNodes = true;
                minX = Math.min(minX, el.x);
                minY = Math.min(minY, el.y);
                maxX = Math.max(maxX, el.x + el.width);
                maxY = Math.max(maxY, el.y + el.height);
            });
            
            if (!hasNodes) {
                 minX = viewX; minY = viewY; maxX = viewX + viewW; maxY = viewY + viewH;
            }
        }

        // Include viewport in bounds so the lens is always visible
        minX = Math.min(minX, viewX);
        minY = Math.min(minY, viewY);
        maxX = Math.max(maxX, viewX + viewW);
        maxY = Math.max(maxY, viewY + viewH);

        const totalW = maxX - minX;
        const totalH = maxY - minY;
        
        // Add 20% padding around the content
        const padW = Math.max(totalW * 0.2, 1000);
        const padH = Math.max(totalH * 0.2, 1000);

        return { 
            minX: minX - padW, 
            minY: minY - padH, 
            width: totalW + (padW * 2), 
            height: totalH + (padH * 2) 
        };
    }, [elements, viewport]);

    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const bounds = getBounds();
        
        const dpr = window.devicePixelRatio || 1;
        if (canvas.width !== WIDTH * dpr) {
            canvas.width = WIDTH * dpr;
            canvas.height = HEIGHT * dpr;
            ctx.scale(dpr, dpr);
            canvas.style.width = `${WIDTH}px`;
            canvas.style.height = `${HEIGHT}px`;
        }

        // 1. Background
        ctx.clearRect(0, 0, WIDTH, HEIGHT);
        ctx.fillStyle = PRO_THEME.bg;
        ctx.beginPath();
        ctx.roundRect(0, 0, WIDTH, HEIGHT, 8);
        ctx.fill();
        
        // Border
        ctx.strokeStyle = PRO_THEME.border;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Scale factors
        const scaleX = WIDTH / bounds.width;
        const scaleY = HEIGHT / bounds.height;
        const mapScale = Math.min(scaleX, scaleY);
        
        const offsetX = (WIDTH - bounds.width * mapScale) / 2;
        const offsetY = (HEIGHT - bounds.height * mapScale) / 2;

        const toMiniX = (val: number) => offsetX + (val - bounds.minX) * mapScale;
        const toMiniY = (val: number) => offsetY + (val - bounds.minY) * mapScale;

        // Data Separation
        const groups: CanvasElement[] = [];
        const connectors: CanvasElement[] = [];
        const nodes: CanvasElement[] = [];
        const elementMap = new Map<string, CanvasElement>();

        elements.forEach(el => {
            elementMap.set(el.id, el);
            if (el.type === 'group') groups.push(el);
            else if (el.type === 'connector') connectors.push(el);
            else nodes.push(el);
        });

        // Layer 1: Groups (Containers)
        ctx.setLineDash([3, 3]);
        ctx.lineWidth = 1;
        
        groups.forEach(el => {
            const x = toMiniX(el.x);
            const y = toMiniY(el.y);
            const w = el.width * mapScale;
            const h = el.height * mapScale;
            
            ctx.fillStyle = PRO_THEME.groupFill;
            ctx.beginPath();
            ctx.roundRect(x, y, w, h, 4);
            ctx.fill();

            ctx.strokeStyle = PRO_THEME.groupBorder;
            ctx.stroke();
        });
        ctx.setLineDash([]);

        // Layer 2: Connectors
        ctx.strokeStyle = PRO_THEME.connector;
        ctx.lineWidth = 0.5;

        connectors.forEach(conn => {
            // Updated to use structured data for connection info instead of legacy content string
            const fromId = conn.data?.connection?.from;
            const toId = conn.data?.connection?.to;

            if (fromId && toId) {
                const source = elementMap.get(fromId);
                const target = elementMap.get(toId);

                if (source && target) {
                    const sRect = {
                        x: toMiniX(source.x), y: toMiniY(source.y),
                        w: source.width * mapScale, h: source.height * mapScale
                    };
                    const tRect = {
                        x: toMiniX(target.x), y: toMiniY(target.y),
                        w: target.width * mapScale, h: target.height * mapScale
                    };
                    drawSmartConnection(ctx, sRect, tRect);
                }
            }
        });

        // Layer 3: Nodes (Semantic)
        nodes.forEach(el => {
            const x = toMiniX(el.x);
            const y = toMiniY(el.y);
            const w = Math.max(2, el.width * mapScale);
            const h = Math.max(2, el.height * mapScale);
            
            ctx.fillStyle = el.selected ? PRO_THEME.selectedFill : PRO_THEME.nodeFill;
            ctx.strokeStyle = el.selected ? PRO_THEME.selectedStroke : getNodeColor(el.type);
            ctx.lineWidth = el.selected ? 1.5 : 1;
            
            ctx.beginPath();
            // Tiny nodes are just rects
            if (mapScale < 0.05) ctx.rect(x, y, w, h);
            else ctx.roundRect(x, y, w, h, 2);
            
            ctx.fill();
            ctx.stroke(); 
            
            // Draw Semantic Symbol inside if large enough
            drawSemanticContent(ctx, el.type, x, y, w, h);
        });

        // Layer 4: Viewport Lens (Camera)
        const viewX = -viewport.x / viewport.zoom;
        const viewY = -viewport.y / viewport.zoom;
        const viewW = window.innerWidth / viewport.zoom;
        const viewH = window.innerHeight / viewport.zoom;

        const vx = toMiniX(viewX);
        const vy = toMiniY(viewY);
        const vw = viewW * mapScale;
        const vh = viewH * mapScale;

        ctx.strokeStyle = PRO_THEME.viewportBorder;
        ctx.lineWidth = 1.5; 
        ctx.fillStyle = PRO_THEME.viewportBg;
        
        ctx.beginPath();
        ctx.roundRect(vx, vy, vw, vh, 3);
        ctx.fill();
        ctx.stroke();

    }, [elements, viewport, getBounds]);

    // Optimized: Only redraw when dependencies change, not every frame
    useEffect(() => {
        draw();
    }, [draw]);

    // --- Interaction Logic ---
    const handleInteraction = (e: React.MouseEvent) => {
        if (!canvasRef.current) return;
        
        const rect = canvasRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const bounds = getBounds();
        const scaleX = WIDTH / bounds.width;
        const scaleY = HEIGHT / bounds.height;
        const mapScale = Math.min(scaleX, scaleY);
        
        const offsetX = (WIDTH - bounds.width * mapScale) / 2;
        const offsetY = (HEIGHT - bounds.height * mapScale) / 2;

        // Inverse project Mouse(Mini) -> World
        const worldX = ((mouseX - offsetX) / mapScale) + bounds.minX;
        const worldY = ((mouseY - offsetY) / mapScale) + bounds.minY;

        // Center viewport on World Coord
        const screenW = window.innerWidth;
        const screenH = window.innerHeight;
        
        // formula: viewportX = screenCenter - worldX * zoom
        const newViewportX = (screenW / 2) - (worldX * viewport.zoom);
        const newViewportY = (screenH / 2) - (worldY * viewport.zoom);

        setViewport({ x: newViewportX, y: newViewportY });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if(isDragging) {
            handleInteraction(e);
        }
    }

    if (elements.length === 0) return null;

    return (
        <div 
            className={`
                absolute bottom-6 left-6 z-[100] 
                transition-all duration-300 ease-in-out
                ${isHovered || isDragging ? 'opacity-100 translate-y-0' : 'opacity-40 translate-y-2'}
            `}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <canvas
                ref={canvasRef}
                className="rounded-lg cursor-crosshair backdrop-blur-md shadow-xl transition-all duration-200"
                style={{ width: WIDTH, height: HEIGHT }}
                onMouseDown={(e) => { setIsDragging(true); handleInteraction(e); }}
                onMouseUp={() => setIsDragging(false)}
                onMouseLeave={() => setIsDragging(false)}
                onMouseMove={handleMouseMove}
            />
        </div>
    );
};
