
import { BaseEntity, MediaResource, VideoMediaResource, ImageMediaResource, AssetMediaResource, MediaScene, GenerationProduct, GenerationPlatform, MediaResourceType } from '../../../types';

// ============================================================================
// Enums
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
// Project
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
  media: MediaResource[];
  settings: FilmSettings;
}

// ============================================================================
// Input & Script
// ============================================================================

export interface FilmUserInput extends BaseEntity {
  type: 'FILM_USER_INPUT';
  text: string;
  language: string;
}

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
// Character
// ============================================================================

export interface FilmCharacter extends BaseEntity {
  type: 'FILM_CHARACTER';
  name: string;
  characterType: FilmCharacterType;
  refAssets: AssetMediaResource[];
  faceImage?: ImageMediaResource;
  threeViewImage?: ImageMediaResource;
  gridViewImage?: ImageMediaResource;
  agentId?: string;
  speakerId?: string;
  description?: string;
  status: FilmCharacterStatus;
  personality?: {
    traits: string[];
    background?: string;
    motivation?: string;
  };
  appearance?: {
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
  };
  interactionSettings?: {
    voiceId?: string;
    modelId?: string;
    systemPrompt?: string;
  };
  version?: string;
}

// ============================================================================
// Prop
// ============================================================================

export interface FilmProp extends BaseEntity {
  type: 'FILM_PROP';
  name: string;
  description?: string;
  tags: string[];
  refAssets: AssetMediaResource[];
  characterUuids: string[];
  faceImage?: ImageMediaResource;
  threeViewImage?: ImageMediaResource;
  gridViewImage?: ImageMediaResource;
}

// ============================================================================
// Location
// ============================================================================

export interface FilmLocation extends BaseEntity {
  type: 'FILM_LOCATION';
  name: string;
  indoor?: boolean;
  timeOfDay?: 'DAY' | 'NIGHT' | 'DAWN' | 'DUSK';
  tags: string[];
  description?: string;
  visualDescription?: string;
  atmosphereTags?: string[];
  image?: AssetMediaResource;
  faceImage?: ImageMediaResource;
  threeViewImage?: ImageMediaResource;
  gridViewImage?: ImageMediaResource;
  refAssets: AssetMediaResource[];
}

// ============================================================================
// Scene
// ============================================================================

export interface FilmScene extends BaseEntity {
  type: 'FILM_SCENE';
  index: number;
  locationUuid?: string;
  summary: string;
  content?: string;
  mood: string[];
  moodTags?: string[];
  visualPrompt?: string;
  characterUuids: string[];
  propUuids: string[];
  assets: AssetMediaResource[];
  prompt?: string;
}

// ============================================================================
// Shot
// ============================================================================

export interface FilmDialogueItem {
  id: string;
  characterId: string;
  text: string;
}

export interface FilmShot extends BaseEntity {
  type: 'FILM_SHOT';
  sceneUuid?: string;
  locationUuid?: string;
  index: number;
  duration: number;
  description: string;
  dialogue: {
    items: FilmDialogueItem[];
  };
  characterUuids: string[];
  propUuids: string[];
  generation: FilmVideoGeneration;
  assets: AssetMediaResource[];
}

// ============================================================================
// Video Generation
// ============================================================================

export interface FilmVideoGeneration {
  product: GenerationProduct;
  platform?: GenerationPlatform;
  modelId: string;
  prompt: FilmPrompt;
  assets: AssetMediaResource[];
  status: FilmVideoStatus;
  progress?: number;
  video?: VideoMediaResource;
  error?: string;
}

// ============================================================================
// Prompt
// ============================================================================

export interface FilmPrompt {
  base: string;
  style?: string;
  camera?: string;
  negative?: string;
  override?: string;
  full?: string;
}

// ============================================================================
// Settings
// ============================================================================

export interface FilmSettings {
  language: string;
  defaultLanguage?: string;
  imageModel: string;
  videoModel: string;
  aspect: '16:9' | '9:16' | '1:1' | '4:3' | '21:9' | '2.39:1';
  resolution: '720P' | '1080P' | '2K' | '4K';
  fps: 24 | 30 | 60;
  quality: 'draft' | 'standard' | 'high' | 'ultra';
  generation?: {
    autoImage: boolean;
    autoVideo: boolean;
    parallel: boolean;
    maxConcurrent: number;
  };
}

// ============================================================================
// Analysis Result
// ============================================================================

export interface FilmAnalysisResult {
  characters: Partial<FilmCharacter>[];
  props: Partial<FilmProp>[];
  locations: Partial<FilmLocation>[];
  scenes: Partial<FilmScene>[];
  shots: Partial<FilmShot>[];
  script?: string;
}

// ============================================================================
// Export
// ============================================================================

export interface FilmExportOptions {
  format: 'mp4' | 'mov' | 'avi' | 'webm';
  quality: 'draft' | 'standard' | 'high' | 'ultra';
  subtitles: boolean;
  audio: boolean;
  watermark?: string;
}
