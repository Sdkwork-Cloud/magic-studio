export function determineTimeStep(pixelsPerSecond: number, minTickSpacing: number, _fps: number = 30): number {
    const minTimeSpacing = minTickSpacing / pixelsPerSecond;
    const intervals = [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5, 10, 30, 60, 300, 600];
    
    for (const interval of intervals) {
        if (interval >= minTimeSpacing) {
            return interval;
        }
    }
    return 60;
}

export function formatRulerLabel(time: number, fps: number = 30, timeStep: number): string {
    const totalSeconds = time;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    if (timeStep >= 60) {
        return `${minutes}:${Math.floor(seconds).toString().padStart(2, '0')}`;
    } else if (timeStep >= 1) {
        return `${minutes}:${seconds.toFixed(1).padStart(4, '0')}`;
    } else {
        const frames = Math.floor((totalSeconds % 1) * fps);
        return `${minutes}:${Math.floor(seconds).toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
    }
}

export function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function formatFrameTime(seconds: number, fps: number = 30): string {
    const totalFrames = Math.floor(seconds * fps);
    const frames = totalFrames % fps;
    const secondsInt = Math.floor(seconds);
    const s = secondsInt % 60;
    const m = Math.floor(secondsInt / 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
}
