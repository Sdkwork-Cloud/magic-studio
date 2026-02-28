import { CanvasElement } from '../entities'

;

export interface SnapResult {
    x: number;
    y: number;
    lines: {
        type: 'horizontal' | 'vertical';
        position: number;
        start: number;
        end: number;
    }[];
}

const SNAP_THRESHOLD = 8; 

/**
 * Calculates snapping position for a dragged node against candidate nodes.
 * Supports: Edge alignment (Left, Right, Top, Bottom) and Center alignment.
 */
export const calculateSnap = (
    activeNode: { x: number; y: number; width: number; height: number; id: string },
    otherNodes: CanvasElement[]
): SnapResult => {
    const { x, y, width, height } = activeNode;
    
    // Active Node Anchors
    const activeLeft = x;
    const activeCenter = x + width / 2;
    const activeRight = x + width;
    
    const activeTop = y;
    const activeMiddle = y + height / 2;
    const activeBottom = y + height;

    let snappedX = x;
    let snappedY = y;
    
    let minDeltaX = SNAP_THRESHOLD + 1;
    let minDeltaY = SNAP_THRESHOLD + 1;
    
    const snapLines: SnapResult['lines'] = [];

    // Helper to add visual guide lines
    const addLine = (type: 'horizontal' | 'vertical', pos: number, tMin: number, tMax: number) => {
        const aMin = type === 'vertical' ? activeTop : activeLeft;
        const aMax = type === 'vertical' ? activeBottom : activeRight;
        
        snapLines.push({ 
            type, 
            position: pos, 
            start: Math.min(aMin, tMin) - 20, // Extend slightly
            end: Math.max(aMax, tMax) + 20 
        });
    };

    otherNodes.forEach(node => {
        if (node.id === activeNode.id || node.type === 'connector') return;

        // Target Anchors
        const tLeft = node.x;
        const tCenter = node.x + node.width / 2;
        const tRight = node.x + node.width;
        
        const tTop = node.y;
        const tMiddle = node.y + node.height / 2;
        const tBottom = node.y + node.height;

        // --- X Snapping Strategies ---
        const xStrategies = [
            { val: tLeft, anchor: activeLeft, offset: 0 },         // L -> L
            { val: tLeft, anchor: activeRight, offset: width },    // R -> L
            { val: tRight, anchor: activeLeft, offset: 0 },        // L -> R
            { val: tRight, anchor: activeRight, offset: width },   // R -> R
            { val: tCenter, anchor: activeCenter, offset: width/2 }, // C -> C
        ];

        xStrategies.forEach(strat => {
            const delta = Math.abs(strat.anchor - strat.val);
            if (delta < minDeltaX) {
                minDeltaX = delta;
                snappedX = strat.val - strat.offset;
            }
        });

        // --- Y Snapping Strategies ---
        const yStrategies = [
            { val: tTop, anchor: activeTop, offset: 0 },           // T -> T
            { val: tTop, anchor: activeBottom, offset: height },   // B -> T
            { val: tBottom, anchor: activeTop, offset: 0 },        // T -> B
            { val: tBottom, anchor: activeBottom, offset: height },// B -> B
            { val: tMiddle, anchor: activeMiddle, offset: height/2 },// M -> M
        ];

        yStrategies.forEach(strat => {
            const delta = Math.abs(strat.anchor - strat.val);
            if (delta < minDeltaY) {
                minDeltaY = delta;
                snappedY = strat.val - strat.offset;
            }
        });
    });

    // --- Generate Visuals for Winning Snaps ---
    // Recalculate aligned positions to find which nodes triggered the snap
    const hasSnappedX = Math.abs(snappedX - x) > 0.001;
    const hasSnappedY = Math.abs(snappedY - y) > 0.001;

    if (hasSnappedX || hasSnappedY) {
        const finalLeft = hasSnappedX ? snappedX : x;
        const finalCenter = finalLeft + width / 2;
        const finalRight = finalLeft + width;
        
        const finalTop = hasSnappedY ? snappedY : y;
        const finalMiddle = finalTop + height / 2;
        const finalBottom = finalTop + height;

        otherNodes.forEach(node => {
            if (node.id === activeNode.id || node.type === 'connector') return;
            
            // Check X matches
            if (hasSnappedX) {
                const matchL = Math.abs(finalLeft - node.x) < 1;
                const matchR = Math.abs(finalRight - (node.x + node.width)) < 1;
                const matchC = Math.abs(finalCenter - (node.x + node.width/2)) < 1;
                const matchLR = Math.abs(finalLeft - (node.x + node.width)) < 1;
                const matchRL = Math.abs(finalRight - node.x) < 1;
                
                if (matchL || matchR || matchC || matchLR || matchRL) {
                    // Determine vertical range for the line
                    addLine('vertical', matchC ? (node.x + node.width/2) : (matchL || matchLR ? node.x : node.x + node.width), node.y, node.y + node.height);
                }
            }

            // Check Y matches
            if (hasSnappedY) {
                const matchT = Math.abs(finalTop - node.y) < 1;
                const matchB = Math.abs(finalBottom - (node.y + node.height)) < 1;
                const matchM = Math.abs(finalMiddle - (node.y + node.height/2)) < 1;
                const matchTB = Math.abs(finalTop - (node.y + node.height)) < 1;
                const matchBT = Math.abs(finalBottom - node.y) < 1;

                if (matchT || matchB || matchM || matchTB || matchBT) {
                    addLine('horizontal', matchM ? (node.y + node.height/2) : (matchT || matchTB ? node.y : node.y + node.height), node.x, node.x + node.width);
                }
            }
        });
    }

    return { x: snappedX, y: snappedY, lines: snapLines };
};
