
;
import { EffectDefinition } from '../../entities/effect.entity'
import { SHADER_LIB } from './DefaultShaders';
import { createOfflineArtwork } from '@sdkwork/react-core';

const createEffectThumbnail = (title: string, accent: string): string =>
    createOfflineArtwork({
        title,
        subtitle: 'Bundled effect thumbnail',
        eyebrow: 'Magic Cut',
        accent,
        width: 480,
        height: 270,
    });

class EffectRegistry {
    private definitions: Map<string, EffectDefinition> = new Map();

    constructor() {
        this.registerDefaults();
    }

    private registerDefaults() {
        // --- COLOR & LIGHTING ---

        this.register({
            id: 'builtin.filter.cinematic',
            name: 'Cinematic Grade',
            type: 'filter',
            category: 'Color',
            version: '2.0.0',
            fragmentShader: SHADER_LIB.cinematicColor,
            parameters: {
                u_temperature: { type: 'float', label: 'Temperature', default: 0.0, min: -1.0, max: 1.0, step: 0.01 },
                u_tint: { type: 'float', label: 'Tint', default: 0.0, min: -1.0, max: 1.0, step: 0.01 },
                u_saturation: { type: 'float', label: 'Saturation', default: 1.0, min: 0.0, max: 2.0, step: 0.01 },
                u_contrast: { type: 'float', label: 'Contrast', default: 1.0, min: 0.5, max: 1.5, step: 0.01 },
                u_exposure: { type: 'float', label: 'Exposure', default: 0.0, min: -2.0, max: 2.0, step: 0.01 },
                u_vibrance: { type: 'float', label: 'Vibrance', default: 0.0, min: -1.0, max: 1.0, step: 0.01 },
            },
            thumbnailUrl: createEffectThumbnail('Cinematic Grade', '#5b8cff')
        });

        this.register({
            id: 'builtin.filter.hsl',
            name: 'Hue/Saturation',
            type: 'filter',
            category: 'Color',
            version: '1.0.0',
            fragmentShader: SHADER_LIB.hsl,
            parameters: {
                u_hue: { type: 'float', label: 'Hue Shift', default: 0.0, min: -0.5, max: 0.5, step: 0.01, description: 'Rotate color wheel' },
                u_saturation: { type: 'float', label: 'Saturation', default: 1.0, min: 0.0, max: 2.0, step: 0.01 },
                u_lightness: { type: 'float', label: 'Lightness', default: 0.0, min: -1.0, max: 1.0, step: 0.01 }
            },
            thumbnailUrl: createEffectThumbnail('Hue Saturation', '#ec4899')
        });
        
        this.register({
            id: 'builtin.filter.color_balance',
            name: 'Color Balance',
            type: 'filter',
            category: 'Color',
            version: '1.0.0',
            fragmentShader: SHADER_LIB.colorBalance,
            parameters: {
                u_shadows: { type: 'color', label: 'Shadows', default: '#000000' },
                u_midtones: { type: 'color', label: 'Midtones', default: '#000000' },
                u_highlights: { type: 'color', label: 'Highlights', default: '#000000' }
            }
        });
        
        this.register({
            id: 'builtin.filter.duotone',
            name: 'Duotone',
            type: 'filter',
            category: 'Color',
            version: '1.0.0',
            fragmentShader: SHADER_LIB.duotone,
            parameters: {
                u_color1: { type: 'color', label: 'Dark', default: '#2b2d42' }, // Dark Blue
                u_color2: { type: 'color', label: 'Light', default: '#d946ef' } // Pink
            }
        });

        // --- ARTISTIC ---

        this.register({
            id: 'builtin.filter.crt',
            name: 'CRT Monitor',
            type: 'filter',
            category: 'Retro',
            version: '1.0.0',
            fragmentShader: SHADER_LIB.crt,
            parameters: {
                u_curvature: { type: 'float', label: 'Curvature', default: 0.1, min: 0.0, max: 0.5, step: 0.01 },
                u_scanlines: { type: 'float', label: 'Scanlines', default: 0.5, min: 0.0, max: 1.0, step: 0.01 },
                u_vignette: { type: 'float', label: 'Vignette', default: 0.5, min: 0.0, max: 1.0, step: 0.01 }
            },
            thumbnailUrl: createEffectThumbnail('CRT Monitor', '#f97316')
        });

        this.register({
            id: 'builtin.filter.old_film',
            name: 'Old Film',
            type: 'filter',
            category: 'Retro',
            version: '2.0.0',
            fragmentShader: SHADER_LIB.oldFilm,
            parameters: {
                u_amount: { type: 'float', label: 'Grain', default: 0.5, min: 0.0, max: 1.0, step: 0.01 },
                u_sepia: { type: 'float', label: 'Sepia', default: 0.5, min: 0.0, max: 1.0, step: 0.01 },
                u_scratch_density: { type: 'float', label: 'Scratches', default: 0.2, min: 0.0, max: 1.0, step: 0.01 },
            },
            thumbnailUrl: createEffectThumbnail('Old Film', '#d97706')
        });

        this.register({
            id: 'builtin.filter.film_grain',
            name: 'Film Grain',
            type: 'filter',
            category: 'Retro',
            version: '1.0.0',
            fragmentShader: SHADER_LIB.filmGrain,
            parameters: {
                u_amount: { type: 'float', label: 'Intensity', default: 0.3, min: 0.0, max: 1.0, step: 0.01 }
            }
        });

        this.register({
            id: 'builtin.filter.halftone',
            name: 'Halftone',
            type: 'filter',
            category: 'Stylize',
            version: '1.0.0',
            fragmentShader: SHADER_LIB.halftone,
            parameters: {
                u_scale: { type: 'float', label: 'Dot Size', default: 10.0, min: 2.0, max: 50.0, step: 1.0 }
            }
        });

        // --- DISTORTION ---

        this.register({
            id: 'builtin.filter.lens_distortion',
            name: 'Lens Distortion',
            type: 'filter',
            category: 'Distort',
            version: '1.0.0',
            fragmentShader: SHADER_LIB.lensDistortion,
            parameters: {
                u_strength: { type: 'float', label: 'Amount', default: 0.0, min: -0.5, max: 0.5, step: 0.01 }
            }
        });

        this.register({
            id: 'builtin.filter.swirl',
            name: 'Swirl',
            type: 'filter',
            category: 'Distort',
            version: '1.0.0',
            fragmentShader: SHADER_LIB.swirl,
            parameters: {
                u_radius: { type: 'float', label: 'Radius', default: 0.5, min: 0.0, max: 1.0, step: 0.01 },
                u_angle: { type: 'float', label: 'Angle', default: 5.0, min: -10.0, max: 10.0, step: 0.1 },
                u_center: { type: 'vec2', label: 'Center', default: {x: 0.5, y: 0.5} }
            }
        });
        
        this.register({
            id: 'builtin.filter.bulge_pinch',
            name: 'Bulge / Pinch',
            type: 'filter',
            category: 'Distort',
            version: '1.0.0',
            fragmentShader: SHADER_LIB.bulgePinch,
            parameters: {
                u_radius: { type: 'float', label: 'Radius', default: 0.5, min: 0.0, max: 1.0, step: 0.01 },
                u_strength: { type: 'float', label: 'Strength', default: 0.5, min: -1.0, max: 1.0, step: 0.01, description: 'Positive for Bulge, Negative for Pinch' },
                u_center: { type: 'vec2', label: 'Center', default: {x: 0.5, y: 0.5} }
            }
        });

        this.register({
            id: 'builtin.filter.kaleidoscope',
            name: 'Kaleidoscope',
            type: 'filter',
            category: 'Distort',
            version: '1.0.0',
            fragmentShader: SHADER_LIB.kaleidoscope,
            parameters: {
                u_segments: { type: 'float', label: 'Segments', default: 6.0, min: 2.0, max: 20.0, step: 1.0 },
                u_offset: { type: 'float', label: 'Rotation', default: 0.0, min: 0.0, max: 6.28, step: 0.1 }
            }
        });

        // --- GLITCH & NOISE ---

        this.register({
            id: 'builtin.filter.glitch',
            name: 'Digital Glitch',
            type: 'filter',
            category: 'Glitch',
            version: '1.0.0',
            fragmentShader: SHADER_LIB.glitch,
            parameters: {
                u_strength: { type: 'float', label: 'Strength', default: 0.5, min: 0.0, max: 1.0, step: 0.05 }
            }
        });

        this.register({
            id: 'builtin.filter.rgb_split',
            name: 'RGB Split',
            type: 'filter',
            category: 'Glitch',
            version: '1.0.0',
            fragmentShader: SHADER_LIB.rgbSplit,
            parameters: {
                u_amount: { type: 'float', label: 'Amount', default: 0.02, min: 0.0, max: 0.1, step: 0.001 },
                u_angle: { type: 'float', label: 'Angle', default: 0.0, min: 0.0, max: 6.28, step: 0.1 }
            }
        });

        this.register({
            id: 'builtin.filter.vhs',
            name: 'VHS Look',
            type: 'filter',
            category: 'Retro',
            version: '1.0.0',
            fragmentShader: SHADER_LIB.vhs,
            parameters: {}
        });

        // --- UTILITY ---
        
        this.register({
            id: 'builtin.filter.blur_pro',
            name: 'Pro Blur',
            type: 'filter',
            category: 'Blur',
            version: '2.1.0',
            fragmentShader: SHADER_LIB.gaussianBlur,
            parameters: {
                u_radius: { type: 'float', label: 'Radius', default: 0.0, min: 0.0, max: 50.0, step: 0.5 }
            }
        });
        
        this.register({
            id: 'builtin.filter.motion_blur',
            name: 'Directional Blur',
            type: 'filter',
            category: 'Blur',
            version: '2.0.0',
            fragmentShader: SHADER_LIB.motionBlur,
            parameters: {
                u_angle: { type: 'float', label: 'Angle', default: 0.0, min: 0.0, max: 360.0, step: 1.0 },
                u_strength: { type: 'float', label: 'Length', default: 0.0, min: 0.0, max: 1.0, step: 0.01 }
            },
            thumbnailUrl: createEffectThumbnail('Directional Blur', '#0ea5e9')
        });
        
        this.register({
            id: 'builtin.filter.radial_blur',
            name: 'Radial Blur',
            type: 'filter',
            category: 'Blur',
            version: '1.0.0',
            fragmentShader: SHADER_LIB.radialBlur,
            parameters: {
                u_strength: { type: 'float', label: 'Strength', default: 0.0, min: 0.0, max: 1.0, step: 0.01 },
                u_center: { type: 'vec2', label: 'Center', default: {x: 0.5, y: 0.5} }
            }
        });

        this.register({
            id: 'builtin.filter.sharpen',
            name: 'Sharpen',
            type: 'filter',
            category: 'Enhance',
            version: '1.0.0',
            fragmentShader: SHADER_LIB.sharpen,
            parameters: {
                u_amount: { type: 'float', label: 'Amount', default: 0.0, min: 0.0, max: 2.0, step: 0.1 }
            }
        });
        
        this.register({
            id: 'builtin.filter.vignette',
            name: 'Vignette',
            type: 'filter',
            category: 'Stylize',
            version: '2.0.0',
            fragmentShader: SHADER_LIB.vignette,
            parameters: {
                u_size: { type: 'float', label: 'Size', default: 0.4, min: 0.0, max: 1.5, step: 0.01 },
                u_feather: { type: 'float', label: 'Feather', default: 0.4, min: 0.0, max: 1.0, step: 0.01 },
                u_roundness: { type: 'float', label: 'Roundness', default: 0.5, min: 0.0, max: 1.0, step: 0.01 },
                u_color: { type: 'color', label: 'Color', default: '#000000' }
            }
        });

        // --- TRANSITIONS ---
        
        this.register({
            id: 'builtin.transition.dissolve',
            name: 'Cross Dissolve',
            type: 'transition',
            category: 'Dissolve',
            version: '1.0.0',
            fragmentShader: SHADER_LIB.transition_dissolve,
            parameters: {
                u_mix_progress: { type: 'float', label: 'Progress', default: 0.0, min: 0.0, max: 1.0, step: 0.01 }
            }
        });

        this.register({
            id: 'builtin.transition.zoom_blur',
            name: 'Zoom Blur',
            type: 'transition',
            category: 'Zoom',
            version: '1.0.0',
            fragmentShader: SHADER_LIB.transition_zoom_blur,
            parameters: {
                u_mix_progress: { type: 'float', label: 'Progress', default: 0.0, min: 0.0, max: 1.0, step: 0.01 },
                u_strength: { type: 'float', label: 'Strength', default: 0.4, min: 0.1, max: 1.0, step: 0.1 }
            }
        });
        
        this.register({
            id: 'builtin.transition.wipe_left',
            name: 'Wipe Left',
            type: 'transition',
            category: 'Wipe',
            version: '1.0.0',
            fragmentShader: SHADER_LIB.transition_wipe_left,
            parameters: {
                u_mix_progress: { type: 'float', label: 'Progress', default: 0.0, min: 0.0, max: 1.0, step: 0.01 },
                u_softness: { type: 'float', label: 'Softness', default: 0.1, min: 0.0, max: 0.5, step: 0.01 }
            }
        });
        
        this.register({
            id: 'builtin.transition.directional_wipe',
            name: 'Directional Wipe',
            type: 'transition',
            category: 'Wipe',
            version: '1.0.0',
            fragmentShader: SHADER_LIB.transition_directional_wipe,
            parameters: {
                u_mix_progress: { type: 'float', label: 'Progress', default: 0.0, min: 0.0, max: 1.0, step: 0.01 },
                u_angle: { type: 'float', label: 'Angle', default: 45.0, min: 0.0, max: 360.0, step: 1.0 },
                u_smoothness: { type: 'float', label: 'Softness', default: 0.2, min: 0.0, max: 1.0, step: 0.01 }
            },
            thumbnailUrl: createEffectThumbnail('Directional Wipe', '#8b5cf6')
        });

        this.register({
            id: 'builtin.transition.slide',
            name: 'Slide',
            type: 'transition',
            category: 'Slide',
            version: '1.0.0',
            fragmentShader: SHADER_LIB.transition_slide,
            parameters: {
                u_mix_progress: { type: 'float', label: 'Progress', default: 0.0, min: 0.0, max: 1.0, step: 0.01 },
                u_direction: { type: 'select', label: 'Direction', default: 0, options: [{label: 'Left', value: '0'}, {label: 'Right', value: '1'}] }
            }
        });
        
        this.register({
            id: 'builtin.transition.circle_open',
            name: 'Circle Open',
            type: 'transition',
            category: 'Iris',
            version: '1.0.0',
            fragmentShader: SHADER_LIB.transition_circle_open,
            parameters: {
                u_mix_progress: { type: 'float', label: 'Progress', default: 0.0, min: 0.0, max: 1.0, step: 0.01 },
                u_smoothness: { type: 'float', label: 'Smoothness', default: 0.3, min: 0.0, max: 1.0, step: 0.01 }
            }
        });

        this.register({
            id: 'builtin.transition.glitch_mem',
            name: 'Digital Glitch',
            type: 'transition',
            category: 'Glitch',
            version: '1.0.0',
            fragmentShader: SHADER_LIB.transition_glitch_mem,
            parameters: {
                u_mix_progress: { type: 'float', label: 'Progress', default: 0.0, min: 0.0, max: 1.0, step: 0.01 }
            }
        });
        
        this.register({
            id: 'builtin.transition.grid_flip',
            name: 'Grid Flip',
            type: 'transition',
            category: '3D',
            version: '1.0.0',
            fragmentShader: SHADER_LIB.transition_grid_flip,
            parameters: {
                u_mix_progress: { type: 'float', label: 'Progress', default: 0.0, min: 0.0, max: 1.0, step: 0.01 },
                u_size: { type: 'vec2', label: 'Grid Size', default: {x: 4, y: 4} },
                u_pause: { type: 'float', label: 'Pause', default: 0.1, min: 0.0, max: 0.5, step: 0.01 },
                u_divider_width: { type: 'float', label: 'Divider', default: 0.02, min: 0.0, max: 0.1, step: 0.001 },
                u_randomness: { type: 'float', label: 'Randomness', default: 0.1, min: 0.0, max: 0.5, step: 0.01 }
            }
        });
        
        this.register({
            id: 'builtin.transition.swirl',
            name: 'Swirl Warp',
            type: 'transition',
            category: 'Distort',
            version: '1.0.0',
            fragmentShader: SHADER_LIB.transition_swirl,
            parameters: {
                u_mix_progress: { type: 'float', label: 'Progress', default: 0.0, min: 0.0, max: 1.0, step: 0.01 }
            }
        });
    }

    public register(def: EffectDefinition) {
        if (this.definitions.has(def.id)) {
            console.warn(`Effect ${def.id} already registered. Overwriting.`);
        }
        this.definitions.set(def.id, def);
    }

    public get(id: string): EffectDefinition | undefined {
        return this.definitions.get(id);
    }

    public getAll(): EffectDefinition[] {
        return Array.from(this.definitions.values());
    }

    public getByCategory(category: string): EffectDefinition[] {
        return this.getAll().filter(d => d.category === category);
    }
}

export const effectRegistry = new EffectRegistry();

