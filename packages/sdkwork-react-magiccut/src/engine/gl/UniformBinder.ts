
import { logger } from '@sdkwork/react-commons'
import { EffectParameterSchema, ParameterValue } from '../../entities/effect.entity'; 
/**
 * Automatically binds values to WebGL Uniforms based on type inference and schema.
 */
export class UniformBinder {
    static bind(
        gl: WebGL2RenderingContext,
        location: WebGLUniformLocation,
        value: ParameterValue,
        type: EffectParameterSchema['type']
    ) {
        try {
            switch (type) {
                case 'float':
                    gl.uniform1f(location, Number(value));
                    break;
                case 'int':
                case 'boolean':
                case 'select':
                    // Boolean is often passed as 0/1 int or float in shader
                    gl.uniform1i(location, Number(value));
                    break;
                case 'vec2':
                    const v2 = value as { x: number; y: number };
                    if (v2 && typeof v2.x === 'number') {
                        gl.uniform2f(location, v2.x, v2.y);
                    }
                    break;
                case 'color':
                    // Expecting value as HEX string (#RRGGBB) or array
                    if (typeof value === 'string') {
                        const [r, g, b] = this.hexToRgb(value);
                        gl.uniform3f(location, r, g, b);
                    }
                    break;
            }
        } catch (e) {
            logger.warn(`[UniformBinder] Failed to bind uniform`, e);
        }
    }

    private static hexToRgb(hex: string): [number, number, number] {
        const cleanHex = hex.startsWith('#') ? hex.slice(1) : hex;
        const bigint = parseInt(cleanHex, 16);
        const r = (bigint >> 16) & 255;
        const g = (bigint >> 8) & 255;
        const b = bigint & 255;
        return [r / 255, g / 255, b / 255];
    }
}

