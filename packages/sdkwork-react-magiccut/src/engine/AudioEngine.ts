
import { assetService } from '@sdkwork/react-assets'
import { platform } from '@sdkwork/react-core';
import { MediaResourceType, AnyMediaResource } from '@sdkwork/react-commons';
import { CutClip, CutTimeline, CutTrack } from '../entities/magicCut.entity';
import { AudioEffectProcessor, createAudioEffectChain } from '../services/audio/AudioEffectProcessor';

declare global {
    interface Window {
        webkitAudioContext?: new (options?: AudioContextOptions) => AudioContext;
    }
}

// --- AudioWorklet Processor Code (Inlined for portability) ---
const WORKLET_CODE = `
class MagicAudioProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.volume = 1.0;
        this.port.onmessage = (e) => {
            if (e.data.type === 'volume') this.volume = e.data.value;
        };
    }

    process(inputs, outputs, parameters) {
        const output = outputs[0];
        const input = inputs[0];
        
        if (output && output.length > 0) {
            const channelCount = output.length;
            
            // Pass-through or Mix logic
            if (input && input.length > 0) {
                for (let channel = 0; channel < channelCount; channel++) {
                    const inputChannel = input[channel];
                    const outputChannel = output[channel];
                    if (inputChannel) {
                        for (let i = 0; i < outputChannel.length; i++) {
                            outputChannel[i] = inputChannel[i] * this.volume;
                        }
                    }
                }
            }
        }
        return true;
    }
}
registerProcessor('magic-audio-processor', MagicAudioProcessor);
`;

interface ScheduledSource {
    source: AudioBufferSourceNode;
    gain: GainNode;
    clipId: string;
    effectChain?: {
        input: GainNode;
        output: GainNode;
        processor: AudioEffectProcessor;
    };
    pan?: StereoPannerNode;
}

export type ReversePlaybackMode = 'mute' | 'lowfi' | 'highfi';

export class AudioEngine {
    private ctx: AudioContext | null = null;
    private masterGain: GainNode | null = null;
    private compressor: DynamicsCompressorNode | null = null; // New: Limiter
    private workletNode: AudioWorkletNode | null = null;
    private analyser: AnalyserNode | null = null;
    private analyserBuffer: Float32Array | null = null;

    private bufferCache = new Map<string, AudioBuffer>();
    private pendingLoads = new Map<string, Promise<AudioBuffer | null>>();
    private reversedBufferCache = new Map<string, { buffer: AudioBuffer; length: number; sampleRate: number }>();
    private reversePlaybackMode: ReversePlaybackMode = 'lowfi';

    // Track active sources by Clip ID
    private scheduledSources = new Map<string, ScheduledSource>();

    constructor() { }

    private async initContext() {
        if (this.ctx) return;

        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (!AudioContextClass) return;

            this.ctx = new AudioContextClass({ latencyHint: 'interactive', sampleRate: 48000 });

            // Load Worklet
            const blob = new Blob([WORKLET_CODE], { type: 'application/javascript' });
            const url = URL.createObjectURL(blob);

            try {
                if (this.ctx.audioWorklet) {
                    await this.ctx.audioWorklet.addModule(url);
                    this.workletNode = new AudioWorkletNode(this.ctx, 'magic-audio-processor');
                }
            } catch (e) {
                console.warn("[AudioEngine] Worklet failed, falling back to basic gain", e);
            }

            URL.revokeObjectURL(url);

            // --- Audio Graph Setup ---
            // Sources -> MasterGain -> Compressor -> Analyser -> Worklet(Volume) -> Destination

            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = 1.0;

            // Add Compressor to prevent clipping when user boosts volume to 5x
            this.compressor = this.ctx.createDynamicsCompressor();
            this.compressor.threshold.value = -12; // Start limiting early
            this.compressor.knee.value = 30;       // Smooth transition
            this.compressor.ratio.value = 12;      // Strong compression for peaks
            this.compressor.attack.value = 0.003;  // Fast attack
            this.compressor.release.value = 0.25;

            this.analyser = this.ctx.createAnalyser();
            this.analyser.fftSize = 256;
            this.analyserBuffer = new Float32Array(this.analyser.frequencyBinCount);

            // Connect Graph
            this.masterGain.connect(this.compressor);
            this.compressor.connect(this.analyser);

            if (this.workletNode) {
                this.analyser.connect(this.workletNode);
                this.workletNode.connect(this.ctx.destination);
            } else {
                this.analyser.connect(this.ctx.destination);
            }
        } catch (e) {
            console.error("Audio Init Failed", e);
        }
    }

    public getAudioLevels(): number {
        if (!this.analyser || !this.analyserBuffer) return 0;

        this.analyser.getFloatTimeDomainData(this.analyserBuffer as Float32Array<ArrayBuffer>);

        let sum = 0;
        for (let i = 0; i < this.analyserBuffer.length; i++) {
            sum += this.analyserBuffer[i] * this.analyserBuffer[i];
        }

        const rms = Math.sqrt(sum / this.analyserBuffer.length);
        return Math.min(1.0, rms * 5.0); // Boost for visibility
    }

    public async resume() {
        if (!this.ctx) await this.initContext();
        if (this.ctx?.state === 'suspended') {
            await this.ctx.resume();
        }
    }

    public suspend() {
        if (this.ctx?.state === 'running') {
            this.ctx.suspend().catch(() => { });
        }
        this.stopAll();
    }

    public getCurrentContextTime(): number {
        return this.ctx ? this.ctx.currentTime : 0;
    }

    public setMasterVolume(val: number) {
        if (this.workletNode) {
            this.workletNode.port.postMessage({ type: 'volume', value: val });
        } else if (this.masterGain) {
            this.masterGain.gain.setTargetAtTime(val, this.ctx!.currentTime, 0.1);
        }
    }

    public setReversePlaybackMode(mode: ReversePlaybackMode): void {
        this.reversePlaybackMode = mode;
    }

    public getReversePlaybackMode(): ReversePlaybackMode {
        return this.reversePlaybackMode;
    }

    public async loadResource(resource: AnyMediaResource): Promise<AudioBuffer | null> {
        if (!this.ctx) await this.initContext();
        if (!this.ctx) return null;

        if (this.bufferCache.has(resource.id)) return this.bufferCache.get(resource.id)!;
        if (this.pendingLoads.has(resource.id)) return this.pendingLoads.get(resource.id)!;

        // Valid audio types check
        const validTypes = [
            MediaResourceType.AUDIO, MediaResourceType.MUSIC,
            MediaResourceType.VOICE, MediaResourceType.SPEECH,
            MediaResourceType.VIDEO
        ];
        if (!validTypes.includes(resource.type)) return null;

        const task = (async () => {
            try {
                // If it's a VFS path on Web, hydration handled by assetService
                const url = await assetService.resolveAssetUrl(resource);
                if (!url) return null;

                const res = await fetch(url);
                const arrayBuffer = await res.arrayBuffer();
                const audioBuffer = await this.ctx!.decodeAudioData(arrayBuffer);

                this.bufferCache.set(resource.id, audioBuffer);
                return audioBuffer;
            } catch (e) {
                console.warn(`[AudioEngine] Failed to load ${resource.id}`, e);
                return null;
            }
        })();

        this.pendingLoads.set(resource.id, task);
        return task.finally(() => this.pendingLoads.delete(resource.id));
    }

    private getReversedBuffer(resourceId: string, buffer: AudioBuffer): AudioBuffer {
        const existing = this.reversedBufferCache.get(resourceId);
        if (existing && existing.length === buffer.length && existing.sampleRate === buffer.sampleRate) {
            return existing.buffer;
        }

        const ctx = this.ctx!;
        const reversed = ctx.createBuffer(buffer.numberOfChannels, buffer.length, buffer.sampleRate);

        for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
            const src = buffer.getChannelData(ch);
            const dst = reversed.getChannelData(ch);
            for (let i = 0, j = src.length - 1; i < src.length; i++, j--) {
                dst[i] = src[j];
            }
        }

        this.reversedBufferCache.set(resourceId, { buffer: reversed, length: buffer.length, sampleRate: buffer.sampleRate });
        return reversed;
    }

    /**
     * Precision Scheduling using "Lookahead" strategy.
     * Manages mixing of concurrent audio streams from multiple tracks.
     */
    public schedule(
        currentTime: number,
        timeline: CutTimeline,
        resources: Record<string, AnyMediaResource>,
        tracks: Record<string, CutTrack>,
        clips: Record<string, CutClip>,
        isPlaying: boolean,
        playbackDirection: 1 | -1 = 1
    ): void {
        if (!this.ctx || !this.masterGain) return;

        if (!isPlaying) {
            this.stopAll();
            return;
        }

        if (playbackDirection === -1) {
            if (this.reversePlaybackMode === 'mute') {
                this.stopAll();
                return;
            }

            const lookahead = this.reversePlaybackMode === 'highfi' ? 0.35 : 0.5;
            const microFade = this.reversePlaybackMode === 'highfi' ? 0.01 : 0;
            this.scheduleReverse(currentTime, timeline, resources, tracks, clips, lookahead, microFade);
            return;
        }

        const contextTime = this.ctx.currentTime;
        const SCHEDULE_LOOKAHEAD = 0.5;

        // 1. Identify active clips for current time window
        const activeClipIds = new Set<string>();

        // Iterate ALL tracks (Audio AND Video tracks can produce sound)
        timeline.tracks.forEach(trackRef => {
            const track = tracks[trackRef.id];

            // Skip if track is muted
            if (!track || track.muted) return;

            track.clips.forEach(clipRef => {
                const clip = clips[clipRef.id];
                if (!clip) return;

                // Check intersection: Clip [start, end) overlaps [now, now + lookahead)
                const clipEnd = clip.start + clip.duration;
                const windowStart = currentTime;
                const windowEnd = currentTime + SCHEDULE_LOOKAHEAD;

                if (clipEnd > windowStart && clip.start < windowEnd) {
                    activeClipIds.add(clip.id);
                    this.scheduleClip(clip, track, resources, contextTime, currentTime);
                }
            });
        });

        // 2. Garbage Collect stopped sources
        // If a clip is no longer in the active window (or track was muted), stop it.
        for (const [id, scheduled] of this.scheduledSources) {
            if (!activeClipIds.has(id)) {
                this.stopSource(scheduled);
                this.scheduledSources.delete(id);
            } else {
                // Update volume/speed for existing sources (real-time mixing)
                const clip = clips[id];
                if (!clip) continue;
                const track = tracks[clip.track.id];
                if (track) {
                    const vol = (track.volume ?? 1.0) * (clip.volume ?? 1.0);
                    // Smooth volume transition
                    scheduled.gain.gain.setTargetAtTime(vol, contextTime, 0.05);

                    // Handle speed change on the fly if needed (though audio nodes prefer constant rate per start)
                    // If speed changes, we typically need to restart the node to avoid desync, but simple playbackRate might work
                    if (Math.abs(scheduled.source.playbackRate.value - (clip.speed || 1.0)) > 0.01) {
                        scheduled.source.playbackRate.setValueAtTime(clip.speed || 1.0, contextTime);
                    }
                }
            }
        }
    }

    private scheduleReverse(
        currentTime: number,
        timeline: CutTimeline,
        resources: Record<string, AnyMediaResource>,
        tracks: Record<string, CutTrack>,
        clips: Record<string, CutClip>,
        lookahead: number,
        microFade: number
    ): void {
        if (!this.ctx || !this.masterGain) return;

        const contextTime = this.ctx.currentTime;
        const windowStart = currentTime - lookahead;
        const windowEnd = currentTime;

        const activeClipIds = new Set<string>();

        timeline.tracks.forEach(trackRef => {
            const track = tracks[trackRef.id];
            if (!track || track.muted) return;

            track.clips.forEach(clipRef => {
                const clip = clips[clipRef.id];
                if (!clip) return;

                const clipEnd = clip.start + clip.duration;
                const intersects = clipEnd > windowStart && clip.start < windowEnd;
                if (!intersects) return;

                activeClipIds.add(clip.id);
                this.scheduleClipReverse(clip, track, resources, contextTime, windowStart, windowEnd, microFade);
            });
        });

        for (const [id, scheduled] of this.scheduledSources) {
            if (!activeClipIds.has(id)) {
                this.stopSource(scheduled);
                this.scheduledSources.delete(id);
            } else {
                const clip = clips[id];
                if (!clip) continue;
                const track = tracks[clip.track.id];
                if (track) {
                    const vol = (track.volume ?? 1.0) * (clip.volume ?? 1.0);
                    scheduled.gain.gain.setTargetAtTime(vol, contextTime, 0.05);
                    const speed = Math.max(0.01, clip.speed || 1.0);
                    if (Math.abs(scheduled.source.playbackRate.value - speed) > 0.01) {
                        scheduled.source.playbackRate.setValueAtTime(speed, contextTime);
                    }
                }
            }
        }
    }

    private scheduleClipReverse(
        clip: CutClip,
        track: CutTrack,
        resources: Record<string, AnyMediaResource>,
        contextTime: number,
        windowStart: number,
        windowEnd: number,
        microFade: number
    ): void {
        if (this.scheduledSources.has(clip.id)) return;

        const resource = resources[clip.resource.id];
        if (!resource) return;

        const buffer = this.bufferCache.get(resource.id);
        if (!buffer) return;

        const speed = Math.max(0.01, clip.speed || 1.0);

        const clipStart = clip.start;
        const clipEnd = clip.start + clip.duration;
        const segStart = Math.max(windowStart, clipStart);
        const segEnd = Math.min(windowEnd, clipEnd);
        if (segEnd <= segStart) return;

        const offset = clip.offset || 0;
        const rStart = offset + (segStart - clipStart) * speed;
        const rEnd = offset + (segEnd - clipStart) * speed;

        const bufferDuration = buffer.duration;
        const clampedREnd = Math.min(Math.max(0, rEnd), bufferDuration);
        const clampedRStart = Math.min(Math.max(0, rStart), bufferDuration);
        const segmentBufferDuration = Math.max(0, clampedREnd - clampedRStart);
        if (segmentBufferDuration <= 0) return;

        const startOffset = Math.max(0, bufferDuration - clampedREnd);
        const maxAvailable = Math.max(0, bufferDuration - startOffset);
        const playBufferDuration = Math.min(segmentBufferDuration, maxAvailable);
        if (playBufferDuration <= 0) return;

        const reversed = this.getReversedBuffer(resource.id, buffer);

        const source = this.ctx!.createBufferSource();
        source.buffer = reversed;
        source.playbackRate.value = speed;

        const gain = this.ctx!.createGain();
        const volume = (track.volume ?? 1.0) * (clip.volume ?? 1.0);
        gain.gain.value = volume;

        let effectChain: ScheduledSource['effectChain'] = undefined;
        let pan: StereoPannerNode | undefined = undefined;

        const clipEffects = clip.audioEffects || [];
        const trackEffects = track.audioEffects || [];
        const allEffects = [...trackEffects, ...clipEffects];

        if (allEffects.length > 0) {
            const enabledEffects = allEffects.filter(e => e.params.enabled && !e.params.bypass);
            if (enabledEffects.length > 0) {
                effectChain = createAudioEffectChain(this.ctx!, enabledEffects);
            }
        }

        if (track.pan !== undefined && track.pan !== 0) {
            pan = this.ctx!.createStereoPanner();
            pan.pan.value = track.pan;
        }

        let lastNode: AudioNode = gain;

        if (effectChain) {
            lastNode.connect(effectChain.input);
            lastNode = effectChain.output;
        }

        if (pan) {
            lastNode.connect(pan);
            lastNode = pan;
        }

        lastNode.connect(this.masterGain!);
        source.connect(gain);

        const delay = Math.max(0, windowEnd - segEnd);
        const absStartTime = contextTime + delay;
        const wallClockDuration = playBufferDuration / speed;

        // Reverse playback: swap fade-in/out to match timeline direction.
        const clipFadeIn = (clip as any).fadeIn || 0;
        const clipFadeOut = (clip as any).fadeOut || 0;
        const fadeIn = Math.max(clipFadeOut, microFade);
        const fadeOut = Math.max(clipFadeIn, microFade);

        if (fadeIn > 0) {
            gain.gain.setValueAtTime(0, absStartTime);
            gain.gain.linearRampToValueAtTime(volume, absStartTime + fadeIn);
        }

        if (fadeOut > 0 && wallClockDuration > fadeOut) {
            const fadeOutStart = absStartTime + wallClockDuration - fadeOut;
            gain.gain.setValueAtTime(volume, Math.max(absStartTime + fadeIn, fadeOutStart));
            gain.gain.linearRampToValueAtTime(0, absStartTime + wallClockDuration);
        }

        try {
            source.start(absStartTime, startOffset, playBufferDuration);

            const scheduled: ScheduledSource = {
                source,
                gain,
                clipId: clip.id,
                effectChain,
                pan
            };

            this.scheduledSources.set(clip.id, scheduled);

            source.onended = () => {
                try {
                    if (this.scheduledSources.has(clip.id)) {
                        const current = this.scheduledSources.get(clip.id);
                        if (current && current.source === source) {
                            this.scheduledSources.delete(clip.id);
                            source.disconnect();
                            gain.disconnect();
                            if (effectChain) {
                                effectChain.processor.dispose();
                            }
                            if (pan) {
                                pan.disconnect();
                            }
                        }
                    }
                } catch (e) {
                    console.warn('[AudioEngine] Error in onended cleanup:', e);
                }
            };
        } catch (e) {
            console.error("Audio Reverse Schedule Error", e);
        }
    }

    private scheduleClip(
        clip: CutClip,
        track: CutTrack,
        resources: Record<string, AnyMediaResource>,
        contextTime: number,
        timelineTime: number
    ) {
        if (this.scheduledSources.has(clip.id)) return;

        const resource = resources[clip.resource.id];
        if (!resource) return;

        const buffer = this.bufferCache.get(resource.id);
        if (!buffer) return;

        const speed = Math.max(0.01, clip.speed || 1.0);

        const timeUntilStart = clip.start - timelineTime;

        let startOffset = 0;
        let delay = 0;
        let duration = clip.duration;

        if (timeUntilStart > 0) {
            delay = timeUntilStart;
            startOffset = clip.offset || 0;
        } else {
            const timeSinceStart = -timeUntilStart;
            startOffset = (clip.offset || 0) + (timeSinceStart * speed);
            delay = 0;
            duration = Math.max(0, clip.duration - timeSinceStart);
        }

        if (startOffset >= buffer.duration) return;

        const source = this.ctx!.createBufferSource();
        source.buffer = buffer;
        source.playbackRate.value = speed;

        const gain = this.ctx!.createGain();
        const volume = (track.volume ?? 1.0) * (clip.volume ?? 1.0);
        gain.gain.value = volume;

        let effectChain: ScheduledSource['effectChain'] = undefined;
        let pan: StereoPannerNode | undefined = undefined;

        const clipEffects = clip.audioEffects || [];
        const trackEffects = track.audioEffects || [];
        const allEffects = [...trackEffects, ...clipEffects];

        if (allEffects.length > 0) {
            const enabledEffects = allEffects.filter(e => e.params.enabled && !e.params.bypass);
            if (enabledEffects.length > 0) {
                effectChain = createAudioEffectChain(this.ctx!, enabledEffects);
            }
        }

        if (track.pan !== undefined && track.pan !== 0) {
            pan = this.ctx!.createStereoPanner();
            pan.pan.value = track.pan;
        }

        let lastNode: AudioNode = gain;

        if (effectChain) {
            lastNode.connect(effectChain.input);
            lastNode = effectChain.output;
        }

        if (pan) {
            lastNode.connect(pan);
            lastNode = pan;
        }

        lastNode.connect(this.masterGain!);

        source.connect(gain);

        const absStartTime = contextTime + delay;
        const bufferDuration = Math.max(0, duration * speed);
        const maxBufferDuration = Math.max(0, buffer.duration - startOffset);
        const playBufferDuration = Math.min(bufferDuration, maxBufferDuration);

        if (playBufferDuration <= 0) return;

        const wallClockDuration = playBufferDuration / speed;

        // Apply fadeIn / fadeOut envelope on the gain node
        const fadeIn = (clip as any).fadeIn || 0;
        const fadeOut = (clip as any).fadeOut || 0;

        if (fadeIn > 0) {
            gain.gain.setValueAtTime(0, absStartTime);
            gain.gain.linearRampToValueAtTime(volume, absStartTime + fadeIn);
        }

        if (fadeOut > 0 && wallClockDuration > fadeOut) {
            const fadeOutStart = absStartTime + wallClockDuration - fadeOut;
            gain.gain.setValueAtTime(volume, Math.max(absStartTime + fadeIn, fadeOutStart));
            gain.gain.linearRampToValueAtTime(0, absStartTime + wallClockDuration);
        }

        try {
            source.start(absStartTime, startOffset, playBufferDuration);

            const scheduled: ScheduledSource = {
                source,
                gain,
                clipId: clip.id,
                effectChain,
                pan
            };

            this.scheduledSources.set(clip.id, scheduled);

            source.onended = () => {
                try {
                    if (this.scheduledSources.has(clip.id)) {
                        const current = this.scheduledSources.get(clip.id);
                        if (current && current.source === source) {
                            this.scheduledSources.delete(clip.id);
                            source.disconnect();
                            gain.disconnect();
                            if (effectChain) {
                                effectChain.processor.dispose();
                            }
                            if (pan) {
                                pan.disconnect();
                            }
                        }
                    }
                } catch (e) {
                    console.warn('[AudioEngine] Error in onended cleanup:', e);
                }
            };
        } catch (e) {
            console.error("Audio Schedule Error", e);
        }
    }

    private stopSource(scheduled: ScheduledSource) {
        try {
            scheduled.source.stop();
            scheduled.source.disconnect();
            scheduled.gain.disconnect();
            if (scheduled.effectChain) {
                scheduled.effectChain.processor.dispose();
            }
            if (scheduled.pan) {
                scheduled.pan.disconnect();
            }
        } catch { }
    }

    public stopAll() {
        this.scheduledSources.forEach((scheduled) => {
            this.stopSource(scheduled);
        });
        this.scheduledSources.clear();
    }

    public async renderTimelineOffline(
        timeline: CutTimeline,
        resources: Record<string, AnyMediaResource>,
        tracks: Record<string, CutTrack>,
        clips: Record<string, CutClip>
    ): Promise<AudioBuffer> {
        await Promise.all(
            Object.values(clips).map(c => this.loadResource(resources[c.resource.id]))
        );

        const sampleRate = 48000;
        const length = Math.ceil(Math.max(1, timeline.duration) * sampleRate);
        const offlineCtx = new OfflineAudioContext(2, length, sampleRate);

        const compressor = offlineCtx.createDynamicsCompressor();
        compressor.threshold.value = -12;
        compressor.knee.value = 30;
        compressor.ratio.value = 12;
        compressor.connect(offlineCtx.destination);

        timeline.tracks.forEach(trackRef => {
            const track = tracks[trackRef.id];
            if (!track || track.muted) return;

            track.clips.forEach(clipRef => {
                const clip = clips[clipRef.id];
                if (!clip) return;
                const res = resources[clip.resource.id];
                if (!res) return;
                const buffer = this.bufferCache.get(res.id);

                if (buffer) {
                    const speed = Math.max(0.01, clip.speed || 1.0);
                    const startOffset = clip.offset || 0;
                    if (startOffset >= buffer.duration) return;

                    const bufferDuration = Math.max(0, clip.duration * speed);
                    const maxBufferDuration = Math.max(0, buffer.duration - startOffset);
                    const playBufferDuration = Math.min(bufferDuration, maxBufferDuration);
                    if (playBufferDuration <= 0) return;

                    const wallClockDuration = playBufferDuration / speed;

                    const src = offlineCtx.createBufferSource();
                    src.buffer = buffer;
                    src.playbackRate.value = speed;

                    const gain = offlineCtx.createGain();
                    gain.gain.value = (track.volume ?? 1) * (clip.volume ?? 1);

                    const clipEffects = clip.audioEffects || [];
                    const trackEffects = track.audioEffects || [];
                    const allEffects = [...trackEffects, ...clipEffects];

                    let lastNode: AudioNode = gain;

                    if (allEffects.length > 0) {
                        const enabledEffects = allEffects.filter(e => e.params.enabled && !e.params.bypass);
                        if (enabledEffects.length > 0) {
                            const effectChain = createAudioEffectChain(offlineCtx as unknown as AudioContext, enabledEffects);
                            lastNode.connect(effectChain.input);
                            lastNode = effectChain.output;
                        }
                    }

                    if (track.pan !== undefined && track.pan !== 0) {
                        const pan = offlineCtx.createStereoPanner();
                        pan.pan.value = track.pan;
                        lastNode.connect(pan);
                        lastNode = pan;
                    }

                    lastNode.connect(compressor);
                    src.connect(gain);

                    // Apply fadeIn / fadeOut envelope on the gain node (timeline time)
                    const fadeIn = (clip as any).fadeIn || 0;
                    const fadeOut = (clip as any).fadeOut || 0;

                    if (fadeIn > 0) {
                        gain.gain.setValueAtTime(0, clip.start);
                        gain.gain.linearRampToValueAtTime(gain.gain.value, clip.start + fadeIn);
                    }

                    if (fadeOut > 0 && wallClockDuration > fadeOut) {
                        const fadeOutStart = clip.start + wallClockDuration - fadeOut;
                        gain.gain.setValueAtTime(gain.gain.value, Math.max(clip.start + fadeIn, fadeOutStart));
                        gain.gain.linearRampToValueAtTime(0, clip.start + wallClockDuration);
                    }

                    src.start(clip.start, startOffset, playBufferDuration);
                }
            });
        });

        return await offlineCtx.startRendering();
    }
}

export const audioEngine = new AudioEngine();
