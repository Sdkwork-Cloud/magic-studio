
import { CutTimeline } from '../entities/magicCut.entity'
import { MasterClock } from '../engine/MasterClock';
import { TimelineStore } from '../store/transientStore';
import { NormalizedState } from '../store/magicCutStore';
import { audioEngine } from '../engine/AudioEngine';
import { TIMELINE_CONSTANTS } from '../constants';
;

export class PlayerController {
    private clock: MasterClock;
    private store: TimelineStore;

    private domRefs: {
        playhead: HTMLDivElement | null;
        rulerHandle: HTMLDivElement | null;
        skimmer: HTMLDivElement | null;
        rulerSkimmer: HTMLDivElement | null;
        scrollContainer: HTMLElement | null;
        timecode: HTMLElement | null;
    } = { playhead: null, rulerHandle: null, skimmer: null, rulerSkimmer: null, scrollContainer: null, timecode: null };

    private engineRenderer: ((time: number) => void) | null = null;
    private currentState: NormalizedState | null = null;
    private activeTimelineId: string | null = null;

    private skimRaf: number | null = null;
    private pendingSkimTime: number | null = null;

    private lastPlaybackRate: number = 1;
    private lastPlaybackDirection: 1 | -1 = 1;
    private jklPressCount: number = 0;
    private jklLastKey: string | null = null;
    private jklResetTimer: ReturnType<typeof setTimeout> | null = null;

    private lastStateUpdateTime: number = 0;
    private readonly STATE_UPDATE_INTERVAL = 100;
    
    private lastDomUpdateTime: number = 0;
    private readonly DOM_UPDATE_INTERVAL = 16;

    private lastFrameTime: number = 0;
    private cachedZoom: number = 1;
    private cachedScrollLeft: number = 0;

    constructor(store: TimelineStore) {
        this.store = store;
        this.clock = new MasterClock();

        this.clock.onTick(this.handleTick.bind(this));
        this.clock.onStatusChange(this.handleStatusChange.bind(this));
    }

    public play = () => {
        audioEngine.resume();
        this.clock.play();
    }

    public pause = () => {
        this.clock.pause();
        audioEngine.stopAll();
        this.resetJKLState();
    }

    public togglePlay = () => {
        if (this.clock.isActive) this.pause();
        else this.play();
    }

    public seek = (time: number) => {
        this.clock.seek(time);
        this.store.setState({ currentTime: time });
        this.handleTick(time);
    }

    public scrub = (time: number) => {
        if (this.clock.isActive) {
            this.pause();
        }
        this.clock.seek(time);
        this.handleTick(time);
        this.store.setState({ currentTime: time });
    }

    public skim = (time: number | null) => {
        this.pendingSkimTime = time;

        if (this.skimRaf === null) {
            this.skimRaf = requestAnimationFrame(() => {
                this.updateSkimmer(this.pendingSkimTime);
                this.skimRaf = null;
            });
        }
    }

    public previewFrame = (time: number | null) => {
        if (time !== null && this.engineRenderer) {
            this.engineRenderer(time);
        }
    }

    public syncScroll = (scrollLeft: number) => {
        this.updateDomElements(this.clock.currentTime);
        this.updateSkimmer(null);
    }

    public setLooping = (loop: boolean) => {
        this.clock.setLooping(loop);
    }

    public setTotalDuration = (duration: number) => {
        this.clock.setDuration(duration);
    }

    public syncState = (state: NormalizedState, activeTimelineId: string | null) => {
        this.currentState = state;
        this.activeTimelineId = activeTimelineId;

        if (activeTimelineId && state.timelines[activeTimelineId]) {
            this.preloadAudio(state.timelines[activeTimelineId], state);
        }

        if (this.clock.isActive) {
            this.processAudioSchedule(this.clock.currentTime);
        }
    }

    public handleJKLInput = (key: 'j' | 'k' | 'l') => {
        const state = this.store.getState();

        if (this.jklResetTimer) {
            clearTimeout(this.jklResetTimer);
        }

        if (key !== this.jklLastKey) {
            this.jklPressCount = 0;
            this.jklLastKey = key;
        }

        this.jklPressCount = Math.min(this.jklPressCount + 1, 4);

        this.jklResetTimer = setTimeout(() => {
            this.resetJKLState();
        }, 500);

        switch (key) {
            case 'j':
                if (state.isPlaying && state.playbackDirection === -1) {
                    const newRate = this.getJKLSpeed(this.jklPressCount);
                    this.store.setState({ playbackRate: newRate });
                    this.clock.setPlaybackRate(newRate);
                } else {
                    this.store.setState({
                        playbackDirection: -1,
                        playbackRate: 1,
                        isPlaying: true
                    });
                    this.clock.setPlaybackDirection(-1);
                    this.clock.setPlaybackRate(1);
                    audioEngine.resume();
                    this.clock.play();
                }
                break;
            case 'k':
                this.pause();
                break;
            case 'l':
                if (state.isPlaying && state.playbackDirection === 1) {
                    const newRate = this.getJKLSpeed(this.jklPressCount);
                    this.store.setState({ playbackRate: newRate });
                    this.clock.setPlaybackRate(newRate);
                } else {
                    this.store.setState({
                        playbackDirection: 1,
                        playbackRate: 1,
                        isPlaying: true
                    });
                    this.clock.setPlaybackDirection(1);
                    this.clock.setPlaybackRate(1);
                    audioEngine.resume();
                    this.clock.play();
                }
                break;
        }
    }

    private getJKLSpeed(pressCount: number): number {
        const speeds = [1, 2, 4, 8];
        return speeds[Math.min(pressCount - 1, speeds.length - 1)];
    }

    private resetJKLState() {
        this.jklPressCount = 0;
        this.jklLastKey = null;
        if (this.jklResetTimer) {
            clearTimeout(this.jklResetTimer);
            this.jklResetTimer = null;
        }
    }

    public setEngineRenderer = (fn: (time: number) => void) => { this.engineRenderer = fn; }
    public setPlayheadDOM = (el: HTMLDivElement | null) => { this.domRefs.playhead = el; }
    public setRulerHandleDOM = (el: HTMLDivElement | null) => { this.domRefs.rulerHandle = el; }
    public setRulerSkimmerDOM = (el: HTMLDivElement | null) => { this.domRefs.rulerSkimmer = el; }
    public setSkimmerDOM = (el: HTMLDivElement | null) => { this.domRefs.skimmer = el; }
    public setScrollContainerDOM = (el: HTMLElement | null) => { this.domRefs.scrollContainer = el; }
    public setTimecodeDOM = (el: HTMLElement | null) => { this.domRefs.timecode = el; }

    public getCurrentTime = () => { return this.clock.currentTime; }
    public getIsPlaying = () => { return this.clock.isActive; }
    public getRenderTime = () => { return this.clock.currentTime; }

    private handleTick(time: number) {
        if (this.engineRenderer) {
            try { this.engineRenderer(time); }
            catch (e) { console.error(e); this.pause(); }
        }

        if (this.clock.isActive) {
            this.processAudioSchedule(time);
        } else {
            audioEngine.stopAll();
        }

        const now = performance.now();
        const isPlaying = this.clock.isActive;
        const frameDelta = now - this.lastFrameTime;
        
        if (frameDelta >= this.DOM_UPDATE_INTERVAL) {
            this.updateDomElements(time);
            this.handleAutoScroll(time);
            this.lastDomUpdateTime = now;
            this.lastFrameTime = now;
        }

        if (!isPlaying || (now - this.lastStateUpdateTime) >= this.STATE_UPDATE_INTERVAL) {
            this.store.setState({ currentTime: time });
            this.lastStateUpdateTime = now;
        }
    }

    private handleStatusChange(isPlaying: boolean) {
        this.store.setState({ isPlaying });
        if (!isPlaying) {
            this.store.setState({ currentTime: this.clock.currentTime });
            this.store.setState({ playbackRate: 1, playbackDirection: 1 });
            this.clock.setPlaybackRate(1);
            this.clock.setPlaybackDirection(1);
        }
    }

    private updateSkimmer(time: number | null) {
        const { skimmer, rulerSkimmer, scrollContainer } = this.domRefs;

        if (time !== null) {
            const zoom = this.store.getState().zoomLevel;
            const pps = TIMELINE_CONSTANTS.DEFAULT_PIXELS_PER_SECOND * zoom;

            const projectPos = time * pps;
            const scrollLeft = scrollContainer ? scrollContainer.scrollLeft : this.store.getState().scrollLeft;
            const screenPos = projectPos - scrollLeft;

            if (skimmer) {
                skimmer.style.transform = `translate3d(${projectPos}px, 0, 0)`;
                skimmer.style.display = 'block';
                skimmer.style.opacity = '1';
            }
            if (rulerSkimmer) {
                rulerSkimmer.style.transform = `translate3d(${screenPos}px, 0, 0) translateX(-50%)`;
                rulerSkimmer.style.display = screenPos < 0 ? 'none' : 'block';
                rulerSkimmer.style.opacity = screenPos < 0 ? '0' : '1';
            }
        } else {
            if (skimmer) skimmer.style.display = 'none';
            if (rulerSkimmer) rulerSkimmer.style.display = 'none';
        }
    }

    private updateDomElements(time: number) {
        const { playhead, rulerHandle, timecode, scrollContainer } = this.domRefs;

        const state = this.store.getState();
        const zoom = state.zoomLevel;
        const pps = TIMELINE_CONSTANTS.DEFAULT_PIXELS_PER_SECOND * zoom;

        const projectPos = time * pps;
        const scrollLeft = scrollContainer ? scrollContainer.scrollLeft : state.scrollLeft;
        const screenPos = projectPos - scrollLeft;

        if (playhead) {
            playhead.style.transform = `translate3d(${projectPos}px, 0, 0)`;
            playhead.style.display = 'block';
        }

        if (rulerHandle) {
            rulerHandle.style.transform = `translate3d(${screenPos}px, 0, 0) translateX(-50%)`;
            if (screenPos < -10) rulerHandle.style.display = 'none';
            else rulerHandle.style.display = 'block';
        }

        if (timecode) {
            timecode.innerText = this.formatTimecode(time);
        }
    }

    private handleAutoScroll(time: number) {
        const { scrollContainer } = this.domRefs;
        if (!scrollContainer || !this.clock.isActive) return;

        const zoom = this.store.getState().zoomLevel;
        const pps = TIMELINE_CONSTANTS.DEFAULT_PIXELS_PER_SECOND * zoom;
        const currentX = time * pps;

        const screenX = currentX - scrollContainer.scrollLeft;
        const width = scrollContainer.clientWidth;

        if (screenX > width - 50) {
            const scrollAmount = width * 0.2;
            scrollContainer.scrollLeft += scrollAmount;
            this.store.setState({ scrollLeft: scrollContainer.scrollLeft });
        }
    }

    private preloadAudio(timeline: CutTimeline, state: NormalizedState) {
        const resourcesToLoad = new Set<string>();

        timeline.tracks.forEach(trackRef => {
            const track = state.tracks[trackRef.id];
            if (!track || track.muted) return;
            track.clips.forEach(clipRef => {
                const clip = state.clips[clipRef.id];
                if (clip && clip.resource) resourcesToLoad.add(clip.resource.id);
            });
        });

        resourcesToLoad.forEach(resId => {
            const res = state.resources[resId];
            if (res) audioEngine.loadResource(res).catch(() => { });
        });
    }

    private processAudioSchedule(startTime: number) {
        if (!this.currentState || !this.activeTimelineId) return;
        const tl = this.currentState.timelines[this.activeTimelineId];
        if (!tl) return;
        audioEngine.schedule(
            startTime,
            tl,
            this.currentState.resources,
            this.currentState.tracks,
            this.currentState.clips,
            this.clock.isActive,
            this.clock.getPlaybackDirection()
        );
    }

    private formatTimecode(seconds: number, frameRate: number = 30) {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 100);
        const frame = Math.floor((seconds % 1) * frameRate);
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')} (${frame.toString().padStart(2, '0')})`;
    }
}

