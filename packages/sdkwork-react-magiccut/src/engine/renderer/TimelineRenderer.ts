
import { RenderContext, FBO, RenderOverrideClip } from '../types';

import { CutTimeline, CutTrack, CutClip, CutLayer, CutClipTransform } from '../../entities/magicCut.entity';
import { TrackRenderer, TextureResult } from './TrackRenderer';
import { TrackIntervalIndex,AnyMediaResource } from '@sdkwork/react-commons';
import { Matrix3Ops, RenderMatrices } from '../config/RenderConfig';
import { RenderSortUtils } from '../utils/RenderSortUtils';

export class TimelineRenderer {
    private trackRenderer: TrackRenderer;
    private trackIndices = new Map<string, TrackIntervalIndex>();
    private lastTrackVersion = new Map<string, number>();

    private projectionMatrix = Matrix3Ops.create();
    private modelMatrix = Matrix3Ops.create();

    constructor() {
        this.trackRenderer = new TrackRenderer();
    }

    private getTrackTree(track: CutTrack, clips: Record<string, CutClip>): TrackIntervalIndex {
        if (!this.trackIndices.has(track.id) || this.lastTrackVersion.get(track.id) !== track.updatedAt) {
            const tree = new TrackIntervalIndex();
            track.clips.forEach((ref: { id: string }) => {
                const clip = clips[ref.id];
                if (clip) {
                    tree.insert({
                        id: clip.id,
                        start: clip.start,
                        end: clip.start + clip.duration,
                        data: clip
                    });
                }
            });
            this.trackIndices.set(track.id, tree);
            this.lastTrackVersion.set(track.id, track.updatedAt);
        }
        return this.trackIndices.get(track.id)!;
    }

    public renderTimeline(
        ctx: RenderContext,
        timeline: CutTimeline,
        resources: Record<string, AnyMediaResource>,
        tracks: Record<string, CutTrack>,
        clips: Record<string, CutClip>,
        layers: Record<string, CutLayer>,
        overrideClip: RenderOverrideClip | null,
        time: number,
        isPlaying: boolean,
        mainFBO: FBO,
        hiddenClipIds?: Set<string>
    ) {
        const { gl } = ctx;

        // 1. Clear Main Output
        gl.bindFramebuffer(gl.FRAMEBUFFER, mainFBO.fbo);
        gl.viewport(0, 0, ctx.width, ctx.height);
        gl.clearColor(0.0, 0.0, 0.0, 0.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        // 2. Setup Projection
        Matrix3Ops.projection(this.projectionMatrix, ctx.width, ctx.height);

        // 3. Render Tracks
        const renderOrderTracks = RenderSortUtils.getRenderOrder(timeline, tracks);

        for (const track of renderOrderTracks) {
            const tree = this.getTrackTree(track, clips);
            const visibleIntervals = tree.queryOverlapping(time, time + 0.01);

            const activeClips: CutClip[] = visibleIntervals
                .filter(i => i.id)
                .map(i => clips[i.id!])
                .filter(c => c && c.id !== overrideClip?.id);

            // Handle Drag Override
            if (overrideClip && overrideClip.type.startsWith('trim')) {
                const original = clips[overrideClip.id];
                if (original && original.track.id === track.id) {
                    const { type: _type, ...restOverride } = overrideClip;
                    const tempClip = { ...original, ...restOverride };
                    if (time >= tempClip.start && time < tempClip.start + tempClip.duration) {
                        activeClips.push(tempClip as unknown as CutClip);
                    }
                }
            }

            activeClips.sort((a, b) => a.start - b.start);

            for (const clip of activeClips) {
                if (hiddenClipIds && hiddenClipIds.has(clip.id)) continue;

                const resource = resources[clip.resource.id];
                const result = resource ? this.trackRenderer.prepareClipTexture(ctx, clip, resource, layers, time, isPlaying) : null;

                if (result) {
                    this.compositeClip(ctx, mainFBO, clip, time, result);
                }
            }
        }

        // 4. Ghost Render
        if (overrideClip && overrideClip.type === 'move') {
            const originalClip = clips[overrideClip.id];
            if (originalClip) {
                const ghostClip: CutClip = {
                    ...originalClip,
                    start: overrideClip.start,
                    track: { id: 'ghost', uuid: '', type: 'CutTrack' },
                    transform: originalClip.transform,
                };

                const resource = resources[overrideClip.resource.id];
                const result = this.trackRenderer.prepareClipTexture(ctx, ghostClip, resource, {}, time, false);

                if (result) {
                    const ghostTf = { ...(ghostClip.transform || { x: 0, y: 0, width: 100, height: 100, rotation: 0, scale: 1, opacity: 1 }) };
                    ghostTf.opacity = (ghostTf.opacity || 1) * 0.6;
                    this.compositeClip(ctx, mainFBO, { ...ghostClip, transform: ghostTf }, time, result);
                }
            }
        }
    }

    public prepareAndRenderSingleClip(
        ctx: RenderContext,
        targetFBO: FBO,
        clip: CutClip,
        resource: AnyMediaResource,
        time: number,
        isPlaying: boolean
    ) {
        const result = this.trackRenderer.prepareClipTexture(
            ctx, clip, resource, {}, time, isPlaying
        );
        if (!result) return;

        const { gl } = ctx;
        gl.bindFramebuffer(gl.FRAMEBUFFER, targetFBO.fbo);
        gl.viewport(0, 0, targetFBO.width, targetFBO.height);
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        Matrix3Ops.projection(this.projectionMatrix, ctx.width, ctx.height);

        const projectW = ctx.width;
        const projectH = ctx.height;
        let mediaW = 1920;
        let mediaH = 1080;

        if ((resource as any).width && (resource as any).height) {
            mediaW = (resource as any).width;
            mediaH = (resource as any).height;
        } else if (resource.metadata?.width && resource.metadata?.height) {
            mediaW = resource.metadata.width;
            mediaH = resource.metadata.height;
        }

        const mediaRatio = mediaW / mediaH;
        const projRatio = projectW / projectH;
        let finalW = projectW;
        let finalH = projectH;

        if (mediaRatio > projRatio) {
            finalW = projectW;
            finalH = projectW / mediaRatio;
        } else {
            finalH = projectH;
            finalW = projectH * mediaRatio;
        }

        const x = (projectW - finalW) / 2;
        const y = (projectH - finalH) / 2;

        const tempClip: CutClip = {
            ...clip,
            transform: { x, y, width: finalW, height: finalH, rotation: 0, scale: 1, opacity: 1 }
        };

        this.compositeClip(ctx, targetFBO, tempClip, time, result);
    }

    private compositeClip(ctx: RenderContext, targetFBO: FBO, clip: CutClip, time: number, result: TextureResult) {
        const { gl, compositor } = ctx;
        const clipTime = time - clip.start;
        const tf = this.resolveTransform(clip, clipTime);
        const opacity = tf.opacity ?? 1.0;

        const w = tf.width;
        const h = tf.height;
        const scale = tf.scale || 1;
        const rotationDeg = tf.rotation || 0;

        this.modelMatrix.set(this.projectionMatrix);

        const cx = tf.x + (w / 2);
        const cy = tf.y + (h / 2);

        Matrix3Ops.translate(this.modelMatrix, this.modelMatrix, cx, cy);
        Matrix3Ops.rotate(this.modelMatrix, this.modelMatrix, rotationDeg * Math.PI / 180);
        Matrix3Ops.scale(this.modelMatrix, this.modelMatrix, w * scale, h * scale);
        Matrix3Ops.translate(this.modelMatrix, this.modelMatrix, -0.5, -0.5);

        // CRITICAL: Flip Y Correction
        // All textures (Raw or FBO) are effectively stored "Top-Down" in memory 
        // (Row 0 is Visual Top), but GL sampling expects Bottom-Up.
        // So we ALWAYS flip Y to correct this mismatch.
        const textureMatrix = RenderMatrices.FLIP_Y;

        gl.bindFramebuffer(gl.FRAMEBUFFER, targetFBO.fbo);
        gl.viewport(0, 0, targetFBO.width, targetFBO.height);

        compositor.blit(ctx, result.texture, opacity, clip.blendMode || 'normal', this.modelMatrix, textureMatrix);
    }

    private resolveTransform(clip: CutClip, clipTime: number): CutClipTransform {
        const base = clip.transform || { x: 0, y: 0, width: 100, height: 100, rotation: 0, scale: 1, opacity: 1 };

        if (!clip.keyframes) return base;

        return {
            x: this.resolveAnimatedValue(clip.keyframes.x, clipTime, base.x),
            y: this.resolveAnimatedValue(clip.keyframes.y, clipTime, base.y),
            width: this.resolveAnimatedValue(clip.keyframes.width, clipTime, base.width),
            height: this.resolveAnimatedValue(clip.keyframes.height, clipTime, base.height),
            rotation: this.resolveAnimatedValue(clip.keyframes.rotation, clipTime, base.rotation),
            scale: this.resolveAnimatedValue(clip.keyframes.scale, clipTime, base.scale),
            opacity: this.resolveAnimatedValue(clip.keyframes.opacity, clipTime, base.opacity)
        };
    }

    private resolveAnimatedValue(keyframes: any[], clipTime: number, defaultValue: number): number {
        if (!keyframes || keyframes.length === 0) return defaultValue;
        if (clipTime <= keyframes[0].time) return keyframes[0].value;
        if (clipTime >= keyframes[keyframes.length - 1].time) return keyframes[keyframes.length - 1].value;

        for (let i = 0; i < keyframes.length - 1; i++) {
            const kfA = keyframes[i];
            const kfB = keyframes[i + 1];
            if (clipTime >= kfA.time && clipTime < kfB.time) {
                const range = kfB.time - kfA.time;
                let t = (clipTime - kfA.time) / range;
                // Apply easing function from keyframe
                t = this.applyEasing(t, kfA.easing || 'linear');
                return kfA.value + (kfB.value - kfA.value) * t;
            }
        }
        return defaultValue;
    }

    private applyEasing(t: number, easing: string): number {
        switch (easing) {
            case 'easeIn': return t * t;
            case 'easeOut': return t * (2 - t);
            case 'easeInOut': return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
            case 'step': return t < 1 ? 0 : 1;
            case 'linear':
            default: return t;
        }
    }
}

