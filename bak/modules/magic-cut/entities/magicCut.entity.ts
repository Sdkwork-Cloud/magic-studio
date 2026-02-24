
import { BaseEntity, ObjectRef } from '../../../types';
import { Patch } from 'immer';
import { AudioEffectConfig } from '../services/audio/AudioEffectTypes';
import { ColorGradeSettings } from '../services/color/LUTService';

// --- Core Configuration ---

export interface CutProjectSettings {
  resolution: string;      // e.g. "1920x1080"
  fps: number;             // e.g. 30
  aspectRatio: string;     // e.g. "16:9"
  colorSpace?: string;     // e.g. "Rec.709"
  audioSampleRate?: number; // e.g. 48000
}

// --- Project Level ---

export interface CutProject extends BaseEntity {
  name: string;
  description?: string;
  version: number; 

  timelines: ObjectRef<'CutTimeline'>[];
  mediaResources: ObjectRef<'MediaResource'>[]; 

  settings: CutProjectSettings;
  
  // Internal field for template serialization
  normalizedState?: unknown;

  // Link back to origin
  sourceCanvasId?: string; // UUID of the Canvas Board this project was generated from
}

export interface TemplateMetadata {
    name: string;
    description?: string;
    thumbnailUrl?: string; // Cover image
    isPublic?: boolean;
    price?: number;
    tags?: string[];
}

export interface CutTemplate extends BaseEntity, TemplateMetadata {
    projectData: CutProject; // Serialized project state
}

// --- Timeline Level ---

export interface TimelineMarker {
    id: string;
    time: number;
    label: string;
    color: string;
}

export interface CutTimeline extends BaseEntity {
  name: string;
  fps: number;
  duration: number;        
  markers?: TimelineMarker[];

  tracks: ObjectRef<'CutTrack'>[];
}

// --- Track Level ---

export type CutTrackType = 'video' | 'audio' | 'text' | 'subtitle' | 'effect' | 'ai';

export interface CutTrack extends BaseEntity {
  type: CutTrackType;
  order: number;           // Visual stacking order (0 is top/main)
  name?: string;

  clips: ObjectRef<'CutClip'>[];

  muted?: boolean;
  locked?: boolean;
  visible?: boolean;       
  
  // Professional NLE Features
  isMain?: boolean;        // Is this the primary storyline (V1)?
  height?: number;         // Custom height
  volume?: number;         // Track-level volume
  pan?: number;            // Stereo pan (-1 to 1)
  coverImage?: string;     // Cover image for main track
  
  // Audio Effects Chain
  audioEffects?: AudioEffectConfig[];
}

// --- Clip Level ---

export interface CutClipTransform {
    x: number;      // Position X (Project Pixels)
    y: number;      // Position Y (Project Pixels)
    width: number;  // Display Width (Project Pixels)
    height: number; // Display Height (Project Pixels)
    rotation: number; // Degrees
    scale: number;  // 1.0 base
    opacity: number; // 0-1
}

export type EasingType = 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' | 'step';

export interface KeyframePoint {
    id: string;
    time: number; // Relative to clip start (seconds)
    value: number;
    easing: EasingType;
}

// Map property name (e.g. 'x', 'scale', 'opacity') to array of keyframes
export type KeyframeMap = Record<string, KeyframePoint[]>;

export type BlendMode = 'normal' | 'screen' | 'multiply' | 'overlay' | 'add' | 'darken' | 'lighten';

export interface CutClip extends BaseEntity {
  track: ObjectRef<'CutTrack'>; 
  resource: ObjectRef<'MediaResource'>; 
  
  start: number;       // Start time on the timeline (seconds)
  duration: number;    // Duration on the timeline (seconds)

  offset?: number;     // Start offset within the source media
  speed?: number;      // Playback speed multiplier
  volume?: number;     
  muted?: boolean;     // Clip-level mute
  
  // Audio Fades
  fadeIn?: number;     // seconds
  fadeOut?: number;    // seconds
  
  // Audio Effects (Clip-level)
  audioEffects?: AudioEffectConfig[];
  
  // Color Grading (Clip-level)
  colorGrade?: ColorGradeSettings;
  
  blendMode?: BlendMode; // Compositing Mode

  transform?: CutClipTransform; // Base Visual Transformation
  keyframes?: KeyframeMap;      // Animation Overrides
  
  // Content for Text/Title Clips
  content?: string;
  
  // Custom Styles for Text/Elements
  style?: Record<string, any>;
  
  layers: ObjectRef<'CutLayer'>[];
  
  // Clip Linking (Video-Audio sync)
  linkedClipId?: string;  // ID of linked clip (e.g., detached audio)
  linkGroupId?: string;   // Group ID for multi-clip linking
  
  // UI State
  isSelected?: boolean;
}

// --- Layer Level ---

export type CutLayerType = 'transform' | 'crop' | 'mask' | 'blend' | 'color' | 'filter' | 'text' | 'sticker' | 'audio_effect' | 'transition_in' | 'transition_out' | 'transition' | 'ai_generation' | 'ai_replace' | 'ai_analysis';

export interface CutLayer extends BaseEntity {
  clip: ObjectRef<'CutClip'>;
  type: CutLayerType;
  enabled: boolean;
  order: number; 
  resource?: ObjectRef<'MediaResource'>;
  params: Record<string, any>;
}

// --- Actions ---

export enum CutEditorActionType {
  ADD_CLIP = 'CUT_ADD_CLIP',
  REMOVE_CLIP = 'CUT_REMOVE_CLIP',
  MOVE_CLIP = 'CUT_MOVE_CLIP',
  TRIM_CLIP = 'CUT_TRIM_CLIP',
  SPLIT_CLIP = 'CUT_SPLIT_CLIP',
  ADD_TRACK = 'CUT_ADD_TRACK',
  REMOVE_TRACK = 'CUT_REMOVE_TRACK',
  RESIZE_TRACK = 'CUT_RESIZE_TRACK',
  UPDATE_CLIP_PROPS = 'CUT_UPDATE_CLIP_PROPS',
  ADD_LAYER = 'CUT_ADD_LAYER',
  UPDATE_LAYER = 'CUT_UPDATE_LAYER',
  REMOVE_LAYER = 'CUT_REMOVE_LAYER',
  AI_AUTO_CUT = 'CUT_AI_AUTO_CUT',
  AI_SMART_TRIM = 'CUT_AI_SMART_TRIM',
  UPDATE_STATE = 'CUT_UPDATE_STATE', // General update
}

export interface CutEditorAction<T = unknown> {
  id: string;
  type: CutEditorActionType;
  payload: T;
  timestamp: number;
}

export interface CutHistoryRecord {
  action: CutEditorAction;
  undoPatch: Patch[]; 
  redoPatch: Patch[];  
  domain: 'CUT';
}
