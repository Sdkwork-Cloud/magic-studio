
import { CutLayer } from '../../entities/magicCut.entity'
import { EffectKeyframe, ParameterValue, ParameterType } from '../../entities/effect.entity';
import { effectRegistry } from '../../services/effects/EffectRegistry';
import { ShaderManager } from '../gl/ShaderManager';
import { UniformBinder } from '../gl/UniformBinder';
import { FBO } from '../types'; 
import { RenderMatrices } from '../config/RenderConfig'

// Constants
// Use standard Full Screen Quad
const MAT3_NDC_QUAD = RenderMatrices.SCREEN_FULL_QUAD;

// Easing Helpers
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const Easings = {
    linear: (t: number) => t,
    easeIn: (t: number) => t * t,
    easeOut: (t: number) => t * (2 - t),
    easeInOut: (t: number) => t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    step: (t: number) => t < 1 ? 0 : 1
};

export class EffectSystem {
    constructor(private shaderManager: ShaderManager) {}

    private resolveParameter(
        paramVal: ParameterValue | EffectKeyframe[], 
        timeInClip: number, 
        duration: number,
        _type: ParameterType
    ): ParameterValue {
        if (!Array.isArray(paramVal)) return paramVal;
        if (paramVal.length === 0) return 0;
        
        const keyframes = paramVal as EffectKeyframe[];
        const normalizedTime = Math.max(0, Math.min(1, timeInClip / duration));

        if (normalizedTime <= keyframes[0].time) return keyframes[0].value;
        if (normalizedTime >= keyframes[keyframes.length - 1].time) return keyframes[keyframes.length - 1].value;

        for (let i = 0; i < keyframes.length - 1; i++) {
            const kfA = keyframes[i];
            const kfB = keyframes[i+1];
            
            if (normalizedTime >= kfA.time && normalizedTime < kfB.time) {
                const range = kfB.time - kfA.time;
                let t = (normalizedTime - kfA.time) / range;
                
                const easeFunc = Easings[kfA.easing || 'linear'] || Easings.linear;
                t = easeFunc(t);

                const vA = kfA.value as number;
                const vB = kfB.value as number;

                if (typeof vA === 'number' && typeof vB === 'number') {
                    return lerp(vA, vB, t);
                }
                return vA;
            }
        }
        return keyframes[0].value;
    }

    private bindUniforms(
        gl: WebGL2RenderingContext,
        shader: any,
        def: any,
        params: any,
        globals: { time: number, localTime: number, progress: number, w: number, h: number }
    ) {
        // Standards
        if (shader.uniforms.u_resolution) gl.uniform2f(shader.uniforms.u_resolution, globals.w, globals.h);
        if (shader.uniforms.u_time) gl.uniform1f(shader.uniforms.u_time, globals.time);
        if (shader.uniforms.u_local_time) gl.uniform1f(shader.uniforms.u_local_time, globals.localTime);
        if (shader.uniforms.u_progress) gl.uniform1f(shader.uniforms.u_progress, globals.progress);
        if (shader.uniforms.u_ratio) gl.uniform1f(shader.uniforms.u_ratio, globals.w / globals.h);
        if (shader.uniforms.u_texel_size) gl.uniform2f(shader.uniforms.u_texel_size, 1.0/globals.w, 1.0/globals.h);

        // Transforms (Standard full-screen quad for filters)
        gl.uniformMatrix3fv(shader.uniforms.u_matrix, false, MAT3_NDC_QUAD);
        
        // CRITICAL: We are sampling from an FBO texture. 
        // All textures in this pipeline are Top-Down (Row 0 is Visual Top).
        // GL UV (0,0) reads Bottom. 
        // We use FLIP_Y matrix to correct sampling.
        gl.uniformMatrix3fv(shader.uniforms.u_textureMatrix, false, RenderMatrices.FLIP_Y);

        // Custom Params
        Object.keys(def.parameters).forEach(key => {
            if (shader.uniforms[key] !== undefined) {
                const rawVal = params[key] ?? def.parameters[key].default;
                const val = this.resolveParameter(rawVal, globals.localTime, 1.0, def.parameters[key].type);
                UniformBinder.bind(gl, shader.uniforms[key], val, def.parameters[key].type);
            }
        });
    }

    public applyFilters(
        gl: WebGL2RenderingContext,
        inputTexture: WebGLTexture,
        filters: CutLayer[],
        fboAux: FBO,
        fboSwap: FBO,
        renderGlobals: { time: number, localTime: number, progress: number },
        resolution: { width: number, height: number },
        vaoQuad: WebGLVertexArrayObject
    ): { texture: WebGLTexture, fbo: FBO | null } {
        
        let currentTexture = inputTexture;
        let outputFBO = fboAux;
        let inputFBO = null; 

        if (filters.length === 0) return { texture: currentTexture, fbo: null };

        gl.disable(gl.BLEND); // Filters are destructive

        for (const filter of filters) {
            const def = effectRegistry.get(filter.params.definitionId);
            if (!def) continue;

            const shader = this.shaderManager.get(`effect_${def.id}`, def.fragmentShader);
            if (!shader) continue;

            gl.bindFramebuffer(gl.FRAMEBUFFER, outputFBO.fbo);
            gl.viewport(0, 0, resolution.width, resolution.height);
            
            gl.useProgram(shader.program);
            gl.bindVertexArray(vaoQuad);

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, currentTexture);
            gl.uniform1i(shader.uniforms.u_image, 0);

            this.bindUniforms(gl, shader, def, filter.params, {
                ...renderGlobals,
                w: resolution.width,
                h: resolution.height
            });

            gl.drawArrays(gl.TRIANGLES, 0, 6);

            currentTexture = outputFBO.texture;
            inputFBO = outputFBO;
            outputFBO = (outputFBO === fboAux) ? fboSwap : fboAux;
        }

        gl.enable(gl.BLEND);
        return { texture: currentTexture, fbo: inputFBO };
    }

    public getTransitionShader(transitionLayer: CutLayer) {
        const def = effectRegistry.get(transitionLayer.params.definitionId);
        if (!def) return null;
        return { 
            shader: this.shaderManager.get(`trans_${def.id}`, def.fragmentShader), 
            def 
        };
    }
    
    public bindTransitionUniforms(
        gl: WebGL2RenderingContext,
        shader: any,
        def: any,
        layer: CutLayer,
        progress: number,
        resolution: { width: number, height: number }
    ) {
         this.bindUniforms(gl, shader, def, layer.params, {
             time: 0, localTime: 0, progress, w: resolution.width, h: resolution.height
         });
         
         if (shader.uniforms.u_mix_progress !== undefined) {
             gl.uniform1f(shader.uniforms.u_mix_progress, progress);
         }
    }
}

