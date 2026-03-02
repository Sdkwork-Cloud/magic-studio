export const CANVAS_CONTAINER_ID = 'canvas-container';

export interface CanvasViewportSize {
    width: number;
    height: number;
}

export interface CanvasViewportBounds {
    left: number;
    top: number;
    right: number;
    bottom: number;
}

const getWindowSize = (): CanvasViewportSize => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0
});

export const getCanvasContainerRect = (): DOMRect | null => {
    if (typeof document === 'undefined') return null;
    const container = document.getElementById(CANVAS_CONTAINER_ID);
    return container?.getBoundingClientRect() ?? null;
};

export const getCanvasViewportSize = (): CanvasViewportSize => {
    const rect = getCanvasContainerRect();
    const fallback = getWindowSize();
    return {
        width: rect?.width ?? fallback.width,
        height: rect?.height ?? fallback.height
    };
};

export const getCanvasViewportBounds = (): CanvasViewportBounds => {
    const rect = getCanvasContainerRect();
    const fallback = getWindowSize();
    return {
        left: rect?.left ?? 0,
        top: rect?.top ?? 0,
        right: rect?.right ?? fallback.width,
        bottom: rect?.bottom ?? fallback.height
    };
};
