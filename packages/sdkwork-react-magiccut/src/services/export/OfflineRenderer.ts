
;
import { CutTimeline } from '../../entities/magicCut.entity'
import { NormalizedState } from '../../store/types';
import { WebGLEngine } from '../../engine/WebGLEngine';
import { ExportProgressCallback, ExportConfig, IMediaEncoder } from './types';
import { audioEngine } from '../../engine/AudioEngine';

export class OfflineRenderer {
    private canvas: HTMLCanvasElement;
    private engine: WebGLEngine;
    
    constructor(width: number, height: number) {
        this.canvas = document.createElement('canvas');
        this.canvas.width = width;
        this.canvas.height = height;
        
        this.engine = new WebGLEngine();
        this.engine.attach(this.canvas);
        
        this.engine.setProjectResolution(width, height);
        this.engine.resize(width, height);
    }

    private getContentDuration(timeline: CutTimeline, state: NormalizedState): number {
        let maxDuration = 0;
        if (!timeline.tracks) return 0;
        for (const trackRef of timeline.tracks) {
            const track = state.tracks[trackRef.id];
            if (!track || track.visible === false) continue;
            for (const clipRef of track.clips) {
                const clip = state.clips[clipRef.id];
                if (clip) {
                    maxDuration = Math.max(maxDuration, clip.start + clip.duration);
                }
            }
        }
        return maxDuration;
    }

    private sliceAudioBuffer(buffer: AudioBuffer, startTime: number, endTime: number): AudioBuffer {
        const sampleRate = buffer.sampleRate;
        const startSample = Math.max(0, Math.floor(startTime * sampleRate));
        const endSample = Math.min(buffer.length, Math.ceil(endTime * sampleRate));
        const outLength = Math.max(1, endSample - startSample);

        const trimmed = new AudioBuffer({
            length: outLength,
            sampleRate,
            numberOfChannels: buffer.numberOfChannels
        });

        for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
            const input = buffer.getChannelData(ch);
            const output = trimmed.getChannelData(ch);
            output.set(input.subarray(startSample, endSample));
        }

        return trimmed;
    }

    public async render(
        timeline: CutTimeline, 
        state: NormalizedState, 
        config: ExportConfig,
        encoder: IMediaEncoder,
        onProgress: ExportProgressCallback,
        signal?: AbortSignal
    ): Promise<Blob> {
        this.engine.reset();
        
        // 1. Preload Media (Ensures video elements are ready)
        await this.engine.preloadMedia(timeline, state.resources, state.tracks, state.clips);

        if (signal?.aborted) throw new Error("Export cancelled");

        const contentDuration = this.getContentDuration(timeline, state);
        const fullDuration = contentDuration > 0 ? contentDuration : (timeline.duration || 10);
        const fps = config.frameRate || 30;

        const rangeStartTime = Math.max(0, Math.min(config.startTime ?? 0, fullDuration));
        const requestedEndTime = config.endTime ?? fullDuration;
        const rangeEndTime = Math.max(rangeStartTime, Math.min(requestedEndTime, fullDuration));
        const duration = Math.max(0, rangeEndTime - rangeStartTime);

        if (duration <= 0) {
            throw new Error('Invalid export range. Please check In/Out points.');
        }

        const totalFrames = Math.max(1, Math.ceil(duration * fps));
        const frameDuration = 1 / fps;

        let audioBuffer: AudioBuffer | null = null;
        if (config.exportAudio) {
             audioBuffer = await audioEngine.renderTimelineOffline(
                timeline, 
                state.resources, 
                state.tracks, 
                state.clips
            );

            if (audioBuffer && (rangeStartTime > 0 || rangeEndTime < fullDuration)) {
                audioBuffer = this.sliceAudioBuffer(audioBuffer, rangeStartTime, rangeEndTime);
            }
        }

        if (signal?.aborted) throw new Error("Export cancelled");

        await encoder.initialize(this.canvas, audioBuffer, config);

        // Seek Frame 0 to stabilize
        await this.engine.seekAndRenderAsync(rangeStartTime, timeline, state.resources, state.tracks, state.clips, state.layers);

        encoder.start();

        const renderStartWallTime = performance.now();

        try {
            for (let i = 0; i <= totalFrames; i++) {
                if (signal?.aborted) throw new Error("Export cancelled");

                const time = Math.min(rangeEndTime, rangeStartTime + (i * frameDuration));
                
                // Real-time throttling if needed (e.g. MediaRecorder)
                if (encoder.requiresRealtime) {
                    const targetWallTime = renderStartWallTime + ((time - rangeStartTime) * 1000);
                    const currentWallTime = performance.now();
                    const waitTime = targetWallTime - currentWallTime;
                    if (waitTime > 0) await new Promise(r => setTimeout(r, waitTime));
                } else {
                    // Yield occasionally to prevent UI freeze
                    if (i % 5 === 0) await new Promise(r => setTimeout(r, 0));
                }
                
                // Deterministic Seek and Render
                if (i > 0) {
                    await this.engine.seekAndRenderAsync(
                        time,
                        timeline,
                        state.resources,
                        state.tracks,
                        state.clips,
                        state.layers
                    );
                }

                await encoder.captureFrame(time, frameDuration);
                onProgress((i / totalFrames) * 100);
            }
            
            if (encoder.requiresRealtime) await new Promise(r => setTimeout(r, 200));

            return await encoder.finish();

        } catch (err) {
            encoder.dispose();
            this.cleanup();
            throw err;
        } finally {
            this.cleanup();
        }
    }

    private cleanup() {
        this.engine.destroy();
        this.canvas.width = 1;
        this.canvas.height = 1;
    }
}
