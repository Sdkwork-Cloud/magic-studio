import { CutTimeline, CutTrack, CutClip, CutLayer } from '../entities/magicCut.entity';
import { AnyMediaResource, MediaResourceType } from 'sdkwork-react-commons';
import { TextureLRUCache } from './TextureLRUCache';
import { ShaderManager } from './gl/ShaderManager';
import { RenderData, RenderOverrideClip, FBO, RenderContext } from './types';
import { ResourceManager } from './renderer/ResourceManager';
import { EffectSystem } from './renderer/EffectSystem';
import { Compositor } from './gl/Compositor';
import { TimelineRenderer } from './renderer/TimelineRenderer';
import { RenderMatrices } from './config/RenderConfig';

// Export types for consumers
export type { RenderData, RenderOverrideClip };

export class WebGLEngine {
    private canvas: HTMLCanvasElement | null = null;
    private gl: WebGL2RenderingContext | null = null;

    private resourceManager: ResourceManager;
    private textureCache: TextureLRUCache | null = null;
    private shaderManager: ShaderManager | null = null;
    private effectSystem: EffectSystem | null = null;
    private compositor: Compositor | null = null;
    private timelineRenderer: TimelineRenderer | null = null;

    private fboMain: FBO | null = null;

    private vaoUnitQuad: WebGLVertexArrayObject | null = null;

    private projectW = 1920;
    private projectH = 1080;

    private isDestroyed = false;

    private emptyTexture: WebGLTexture | null = null;

    private cachedContext: RenderContext | null = null;

    constructor() {
        this.resourceManager = new ResourceManager();
    }

    public setRenderCallback(fn: () => void) {
        this.resourceManager.setRenderCallback(fn);
    }

    public attach(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.isDestroyed = false;

        // If GL context already exists and is valid, just rebind
        if (this.gl && !this.gl.isContextLost()) {
            return;
        }

        const gl = canvas.getContext('webgl2', {
            alpha: true,
            premultipliedAlpha: true,
            preserveDrawingBuffer: false,
            antialias: false,
            powerPreference: "high-performance",
            desynchronized: true
        });

        if (!gl) throw new Error("WebGL2 not supported");
        this.gl = gl;

        // --- GLOBAL STATE ENFORCEMENT ---
        // We set this ONCE. No component should toggle these.

        // 1. Blending: Standard Pre-multiplied Alpha
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

        // 2. Texture Orientation: STRICTLY NO FLIP
        // We handle coordinate systems via Matrix math, not implicit driver magic.
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);

        // 3. Alpha Handling
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);

        this.textureCache = new TextureLRUCache(gl);
        this.shaderManager = new ShaderManager(gl);
        this.effectSystem = new EffectSystem(this.shaderManager);
        this.compositor = new Compositor(gl);
        this.timelineRenderer = new TimelineRenderer();

        this.initBuffers();
        this.emptyTexture = this.createEmptyTexture(gl);
    }

    private createEmptyTexture(gl: WebGL2RenderingContext): WebGLTexture {
        const tex = gl.createTexture()!;
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
            new Uint8Array([0, 0, 0, 0]));
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        return tex;
    }

    public detach() {
        this.isDestroyed = true;
    }

    public isEngineDestroyed(): boolean {
        return this.isDestroyed;
    }

    public reset() {
        if (this.gl && this.fboMain) {
            this.compositor?.releaseFBO(this.fboMain);
            this.fboMain = null;
        }
        this.compositor?.cleanup();
    }

    public destroy() {
        this.isDestroyed = true;
        this.cleanup();
    }

    private cleanup() {
        if (this.gl) {
            if (this.vaoUnitQuad) {
                this.gl.deleteVertexArray(this.vaoUnitQuad);
                this.vaoUnitQuad = null;
            }
            if (this.emptyTexture) {
                this.gl.deleteTexture(this.emptyTexture);
                this.emptyTexture = null;
            }
            if (this.shaderManager) this.shaderManager.cleanup();
            if (this.textureCache) this.textureCache.clear();
            if (this.compositor) this.compositor.cleanup();
            this.resourceManager.cleanup();
            this.gl = null;
            this.canvas = null;
        }
    }

    public setProjectResolution(w: number, h: number) {
        if (this.projectW !== w || this.projectH !== h) {
            this.projectW = w;
            this.projectH = h;
            this.reset();
        }
    }

    public resize(w: number, h: number) {
        if (this.canvas) {
            this.canvas.width = w;
            this.canvas.height = h;
        }
    }

    private initBuffers() {
        if (!this.gl) return;
        const gl = this.gl;

        // Standard Unit Quad (0 to 1)
        // Position: 0,0 (Top-Left visual) to 1,1 (Bottom-Right visual)
        // Texture: 0,0 (Start of data) to 1,1 (End of data)
        const vertices = new Float32Array([
            0, 0, 0, 0,
            1, 0, 1, 0,
            0, 1, 0, 1,
            0, 1, 0, 1,
            1, 0, 1, 0,
            1, 1, 1, 1,
        ]);

        this.vaoUnitQuad = gl.createVertexArray();
        gl.bindVertexArray(this.vaoUnitQuad);

        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 16, 0);

        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 16, 8);

        gl.bindVertexArray(null);
    }

    public render(
        time: number,
        timeline: CutTimeline,
        resources: Record<string, AnyMediaResource>,
        tracks: Record<string, CutTrack>,
        clips: Record<string, CutClip>,
        isPlaying: boolean,
        overrideClip: RenderOverrideClip | null,
        layersMap: Record<string, CutLayer>,
        hiddenClipIds?: Set<string>
    ) {
        this.resourceManager.startFrame();

        if (!this.gl || this.isDestroyed || !this.textureCache) return;

        const gl = this.gl;

        if (!this.fboMain || this.fboMain.width !== this.projectW || this.fboMain.height !== this.projectH) {
            if (this.fboMain) this.compositor!.releaseFBO(this.fboMain);
            this.fboMain = this.compositor!.requestFBO(this.projectW, this.projectH);
            if (!this.fboMain) {
                console.error('[WebGLEngine] Failed to allocate main FBO');
                return;
            }
            this.cachedContext = null;
        }

        if (!this.cachedContext) {
            this.cachedContext = {
                gl,
                width: this.projectW,
                height: this.projectH,
                resolution: { width: this.projectW, height: this.projectH },
                resourceManager: this.resourceManager,
                shaderManager: this.shaderManager!,
                textureCache: this.textureCache,
                effectSystem: this.effectSystem!,
                compositor: this.compositor!,
                vaoQuad: this.vaoUnitQuad!,
                emptyTexture: this.emptyTexture!
            };
        }
        const ctx = this.cachedContext;

        if (timeline) {
            this.syncVideoState(time, timeline, resources, tracks, clips, isPlaying);

            this.timelineRenderer!.renderTimeline(
                ctx, timeline, resources, tracks, clips, layersMap, overrideClip, time, isPlaying, this.fboMain, hiddenClipIds
            );
        } else {
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.fboMain.fbo);
            gl.clearColor(0.0, 0.0, 0.0, 0.0);
            gl.clear(gl.COLOR_BUFFER_BIT);
        }

        this.renderToScreen(ctx);
    }

    private renderToScreen(ctx: RenderContext) {
        if (!this.fboMain || !this.canvas) return;
        const gl = this.gl!;

        const canvasW = this.canvas.width;
        const canvasH = this.canvas.height;

        const projW = this.projectW;
        const projH = this.projectH;

        // Aspect Ratio Contain Logic
        const canvasRatio = canvasW / canvasH;
        const projRatio = projW / projH;

        let drawW = canvasW;
        let drawH = canvasH;
        let offX = 0;
        let offY = 0;

        // Letterbox
        if (canvasRatio < projRatio) {
            drawH = canvasW / projRatio;
            offY = (canvasH - drawH) / 2;
        }
        // Pillarbox
        else {
            drawW = canvasH * projRatio;
            offX = (canvasW - drawW) / 2;
        }

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, canvasW, canvasH);
        gl.clearColor(0.0, 0.0, 0.0, 1.0); // Black Bars
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.enable(gl.BLEND);

        gl.viewport(Math.floor(offX), Math.floor(offY), Math.floor(drawW), Math.floor(drawH));

        // FINAL COMPOSITE STEP:
        // Because we draw to FBO using FLIP_Y matrix internally, the FBO content is visually "correct" 
        // if viewed top-down. 
        // But uploading textures without FLIP_Y makes them inverted in memory (Row 0 = Top).
        // Since we render to FBO with FLIP_Y matrix (see TimelineRenderer/TrackRenderer), the FBO ends up 
        // with Row 0 = Top (stored inverted in GL convention).
        // When we render to screen, we sample 0..1. 
        // Since both Source (FBO) and Dest (Screen) share the same "Top-Down" logic via matrices,
        // we actually need FLIP_Y here as well to correct for WebGL's bottom-left origin expectation vs our top-down data.

        this.compositor!.blit(
            ctx,
            this.fboMain.texture,
            1.0,
            'normal',
            RenderMatrices.SCREEN_FULL_QUAD,
            RenderMatrices.FLIP_Y // Apply standard correction for Screen output
        );
    }

    public renderSingleResource(resource: AnyMediaResource, time: number) {
        if (!this.gl || this.isDestroyed || !this.textureCache) return;
        const gl = this.gl;

        if (!this.fboMain || this.fboMain.width !== this.projectW || this.fboMain.height !== this.projectH) {
            if (this.fboMain) this.compositor!.releaseFBO(this.fboMain);
            this.fboMain = this.compositor!.requestFBO(this.projectW, this.projectH);
            if (!this.fboMain) {
                console.error('[WebGLEngine] Failed to allocate FBO for single resource');
                return;
            }
        }

        const ctx: RenderContext = {
            gl,
            width: this.projectW,
            height: this.projectH,
            resolution: { width: this.projectW, height: this.projectH },
            resourceManager: this.resourceManager,
            shaderManager: this.shaderManager!,
            textureCache: this.textureCache,
            effectSystem: this.effectSystem!,
            compositor: this.compositor!,
            vaoQuad: this.vaoUnitQuad!,
            emptyTexture: this.emptyTexture!
        };

        const clipId = 'preview-clip-' + resource.id;

        if (resource.type === MediaResourceType.VIDEO) {
            const url = this.resourceManager.resolveResourceUrl(resource);
            if (url) {
                const video = this.resourceManager.getVideoElement(clipId, url);
                this.resourceManager.syncVideoTime(video, time, false, clipId, 1.0);
            }
        }

        const dummyClip: CutClip = {
            id: clipId,
            uuid: clipId,
            resource: { id: resource.id, uuid: resource.uuid, type: 'MediaResource' },
            track: { id: 'preview', uuid: '', type: 'CutTrack' },
            start: 0,
            duration: 1000,
            offset: time,
            speed: 1,
            volume: 1,
            layers: [],
            createdAt: 0, updatedAt: 0,
            transform: { x: 0, y: 0, width: this.projectW, height: this.projectH, rotation: 0, scale: 1, opacity: 1 },
            content: (resource.type === MediaResourceType.TEXT || resource.type === MediaResourceType.SUBTITLE)
                ? (resource.metadata?.text || resource.name)
                : undefined
        };

        this.timelineRenderer!.prepareAndRenderSingleClip(
            ctx,
            this.fboMain,
            dummyClip,
            resource,
            time,
            false
        );

        this.renderToScreen(ctx);
    }

    private syncVideoState(
        time: number,
        timeline: CutTimeline,
        resources: Record<string, AnyMediaResource>,
        tracks: Record<string, CutTrack>,
        clips: Record<string, CutClip>,
        isPlaying: boolean
    ) {
        const activeClipIds = new Set<string>();
        // Lookahead for pre-buffering
        const LOOKAHEAD = 0.5; // 0.5s warmup

        if (timeline) {
            timeline.tracks.forEach(tr => {
                const track = tracks[tr.id];
                if (!track || track.visible === false) return;
                track.clips.forEach(cr => {
                    const clip = clips[cr.id];
                    // Check if clip is active OR about to be active
                    if (clip &&
                        time >= clip.start - LOOKAHEAD &&
                        time < clip.start + clip.duration) {

                        activeClipIds.add(clip.id);

                        const res = resources[clip.resource.id];
                        if (res && res.type === MediaResourceType.VIDEO) {
                            const url = this.resourceManager.resolveResourceUrl(res);
                            if (url) {
                                const video = this.resourceManager.getVideoElement(clip.id, url);

                                const speed = clip.speed || 1.0;
                                const timeInClip = time - clip.start;
                                let resourceTime = (timeInClip * speed) + (clip.offset || 0);
                                let shouldPlay: boolean = isPlaying;

                                // Handle pre-roll (before clip start)
                                if (resourceTime < 0) {
                                    resourceTime = (clip.offset || 0);
                                    shouldPlay = false;
                                }

                                // CRITICAL: Always sync video time during playback
                                // The syncVideoTime function handles drift correction internally
                                this.resourceManager.syncVideoTime(video, resourceTime, shouldPlay, clip.id, speed);
                            }
                        }
                    }
                });
            });
        }
        this.resourceManager.pauseAllVideos(activeClipIds);
    }

    public async preloadMedia(timeline: CutTimeline, resources: Record<string, AnyMediaResource>, tracks: Record<string, CutTrack>, clips: Record<string, CutClip>) {
        const promises: Promise<void>[] = [];
        timeline.tracks.forEach(tr => {
            const track = tracks[tr.id];
            if (!track || track.muted) return;
            track.clips.forEach(cr => {
                const clip = clips[cr.id];
                if (clip) {
                    const res = resources[clip.resource.id];
                    if (res && res.type === MediaResourceType.VIDEO) {
                        const url = this.resourceManager.resolveResourceUrl(res);
                        if (url) {
                            const p = new Promise<void>(resolve => {
                                const v = this.resourceManager.getVideoElement(clip.id, url);
                                if (v.readyState >= 2) resolve();
                                else {
                                    v.onloadeddata = () => resolve();
                                    v.onerror = () => resolve();
                                }
                            });
                            promises.push(p);
                        }
                    }
                }
            });
        });
        await Promise.race([Promise.all(promises), new Promise(r => setTimeout(r, 5000))]);
    }

    public async seekAndRenderAsync(
        time: number,
        timeline: CutTimeline,
        resources: Record<string, AnyMediaResource>,
        tracks: Record<string, CutTrack>,
        clips: Record<string, CutClip>,
        layersMap: Record<string, CutLayer>
    ): Promise<void> {
        const videosToSeek: HTMLVideoElement[] = [];
        timeline.tracks.forEach(tr => {
            const track = tracks[tr.id];
            if (!track || track.muted || track.visible === false) return;
            track.clips.forEach(cr => {
                const clip = clips[cr.id];
                if (clip && time >= clip.start && time < clip.start + clip.duration) {
                    const resource = resources[clip.resource.id];
                    if (resource && resource.type === MediaResourceType.VIDEO) {
                        const url = this.resourceManager.resolveResourceUrl(resource);
                        if (url) {
                            const video = this.resourceManager.getVideoElement(clip.id, url);
                            const speed = clip.speed || 1.0;
                            const timeInClip = time - clip.start;
                            const resourceTime = (timeInClip * speed) + (clip.offset || 0);

                            if (Math.abs(video.currentTime - resourceTime) > 0.05) {
                                video.currentTime = resourceTime;
                                videosToSeek.push(video);
                            }
                        }
                    }
                }
            });
        });

        if (videosToSeek.length > 0) {
            await Promise.all(videosToSeek.map(v => new Promise<void>(resolve => {
                // Use requestVideoFrameCallback to wait for the ACTUAL frame to be ready
                if ('requestVideoFrameCallback' in (v as any)) {
                    (v as any).requestVideoFrameCallback(() => resolve());
                } else {
                    // Fallback for older browsers
                    const onSeeked = () => {
                        v.removeEventListener('seeked', onSeeked);
                        resolve();
                    };
                    v.addEventListener('seeked', onSeeked);
                }

                // Safety timeout: if video never produces a new frame (e.g. stalled),
                // resolve anyway to prevent infinite hang. 
                // Reduced to 200ms to be responsive but safe.
                setTimeout(() => resolve(), 200);
            })));
        }

        this.render(time, timeline, resources, tracks, clips, false, null, layersMap);
    }
}

