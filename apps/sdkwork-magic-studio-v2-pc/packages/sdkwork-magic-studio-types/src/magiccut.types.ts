// MagicCut project type definitions
// All magiccut-related types are defined here to avoid circular dependencies

import type { BaseEntity, EntityId, EntityIdentityLike } from './base.types';
import {
  createClientEntityIdentity,
  entityKeysEqual,
  matchesEntityKey,
  resolveEntityKey,
  resolveEntityKeys,
} from './base.types';
import type { AssetBusinessDomain, AssetStorageMode } from './asset-center.types';
import type { AssetContentKey } from './media.types';
import type { ProjectGraphDocument } from './project-graph.types';

export const resolveMagicCutRefKey = (ref: EntityIdentityLike): string => resolveEntityKey(ref);

export const resolveMagicCutRecordKey = <T extends EntityIdentityLike>(
  records: Record<string, T> | undefined,
  refOrKey: EntityIdentityLike | string | null | undefined
): string | null => {
  if (!records) {
    return null;
  }

  if (typeof refOrKey === 'string') {
    const trimmed = refOrKey.trim();
    if (!trimmed) {
      return null;
    }

    if (records[trimmed]) {
      return trimmed;
    }

    for (const [recordKey, entity] of Object.entries(records)) {
      if (matchesEntityKey(entity, trimmed)) {
        return recordKey;
      }
    }

    return null;
  }

  if (!refOrKey) {
    return null;
  }

  for (const key of resolveEntityKeys(refOrKey)) {
    if (records[key]) {
      return key;
    }
  }

  for (const [recordKey, entity] of Object.entries(records)) {
    if (entityKeysEqual(entity, refOrKey)) {
      return recordKey;
    }
  }

  return null;
};

export const findMagicCutEntityByRef = <T extends EntityIdentityLike>(
  records: Record<string, T> | undefined,
  ref: EntityIdentityLike | null | undefined
): T | null => {
  const recordKey = resolveMagicCutRecordKey(records, ref);
  return recordKey ? records?.[recordKey] || null : null;
};

export const findMagicCutEntityByKey = <T extends EntityIdentityLike>(
  records: Record<string, T> | undefined,
  key: string | null | undefined
): T | null => {
  const recordKey = resolveMagicCutRecordKey(records, key);
  return recordKey ? records?.[recordKey] || null : null;
};

interface MagicCutEntityBase extends Omit<BaseEntity, 'id'> {
  id: EntityId;
}

interface MagicCutRefBase {
  id: EntityId;
  uuid: string;
}

const normalizeOptionalString = (value: string | null | undefined): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

interface CreateMagicCutIdentityInput extends Partial<Omit<MagicCutEntityBase, 'uuid'>> {
  id?: EntityId;
  uuid?: string | null;
}

const createMagicCutIdentity = (
  input: CreateMagicCutIdentityInput = {}
) =>
  createClientEntityIdentity({
    id: input.id ?? null,
    uuid: input.uuid ?? undefined,
    createdAt: input.createdAt,
    updatedAt: input.updatedAt,
    deletedAt: input.deletedAt,
  });

const createMagicCutTypedRef = <TType extends string>(
  type: TType,
  input: EntityIdentityLike = {}
): { type: TType; id: EntityId; uuid: string } => {
  const identity = createMagicCutIdentity({
    id: input.id ?? null,
    uuid: input.uuid ?? undefined,
  });

  return {
    type,
    id: identity.id,
    uuid: identity.uuid,
  };
};

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

export interface CutProject extends MagicCutEntityBase {
  type: 'CUT_PROJECT';
  name: string;
  description?: string;
  version: number;
  timelines: CutTimelineRef[];
  mediaResources: CutMediaResourceRef[];
  settings: CutProjectSettings;
  normalizedState?: unknown;
  sourceCanvasId?: string;
  sourceCanvasUuid?: string;
  projectGraph?: ProjectGraphDocument;
}

export interface CutTimelineRef extends MagicCutRefBase {
  type: 'CutTimeline';
}

export interface CutMediaResourceRef extends MagicCutRefBase {
  type: 'MediaResource';
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
  thumbnailPath?: string;
  thumbnailUrl?: string;
  isPublic?: boolean;
  price?: number;
  tags?: string[];
}

export interface CutTemplate extends MagicCutEntityBase, TemplateMetadata {
  type: 'CUT_TEMPLATE';
  projectData: CutProject;
}

// ============================================================================
// Timeline Marker
// ============================================================================

export interface TimelineMarker {
  id: EntityId;
  uuid: string;
  time: number;
  label: string;
  color: string;
}

// ============================================================================
// Cut Timeline
// ============================================================================

export interface CutTimeline extends MagicCutEntityBase {
  type: 'CutTimeline';
  name: string;
  fps: number;
  duration: number;
  markers?: TimelineMarker[];
  tracks: CutTrackRef[];
}

export interface CutTrackRef extends MagicCutRefBase {
  type: 'CutTrack';
}

// ============================================================================
// Cut Track
// ============================================================================

export type CutTrackType = 'video' | 'audio' | 'text' | 'subtitle' | 'effect' | 'ai';

export interface CutTrack extends MagicCutEntityBase {
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

export interface CutClipRef extends MagicCutRefBase {
  type: 'CutClip';
}

// ============================================================================
// Audio Effect Config
// ============================================================================

export type AudioEffectType = 'eq' | 'compressor' | 'noiseGate' | 'reverb' | 'limiter' | 'deEsser';

export interface AudioEffectConfig {
  id: EntityId;
  uuid: string;
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
  id: EntityId;
  uuid: string;
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

export interface CutClip extends MagicCutEntityBase {
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

export interface CutLayerRef extends MagicCutRefBase {
  type: 'CutLayer';
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

export interface CutLayer extends MagicCutEntityBase {
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
  id: EntityId;
  uuid: string;
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

export interface EffectInstance extends MagicCutEntityBase {
  type: 'EffectInstance';
  definitionId: string;
  enabled: boolean;
  params: Record<string, ParameterValue | EffectKeyframe[]>;
}

export interface TransitionInstance extends EffectInstance {
  duration: number;
  easing: string;
}

export interface CreateTimelineMarkerInput
  extends Partial<Pick<TimelineMarker, 'id' | 'uuid' | 'label' | 'color'>> {
  time: number;
}

export type CreateCutTimelineRefInput = EntityIdentityLike;

export const createCutTimelineRef = (
  input: CreateCutTimelineRefInput = {}
): CutTimelineRef => createMagicCutTypedRef('CutTimeline', input);

export interface CreateCutMediaResourceRefInput
  extends EntityIdentityLike,
    Partial<Pick<CutMediaResourceRef, 'assetId' | 'resourceViewId' | 'primaryResourceId' | 'primaryType' | 'storageMode' | 'scopeDomain'>> {}

export const createCutMediaResourceRef = (
  input: CreateCutMediaResourceRefInput = {}
): CutMediaResourceRef => {
  const ref = createMagicCutTypedRef('MediaResource', input);

  return {
    ...ref,
    assetId: normalizeOptionalString(input.assetId) || undefined,
    resourceViewId: normalizeOptionalString(input.resourceViewId) || undefined,
    primaryResourceId: normalizeOptionalString(input.primaryResourceId) || undefined,
    primaryType: input.primaryType,
    storageMode: input.storageMode,
    scopeDomain: input.scopeDomain,
  };
};

export interface CreateCutProjectInput
  extends Partial<Omit<CutProject, 'type' | 'id' | 'uuid' | 'createdAt' | 'updatedAt' | 'name' | 'version' | 'settings'>> {
  id?: EntityId;
  uuid?: string | null;
  createdAt?: CutProject['createdAt'];
  updatedAt?: CutProject['updatedAt'];
  name: string;
  version: number;
  settings: CutProjectSettings;
}

export const createCutProject = (
  input: CreateCutProjectInput
): CutProject => {
  const identity = createMagicCutIdentity(input);

  return {
    id: identity.id,
    uuid: identity.uuid,
    createdAt: input.createdAt ?? identity.createdAt,
    updatedAt: input.updatedAt ?? identity.updatedAt,
    deletedAt: input.deletedAt,
    type: 'CUT_PROJECT',
    name: input.name,
    description: input.description,
    version: input.version,
    timelines: input.timelines ?? [],
    mediaResources: input.mediaResources ?? [],
    settings: input.settings,
    normalizedState: input.normalizedState,
    sourceCanvasId: input.sourceCanvasId,
    sourceCanvasUuid: input.sourceCanvasUuid,
    projectGraph: input.projectGraph,
  };
};

export const createTimelineMarker = (
  input: CreateTimelineMarkerInput
): TimelineMarker => {
  const identity = createMagicCutIdentity(input);

  return {
    id: identity.id,
    uuid: identity.uuid,
    time: input.time,
    label: input.label ?? '',
    color: input.color ?? '#f59e0b',
  };
};

export interface CreateAudioEffectConfigInput
  extends Partial<Pick<AudioEffectConfig, 'id' | 'uuid' | 'enabled'>> {
  type: AudioEffectType;
  params: Record<string, any>;
}

export type CreateCutTrackRefInput = EntityIdentityLike;

export const createCutTrackRef = (
  input: CreateCutTrackRefInput = {}
): CutTrackRef => createMagicCutTypedRef('CutTrack', input);

export interface CreateCutTimelineInput
  extends Partial<Omit<CutTimeline, 'type' | 'id' | 'uuid' | 'createdAt' | 'updatedAt' | 'name' | 'fps' | 'duration' | 'tracks'>> {
  id?: EntityId;
  uuid?: string | null;
  createdAt?: CutTimeline['createdAt'];
  updatedAt?: CutTimeline['updatedAt'];
  name: string;
  fps: number;
  duration: number;
  tracks?: Array<CutTrackRef | EntityIdentityLike>;
}

export const createCutTimeline = (
  input: CreateCutTimelineInput
): CutTimeline => {
  const identity = createMagicCutIdentity(input);

  return {
    id: identity.id,
    uuid: identity.uuid,
    createdAt: input.createdAt ?? identity.createdAt,
    updatedAt: input.updatedAt ?? identity.updatedAt,
    deletedAt: input.deletedAt,
    type: 'CutTimeline',
    name: input.name,
    fps: input.fps,
    duration: input.duration,
    markers: input.markers,
    tracks: (input.tracks ?? []).map((track) => createCutTrackRef(track)),
  };
};

export type CreateCutClipRefInput = EntityIdentityLike;

export const createCutClipRef = (
  input: CreateCutClipRefInput = {}
): CutClipRef => createMagicCutTypedRef('CutClip', input);

export interface CreateCutTrackInput
  extends Partial<Omit<CutTrack, 'type' | 'id' | 'uuid' | 'createdAt' | 'updatedAt' | 'trackType' | 'order' | 'clips'>> {
  id?: EntityId;
  uuid?: string | null;
  createdAt?: CutTrack['createdAt'];
  updatedAt?: CutTrack['updatedAt'];
  trackType: CutTrackType;
  order: number;
  clips?: Array<CutClipRef | EntityIdentityLike>;
}

export const createCutTrack = (
  input: CreateCutTrackInput
): CutTrack => {
  const identity = createMagicCutIdentity(input);

  return {
    id: identity.id,
    uuid: identity.uuid,
    createdAt: input.createdAt ?? identity.createdAt,
    updatedAt: input.updatedAt ?? identity.updatedAt,
    deletedAt: input.deletedAt,
    type: 'CutTrack',
    trackType: input.trackType,
    order: input.order,
    name: input.name,
    clips: (input.clips ?? []).map((clip) => createCutClipRef(clip)),
    muted: input.muted,
    locked: input.locked,
    visible: input.visible,
    isMain: input.isMain,
    height: input.height,
    volume: input.volume,
    pan: input.pan,
    coverImage: input.coverImage,
    audioEffects: input.audioEffects,
  };
};

export const createAudioEffectConfig = (
  input: CreateAudioEffectConfigInput
): AudioEffectConfig => {
  const identity = createMagicCutIdentity(input);

  return {
    id: identity.id,
    uuid: identity.uuid,
    type: input.type,
    enabled: input.enabled ?? true,
    params: input.params,
  };
};

export interface CreateKeyframePointInput
  extends Partial<Pick<KeyframePoint, 'id' | 'uuid' | 'easing'>> {
  time: number;
  value: number;
}

export type CreateCutLayerRefInput = EntityIdentityLike;

export const createCutLayerRef = (
  input: CreateCutLayerRefInput = {}
): CutLayerRef => createMagicCutTypedRef('CutLayer', input);

export interface CreateCutClipInput
  extends Partial<Omit<CutClip, 'type' | 'id' | 'uuid' | 'createdAt' | 'updatedAt' | 'track' | 'resource' | 'start' | 'duration' | 'layers'>> {
  id?: EntityId;
  uuid?: string | null;
  createdAt?: CutClip['createdAt'];
  updatedAt?: CutClip['updatedAt'];
  track: CutTrackRef | EntityIdentityLike;
  resource: CutMediaResourceRef | CreateCutMediaResourceRefInput;
  start: number;
  duration: number;
  layers?: Array<CutLayerRef | EntityIdentityLike>;
}

export const createCutClip = (
  input: CreateCutClipInput
): CutClip => {
  const identity = createMagicCutIdentity(input);

  return {
    id: identity.id,
    uuid: identity.uuid,
    createdAt: input.createdAt ?? identity.createdAt,
    updatedAt: input.updatedAt ?? identity.updatedAt,
    deletedAt: input.deletedAt,
    type: 'CutClip',
    track: createCutTrackRef(input.track),
    resource: createCutMediaResourceRef(input.resource),
    start: input.start,
    duration: input.duration,
    offset: input.offset,
    speed: input.speed,
    volume: input.volume,
    muted: input.muted,
    fadeIn: input.fadeIn,
    fadeOut: input.fadeOut,
    audioEffects: input.audioEffects,
    colorGrade: input.colorGrade,
    blendMode: input.blendMode,
    transform: input.transform,
    keyframes: input.keyframes,
    content: input.content,
    style: input.style,
    layers: (input.layers ?? []).map((layer) => createCutLayerRef(layer)),
    linkedClipId: input.linkedClipId,
    linkGroupId: input.linkGroupId,
    isSelected: input.isSelected,
  };
};

export interface CreateCutLayerInput
  extends Partial<Omit<CutLayer, 'type' | 'id' | 'uuid' | 'createdAt' | 'updatedAt' | 'clip' | 'layerType' | 'enabled' | 'order' | 'params'>> {
  id?: EntityId;
  uuid?: string | null;
  createdAt?: CutLayer['createdAt'];
  updatedAt?: CutLayer['updatedAt'];
  clip: CutClipRef | EntityIdentityLike;
  layerType: CutLayerType;
  enabled: boolean;
  order: number;
  params: Record<string, any>;
}

export const createCutLayer = (
  input: CreateCutLayerInput
): CutLayer => {
  const identity = createMagicCutIdentity(input);

  return {
    id: identity.id,
    uuid: identity.uuid,
    createdAt: input.createdAt ?? identity.createdAt,
    updatedAt: input.updatedAt ?? identity.updatedAt,
    deletedAt: input.deletedAt,
    type: 'CutLayer',
    clip: createCutClipRef(input.clip),
    layerType: input.layerType,
    enabled: input.enabled,
    order: input.order,
    resource: input.resource ? createCutMediaResourceRef(input.resource) : undefined,
    params: input.params,
  };
};

export const createKeyframePoint = (
  input: CreateKeyframePointInput
): KeyframePoint => {
  const identity = createMagicCutIdentity(input);

  return {
    id: identity.id,
    uuid: identity.uuid,
    time: input.time,
    value: input.value,
    easing: input.easing ?? 'linear',
  };
};

export interface CreateCutEditorActionInput<T = unknown>
  extends Partial<Pick<CutEditorAction<T>, 'id' | 'uuid' | 'timestamp'>> {
  type: CutEditorActionType;
  payload: T;
}

export const createCutEditorAction = <T = unknown>(
  input: CreateCutEditorActionInput<T>
): CutEditorAction<T> => {
  const identity = createMagicCutIdentity(input);

  return {
    id: identity.id,
    uuid: identity.uuid,
    type: input.type,
    payload: input.payload,
    timestamp: input.timestamp ?? new Date().toISOString(),
  };
};
