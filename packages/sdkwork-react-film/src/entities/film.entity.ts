import { BaseEntity, MediaResource, VideoMediaResource, ImageMediaResource, AssetMediaResource, MediaScene, GenerationProduct, GenerationPlatform, MediaResourceType } from 'sdkwork-react-commons';

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
    greeting?: string;
    tone?: string;
    formality?: string;
  };
}

export interface FilmLocation extends BaseEntity {
  type: 'FILM_LOCATION';
  name: string;
  description?: string;
  tags: string[];
  visualDescription?: string;
  faceImage?: ImageMediaResource;
  threeViewImage?: ImageMediaResource;
  gridViewImage?: ImageMediaResource;
}

export interface FilmProp extends BaseEntity {
  type: 'FILM_PROP';
  name: string;
  description?: string;
  tags: string[];
  faceImage?: ImageMediaResource;
  threeViewImage?: ImageMediaResource;
  gridViewImage?: ImageMediaResource;
}

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

export interface FilmShot extends BaseEntity {
  type: 'FILM_SHOT';
  shotNumber: number;
  sceneId?: string;
  sceneUuid?: string;
  description: string;
  dialogue?: string;
  duration?: number;
  generation?: {
    status?: string;
    prompt?: string;
    assets?: AssetMediaResource[];
  };
  assets?: AssetMediaResource[];
  characterIds?: string[];
}

export interface FilmDialogueItem {
  id: string;
  characterId: string;
  text: string;
}

export interface FilmSettings extends BaseEntity {
  theme?: string;
  style?: string;
  aspectRatio?: string;
  resolution?: string;
  fps?: number;
  quality?: string;
}

export interface FilmVideo extends BaseEntity {
  type: 'FILM_VIDEO';
  name: string;
  status: FilmVideoStatus;
  url?: string;
}
