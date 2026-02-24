
import { audioEngine } from './AudioEngine';

type TickCallback = (time: number) => void;
type StatusCallback = (isPlaying: boolean) => void;

export class MasterClock {
    private isPlaying = false;

    private _audioStartTime = 0;
    private systemStartTime = 0;

    private offsetTime = 0;
    private playbackRate = 1.0;
    private playbackDirection: 1 | -1 = 1;
    private duration = 0;
    private isLooping = false;

    private inPoint: number | null = null;
    private outPoint: number | null = null;

    private rafId: number | null = null;
    private tickCallbacks: Set<TickCallback> = new Set();
    private statusCallbacks: Set<StatusCallback> = new Set();

    constructor() {
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.isPlaying) {
                this.pause();
            }
        });
    }

    public get currentTime(): number {
        if (!this.isPlaying) return this.offsetTime;

        const systemElapsed = (performance.now() - this.systemStartTime) / 1000 * this.playbackRate * this.playbackDirection;
        return this.offsetTime + systemElapsed;
    }

    public get isActive(): boolean {
        return this.isPlaying;
    }

    public get effectiveDuration(): number {
        if (this.inPoint !== null && this.outPoint !== null) {
            return this.outPoint - this.inPoint;
        }
        return this.duration;
    }

    public setDuration(d: number) {
        this.duration = d;
    }

    public setLooping(loop: boolean) {
        this.isLooping = loop;
    }

    public setInOutPoints(inPoint: number | null, outPoint: number | null) {
        this.inPoint = inPoint;
        this.outPoint = outPoint;
    }

    public clearInOutPoints() {
        this.inPoint = null;
        this.outPoint = null;
    }

    public getInOutPoints(): { inPoint: number | null; outPoint: number | null } {
        return { inPoint: this.inPoint, outPoint: this.outPoint };
    }

    public setPlaybackRate(rate: number) {
        if (this.isPlaying) {
            this.offsetTime = this.currentTime;
            this._audioStartTime = audioEngine.getCurrentContextTime();
            this.systemStartTime = performance.now();
        }
        this.playbackRate = rate;
    }

    public setPlaybackDirection(direction: 1 | -1) {
        if (this.isPlaying) {
            this.offsetTime = this.currentTime;
            this._audioStartTime = audioEngine.getCurrentContextTime();
            this.systemStartTime = performance.now();
        }
        this.playbackDirection = direction;
    }

    public getPlaybackDirection(): 1 | -1 {
        return this.playbackDirection;
    }

    public play() {
        if (this.isPlaying) return;

        audioEngine.resume();

        this._audioStartTime = audioEngine.getCurrentContextTime();
        this.systemStartTime = performance.now();

        const _startBoundary = this.inPoint ?? 0;
        const _endBoundary = this.outPoint ?? this.duration;

        if (this.offsetTime >= _endBoundary - 0.1) {
            this.offsetTime = _startBoundary;
        }

        if (this.inPoint !== null && this.offsetTime < this.inPoint) {
            this.offsetTime = this.inPoint;
        }

        this.isPlaying = true;
        this.notifyStatus(true);
        this.loop();
    }

    public pause() {
        if (!this.isPlaying) return;

        const freezeTime = this.currentTime;

        this.isPlaying = false;
        this.offsetTime = freezeTime;

        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }

        this.notifyStatus(false);
        this.notifyTick();
    }

    public seek(time: number) {
        const wasPlaying = this.isPlaying;

        const _startBoundary = this.inPoint ?? 0;
        const _endBoundary = this.outPoint ?? this.duration;

        let newTime = Math.max(0, Math.min(time, this.duration));

        if (this.inPoint !== null && newTime < this.inPoint) {
            newTime = this.inPoint;
        }
        if (this.outPoint !== null && newTime > this.outPoint) {
            newTime = this.outPoint;
        }

        this.offsetTime = newTime;

        if (wasPlaying) {
            this._audioStartTime = audioEngine.getCurrentContextTime();
            this.systemStartTime = performance.now();
        }

        this.notifyTick();
    }

    public onTick(cb: TickCallback) {
        this.tickCallbacks.add(cb);
        return () => this.tickCallbacks.delete(cb);
    }

    public onStatusChange(cb: StatusCallback) {
        this.statusCallbacks.add(cb);
        return () => this.statusCallbacks.delete(cb);
    }

    private notifyTick() {
        const t = this.currentTime;
        this.tickCallbacks.forEach(cb => cb(t));
    }

    private notifyStatus(playing: boolean) {
        this.statusCallbacks.forEach(cb => cb(playing));
    }

    private loop = () => {
        if (!this.isPlaying) return;

        const t = this.currentTime;

        const startBoundary = this.inPoint ?? 0;
        const endBoundary = this.outPoint ?? this.duration;

        if (this.playbackDirection === 1) {
            if (endBoundary > 0 && t >= endBoundary) {
                if (this.isLooping) {
                    this.seek(startBoundary);
                } else {
                    this.pause();
                    this.seek(endBoundary);
                    return;
                }
            }
        } else {
            if (t <= startBoundary) {
                if (this.isLooping) {
                    this.seek(endBoundary);
                } else {
                    this.pause();
                    this.seek(startBoundary);
                    return;
                }
            }
        }

        this.notifyTick();
        this.rafId = requestAnimationFrame(this.loop);
    }
}

