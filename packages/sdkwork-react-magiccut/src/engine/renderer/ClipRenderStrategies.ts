import { CutClip } from '../../entities/magicCut.entity';
import { AnyMediaResource, MediaResourceType } from '@sdkwork/react-commons';
import { RenderContext } from '../types';
import { textRenderer, TextStyle, DEFAULT_TEXT_STYLE } from '../text/TextRenderer';

export interface IClipRenderStrategy {
    supports(type: MediaResourceType): boolean;
    getTexture(
        ctx: RenderContext,
        clip: CutClip,
        resource: AnyMediaResource,
        time: number,
        isPlaying: boolean
    ): WebGLTexture | null;
}

export class VideoClipStrategy implements IClipRenderStrategy {
    private lastUploadTime = new Map<string, number>();

    supports(type: MediaResourceType) { return type === MediaResourceType.VIDEO; }
    
    getTexture(ctx: RenderContext, clip: CutClip, resource: AnyMediaResource, _time: number, _isPlaying: boolean): WebGLTexture | null {
        const { gl, resourceManager, textureCache, emptyTexture } = ctx;
        const url = resourceManager.resolveResourceUrl(resource);
        
        if (!url) {
            return emptyTexture;
        }

        const video = resourceManager.getVideoElement(clip.id, url);
        
        const hasData = video.readyState >= 2;
        const hasDimensions = video.videoWidth > 0 && video.videoHeight > 0;
        
        if (!hasData || !hasDimensions) {
            return emptyTexture;
        }

        let tex = textureCache.get(clip.id);
        const currentVideoTime = video.currentTime;
        const lastTime = this.lastUploadTime.get(clip.id);
        const timeDiff = lastTime !== undefined ? Math.abs(currentVideoTime - lastTime) : Infinity;
        const needsUpload = !tex || timeDiff > 0.004;

        if (needsUpload) {
            const isNew = !tex;
            if (isNew) {
                tex = gl.createTexture()!;
                gl.bindTexture(gl.TEXTURE_2D, tex);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            } else {
                gl.bindTexture(gl.TEXTURE_2D, tex ?? null);
            }

            try {
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
                textureCache.set(clip.id, tex!, video.videoWidth, video.videoHeight);
                this.lastUploadTime.set(clip.id, currentVideoTime);
            } catch (e) {
                return emptyTexture;
            }
        }

        return tex || emptyTexture;
    }
}

export class ImageClipStrategy implements IClipRenderStrategy {
    supports(type: MediaResourceType) { return type === MediaResourceType.IMAGE; }
    
    getTexture(ctx: RenderContext, _clip: CutClip, resource: AnyMediaResource, _time: number, _isPlaying: boolean): WebGLTexture | null {
        const { gl, resourceManager, textureCache, emptyTexture } = ctx;
        let tex = textureCache.get(resource.id);
        
        if (!tex) {
            const url = resourceManager.resolveResourceUrl(resource);
            if (!url) return emptyTexture;
            
            const img = resourceManager.getImageElement(resource.id, url);
            if (img.complete && img.naturalWidth > 0) {
                tex = gl.createTexture()!;
                gl.bindTexture(gl.TEXTURE_2D, tex);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                textureCache.set(resource.id, tex, img.naturalWidth, img.naturalHeight);
            }
        }
        
        return tex || emptyTexture;
    }
}

export class TextClipStrategy implements IClipRenderStrategy {
    private hashCache = new Map<string, string>();

    supports(type: MediaResourceType) {
        return type === MediaResourceType.TEXT || type === MediaResourceType.SUBTITLE;
    }

    getTexture(ctx: RenderContext, clip: CutClip, resource: AnyMediaResource, _time: number, _isPlaying: boolean): WebGLTexture | null {
        const { gl, textureCache, emptyTexture } = ctx;

        const textContent = clip.content || resource.name || "Text";
        const baseMeta = (resource as any).metadata || {};
        const overrides = clip.style || {};
        const transformScale = clip.transform?.scale || 1.0;
        const RENDER_SCALE = Math.min(3.0, Math.max(1.0, transformScale * 1.5));

        const fontSize = (overrides.fontSize || baseMeta.fontSize || DEFAULT_TEXT_STYLE.fontSize) * RENDER_SCALE;

        const style: TextStyle = {
            fontFamily: overrides.fontFamily || baseMeta.fontFamily || DEFAULT_TEXT_STYLE.fontFamily,
            fontSize: fontSize,
            color: overrides.color || baseMeta.color || DEFAULT_TEXT_STYLE.color,
            fontWeight: overrides.fontWeight || baseMeta.fontWeight || DEFAULT_TEXT_STYLE.fontWeight,
            fontStyle: overrides.fontStyle || baseMeta.fontStyle,
            textAlign: overrides.textAlign || baseMeta.textAlign || DEFAULT_TEXT_STYLE.textAlign,
            lineHeight: overrides.lineHeight || baseMeta.lineHeight || DEFAULT_TEXT_STYLE.lineHeight,
            letterSpacing: overrides.letterSpacing ?? baseMeta.letterSpacing ?? DEFAULT_TEXT_STYLE.letterSpacing,
            strokeColor: overrides.strokeColor || baseMeta.strokeColor || DEFAULT_TEXT_STYLE.strokeColor,
            strokeWidth: (overrides.strokeWidth ?? baseMeta.strokeWidth ?? 0) * RENDER_SCALE,
            shadowColor: overrides.shadowColor || baseMeta.shadowColor || DEFAULT_TEXT_STYLE.shadowColor,
            shadowBlur: (overrides.shadowBlur ?? baseMeta.shadowBlur ?? 0) * RENDER_SCALE,
            shadowOffsetX: (overrides.shadowOffsetX ?? baseMeta.shadowOffsetX ?? 0) * RENDER_SCALE,
            shadowOffsetY: (overrides.shadowOffsetY ?? baseMeta.shadowOffsetY ?? 0) * RENDER_SCALE,
            backgroundColor: overrides.backgroundColor || baseMeta.backgroundColor,
            backgroundPadding: (overrides.backgroundPadding ?? baseMeta.backgroundPadding ?? 20) * RENDER_SCALE,
            backgroundCornerRadius: (overrides.backgroundCornerRadius ?? baseMeta.backgroundCornerRadius ?? 10) * RENDER_SCALE,
        };

        const hash = `${clip.id}:${textContent}:${JSON.stringify(style)}`;
        const lastHash = this.hashCache.get(clip.id);
        let tex = textureCache.get(clip.id);

        if (lastHash !== hash || !tex) {
            const textCanvas = textRenderer.render(textContent, style);
            if (!tex) tex = gl.createTexture()!;

            gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textCanvas);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

            textureCache.set(clip.id, tex, textCanvas.width, textCanvas.height);
            this.hashCache.set(clip.id, hash);
        }

        return tex || emptyTexture;
    }
}

export class ClipStrategyFactory {
    private strategies: IClipRenderStrategy[] = [
        new VideoClipStrategy(),
        new ImageClipStrategy(),
        new TextClipStrategy()
    ];

    public getStrategy(type: MediaResourceType): IClipRenderStrategy | undefined {
        return this.strategies.find(s => s.supports(type));
    }
}

