
import { CutClip, CutLayer } from '../../entities/magicCut.entity';
import { AnyMediaResource } from '@sdkwork/react-commons';
import { RenderContext, FBO } from '../types';
import { ClipStrategyFactory } from './ClipRenderStrategies';
import { RenderMatrices } from '../config/RenderConfig';

export interface TextureResult {
    texture: WebGLTexture;
    isFBO: boolean;
    fbo: FBO | null;
}

export class TrackRenderer {
    public clipFactory: ClipStrategyFactory;

    constructor() {
        this.clipFactory = new ClipStrategyFactory();
    }

    /**
     * Prepares the final texture for a clip.
     * Returns the texture and an indicator if it is an FBO (requiring different matrix application).
     */
    public prepareClipTexture(
        ctx: RenderContext,
        clip: CutClip,
        resource: AnyMediaResource,
        layersMap: Record<string, CutLayer>,
        time: number,
        isPlaying: boolean,
        renderSize?: { width: number; height: number }
    ): TextureResult | null {
        const { gl, compositor, effectSystem, emptyTexture } = ctx;

        const strategy = this.clipFactory.getStrategy(resource.type);
        if (!strategy) return null;

        // 1. Get Source Texture (Upload/Update)
        // CRITICAL FIX: Always return a valid texture to prevent black frames
        // Strategy now guarantees to return either cached texture or emptyTexture
        let rawTexture = strategy.getTexture(ctx, clip, resource, time, isPlaying);
        
        // If strategy returns null, use emptyTexture but still allow rendering
        if (!rawTexture) {
            rawTexture = emptyTexture;
        }

        // 2. Check for active filter effects
        const activeLayers = (clip.layers || [])
            .map(ref => layersMap[ref.id])
            .filter(l => l && l.enabled && l.layerType === 'filter');

        // FAST PATH: No effects? Return raw texture directly.
        if (activeLayers.length === 0) {
            return { texture: rawTexture, isFBO: false, fbo: null };
        }

        // SLOW PATH: Apply Effects Chain via FBOs

        const effectWidth = renderSize?.width ?? ctx.width;
        const effectHeight = renderSize?.height ?? ctx.height;

        const rawFBO = compositor.requestFBO(effectWidth, effectHeight);
        const auxFBO = compositor.requestFBO(effectWidth, effectHeight);

        // Render raw texture into rawFBO first (Base Pass)
        gl.bindFramebuffer(gl.FRAMEBUFFER, rawFBO.fbo);
        gl.viewport(0, 0, rawFBO.width, rawFBO.height);
        gl.clearColor(0.0, 0.0, 0.0, 0.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        // Draw raw texture to FBO using SCREEN_FULL_QUAD to fill entire FBO.
        // Raw texture is Top-Down (Row 0 = Visual Top). We keep the same
        // convention in the FBO by NOT flipping �� ensuring the entire
        // pipeline is consistently Top-Down until final screen output.
        compositor.blit(ctx, rawTexture, 1.0, 'normal', RenderMatrices.SCREEN_FULL_QUAD);

        const clipTime = time - clip.start;
        const clipProgress = Math.max(0, Math.min(1, clipTime / clip.duration));

        // Apply filters (Ping-Pong)
        const res = effectSystem.applyFilters(
            gl, rawFBO.texture, activeLayers, auxFBO, rawFBO,
            { time, localTime: clipTime, progress: clipProgress },
            { width: effectWidth, height: effectHeight },
            ctx.vaoQuad
        );

        const finalTexture = res.texture;

        // Release the FBO that is NOT holding the result
        if (res.fbo === rawFBO) {
            compositor.releaseFBO(auxFBO);
        } else if (res.fbo === auxFBO) {
            compositor.releaseFBO(rawFBO);
        } else {
            // No effect was actually applied (all defs missing), release both
            compositor.releaseFBO(rawFBO);
            compositor.releaseFBO(auxFBO);
            return { texture: rawTexture, isFBO: false, fbo: null };
        }

        return { texture: finalTexture, isFBO: true, fbo: res.fbo ?? null };
    }
}
