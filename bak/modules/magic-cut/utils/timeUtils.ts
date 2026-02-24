
/**
 * Time formatting utilities for professional video editing (SMPTE style).
 */

/**
 * Formats seconds into MM:SS.ms (Standard)
 */
export const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
};

/**
 * Formats seconds into HH:MM:SS:FF (SMPTE Timecode) based on Frame Rate.
 * Used for high-precision timeline rulers.
 */
export const formatFrameTime = (seconds: number, fps: number = 30): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const f = Math.floor((seconds % 1) * fps);

    const hh = h.toString().padStart(2, '0');
    const mm = m.toString().padStart(2, '0');
    const ss = s.toString().padStart(2, '0');
    const ff = f.toString().padStart(2, '0');

    // If hour is 0, omit it for compactness unless required, but SMPTE usually keeps it.
    // For UI compactness, we can drop HH if 0.
    if (h > 0) {
        return `${hh}:${mm}:${ss}:${ff}`;
    }
    return `${mm}:${ss}:${ff}`;
};

/**
 * Formats seconds into a compact string for ruler labels.
 * Adapts based on the step size (e.g. shows frames only if step is sub-second).
 */
export const formatRulerLabel = (seconds: number, fps: number, timeStep: number): string => {
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    
    // If step is less than a second, we are in frame view
    if (timeStep < 1) {
        const f = Math.floor((seconds % 1) * fps);
        // Show SS:FF when very zoomed in, or just FF if step is very small
        return `${s.toString().padStart(2, '0')}:${f.toString().padStart(2, '0')}`;
    }
    
    // Standard view
    if (m > 0 || seconds >= 3600) {
        const h = Math.floor(seconds / 3600);
        const mm = m.toString().padStart(2, '0');
        const ss = s.toString().padStart(2, '0');
        return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss}`;
    }
    
    // Just seconds
    return `${s}s`;
};

export const parseTime = (timeStr: string): number => {
    const parts = timeStr.split(':');
    if (parts.length === 2) {
        const [m, s] = parts;
        return parseInt(m) * 60 + parseFloat(s);
    } else if (parts.length === 3) {
        const [h, m, s] = parts;
        return parseInt(h) * 3600 + parseInt(m) * 60 + parseFloat(s);
    }
    return 0;
};

/**
 * Calculates the optimal time step (in seconds) for ruler ticks based on zoom level.
 * Ensures ticks don't overlap visually.
 * 
 * @param pps Pixels Per Second (Zoom Level)
 * @param minSpacingPx Minimum visual spacing between ticks (pixels)
 * @param fps Project Frame Rate
 */
export const determineTimeStep = (pps: number, minSpacingPx: number, fps: number): number => {
    const frameDuration = 1 / fps;
    
    // Potential steps: 1 frame, 2 frames, 5 frames, 10 frames... 1 sec, 2 sec...
    const frameSteps = [
        frameDuration, 
        frameDuration * 2, 
        frameDuration * 5, 
        frameDuration * 10,
        frameDuration * 15 // Half second (usually)
    ];

    const secondSteps = [
        1, 2, 5, 10, 15, 30, 60,
        120, 300, 600, 900, 1800, 3600
    ];

    const allSteps = [...frameSteps, ...secondSteps];

    for (const step of allSteps) {
        if (step * pps >= minSpacingPx) return step;
    }
    return 3600;
};
