
export interface Bounds {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
}

export const calculateBounds = (
    elements: { x: number; y: number; width: number; height: number }[]
): Bounds => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    elements.forEach(el => {
        minX = Math.min(minX, el.x);
        minY = Math.min(minY, el.y);
        maxX = Math.max(maxX, el.x + el.width);
        maxY = Math.max(maxY, el.y + el.height);
    });
    return { minX, minY, maxX, maxY };
};
