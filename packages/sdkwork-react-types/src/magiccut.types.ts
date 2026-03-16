// MagicCut project type definitions
// All magiccut-related types are defined here to avoid circular dependencies

import type { BaseEntity } from './base.types';
import type { AssetBusinessDomain, AssetStorageMode } from './asset-center.types';
import type { AssetContentKey } from './media.types';

// ============================================================================
// Cut Project Settings
// ============================================================================

export interface CutProjectSettings {
  resolution: string;
  fps: number;
  aspectRatio: string;
  colorSpace?: string;
  audioSampleRate?: number;
}

// ============================================================================
// Cut Project
// ============================================================================

export interface CutProject extends BaseEntity {
  type: 'CUT_PROJECT';
  name: string;
  description?: string;
  version: number;
  timelines: CutTimelineRef[];
  mediaResources: CutMediaResourceRef[];
  settings: CutProjectSettings;
  normalizedState?: unknown;
  sourceCanvasId?: string;
}

export interface CutTimelineRef {
  type: 'CutTimeline';
  id: string;
  uuid?: string;
}

export interface CutMediaResourceRef {
  type: 'MediaResource';
  id: string;
  uuid?: string;
  assetId?: string;
  resourceViewId?: string;
  primaryResourceId?: string;
  primaryType?: AssetContentKey;
  storageMode?: AssetStorageMode;
  scopeDomain?: AssetBusinessDomain;
}

// ============================================================================
// Template
// ============================================================================

export interface TemplateMetadata {
  name: string;
  description?: string;
  thumbnailUrl?: string;
  isPublic?: boolean;
  price?: number;
  tags?: string[];
}

export interface CutTemplate extends BaseEntity, TemplateMetadata {
  type: 'CUT_TEMPLATE';
  projectData: CutProject;
}

// ============================================================================
// Timeline Marker
// ============================================================================

export interface TimelineMarker {
  id: string;
  time: number;
  label: string;
  color: string;
}

// ============================================================================
// Cut Timeline
// ============================================================================

export interface CutTimeline extends BaseEntity {
  type: 'CutTimeline';
  name: string;
  fps: number;
  duration: number;
  markers?: TimelineMarker[];
  tracks: CutTrackRef[];
}

export interface CutTrackRef {
  type: 'CutTrack';
  id: string;
  uuid?: string;
}

// ============================================================================
// Cut Track
// ============================================================================

export type CutTrackType = 'video' | 'audio' | 'text' | 'subtitle' | 'effect' | 'ai';

export interface CutTrack extends BaseEntity {
  type: 'CutTrack';
  trackType: CutTrackType;
  order: number;
  name?: string;
  clips: CutClipRef[];
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

export interface CutClipRef {
  type: 'CutClip';
  id: string;
  uuid?: string;
}

// ============================================================================
// Audio Effect Config
// ============================================================================

export type AudioEffectType = 'eq' | 'compressor' | 'noiseGate' | 'reverb' | 'limiter' | 'deEsser';

export interface AudioEffectConfig {
  id: string;
  type: AudioEffectType;
  enabled: boolean;
  params: Record<string, any>;
}

// ============================================================================
// Color Grade Settings
// ============================================================================

export interface ColorGradeSettings {
  brightness?: number;
  contrast?: number;
  saturation?: number;
  hue?: number;
  temperature?: number;
  tint?: number;
  highlights?: number;
  shadows?: number;
  whites?: number;
  blacks?: number;
  clarity?: number;
  vibrance?: number;
}

// ============================================================================
// Cut Clip Transform
// ============================================================================

export interface CutClipTransform {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scale: number;
  scaleX?: number;
  scaleY?: number;
  opacity: number;
}

// ============================================================================
// Easing and Keyframes
// ============================================================================

export type EasingType = 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' | 'step';

export interface KeyframePoint {
  id: string;
  time: number;
  value: number;
  easing: EasingType;
}

export type KeyframeMap = Record<string, KeyframePoint[]>;

// ============================================================================
// Blend Mode
// ============================================================================

export type BlendMode = 'normal' | 'screen' | 'multiply' | 'overlay' | 'add' | 'darken' | 'lighten';

// ============================================================================
// Cut Clip
// ============================================================================

export interface CutClip extends BaseEntity {
  type: 'CutClip';
  track: CutTrackRef;
  resource: CutMediaResourceRef;
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
  layers: CutLayerRef[];
  linkedClipId?: string;
  linkGroupId?: string;
  isSelected?: boolean;
}

export interface CutLayerRef {
  type: 'CutLayer';
  id: string;
  uuid?: string;
}

// ============================================================================
// Cut Layer
// ============================================================================

export type CutLayerType =
  | 'transform'
  | 'crop'
  | 'mask'
  | 'blend'
  | 'color'
  | 'filter'
  | 'text'
  | 'sticker'
  | 'audio_effect'
  | 'transition_in'
  | 'transition_out'
  | 'transition'
  | 'ai_generation'
  | 'ai_replace'
  | 'ai_analysis';

export interface CutLayer extends BaseEntity {
  type: 'CutLayer';
  clip: CutClipRef;
  layerType: CutLayerType;
  enabled: boolean;
  order: number;
  resource?: CutMediaResourceRef;
  params: Record<string, any>;
}

// ============================================================================
// Cut Editor Action Types
// ============================================================================

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
  timestamp: string; // ISO 8601 format: yyyy-MM-dd HH:mm:ss
}

// ============================================================================
// Effect Types
// ============================================================================

export type EffectType = 'filter' | 'transition' | 'generator' | 'utility';

export type ParameterType = 'float' | 'int' | 'color' | 'boolean' | 'select' | 'vec2';

export type ParameterValue = string | number | boolean | { x: number; y: number } | string[];

export interface EffectParameterSchema {
  type: ParameterType;
  label: string;
  default: ParameterValue;
  min?: number;
  max?: number;
  step?: number;
  options?: { label: string; value: string }[];
  description?: string;
}

export interface EffectDefinition {
  id: string;
  name: string;
  type: EffectType;
  category: string;
  version: string;
  fragmentShader: string;
  vertexShader?: string;
  parameters: Record<string, EffectParameterSchema>;
  author?: string;
  description?: string;
  thumbnailUrl?: string;
}

export interface EffectKeyframe {
  time: number;
  value: ParameterValue;
  easing?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';
}

export interface EffectInstance extends BaseEntity {
  type: 'EffectInstance';
  definitionId: string;
  enabled: boolean;
  params: Record<string, ParameterValue | EffectKeyframe[]>;
}

export interface TransitionInstance extends EffectInstance {
  duration: number;
  easing: string;
}
