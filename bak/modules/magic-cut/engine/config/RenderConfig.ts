
/**
 * RENDER CONFIGURATION
 * Single Source of Truth for Coordinate Systems and Matrices.
 * 
 * REFACTOR STANDARD (v2.0):
 * - Global GL State: UNPACK_FLIP_Y_WEBGL is ALWAYS FALSE.
 * - Texture Memory: Stores data Top-Down (Row 0 is Image Top).
 * - GL UV Space: (0,0) is Bottom-Left.
 * 
 * CONSEQUENCE:
 * Raw textures (Image/Video) appear Upside-Down in GL UV space.
 * FBO textures (rendered with Top-Down projection) also appear Upside-Down in GL UV space.
 * 
 * SOLUTION:
 * We apply a standard FLIP_Y matrix to ALL samplers to correct this at the shader level.
 * This unifies the pipeline: Source -> FBO -> Screen all use the same logic.
 */

// Column-Major Matrices for WebGL
export const RenderMatrices = {
    // Identity Matrix (No change)
    IDENTITY: new Float32Array([
        1, 0, 0,
        0, 1, 0, 
        0, 0, 1
    ]),

    // Y-Flip Matrix for Textures
    // Maps UV (0..1) to (0..1) but flips Y: y' = 1 - y
    // Use this when sampling textures uploaded with UNPACK_FLIP_Y=false
    FLIP_Y: new Float32Array([
        1,  0, 0,
        0, -1, 0,
        0,  1, 1
    ]),

    // Full Screen Quad Projection
    // Maps a 0..1 unit quad to -1..1 NDC space
    SCREEN_FULL_QUAD: new Float32Array([
        2,  0, 0,
        0,  2, 0,
        -1, -1, 1
    ])
};

export const Matrix3Ops = {
    create: () => new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]),

    /**
     * Creates an Orthographic Projection Matrix.
     * Maps Pixel Coordinates (0..width, 0..height) to NDC (-1..1, 1..-1).
     * Note: We use Top-Down Y (0 at top, H at bottom).
     */
    projection: (out: Float32Array, width: number, height: number) => {
        out[0] = 2 / width;
        out[1] = 0;
        out[2] = 0;
        out[3] = 0;
        out[4] = -2 / height; // NEGATIVE flips Y axis to match DOM/Canvas coordinates (Top-Down)
        out[5] = 0;
        out[6] = -1;
        out[7] = 1;
        out[8] = 1;
        return out;
    },

    translate: (out: Float32Array, a: Float32Array, x: number, y: number) => {
        const a00 = a[0], a01 = a[1], a02 = a[2];
        const a10 = a[3], a11 = a[4], a12 = a[5];
        const a20 = a[6], a21 = a[7], a22 = a[8];

        out[0] = a00;
        out[1] = a01;
        out[2] = a02;
        out[3] = a10;
        out[4] = a11;
        out[5] = a12;
        out[6] = x * a00 + y * a10 + a20;
        out[7] = x * a01 + y * a11 + a21;
        out[8] = x * a02 + y * a12 + a22;
        return out;
    },

    rotate: (out: Float32Array, a: Float32Array, rad: number) => {
        const a00 = a[0], a01 = a[1], a02 = a[2];
        const a10 = a[3], a11 = a[4], a12 = a[5];
        const s = Math.sin(rad);
        const c = Math.cos(rad);

        out[0] = c * a00 + s * a10;
        out[1] = c * a01 + s * a11;
        out[2] = c * a02 + s * a12;
        out[3] = c * a10 - s * a00;
        out[4] = c * a11 - s * a01;
        out[5] = c * a12 - s * a02;
        // Preserve translation row — critical for correct positioning
        out[6] = a[6];
        out[7] = a[7];
        out[8] = a[8];
        return out;
    },

    scale: (out: Float32Array, a: Float32Array, x: number, y: number) => {
        out[0] = a[0] * x;
        out[1] = a[1] * x;
        out[2] = a[2] * x;
        out[3] = a[3] * y;
        out[4] = a[4] * y;
        out[5] = a[5] * y;
        return out;
    }
};
