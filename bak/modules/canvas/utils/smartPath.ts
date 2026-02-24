
// Geometry Types
type Point = { x: number; y: number };
type Rect = { x: number; y: number; w: number; h: number };
type Direction = 'n' | 's' | 'e' | 'w';

// Get center of a rect
const getCenter = (r: Rect): Point => ({
    x: r.x + r.w / 2,
    y: r.y + r.h / 2
});

// Calculate the connection point on the boundary of a rect for a given direction
const getHandlePoint = (r: Rect, dir: Direction): Point => {
    switch (dir) {
        case 'n': return { x: r.x + r.w / 2, y: r.y };
        case 's': return { x: r.x + r.w / 2, y: r.y + r.h };
        case 'e': return { x: r.x + r.w, y: r.y + r.h / 2 };
        case 'w': return { x: r.x, y: r.y + r.h / 2 };
    }
};

// Determine best connection directions based on relative position
const getBestDirections = (source: Rect, target: Rect): { startDir: Direction, endDir: Direction } => {
    const sC = getCenter(source);
    const tC = getCenter(target);
    const dx = tC.x - sC.x;
    const dy = tC.y - sC.y;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    // Heuristic: If horizontal distance > vertical distance, connect sideways
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

/**
 * Generates a cubic bezier path string with intelligent control points
 */
export const getSmartPath = (
    x1: number, y1: number, w1: number, h1: number,
    x2: number, y2: number, w2: number, h2: number
): string => {
    const source: Rect = { x: x1, y: y1, w: w1, h: h1 };
    const target: Rect = { x: x2, y: y2, w: w2, h: h2 };

    const { startDir, endDir } = getBestDirections(source, target);
    
    const p1 = getHandlePoint(source, startDir);
    const p2 = getHandlePoint(target, endDir);

    // Calculate Control Points
    const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    // Dynamic curvature based on distance, clamped to look good at short/long ranges
    const controlDist = Math.max(dist * 0.5, 30); 

    let cp1 = { ...p1 };
    let cp2 = { ...p2 };

    // Push control points out from the node in the direction of the handle
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

    return `M ${p1.x} ${p1.y} C ${cp1.x} ${cp1.y} ${cp2.x} ${cp2.y} ${p2.x} ${p2.y}`;
};
