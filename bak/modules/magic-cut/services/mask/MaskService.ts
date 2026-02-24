
export type MaskShapeType = 'rectangle' | 'ellipse' | 'polygon' | 'bezier' | 'lasso';

export interface MaskPoint {
    x: number;
    y: number;
    cp1x?: number;
    cp1y?: number;
    cp2x?: number;
    cp2y?: number;
}

export interface MaskShape {
    id: string;
    type: MaskShapeType;
    points: MaskPoint[];
    feather: number;
    expansion: number;
    inverted: boolean;
    opacity: number;
    enabled: boolean;
}

export interface MaskTrack {
    id: string;
    name: string;
    shapes: MaskShape[];
    blendMode: 'add' | 'subtract' | 'intersect' | 'difference';
}

export const DEFAULT_MASK_SHAPE: Omit<MaskShape, 'id'> = {
    type: 'rectangle',
    points: [],
    feather: 0,
    expansion: 0,
    inverted: false,
    opacity: 1.0,
    enabled: true
};

export class MaskService {
    public createRectangleMask(x: number, y: number, width: number, height: number): MaskShape {
        return {
            id: `mask-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: 'rectangle',
            points: [
                { x, y },
                { x: x + width, y },
                { x: x + width, y: y + height },
                { x, y: y + height }
            ],
            feather: 0,
            expansion: 0,
            inverted: false,
            opacity: 1.0,
            enabled: true
        };
    }
    
    public createEllipseMask(cx: number, cy: number, rx: number, ry: number, segments: number = 64): MaskShape {
        const points: MaskPoint[] = [];
        
        for (let i = 0; i < segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            points.push({
                x: cx + rx * Math.cos(angle),
                y: cy + ry * Math.sin(angle)
            });
        }
        
        return {
            id: `mask-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: 'ellipse',
            points,
            feather: 0,
            expansion: 0,
            inverted: false,
            opacity: 1.0,
            enabled: true
        };
    }
    
    public createPolygonMask(points: MaskPoint[]): MaskShape {
        return {
            id: `mask-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: 'polygon',
            points: [...points],
            feather: 0,
            expansion: 0,
            inverted: false,
            opacity: 1.0,
            enabled: true
        };
    }
    
    public createBezierMask(points: MaskPoint[]): MaskShape {
        return {
            id: `mask-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: 'bezier',
            points: [...points],
            feather: 0,
            expansion: 0,
            inverted: false,
            opacity: 1.0,
            enabled: true
        };
    }
    
    public renderMaskToCanvas(
        ctx: CanvasRenderingContext2D,
        shapes: MaskShape[],
        width: number,
        height: number
    ): void {
        ctx.clearRect(0, 0, width, height);
        
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, width, height);
        
        ctx.globalCompositeOperation = 'source-over';
        
        shapes.forEach(shape => {
            if (!shape.enabled) return;
            
            ctx.save();
            
            ctx.beginPath();
            this.drawShapePath(ctx, shape);
            
            ctx.closePath();
            
            if (shape.feather > 0) {
                ctx.filter = `blur(${shape.feather}px)`;
            }
            
            if (shape.inverted) {
                ctx.globalCompositeOperation = 'destination-out';
            }
            
            const alpha = shape.opacity * (shape.inverted ? 1 : 1);
            ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
            ctx.fill();
            
            ctx.restore();
        });
    }
    
    private drawShapePath(ctx: CanvasRenderingContext2D, shape: MaskShape): void {
        const { type, points, expansion } = shape;
        
        if (points.length === 0) return;
        
        let adjustedPoints = points;
        if (expansion !== 0) {
            adjustedPoints = this.expandShape(points, expansion);
        }
        
        switch (type) {
            case 'rectangle':
            case 'polygon':
            case 'ellipse':
                this.drawPolygonPath(ctx, adjustedPoints);
                break;
            case 'bezier':
                this.drawBezierPath(ctx, adjustedPoints);
                break;
        }
    }
    
    private drawPolygonPath(ctx: CanvasRenderingContext2D, points: MaskPoint[]): void {
        if (points.length === 0) return;
        
        ctx.moveTo(points[0].x, points[0].y);
        
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        
        ctx.closePath();
    }
    
    private drawBezierPath(ctx: CanvasRenderingContext2D, points: MaskPoint[]): void {
        if (points.length < 3) return;
        
        ctx.moveTo(points[0].x, points[0].y);
        
        for (let i = 0; i < points.length; i++) {
            const p0 = points[i];
            const p1 = points[(i + 1) % points.length];
            
            if (p0.cp2x !== undefined && p0.cp2y !== undefined && 
                p1.cp1x !== undefined && p1.cp1y !== undefined) {
                ctx.bezierCurveTo(
                    p0.cp2x, p0.cp2y,
                    p1.cp1x, p1.cp1y,
                    p1.x, p1.y
                );
            } else {
                ctx.lineTo(p1.x, p1.y);
            }
        }
        
        ctx.closePath();
    }
    
    private expandShape(points: MaskPoint[], expansion: number): MaskPoint[] {
        if (points.length < 3) return points;
        
        const centroid = this.calculateCentroid(points);
        
        return points.map(p => {
            const dx = p.x - centroid.x;
            const dy = p.y - centroid.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance === 0) return p;
            
            const scale = (distance + expansion) / distance;
            
            return {
                ...p,
                x: centroid.x + dx * scale,
                y: centroid.y + dy * scale
            };
        });
    }
    
    private calculateCentroid(points: MaskPoint[]): { x: number; y: number } {
        let sumX = 0;
        let sumY = 0;
        
        points.forEach(p => {
            sumX += p.x;
            sumY += p.y;
        });
        
        return {
            x: sumX / points.length,
            y: sumY / points.length
        };
    }
    
    public isPointInShape(x: number, y: number, shape: MaskShape): boolean {
        const { type, points } = shape;
        
        if (points.length < 3) return false;
        
        switch (type) {
            case 'rectangle':
            case 'polygon':
            case 'ellipse':
                return this.isPointInPolygon(x, y, points);
            default:
                return false;
        }
    }
    
    private isPointInPolygon(x: number, y: number, points: MaskPoint[]): boolean {
        let inside = false;
        
        for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
            const xi = points[i].x;
            const yi = points[i].y;
            const xj = points[j].x;
            const yj = points[j].y;
            
            if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
                inside = !inside;
            }
        }
        
        return inside;
    }
    
    public getShapeBounds(shape: MaskShape): { x: number; y: number; width: number; height: number } {
        if (shape.points.length === 0) {
            return { x: 0, y: 0, width: 0, height: 0 };
        }
        
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
        
        shape.points.forEach(p => {
            minX = Math.min(minX, p.x);
            minY = Math.min(minY, p.y);
            maxX = Math.max(maxX, p.x);
            maxY = Math.max(maxY, p.y);
        });
        
        return {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY
        };
    }
    
    public transformShape(shape: MaskShape, transform: {
        translateX?: number;
        translateY?: number;
        scaleX?: number;
        scaleY?: number;
        rotation?: number;
    }): MaskShape {
        const { translateX = 0, translateY = 0, scaleX = 1, scaleY = 1, rotation = 0 } = transform;
        
        const centroid = this.calculateCentroid(shape.points);
        const cos = Math.cos(rotation);
        const sin = Math.sin(rotation);
        
        const transformedPoints = shape.points.map(p => {
            let x = p.x - centroid.x;
            let y = p.y - centroid.y;
            
            x *= scaleX;
            y *= scaleY;
            
            const rotatedX = x * cos - y * sin;
            const rotatedY = x * sin + y * cos;
            
            return {
                ...p,
                x: rotatedX + centroid.x + translateX,
                y: rotatedY + centroid.y + translateY
            };
        });
        
        return {
            ...shape,
            points: transformedPoints
        };
    }
    
    public addPoint(shape: MaskShape, point: MaskPoint): MaskShape {
        return {
            ...shape,
            points: [...shape.points, point]
        };
    }
    
    public updatePoint(shape: MaskShape, index: number, point: MaskPoint): MaskShape {
        const newPoints = [...shape.points];
        newPoints[index] = point;
        
        return {
            ...shape,
            points: newPoints
        };
    }
    
    public removePoint(shape: MaskShape, index: number): MaskShape {
        const newPoints = shape.points.filter((_, i) => i !== index);
        
        return {
            ...shape,
            points: newPoints
        };
    }
    
    public createMaskTrack(name: string = 'Mask'): MaskTrack {
        return {
            id: `mask-track-${Date.now()}`,
            name,
            shapes: [],
            blendMode: 'add'
        };
    }
    
    public addShapeToTrack(track: MaskTrack, shape: MaskShape): MaskTrack {
        return {
            ...track,
            shapes: [...track.shapes, shape]
        };
    }
    
    public removeShapeFromTrack(track: MaskTrack, shapeId: string): MaskTrack {
        return {
            ...track,
            shapes: track.shapes.filter(s => s.id !== shapeId)
        };
    }
}

export const maskService = new MaskService();
