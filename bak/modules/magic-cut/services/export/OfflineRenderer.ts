
import { CutTimeline } from '../../entities/magicCut.entity';
import { NormalizedState } from '../../store/magicCutStore';
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
        const duration = contentDuration > 0 ? contentDuration : (timeline.duration || 10);
        const fps = config.frameRate || 30;
        const totalFrames = Math.ceil(duration * fps);
        const frameDuration = 1 / fps;

        let audioBuffer: AudioBuffer | null = null;
        if (config.exportAudio) {
             audioBuffer = await audioEngine.renderTimelineOffline(
                timeline, 
                state.resources, 
                state.tracks, 
                state.clips
            );
        }

        if (signal?.aborted) throw new Error("Export cancelled");

        await encoder.initialize(this.canvas, audioBuffer, config);

        // Seek Frame 0 to stabilize
        await this.engine.seekAndRenderAsync(0, timeline, state.resources, state.tracks, state.clips, state.layers);

        encoder.start();

        const startTime = performance.now();

        try {
            for (let i = 0; i <= totalFrames; i++) {
                if (signal?.aborted) throw new Error("Export cancelled");

                const time = i * frameDuration;
                
                // Real-time throttling if needed (e.g. MediaRecorder)
                if (encoder.requiresRealtime) {
                    const targetWallTime = startTime + (time * 1000);
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
        this.engine.detach();
        this.canvas.width = 1;
        this.canvas.height = 1;
    }
}
