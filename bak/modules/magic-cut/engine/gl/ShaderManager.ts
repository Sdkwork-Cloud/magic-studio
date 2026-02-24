
import { SHADER_LIB } from '../../services/effects/DefaultShaders';
import { logger } from '../../utils/logger';

export interface ShaderProgram {
    program: WebGLProgram;
    uniforms: Record<string, WebGLUniformLocation>;
    attributes: Record<string, number>;
}

export class ShaderManager {
    private gl: WebGL2RenderingContext;
    private cache = new Map<string, ShaderProgram>();

    constructor(gl: WebGL2RenderingContext) {
        this.gl = gl;
    }

    public get(id: string, fragmentSource: string, vertexSource: string = SHADER_LIB.VERTEX_DEFAULT): ShaderProgram | null {
        if (this.cache.has(id)) {
            return this.cache.get(id)!;
        }

        const program = this.createProgram(vertexSource, fragmentSource);
        if (!program) return null;

        const shaderData = this.introspectProgram(program);
        this.cache.set(id, shaderData);
        return shaderData;
    }

    private createShader(type: number, source: string): WebGLShader | null {
        const shader = this.gl.createShader(type);
        if (!shader) return null;
        
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);

        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            logger.error('[ShaderManager] Compile error:', this.gl.getShaderInfoLog(shader));
            this.gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    private createProgram(vsSource: string, fsSource: string): WebGLProgram | null {
        const vs = this.createShader(this.gl.VERTEX_SHADER, vsSource);
        const fs = this.createShader(this.gl.FRAGMENT_SHADER, fsSource);
        if (!vs || !fs) return null;

        const program = this.gl.createProgram();
        if (!program) return null;

        this.gl.attachShader(program, vs);
        this.gl.attachShader(program, fs);
        this.gl.linkProgram(program);

        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            logger.error('[ShaderManager] Link error:', this.gl.getProgramInfoLog(program));
            this.gl.deleteProgram(program);
            return null;
        }

        // Cleanup shaders after link
        this.gl.deleteShader(vs);
        this.gl.deleteShader(fs);

        return program;
    }

    private introspectProgram(program: WebGLProgram): ShaderProgram {
        const uniforms: Record<string, WebGLUniformLocation> = {};
        const attributes: Record<string, number> = {};

        const numUniforms = this.gl.getProgramParameter(program, this.gl.ACTIVE_UNIFORMS);
        for (let i = 0; i < numUniforms; ++i) {
            const info = this.gl.getActiveUniform(program, i);
            if (info) {
                const loc = this.gl.getUniformLocation(program, info.name);
                if (loc) uniforms[info.name] = loc;
            }
        }

        const numAttribs = this.gl.getProgramParameter(program, this.gl.ACTIVE_ATTRIBUTES);
        for (let i = 0; i < numAttribs; ++i) {
            const info = this.gl.getActiveAttrib(program, i);
            if (info) {
                const loc = this.gl.getAttribLocation(program, info.name);
                if (loc !== -1) attributes[info.name] = loc;
            }
        }

        return { program, uniforms, attributes };
    }

    public cleanup() {
        this.cache.forEach(s => this.gl.deleteProgram(s.program));
        this.cache.clear();
    }
}
