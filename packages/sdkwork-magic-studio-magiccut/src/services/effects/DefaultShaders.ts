
const STANDARD_VERTEX = `#version 300 es
layout(location = 0) in vec2 a_position;
layout(location = 1) in vec2 a_texCoord;
uniform mat3 u_matrix;
uniform mat3 u_textureMatrix;
out vec2 v_texCoord;
out vec2 v_backdropCoord;

void main() {
  vec3 pos = u_matrix * vec3(a_position, 1.0);
  gl_Position = vec4(pos.xy, 0.0, 1.0);
  v_texCoord = (u_textureMatrix * vec3(a_texCoord, 1.0)).xy;
  v_backdropCoord = (pos.xy + 1.0) / 2.0;
}
`;

/**
 * Professional GLSL Math & Utility Library
 */
const GLSL_HEADER = `
precision highp float;
uniform vec2 u_resolution;
uniform vec2 u_texel_size;
uniform float u_ratio; 
uniform float u_time; 
uniform float u_local_time; 
uniform float u_progress;

#define PI 3.14159265359

// --- Alpha Handling Helpers ---
// Critical for correct color grading on semi-transparent pixels

vec3 unpremultiply(vec4 color) {
    if (color.a == 0.0) return vec3(0.0);
    return color.rgb / color.a;
}

vec4 premultiply(vec3 rgb, float a) {
    return vec4(rgb * a, a);
}

// --- Utils ---
float rand(vec2 co) {
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

float noise(vec2 p) {
    vec2 ip = floor(p);
    vec2 u = fract(p);
    u = u*u*(3.0-2.0*u);
    float res = mix(
        mix(rand(ip), rand(ip+vec2(1.0,0.0)), u.x),
        mix(rand(ip+vec2(0.0,1.0)), rand(ip+vec2(1.0,1.0)), u.x), u.y);
    return res*res;
}

vec3 rgb2hsv(vec3 c) {
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

// Luminance (Perceived Brightness)
float luma(vec3 color) {
    return dot(color, vec3(0.299, 0.587, 0.114));
}

// Color Temperature Adjustment
vec3 colorTemp(vec3 color, float temp) {
    // Temp range -1.0 (Cool) to 1.0 (Warm)
    vec3 outColor = color;
    outColor.r += temp * 0.2;
    outColor.b -= temp * 0.2;
    // Compensate green slightly to maintain brightness
    outColor.g += temp * 0.05; 
    return clamp(outColor, 0.0, 1.0);
}

// Tint Adjustment
vec3 colorTint(vec3 color, float tint) {
    // Tint range -1.0 (Green) to 1.0 (Magenta)
    vec3 outColor = color;
    outColor.g -= tint * 0.2;
    return clamp(outColor, 0.0, 1.0);
}
`;

export const SHADER_LIB = {
    VERTEX_DEFAULT: STANDARD_VERTEX,
    header: GLSL_HEADER,

    // --- CORE ---
    basic: `#version 300 es
        ${GLSL_HEADER}
        uniform sampler2D u_image;
        uniform float u_opacity;
        in vec2 v_texCoord;
        out vec4 outColor;
        void main() {
            vec4 color = texture(u_image, v_texCoord);
            // Opacity is applied to the already pre-multiplied color (standard WebGL blend)
            outColor = color * u_opacity;
        }
    `,

    // --- COLOR ADJUSTMENTS ---
    
    // Hue / Saturation / Lightness
    hsl: `#version 300 es
        ${GLSL_HEADER}
        uniform sampler2D u_image;
        uniform float u_hue;        // -0.5 to 0.5 (rotates -180 to 180)
        uniform float u_saturation; // 0.0 to 2.0
        uniform float u_lightness;  // -1.0 to 1.0
        
        in vec2 v_texCoord;
        out vec4 outColor;
        
        void main() {
            vec4 tex = texture(u_image, v_texCoord);
            vec3 color = unpremultiply(tex);
            
            // Convert to HSV
            vec3 hsv = rgb2hsv(color);
            
            // Hue
            hsv.x += u_hue;
            if(hsv.x < 0.0) hsv.x += 1.0;
            if(hsv.x > 1.0) hsv.x -= 1.0;
            
            // Saturation
            hsv.y *= u_saturation;
            
            // Lightness (Value in HSV)
            hsv.z += u_lightness;
            
            color = hsv2rgb(hsv);
            outColor = premultiply(clamp(color, 0.0, 1.0), tex.a);
        }
    `,
    
    colorBalance: `#version 300 es
        ${GLSL_HEADER}
        uniform sampler2D u_image;
        uniform vec3 u_shadows;    // RGB Shift for darks (-1 to 1)
        uniform vec3 u_midtones;   // RGB Shift for mids
        uniform vec3 u_highlights; // RGB Shift for lights
        
        in vec2 v_texCoord;
        out vec4 outColor;

        vec3 applyBalance(vec3 col, vec3 shadows, vec3 mids, vec3 lights) {
            float lum = luma(col);
            
            // Weighting curves for 3-way color wheels
            float wShadow = 1.0 - smoothstep(0.0, 0.5, lum);
            float wHighlight = smoothstep(0.5, 1.0, lum);
            float wMid = 1.0 - wShadow - wHighlight;
            
            // Apply shifts
            vec3 shift = shadows * wShadow + mids * wMid + lights * wHighlight;
            
            // Add shift (scaled down for usability)
            return clamp(col + shift * 0.2, 0.0, 1.0); 
        }
        
        void main() {
            vec4 tex = texture(u_image, v_texCoord);
            vec3 color = unpremultiply(tex);
            
            color = applyBalance(color, u_shadows, u_midtones, u_highlights);
            
            outColor = premultiply(color, tex.a);
        }
    `,

    duotone: `#version 300 es
        ${GLSL_HEADER}
        uniform sampler2D u_image;
        uniform vec3 u_color1; // Shadow color
        uniform vec3 u_color2; // Highlight color
        
        in vec2 v_texCoord;
        out vec4 outColor;
        
        void main() {
            vec4 tex = texture(u_image, v_texCoord);
            vec3 color = unpremultiply(tex);
            float lum = luma(color);
            
            // Map luminance to gradient
            vec3 mapped = mix(u_color1, u_color2, lum);
            
            // Mix with original alpha
            outColor = premultiply(mapped, tex.a);
        }
    `,

    cinematicColor: `#version 300 es
        ${GLSL_HEADER}
        uniform sampler2D u_image;
        
        uniform float u_temperature; 
        uniform float u_tint;        
        uniform float u_saturation;  
        uniform float u_contrast;    
        uniform float u_exposure;    
        uniform float u_vibrance;    

        in vec2 v_texCoord;
        out vec4 outColor;
        
        void main() {
            vec4 tex = texture(u_image, v_texCoord);
            vec3 color = unpremultiply(tex);
            
            // 1. Exposure
            color *= pow(2.0, u_exposure);
            
            // 2. White Balance (Temp/Tint)
            color = colorTemp(color, u_temperature);
            color = colorTint(color, u_tint);
            
            // 3. Contrast (Pivot around 0.5)
            color = (color - 0.5) * u_contrast + 0.5;
            
            // 4. Saturation (Linear)
            float luminance = luma(color);
            color = mix(vec3(luminance), color, u_saturation);
            
            // 5. Vibrance (Smart Saturation)
            float sat = max(color.r, max(color.g, color.b)) - min(color.r, min(color.g, color.b));
            vec3 vibColor = mix(vec3(luminance), color, 1.0 + (u_vibrance * (1.0 - sat)));
            color = mix(color, vibColor, 0.5);

            color = clamp(color, 0.0, 1.0);
            outColor = premultiply(color, tex.a);
        }
    `,

    lut: `#version 300 es
        ${GLSL_HEADER}
        uniform sampler2D u_image;
        uniform sampler3D u_lut;
        uniform float u_intensity;
        
        in vec2 v_texCoord;
        out vec4 outColor;
        
        void main() {
            vec4 tex = texture(u_image, v_texCoord);
            vec3 color = unpremultiply(tex);
            
            vec3 lutColor = texture(u_lut, color).rgb;
            
            color = mix(color, lutColor, u_intensity);
            
            outColor = premultiply(color, tex.a);
        }
    `,

    colorGrade: `#version 300 es
        ${GLSL_HEADER}
        uniform sampler2D u_image;
        uniform sampler3D u_lut;
        uniform float u_lutIntensity;
        
        uniform float u_exposure;
        uniform float u_contrast;
        uniform float u_saturation;
        uniform float u_temperature;
        uniform float u_tint;
        uniform float u_highlights;
        uniform float u_shadows;
        uniform float u_whites;
        uniform float u_blacks;
        uniform float u_vibrance;
        uniform vec3 u_highlightColor;
        uniform vec3 u_shadowColor;
        uniform vec3 u_midtoneColor;
        
        in vec2 v_texCoord;
        out vec4 outColor;
        
        vec3 liftGammaGain(vec3 color, float lift, float gamma, float gain) {
            color = color * (1.0 + gain) + lift;
            color = pow(color, vec3(1.0 / max(0.01, gamma)));
            return color;
        }
        
        vec3 splitToning(vec3 color, vec3 highlightColor, vec3 shadowColor) {
            float lum = luma(color);
            
            float highlightWeight = smoothstep(0.5, 1.0, lum);
            float shadowWeight = smoothstep(0.5, 0.0, lum);
            
            color += highlightColor * highlightWeight * 0.3;
            color += shadowColor * shadowColor * 0.3;
            
            return color;
        }
        
        void main() {
            vec4 tex = texture(u_image, v_texCoord);
            vec3 color = unpremultiply(tex);
            
            color *= pow(2.0, u_exposure);
            
            color = colorTemp(color, u_temperature);
            color = colorTint(color, u_tint);
            
            color = (color - 0.5) * u_contrast + 0.5;
            
            float lum = luma(color);
            float highlightMask = smoothstep(0.5, 1.0, lum);
            float shadowMask = smoothstep(0.5, 0.0, lum);
            
            color += u_highlights * 0.1 * highlightMask;
            color += u_shadows * 0.1 * shadowMask;
            
            color = liftGammaGain(color, u_blacks * 0.1, 1.0 + u_whites * 0.1, 1.0);
            
            float luminance = luma(color);
            color = mix(vec3(luminance), color, u_saturation);
            
            float sat = max(color.r, max(color.g, color.b)) - min(color.r, min(color.g, color.b));
            vec3 vibColor = mix(vec3(luminance), color, 1.0 + (u_vibrance * (1.0 - sat)));
            color = mix(color, vibColor, 0.5);
            
            color = splitToning(color, u_highlightColor, u_shadowColor);
            
            if (u_lutIntensity > 0.0) {
                vec3 lutColor = texture(u_lut, clamp(color, 0.0, 1.0)).rgb;
                color = mix(color, lutColor, u_lutIntensity);
            }
            
            color = clamp(color, 0.0, 1.0);
            outColor = premultiply(color, tex.a);
        }
    `,

    mask: `#version 300 es
        ${GLSL_HEADER}
        uniform sampler2D u_image;
        uniform sampler2D u_mask;
        uniform float u_feather;
        uniform float u_expansion;
        uniform bool u_inverted;
        
        in vec2 v_texCoord;
        out vec4 outColor;
        
        void main() {
            vec4 tex = texture(u_image, v_texCoord);
            float maskValue = texture(u_mask, v_texCoord).r;
            
            if (u_inverted) {
                maskValue = 1.0 - maskValue;
            }
            
            if (u_feather > 0.0) {
                float step = u_texel_size.x * u_feather;
                float blur = 0.0;
                float total = 0.0;
                
                for (float x = -2.0; x <= 2.0; x += 1.0) {
                    for (float y = -2.0; y <= 2.0; y += 1.0) {
                        vec2 offset = vec2(x, y) * step;
                        float weight = 1.0 - length(vec2(x, y)) / 3.0;
                        blur += texture(u_mask, v_texCoord + offset).r * weight;
                        total += weight;
                    }
                }
                maskValue = blur / total;
                
                if (u_inverted) {
                    maskValue = 1.0 - maskValue;
                }
            }
            
            outColor = vec4(tex.rgb, tex.a * maskValue);
        }
    `,

    shapeMask: `#version 300 es
        ${GLSL_HEADER}
        uniform sampler2D u_image;
        uniform vec2 u_center;
        uniform vec2 u_size;
        uniform float u_rotation;
        uniform float u_feather;
        uniform float u_corner_radius;
        uniform bool u_inverted;
        uniform int u_shape_type;
        
        in vec2 v_texCoord;
        out vec4 outColor;
        
        float roundedBoxSDF(vec2 centerPos, vec2 size, float radius) {
            vec2 q = abs(centerPos) - size + radius;
            return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - radius;
        }
        
        float ellipseSDF(vec2 centerPos, vec2 radii) {
            vec2 p = centerPos / radii;
            return (length(p) - 1.0) * min(radii.x, radii.y);
        }
        
        void main() {
            vec4 tex = texture(u_image, v_texCoord);
            
            vec2 centerPos = v_texCoord - u_center;
            
            float cosR = cos(u_rotation);
            float sinR = sin(u_rotation);
            vec2 rotatedPos = vec2(
                centerPos.x * cosR - centerPos.y * sinR,
                centerPos.x * sinR + centerPos.y * cosR
            );
            
            float dist;
            
            if (u_shape_type == 0) {
                dist = roundedBoxSDF(rotatedPos, u_size * 0.5, u_corner_radius);
            } else {
                dist = ellipseSDF(rotatedPos, u_size * 0.5);
            }
            
            float mask = 1.0 - smoothstep(-u_feather, u_feather, dist);
            
            if (u_inverted) {
                mask = 1.0 - mask;
            }
            
            outColor = vec4(tex.rgb, tex.a * mask);
        }
    `,

    // --- ARTISTIC ---

    crt: `#version 300 es
        ${GLSL_HEADER}
        uniform sampler2D u_image;
        uniform float u_curvature; // 0.0 to 1.0
        uniform float u_scanlines; // 0.0 to 1.0 strength
        uniform float u_vignette;  // 0.0 to 1.0 size

        in vec2 v_texCoord;
        out vec4 outColor;

        vec2 curve(vec2 uv) {
            uv = (uv - 0.5) * 2.0;
            vec2 offset = uv.yx / 5.0; // Curvature amount
            uv = uv + uv * offset * offset * u_curvature;
            return (uv * 0.5) + 0.5;
        }

        void main() {
            vec2 uv = curve(v_texCoord);
            
            // Edge masking
            if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
                outColor = vec4(0.0);
                return;
            }

            vec4 tex = texture(u_image, uv);
            vec3 color = unpremultiply(tex);

            // Chromatic Aberration at edges
            float dist = distance(uv, vec2(0.5));
            float aber = 0.005 * dist * u_curvature;
            
            color.r = texture(u_image, uv + vec2(aber, 0.0)).r;
            color.b = texture(u_image, uv - vec2(aber, 0.0)).b;

            // Scanlines
            float scans = sin(uv.y * u_resolution.y * 1.5) * 0.5 + 0.5;
            color *= 1.0 - (scans * u_scanlines);

            // Vignette
            float vig = 16.0 * uv.x * uv.y * (1.0 - uv.x) * (1.0 - uv.y);
            color *= pow(vig, u_vignette * 0.5);
            
            // Brightness boost to compensate scanlines
            color *= 1.2;

            outColor = premultiply(color, tex.a);
        }
    `,
    
    halftone: `#version 300 es
        ${GLSL_HEADER}
        uniform sampler2D u_image;
        uniform float u_scale; // Size of dots
        
        in vec2 v_texCoord;
        out vec4 outColor;

        void main() {
            vec4 tex = texture(u_image, v_texCoord);
            vec3 color = unpremultiply(tex);
            float luminance = luma(color);
            
            // Screen coordinates
            vec2 screenPos = v_texCoord * u_resolution;
            
            // Rotated Grid (45 deg)
            float s = 0.70710678; // sin(45)
            vec2 rotPos = vec2(
                screenPos.x * s - screenPos.y * s,
                screenPos.x * s + screenPos.y * s
            );
            
            vec2 nearest = 2.0 * fract(rotPos / u_scale) - 1.0;
            float dist = length(nearest);
            
            float radius = sqrt(1.0 - luminance); // Darker = Larger Dots
            
            vec3 finalColor = vec3(1.0); // White paper
            if (dist < radius) {
                finalColor = vec3(0.1); // Ink
            }
            
            // Mix based on original alpha to keep transparency
            outColor = vec4(finalColor * tex.a, tex.a);
        }
    `,

    // --- DISTORTION ---

    kaleidoscope: `#version 300 es
        ${GLSL_HEADER}
        uniform sampler2D u_image;
        uniform float u_segments; // 2.0 to 20.0
        uniform float u_offset;   // Rotation offset
        
        in vec2 v_texCoord;
        out vec4 outColor;

        void main() {
            vec2 uv = v_texCoord - 0.5;
            float r = length(uv);
            float a = atan(uv.y, uv.x);
            
            float segmentAngle = PI * 2.0 / u_segments;
            
            // Mirror logic
            a = mod(a + u_offset, segmentAngle);
            a = abs(a - segmentAngle / 2.0);
            
            // Convert back to Cartesian
            vec2 newUV = r * vec2(cos(a), sin(a)) + 0.5;
            
            outColor = texture(u_image, newUV);
        }
    `,

    swirl: `#version 300 es
        ${GLSL_HEADER}
        uniform sampler2D u_image;
        uniform float u_radius; 
        uniform float u_angle; // Swirl amount
        uniform vec2 u_center; // 0.5, 0.5
        
        in vec2 v_texCoord;
        out vec4 outColor;

        void main() {
            vec2 uv = v_texCoord;
            vec2 center = u_center;
            
            // Adjust for aspect ratio so circle is circular
            vec2 tc = uv - center;
            tc.x *= u_ratio;
            
            float dist = length(tc);
            
            if (dist < u_radius) {
                float percent = (u_radius - dist) / u_radius;
                float theta = percent * percent * u_angle;
                float s = sin(theta);
                float c = cos(theta);
                
                tc = vec2(dot(tc, vec2(c, -s)), dot(tc, vec2(s, c)));
            }
            
            tc.x /= u_ratio;
            vec2 finalUV = tc + center;
            
            if (finalUV.x < 0.0 || finalUV.x > 1.0 || finalUV.y < 0.0 || finalUV.y > 1.0) {
                outColor = vec4(0.0);
            } else {
                outColor = texture(u_image, finalUV);
            }
        }
    `,
    
    bulgePinch: `#version 300 es
        ${GLSL_HEADER}
        uniform sampler2D u_image;
        uniform float u_radius;    // 0.0 to 1.0
        uniform float u_strength;  // -1.0 (pinch) to 1.0 (bulge)
        uniform vec2 u_center;     // 0.5, 0.5
        
        in vec2 v_texCoord;
        out vec4 outColor;

        void main() {
            vec2 uv = v_texCoord;
            vec2 center = u_center;
            
            // Aspect correction
            vec2 distVec = (uv - center);
            distVec.x *= u_ratio;
            float dist = length(distVec);
            
            if (dist < u_radius) {
                float percent = dist / u_radius;
                
                if (u_strength > 0.0) {
                    // Bulge
                    uv -= (uv - center) * (1.0 - percent) * (1.0 - percent) * u_strength;
                } else {
                    // Pinch
                    uv += (uv - center) * (1.0 - percent) * (1.0 - percent) * -u_strength;
                }
            }
            
            if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
                 outColor = vec4(0.0); // Transparent edge
            } else {
                 outColor = texture(u_image, uv);
            }
        }
    `,

    // --- UTILITY / ENHANCEMENT ---

    lensDistortion: `#version 300 es
        ${GLSL_HEADER}
        uniform sampler2D u_image;
        uniform float u_strength; // -1.0 to 1.0 (Barrel to Pincushion)
        
        in vec2 v_texCoord;
        out vec4 outColor;
        
        void main() {
            vec2 uv = v_texCoord - 0.5;
            float r2 = uv.x*uv.x + uv.y*uv.y;
            float f = 1.0 + r2 * (u_strength * 0.5 + u_strength * sqrt(r2));
            
            vec2 newUV = f * uv + 0.5;
            
            if (newUV.x < 0.0 || newUV.x > 1.0 || newUV.y < 0.0 || newUV.y > 1.0) {
                outColor = vec4(0.0);
            } else {
                outColor = texture(u_image, newUV);
            }
        }
    `,
    
    rgbSplit: `#version 300 es
        ${GLSL_HEADER}
        uniform sampler2D u_image;
        uniform float u_amount; // 0.0 to 0.1
        uniform float u_angle;  // 0 to 2PI
        
        in vec2 v_texCoord;
        out vec4 outColor;

        void main() {
            vec2 dir = vec2(cos(u_angle), sin(u_angle));
            vec2 offset = dir * u_amount;
            
            vec4 c1 = texture(u_image, v_texCoord - offset);
            vec4 c2 = texture(u_image, v_texCoord);
            vec4 c3 = texture(u_image, v_texCoord + offset);
            
            vec4 result = vec4(c1.r, c2.g, c3.b, c2.a);
            result.a = c2.a;
            
            outColor = result;
        }
    `,

    motionBlur: `#version 300 es
        ${GLSL_HEADER}
        uniform sampler2D u_image;
        uniform float u_angle;     // Degrees
        uniform float u_strength;  // Screen fraction (0.0 - 0.1)
        
        in vec2 v_texCoord;
        out vec4 outColor;
        
        void main() {
            float rad = radians(u_angle);
            vec2 dir = vec2(cos(rad), sin(rad));
            
            vec4 acc = vec4(0.0);
            float total = 0.0;
            
            // Fixed sample count for stability
            const int SAMPLES = 20;
            
            // u_strength maps to visual distance. 
            // 0.0 = no blur. 1.0 = heavy blur (e.g. 10% screen width).
            float distance = u_strength * 0.1;
            
            if (distance < 0.001) {
                outColor = texture(u_image, v_texCoord);
                return;
            }

            for(int i = 0; i < SAMPLES; i++) {
                float t = float(i) / float(SAMPLES - 1); // 0.0 to 1.0
                float offset = t - 0.5; // -0.5 to 0.5 (Centered)
                
                vec2 coord = v_texCoord + dir * distance * offset;
                
                // Edge Clamp (Optional, or mirror)
                // For now we sample. Texture repeat mode will handle edge or discard.
                // Discarding off-screen samples avoids bleeding background color
                if (coord.x >= 0.0 && coord.x <= 1.0 && coord.y >= 0.0 && coord.y <= 1.0) {
                     acc += texture(u_image, coord);
                     total += 1.0;
                }
            }
            
            if (total > 0.0) {
                outColor = acc / total;
            } else {
                outColor = texture(u_image, v_texCoord);
            }
        }
    `,

    radialBlur: `#version 300 es
        ${GLSL_HEADER}
        uniform sampler2D u_image;
        uniform float u_strength; // 0.0 to 1.0
        uniform vec2 u_center;    // 0.5, 0.5
        
        in vec2 v_texCoord;
        out vec4 outColor;
        
        void main() {
            const int SAMPLES = 30;
            vec2 uv = v_texCoord;
            vec2 center = u_center;
            vec4 color = vec4(0.0);
            float total = 0.0;
            
            float intensity = u_strength * 0.2; 
            
            for (int i = 0; i < SAMPLES; i++) {
                float scale = 1.0 - intensity * (float(i) / float(SAMPLES - 1));
                vec2 coord = (uv - center) * scale + center;
                
                if (coord.x >= 0.0 && coord.x <= 1.0 && coord.y >= 0.0 && coord.y <= 1.0) {
                    color += texture(u_image, coord);
                    total += 1.0;
                }
            }
            
            if (total > 0.0) {
                outColor = color / total;
            } else {
                outColor = texture(u_image, uv);
            }
        }
    `,

    filmGrain: `#version 300 es
        ${GLSL_HEADER}
        uniform sampler2D u_image;
        uniform float u_amount; // 0.0 to 1.0
        
        in vec2 v_texCoord;
        out vec4 outColor;

        void main() {
            vec4 tex = texture(u_image, v_texCoord);
            vec3 color = unpremultiply(tex);
            
            // High frequency noise
            // Using time for animation
            vec2 seed = v_texCoord * u_resolution + u_time * 100.0;
            float n = fract(sin(dot(seed, vec2(12.9898, 78.233))) * 43758.5453);
            
            // Overlay blend
            vec3 grain = vec3(n);
            vec3 final = mix(color, color + (grain - 0.5) * u_amount, 1.0);
            
            outColor = premultiply(final, tex.a);
        }
    `,

    sharpen: `#version 300 es
        ${GLSL_HEADER}
        uniform sampler2D u_image;
        uniform float u_amount; // 0.0 to 1.0 (strength)
        
        in vec2 v_texCoord;
        out vec4 outColor;
        
        void main() {
            vec2 step = u_texel_size;
            
            vec4 c = texture(u_image, v_texCoord);
            vec4 n = texture(u_image, v_texCoord + vec2(0.0, -step.y));
            vec4 s = texture(u_image, v_texCoord + vec2(0.0, step.y));
            vec4 e = texture(u_image, v_texCoord + vec2(step.x, 0.0));
            vec4 w = texture(u_image, v_texCoord + vec2(-step.x, 0.0));
            
            // Laplace filter for edge detection
            vec4 edge = c * 5.0 - (n + s + e + w);
            
            outColor = mix(c, edge, u_amount);
            // Clamp alpha to original
            outColor.a = c.a; 
        }
    `,

    gaussianBlur: `#version 300 es
        ${GLSL_HEADER}
        uniform sampler2D u_image;
        uniform float u_radius; // 0.0 to 100.0
        
        in vec2 v_texCoord;
        out vec4 outColor;

        // Golden Angle
        const float GOLDEN_ANGLE = 2.39996323;
        const float ITERATIONS = 32.0; 

        void main() {
            vec4 original = texture(u_image, v_texCoord);
            
            if (u_radius <= 0.5) {
                outColor = original;
                return;
            }

            vec2 radius = vec2(u_radius) * u_texel_size;
            vec3 acc = vec3(0.0);
            float totalWeight = 0.0;
            float accAlpha = 0.0;
            
            for (float i = 0.0; i < ITERATIONS; i++) {
                float theta = i * GOLDEN_ANGLE;
                float r = sqrt(i) / sqrt(ITERATIONS);
                
                vec2 uvOffset = vec2(cos(theta), sin(theta)) * r * radius;
                vec2 sampleUV = v_texCoord + uvOffset;
                float weight = 1.0 - r * 0.5; 
                
                vec4 samp = texture(u_image, sampleUV);
                acc += samp.rgb * weight; 
                accAlpha += samp.a * weight;
                totalWeight += weight;
            }
            
            vec3 finalColor = acc / totalWeight;
            float finalAlpha = accAlpha / totalWeight;

            outColor = vec4(finalColor, finalAlpha);
        }
    `,

    vignette: `#version 300 es
        ${GLSL_HEADER}
        uniform sampler2D u_image;
        uniform float u_size; 
        uniform float u_feather;
        uniform float u_roundness;
        uniform vec3 u_color;
        
        in vec2 v_texCoord;
        out vec4 outColor;
        
        void main() {
            vec4 imgColor = texture(u_image, v_texCoord);
            vec2 uv = v_texCoord - 0.5;
            float aspect = mix(1.0, u_ratio, u_roundness);
            uv.x *= aspect;
            float dist = length(uv);
            
            float radius = (1.5 - u_size) * 0.8; 
            float vignette = smoothstep(radius, radius + u_feather, dist);
            
            // Mix original rgb with vignette color
            vec3 finalRGB = mix(imgColor.rgb, u_color * imgColor.a, vignette);
            
            outColor = vec4(finalRGB, imgColor.a);
        }
    `,
    
    oldFilm: `#version 300 es
        ${GLSL_HEADER}
        uniform sampler2D u_image;
        uniform float u_amount;
        uniform float u_sepia;
        uniform float u_scratch_density;
        
        in vec2 v_texCoord;
        out vec4 outColor;
        
        void main() {
            vec4 tex = texture(u_image, v_texCoord);
            vec3 color = unpremultiply(tex);
            
            // Sepia
            if (u_sepia > 0.0) {
                float gray = dot(color, vec3(0.299, 0.587, 0.114));
                vec3 sepiaColor = vec3(gray * 1.2, gray * 1.0, gray * 0.8);
                color = mix(color, sepiaColor, u_sepia);
            }
            
            // Animated Grain
            float n = noise(v_texCoord * u_resolution + u_time * 10.0);
            color += (n - 0.5) * u_amount * 0.3;
            
            // Scratches (Animated)
            if (u_scratch_density > 0.0) {
                float scratchTime = floor(u_time * 12.0); 
                float r = rand(vec2(scratchTime, v_texCoord.x));
                if (r > (1.0 - u_scratch_density * 0.05)) {
                     float dist = abs(v_texCoord.x - rand(vec2(scratchTime, 0.5)));
                     if (dist < 0.002) color *= 1.4;
                }
            }
            
            // Flicker
            float flicker = 1.0 + (rand(vec2(u_time, 0.0)) - 0.5) * 0.1 * u_amount;
            color *= flicker;
            
            outColor = premultiply(color, tex.a);
        }
    `,
    
    glitch: `#version 300 es
        ${GLSL_HEADER}
        uniform sampler2D u_image;
        uniform float u_strength;
        in vec2 v_texCoord;
        out vec4 outColor;
        
        void main() {
            vec2 uv = v_texCoord;
            
            float t = floor(u_time * 10.0); 
            float maxOffset = u_strength * 0.2; 
            float sliceY = floor(uv.y * 20.0); 
            float sliceNoise = rand(vec2(t, sliceY));
            
            float offset = 0.0;
            if (sliceNoise > 0.8) {
                offset = (rand(vec2(t, sliceY + 1.0)) - 0.5) * maxOffset;
            }
            
            float split = u_strength * 0.02 * sin(u_time * 20.0);
            
            float r = texture(u_image, vec2(uv.x + offset + split, uv.y)).r;
            float g = texture(u_image, vec2(uv.x + offset, uv.y)).g;
            float b = texture(u_image, vec2(uv.x + offset - split, uv.y)).b;
            float a = texture(u_image, vec2(uv.x + offset, uv.y)).a;
            
            outColor = vec4(r, g, b, a);
        }
    `,

    vhs: `#version 300 es
        ${GLSL_HEADER}
        uniform sampler2D u_image;
        
        in vec2 v_texCoord;
        out vec4 outColor;

        void main() {
            vec2 uv = v_texCoord;
            vec4 tex = texture(u_image, uv);
            
            // Color Channel Shift (Chromatic Aberration)
            float shift = 0.005 * sin(u_time * 2.0);
            float r = texture(u_image, uv + vec2(shift, 0.0)).r;
            float g = texture(u_image, uv).g;
            float b = texture(u_image, uv - vec2(shift, 0.0)).b;
            
            // Scanlines
            float scanline = sin(uv.y * 400.0) * 0.04;
            
            // Noise
            float n = noise(uv * u_time) * 0.05;
            
            vec3 finalColor = vec3(r, g, b) - scanline + n;
            
            outColor = vec4(finalColor * tex.a, tex.a);
        }
    `,

    // --- TRANSITIONS ---
    
    transition_dissolve: `#version 300 es
        ${GLSL_HEADER}
        uniform sampler2D u_image;    
        uniform sampler2D u_backdrop; 
        uniform float u_mix_progress; 
        in vec2 v_texCoord;
        in vec2 v_backdropCoord;
        out vec4 outColor;
        
        void main() {
            vec4 fg = texture(u_image, v_texCoord);
            vec4 bg = texture(u_backdrop, v_backdropCoord);
            outColor = mix(bg, fg, u_mix_progress);
        }
    `,

    transition_zoom_blur: `#version 300 es
        ${GLSL_HEADER}
        uniform sampler2D u_image; 
        uniform sampler2D u_backdrop; 
        uniform float u_mix_progress;
        uniform float u_strength;
        in vec2 v_texCoord;
        in vec2 v_backdropCoord;
        out vec4 outColor;
        
        void main() {
            vec2 center = vec2(0.5);
            float strength = u_strength * sin(u_mix_progress * PI);
            
            vec4 color = vec4(0.0);
            float total = 0.0;
            vec2 toCenter = center - v_texCoord;
            float random = rand(v_texCoord);
            float p = u_mix_progress;

            for(float t = 0.0; t <= 12.0; t++) {
                float percent = (t + random) / 12.0;
                float weight = 4.0 * (percent - percent * percent);
                vec4 c1 = texture(u_backdrop, v_backdropCoord + toCenter * percent * strength);
                vec4 c2 = texture(u_image, v_texCoord + toCenter * percent * strength);
                vec4 sampleColor = mix(c1, c2, p);
                color += sampleColor * weight;
                total += weight;
            }
            outColor = color / total;
        }
    `,
    
    transition_wipe_left: `#version 300 es
        ${GLSL_HEADER}
        uniform sampler2D u_image;
        uniform sampler2D u_backdrop;
        uniform float u_mix_progress;
        uniform float u_softness;
        in vec2 v_texCoord;
        in vec2 v_backdropCoord;
        out vec4 outColor;
        
        void main() {
            vec4 fg = texture(u_image, v_texCoord);
            vec4 bg = texture(u_backdrop, v_backdropCoord);
            float edge = smoothstep(u_mix_progress - u_softness, u_mix_progress, v_backdropCoord.x);
            outColor = mix(fg, bg, edge); 
        }
    `,

    transition_slide: `#version 300 es
        ${GLSL_HEADER}
        uniform sampler2D u_image;
        uniform sampler2D u_backdrop;
        uniform float u_mix_progress;
        uniform float u_direction; 
        in vec2 v_texCoord;
        in vec2 v_backdropCoord;
        out vec4 outColor;
        
        void main() {
            float p = u_mix_progress;
            vec2 offset = vec2(0.0);
            if (u_direction < 0.5) offset = vec2(-1.0, 0.0); 
            else if (u_direction < 1.5) offset = vec2(1.0, 0.0); 
            else if (u_direction < 2.5) offset = vec2(0.0, -1.0); 
            else offset = vec2(0.0, 1.0); 
            
            vec2 uvA = v_backdropCoord + (offset * p);
            vec2 uvB = v_texCoord + (offset * (p - 1.0));
            
            vec4 colA = vec4(0.0);
            vec4 colB = vec4(0.0);
            
            if(uvA.x >= 0.0 && uvA.x <= 1.0 && uvA.y >= 0.0 && uvA.y <= 1.0) 
                colA = texture(u_backdrop, uvA);
            if(uvB.x >= 0.0 && uvB.x <= 1.0 && uvB.y >= 0.0 && uvB.y <= 1.0) 
                colB = texture(u_image, uvB);

            outColor = colB + colA * (1.0 - colB.a);
        }
    `,

    transition_circle_open: `#version 300 es
        ${GLSL_HEADER}
        uniform sampler2D u_image;
        uniform sampler2D u_backdrop;
        uniform float u_mix_progress;
        uniform float u_smoothness; 
        uniform sampler2D u_next; // Alias for consistency if needed, but we use image/backdrop standard

        in vec2 v_texCoord;
        in vec2 v_backdropCoord;
        out vec4 outColor;
        
        void main() {
            vec2 p = v_texCoord - vec2(0.5);
            // Correct aspect ratio for perfect circle
            p.x *= u_ratio;
            
            float len = length(p);
            // Max distance from center to corner is approx 0.8 (if ratio 1.77)
            float maxR = sqrt(0.5*0.5 + (0.5*u_ratio)*(0.5*u_ratio));
            
            float prog = u_mix_progress;
            float radius = prog * maxR * 1.2; // Overshoot slightly
            
            float mask = smoothstep(radius, radius - u_smoothness, len);
            
            vec4 fg = texture(u_image, v_texCoord);
            vec4 bg = texture(u_backdrop, v_backdropCoord);
            
            outColor = mix(bg, fg, mask);
        }
    `,

    transition_directional_wipe: `#version 300 es
        ${GLSL_HEADER}
        uniform sampler2D u_image;
        uniform sampler2D u_backdrop;
        uniform float u_mix_progress;
        uniform float u_angle; // Degrees
        uniform float u_smoothness;
        
        in vec2 v_texCoord;
        in vec2 v_backdropCoord;
        out vec4 outColor;
        
        void main() {
            vec2 p = v_texCoord - 0.5;
            float rad = radians(u_angle);
            vec2 dir = vec2(cos(rad), sin(rad));
            
            // Project point onto direction vector
            float dist = dot(p, dir);
            
            // dist ranges roughly -0.8 to 0.8 (depending on aspect)
            // We map progress 0..1 to this range with smoothness buffer
            
            float progMap = (u_mix_progress * 2.0) - 1.0; 
            // Add buffer for smoothness
            float spread = 0.5 + u_smoothness;
            progMap *= spread;
            
            float mask = smoothstep(progMap - u_smoothness, progMap, dist);
            
            float alpha = 1.0 - mask;
            
            vec4 fg = texture(u_image, v_texCoord);
            vec4 bg = texture(u_backdrop, v_backdropCoord);
            outColor = mix(bg, fg, alpha);
        }
    `,
    
    transition_glitch_mem: `#version 300 es
        ${GLSL_HEADER}
        uniform sampler2D u_image;
        uniform sampler2D u_backdrop;
        uniform float u_mix_progress;
        
        in vec2 v_texCoord;
        in vec2 v_backdropCoord;
        out vec4 outColor;
        
        void main() {
            vec2 p = v_texCoord;
            float t = u_mix_progress;
            
            // Glitch block noise
            vec2 block = floor(p.xy * vec2(24.0, 9.0));
            vec2 uv_noise = block / vec2(64.0);
            uv_noise += floor(vec2(t) * vec2(1234.0, 3543.0)) / vec2(64.0);
            float blockNoise = rand(uv_noise);
            
            float displaceNoise = pow(blockNoise, 8.0) * pow(t, 2.0);
            
            // Color Channel Offset (RGB Split) based on progress peak
            float offsetStrength = sin(t * PI) * 0.1;
            float r = texture(u_image, p + vec2(offsetStrength, 0.0)).r;
            float g = texture(u_image, p).g;
            float b = texture(u_image, p - vec2(offsetStrength, 0.0)).b;
            vec4 fg = vec4(r, g, b, 1.0);
            
            // Backdrop Glitch
            float bg_r = texture(u_backdrop, v_backdropCoord - vec2(offsetStrength, 0.0)).r;
            float bg_g = texture(u_backdrop, v_backdropCoord).g;
            float bg_b = texture(u_backdrop, v_backdropCoord + vec2(offsetStrength, 0.0)).b;
            vec4 bg = vec4(bg_r, bg_g, bg_b, 1.0);
            
            // Digital Tearing
            if (blockNoise > 0.9 && sin(t * 10.0) > 0.0) {
                 p.x -= 0.05 * sin(t);
                 fg = texture(u_image, p);
                 bg = texture(u_backdrop, p);
            }
            
            // Hard Cut with Noise Edge
            float noiseCut = smoothstep(0.45, 0.55, t + (blockNoise * 0.1));
            
            outColor = mix(bg, fg, noiseCut);
        }
    `,

    transition_grid_flip: `#version 300 es
        ${GLSL_HEADER}
        uniform sampler2D u_image;
        uniform sampler2D u_backdrop;
        uniform float u_mix_progress;
        uniform vec2 u_size; // grid size e.g. (4, 4)
        uniform float u_pause; // 0.1
        uniform float u_divider_width; // 0.05
        uniform vec4 u_bgcolor; // Black
        uniform float u_randomness; // 0.1
        
        in vec2 v_texCoord;
        in vec2 v_backdropCoord;
        out vec4 outColor;
        
        vec4 getFromColor(vec2 uv) { return texture(u_backdrop, uv); }
        vec4 getToColor(vec2 uv) { return texture(u_image, uv); }

        void main() {
            vec2 p = v_texCoord;
            float progress = u_mix_progress;
            vec2 size = vec2(4.0); // Default if uniform missing
            if(u_size.x > 0.0) size = u_size;
            
            float pause = 0.1;
            if(u_pause > 0.0) pause = u_pause;
            
            float dividerWidth = 0.02;
            if(u_divider_width > 0.0) dividerWidth = u_divider_width;
            
            float randomness = 0.1;
            if(u_randomness > 0.0) randomness = u_randomness;
            
            vec4 bgcolor = vec4(0.0, 0.0, 0.0, 1.0);
            
            vec2 rectanglePos = floor(p * size);
            vec2 rectangleSize = 1.0 / size;
            
            float top = rectanglePos.y * rectangleSize.y;
            float bottom = top + rectangleSize.y;
            float left = rectanglePos.x * rectangleSize.x;
            float right = left + rectangleSize.x;
            
            float minX = min(abs(p.x - left), abs(p.x - right));
            float minY = min(abs(p.y - top), abs(p.y - bottom));
            float dist = min(minX, minY);
            
            float r = rand(rectanglePos);
            float cp = smoothstep(0.0, 1.0 - pause, progress + (r * randomness));
            
            float rectangleProgress = (cp - pause * r) / (1.0 - pause);
            rectangleProgress = clamp(rectangleProgress, 0.0, 1.0);
            
            if(dist < dividerWidth) {
                outColor = bgcolor;
            } else {
                float currentProg = rectangleProgress;
                // Switch logic
                if(currentProg < 0.5) {
                    outColor = getFromColor(v_backdropCoord);
                } else {
                    outColor = getToColor(v_texCoord);
                }
            }
        }
    `,

    transition_swirl: `#version 300 es
        ${GLSL_HEADER}
        uniform sampler2D u_image;
        uniform sampler2D u_backdrop;
        uniform float u_mix_progress;
        
        in vec2 v_texCoord;
        in vec2 v_backdropCoord;
        out vec4 outColor;
        
        vec4 getFromColor(vec2 uv) { return texture(u_backdrop, uv); }
        vec4 getToColor(vec2 uv) { return texture(u_image, uv); }

        void main() {
            float Radius = 1.0;
            float T = u_mix_progress;
            vec2 UV = v_texCoord - 0.5;
            UV.x *= u_ratio; // Correct aspect for rotation center
            
            float Dist = length(UV);

            if ( Dist < Radius ) {
                float Percent = (Radius - Dist) / Radius;
                float A = ( T <= 0.5 ) ? mix( 0.0, 1.0, T/0.5 ) : mix( 1.0, 0.0, (T-0.5)/0.5 );
                float Theta = Percent * Percent * A * 8.0 * 3.14159;
                float S = sin( Theta );
                float C = cos( Theta );
                
                UV = vec2( dot(UV, vec2(C, -S)), dot(UV, vec2(S, C)) );
            }
            
            UV.x /= u_ratio; // Restore
            UV += 0.5;
            
            vec4 C0 = getFromColor(UV);
            vec4 C1 = getToColor(UV);
            
            outColor = mix( C0, C1, T );
        }
    `
};

