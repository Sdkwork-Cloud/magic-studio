
import { CutTimeline, CutTrack, CutClip, CutLayer } from '../entities/magicCut.entity';
import { AnyMediaResource } from '../../../types';
import { ShaderManager } from './gl/ShaderManager';
import { ResourceManager } from './renderer/ResourceManager';
import { TextureLRUCache } from './TextureLRUCache';
import { EffectSystem } from './renderer/EffectSystem';
import { Compositor } from './gl/Compositor';

export interface RenderOverrideClip {
    id: string;
    resource: AnyMediaResource;
    start: number;
    duration: number;
    offset: number;
    type: 'move' | 'trim-start' | 'trim-end';
    opacity?: number; 
    speed?: number;
}

export interface RenderData {
    timeline: CutTimeline | null;
    resources: Record<string, AnyMediaResource>;
    tracks: Record<string, CutTrack>;
    clips: Record<string, CutClip>;
    layers: Record<string, CutLayer>;
}

export interface FBO {
    texture: WebGLTexture;
    fbo: WebGLFramebuffer;
    width: number;
    height: number;
}

export interface RenderContext {
    gl: WebGL2RenderingContext;
    // Project Resolution
    width: number;
    height: number;
    resolution: { width: number, height: number };
    
    // Systems
    resourceManager: ResourceManager;
    shaderManager: ShaderManager;
    textureCache: TextureLRUCache;
    effectSystem: EffectSystem;
    compositor: Compositor;

    // Shared Buffers
    vaoQuad: WebGLVertexArrayObject;
    
    // Assets
    emptyTexture: WebGLTexture;
}
