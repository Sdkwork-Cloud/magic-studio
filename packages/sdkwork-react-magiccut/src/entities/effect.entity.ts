
import { BaseEntity } from 'sdkwork-react-commons';

// --- Domain Enum Types ---

export type EffectType = 'filter' | 'transition' | 'generator' | 'utility';
export type ParameterType = 'float' | 'int' | 'color' | 'boolean' | 'select' | 'vec2';

// --- Parameter Schema (The Definition) ---

export type ParameterValue = string | number | boolean | { x: number; y: number } | string[];

export interface EffectParameterSchema {
    type: ParameterType;
    label: string;
    default: ParameterValue;
    min?: number;
    max?: number;
    step?: number;
    options?: { label: string; value: string }[]; // For select
    description?: string;
}

// --- Effect Definition (The Blueprint/Plugin) ---

/**
 * Standard Effect Plugin Interface
 * Any effect/transition must strictly adhere to the Uniform naming convention:
 * - u_image: sampler2D (Current Texture)
 * - u_resolution: vec2 (Canvas Size)
 * - u_time: float (Time in seconds)
 * 
 * For Transitions:
 * - u_next: sampler2D (Target Texture)
 * - u_progress: float (0.0 to 1.0)
 * - u_ratio: float (Aspect Ratio)
 */
export interface EffectDefinition {
    id: string;           // e.g., 'org.openstudio.blur'
    name: string;
    type: EffectType;
    category: string;     // e.g., 'Blur', 'Color', 'Distort'
    version: string;
    
    // Rendering
    fragmentShader: string; // The GLSL code
    vertexShader?: string;  // Optional custom vertex logic
    
    // Interface
    parameters: Record<string, EffectParameterSchema>;
    
    // Metadata
    author?: string;
    description?: string;
    thumbnailUrl?: string;
}

// --- Runtime Instance (The Data on the Timeline) ---

export interface EffectKeyframe {
    time: number; // Relative to clip start (0.0 to 1.0 or seconds)
    value: ParameterValue;
    easing?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';
}

export interface EffectInstance extends BaseEntity {
    definitionId: string; // Reference to EffectDefinition
    enabled: boolean;
    
    // Parameter Values (Runtime state)
    params: Record<string, ParameterValue | EffectKeyframe[]>; 
}

// --- Specific Transition Logic ---

export interface TransitionInstance extends EffectInstance {
    duration: number;
    easing: string;
}

