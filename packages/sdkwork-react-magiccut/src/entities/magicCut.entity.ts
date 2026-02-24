
import { BaseEntity, ObjectRef } from 'sdkwork-react-commons';
import { Patch } from 'immer';
import { AudioEffectConfig } from '../services/audio/AudioEffectTypes';
import { ColorGradeSettings } from '../services/color/LUTService'; 

export interface CutProjectSettings {
  resolution: string;
  fps: number;
  aspectRatio: string;
  colorSpace?: string;
  audioSampleRate?: number;
}

export interface CutProject extends BaseEntity {
  name: string;
  description?: string;
  version: number; 
  timelines: ObjectRef<'CutTimeline'>[];
  mediaResources: ObjectRef<'MediaResource'>[]; 
  settings: CutProjectSettings;
  normalizedState?: unknown;
  sourceCanvasId?: string;
}

export interface TemplateMetadata {
    name: string;
    description?: string;
    thumbnailUrl?: string;
    isPublic?: boolean;
    price?: number;
    tags?: string[];
}

export interface CutTemplate extends BaseEntity, TemplateMetadata {
    projectData: CutProject;
}

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

export type CutTrackType = 'video' | 'audio' | 'text' | 'subtitle' | 'effect' | 'ai';

export interface CutTrack extends BaseEntity {
  type: CutTrackType;
  order: number;
  name?: string;
  clips: ObjectRef<'CutClip'>[];
  muted?: boolean;
  locked?: boolean;
  visible?: boolean;       
  isMain?: boolean;
  height?: number;
  volume?: number;
  pan?: number;
  coverImage?: string;
  audioEffects?: AudioEffectConfig[];
}

export interface CutClipTransform {
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
    scale: number;
    opacity: number;
}

export type EasingType = 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' | 'step';

export interface KeyframePoint {
    id: string;
    time: number;
    value: number;
    easing: EasingType;
}

export type KeyframeMap = Record<string, KeyframePoint[]>;

export type BlendMode = 'normal' | 'screen' | 'multiply' | 'overlay' | 'add' | 'darken' | 'lighten';

export interface CutClip extends BaseEntity {
  track: ObjectRef<'CutTrack'>; 
  resource: ObjectRef<'MediaResource'>; 
  start: number;
  duration: number;
  offset?: number;
  speed?: number;
  volume?: number;     
  muted?: boolean;
  fadeIn?: number;
  fadeOut?: number;
  audioEffects?: AudioEffectConfig[];
  colorGrade?: ColorGradeSettings;
  blendMode?: BlendMode;
  transform?: CutClipTransform;
  keyframes?: KeyframeMap;
  content?: string;
  style?: Record<string, any>;
  layers: ObjectRef<'CutLayer'>[];
  linkedClipId?: string;
  linkGroupId?: string;
  isSelected?: boolean;
}

export type CutLayerType = 'transform' | 'crop' | 'mask' | 'blend' | 'color' | 'filter' | 'text' | 'sticker' | 'audio_effect' | 'transition_in' | 'transition_out' | 'transition' | 'ai_generation' | 'ai_replace' | 'ai_analysis';

export interface CutLayer extends BaseEntity {
  clip: ObjectRef<'CutClip'>;
  type: CutLayerType;
  enabled: boolean;
  order: number; 
  resource?: ObjectRef<'MediaResource'>;
  params: Record<string, any>;
}

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
  UPDATE_STATE = 'CUT_UPDATE_STATE',
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

