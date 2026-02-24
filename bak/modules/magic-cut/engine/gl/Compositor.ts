
import { FBO, RenderContext } from '../types';
import { BlendMode } from '../../entities/magicCut.entity';
import { SHADER_LIB } from '../../services/effects/DefaultShaders';

export class Compositor {
    private gl: WebGL2RenderingContext;
    private fboPool: FBO[] = [];
    private activeFBOs: Set<FBO> = new Set();
    private static readonly MAX_FBO_POOL = 32;

    constructor(gl: WebGL2RenderingContext) {
        this.gl = gl;
    }

    public createFBO(width: number, height: number): FBO {
        const gl = this.gl;
        
        const texture = gl.createTexture()!;
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        const fbo = gl.createFramebuffer()!;
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
        gl.clearColor(0.0, 0.0, 0.0, 0.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        return { texture, fbo, width, height };
    }

    public requestFBO(width: number, height: number): FBO {
        const existing = this.fboPool.find(f => !this.activeFBOs.has(f) && f.width === width && f.height === height);
        
        if (existing) {
            this.activeFBOs.add(existing);
            this.clearFBO(existing);
            return existing;
        }

        if (this.fboPool.length >= Compositor.MAX_FBO_POOL) {
            const idleIdx = this.fboPool.findIndex(f => !this.activeFBOs.has(f));
            if (idleIdx >= 0) {
                const evicted = this.fboPool[idleIdx];
                this.gl.deleteFramebuffer(evicted.fbo);
                this.gl.deleteTexture(evicted.texture);
                this.fboPool.splice(idleIdx, 1);
            }
        }

        const newFbo = this.createFBO(width, height);
        this.fboPool.push(newFbo);
        this.activeFBOs.add(newFbo);
        return newFbo;
    }

    private clearFBO(fbo: FBO): void {
        const gl = this.gl;
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo.fbo);
        gl.clearColor(0.0, 0.0, 0.0, 0.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    public releaseFBO(fbo: FBO): void {
        this.activeFBOs.delete(fbo);
    }

    public cleanup(): void {
        const gl = this.gl;
        this.fboPool.forEach(f => {
            gl.deleteFramebuffer(f.fbo);
            gl.deleteTexture(f.texture);
        });
        this.fboPool = [];
        this.activeFBOs.clear();
    }

    public blit(
        ctx: RenderContext,
        texture: WebGLTexture,
        opacity: number = 1.0,
        blendMode: BlendMode = 'normal',
        transformMatrix?: Float32Array,
        textureMatrix?: Float32Array
    ): void {
        const gl = this.gl;
        const shader = ctx.shaderManager.get('basic', SHADER_LIB.basic);
        
        if (!shader) {
            console.warn('[Compositor] Shader not found: basic');
            return;
        }

        gl.disable(gl.BLEND);
        this.applyBlendMode(gl, blendMode);
        
        if (opacity < 1.0 || blendMode !== 'normal') {
            gl.enable(gl.BLEND);
        }

        gl.useProgram(shader.program);
        gl.bindVertexArray(ctx.vaoQuad);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(shader.uniforms.u_image, 0);

        gl.uniform1f(shader.uniforms.u_opacity, opacity);

        const matrix = transformMatrix || new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]);
        gl.uniformMatrix3fv(shader.uniforms.u_matrix, false, matrix);

        const texMatrix = textureMatrix || new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]);
        gl.uniformMatrix3fv(shader.uniforms.u_textureMatrix, false, texMatrix);

        gl.drawArrays(gl.TRIANGLES, 0, 6);

        if (blendMode === 'darken' || blendMode === 'lighten') {
            gl.blendEquation(gl.FUNC_ADD);
        }
    }

    private applyBlendMode(gl: WebGL2RenderingContext, mode: BlendMode): void {
        switch (mode) {
            case 'add':
                gl.blendEquation(gl.FUNC_ADD);
                gl.blendFunc(gl.ONE, gl.ONE);
                break;
            case 'screen':
                gl.blendEquation(gl.FUNC_ADD);
                gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_COLOR);
                break;
            case 'multiply':
                gl.blendEquation(gl.FUNC_ADD);
                gl.blendFunc(gl.DST_COLOR, gl.ONE_MINUS_SRC_ALPHA);
                break;
            case 'overlay':
                gl.blendEquation(gl.FUNC_ADD);
                gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
                break;
            case 'darken':
                gl.blendEquation(gl.MIN);
                gl.blendFunc(gl.ONE, gl.ONE);
                break;
            case 'lighten':
                gl.blendEquation(gl.MAX);
                gl.blendFunc(gl.ONE, gl.ONE);
                break;
            case 'normal':
            default:
                gl.blendEquation(gl.FUNC_ADD);
                gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
                break;
        }
    }
}
