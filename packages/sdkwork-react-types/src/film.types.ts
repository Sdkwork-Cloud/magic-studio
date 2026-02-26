// Film project type definitions
// All film-related types are defined here to avoid circular dependencies

import type { BaseEntity } from './base.types';
import type { AssetMediaResource, ImageMediaResource } from './media.types';

// ============================================================================
// Enums and Type Aliases
// ============================================================================

export type FilmProjectStatus =
  | 'DRAFT'
  | 'ANALYZING'
  | 'SCRIPT_READY'
  | 'STORYBOARD_READY'
  | 'GENERATING'
  | 'COMPLETED';

export type FilmCharacterType =
  | 'HUMAN'
  | 'PET'
  | 'ANIMAL'
  | 'ROBOT'
  | 'OTHER';

export type FilmCharacterStatus = 'ACTIVE' | 'DISABLED' | 'DELETED';

export type FilmVideoStatus =
  | 'PENDING'
  | 'GENERATING'
  | 'SUCCESS'
  | 'FAILED';

export type FilmViewMode =
  | 'overview'
  | 'script'
  | 'characters'
  | 'props'
  | 'locations'
  | 'storyboard'
  | 'timeline'
  | 'preview';

// ============================================================================
// Film Project
// ============================================================================

export interface FilmProject extends BaseEntity {
  type: 'FILM_PROJECT';
  name: string;
  description?: string;
  status: FilmProjectStatus;
  input: FilmUserInput;
  script: FilmScript;
  characters: FilmCharacter[];
  props: FilmProp[];
  locations: FilmLocation[];
  scenes: FilmScene[];
  shots: FilmShot[];
  media: FilmMediaResource[];
  settings: FilmSettings;
}

export interface FilmUserInput extends BaseEntity {
  type: 'FILM_USER_INPUT';
  text: string;
  language: string;
}

// ============================================================================
// Film Script
// ============================================================================

export interface FilmScript extends BaseEntity {
  type: 'FILM_SCRIPT';
  title: string;
  genres: string[];
  styles: string[];
  content: string;
  standardized: boolean;
  duration?: number;
  version: string;
}

// ============================================================================
// Film Character
// ============================================================================

export interface FilmCharacter extends BaseEntity {
  type: 'FILM_CHARACTER';
  name: string;
  characterType: FilmCharacterType;
  refAssets: FilmAssetMediaResource[];
  faceImage?: FilmImageMediaResource;
  threeViewImage?: FilmImageMediaResource;
  gridViewImage?: FilmImageMediaResource;
  agentId?: string;
  speakerId?: string;
  description?: string;
  status: FilmCharacterStatus;
  personality?: FilmCharacterPersonality;
  appearance?: FilmCharacterAppearance;
  interactionSettings?: FilmCharacterInteractionSettings;
}

export interface FilmCharacterPersonality {
  traits: string[];
  background?: string;
  motivation?: string;
}

export interface FilmCharacterAppearance {
  gender?: string;
  age?: string;
  ageGroup?: string;
  height?: string;
  build?: string;
  hair?: string;
  hairColor?: string;
  eyes?: string;
  clothing?: string;
  accessories?: string[];
  features?: string[];
}

export interface FilmCharacterInteractionSettings {
  greeting?: string;
  tone?: string;
  formality?: string;
}

// ============================================================================
// Film Location
// ============================================================================

export interface FilmLocation extends BaseEntity {
  type: 'FILM_LOCATION';
  name: string;
  description?: string;
  tags: string[];
  visualDescription?: string;
  faceImage?: FilmImageMediaResource;
  threeViewImage?: FilmImageMediaResource;
  gridViewImage?: FilmImageMediaResource;
}

// ============================================================================
// Film Prop
// ============================================================================

export interface FilmProp extends BaseEntity {
  type: 'FILM_PROP';
  name: string;
  description?: string;
  tags: string[];
  faceImage?: FilmImageMediaResource;
  threeViewImage?: FilmImageMediaResource;
  gridViewImage?: FilmImageMediaResource;
}

// ============================================================================
// Film Scene
// ============================================================================

export interface FilmScene extends BaseEntity {
  type: 'FILM_SCENE';
  sceneNumber: number;
  summary: string;
  locationId?: string;
  locationUuid?: string;
  characterIds?: string[];
  characterUuids?: string[];
  propUuids?: string[];
  moodTags?: string[];
  visualPrompt?: string;
}

// ============================================================================
// Film Shot
// ============================================================================

export interface FilmShot extends BaseEntity {
  type: 'FILM_SHOT';
  shotNumber: number;
  sceneId?: string;
  sceneUuid?: string;
  description: string;
  dialogue?: FilmDialogue;
  duration: number;
  generation?: FilmShotGeneration;
  assets?: FilmAssetMediaResource[];
  characterIds?: string[];
}

export interface FilmDialogue {
  items?: FilmDialogueItem[];
}

export interface FilmDialogueItem {
  id: string;
  characterId: string;
  text: string;
}

export interface FilmShotGeneration {
  status?: FilmGenerationStatus;
  prompt?: string;
  video?: FilmVideoResource;
  assets?: FilmAssetMediaResource[];
}

export type FilmGenerationStatus = 'PENDING' | 'GENERATING' | 'SUCCESS' | 'FAILED';

// ============================================================================
// Film Settings
// ============================================================================

export interface FilmSettings extends BaseEntity {
  theme?: string;
  style?: string;
  aspectRatio?: string;
  resolution?: string;
  fps?: number;
  quality?: string;
}

// ============================================================================
// Film Video
// ============================================================================

export interface FilmVideo extends BaseEntity {
  type: 'FILM_VIDEO';
  name: string;
  status: FilmVideoStatus;
  url?: string;
}

// ============================================================================
// Media Resources (Film-specific)
// ============================================================================

export interface FilmMediaResource {
  id: string;
  type: FilmMediaType;
  url: string;
  thumbnailUrl?: string;
  duration?: number;
  size?: number;
  width?: number;
  height?: number;
  format?: string;
}

export interface FilmFileMediaResource extends FilmMediaResource {
  fileId: string;
  fileName: string;
}

export interface FilmVideoMediaResource extends FilmFileMediaResource {
  type: 'video';
  coverUrl?: string;
  fps?: number;
  bitrate?: number;
}

export interface FilmImageMediaResource extends FilmFileMediaResource {
  type: 'image';
  aspectRatio?: number;
}

export interface FilmAudioMediaResource extends FilmFileMediaResource {
  type: 'audio';
  bitrate?: number;
  sampleRate?: number;
}

export interface FilmAssetMediaResource extends FilmFileMediaResource {
  type: 'image' | 'video' | 'audio';
  assetId: string;
  assetType: FilmAssetType;
}

export type FilmMediaType = 'image' | 'video' | 'audio' | 'voice' | 'music' | 'speech';

export type FilmAssetType = 'image' | 'video' | 'audio' | 'music' | 'voice' | 'document' | 'other';

export interface FilmVideoResource {
  url?: string;
  thumbnailUrl?: string;
  duration?: number;
  width?: number;
  height?: number;
}
