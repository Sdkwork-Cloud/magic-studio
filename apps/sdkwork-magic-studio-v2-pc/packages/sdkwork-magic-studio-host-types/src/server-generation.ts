import type {
  AgiExecutionStatus,
  AgiGenerationMode,
  AgiGenerationProduct,
  MediaInputRef,
} from '@sdkwork/magic-studio-types/agi';
import type {
  CharacterArchetype,
  CharacterGender,
} from '@sdkwork/magic-studio-types/character';
import type {
  ImageAspectRatio,
  ImageStyle,
} from '@sdkwork/magic-studio-types/image';
import type { UnifiedVideoGenerationRequest } from '@sdkwork/magic-studio-types/video';

export type MagicStudioGenerationArtifactRole =
  | 'primary'
  | 'preview'
  | 'thumbnail'
  | 'source'
  | 'reference'
  | 'mask';

export interface MagicStudioGenerationArtifact {
  id: string;
  uuid: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'music' | 'voice' | 'file';
  role: MagicStudioGenerationArtifactRole;
  assetId?: string | null;
  assetUuid?: string | null;
  primaryResourceId?: string | null;
  primaryResourceUuid?: string | null;
  resourceViewId?: string | null;
  resourceViewUuid?: string | null;
  url: string;
  posterUrl?: string;
  mimeType?: string;
  name: string;
  width?: number;
  height?: number;
  duration?: number;
  metadata?: Record<string, unknown>;
}

export interface MagicStudioGenerationTask {
  id: string;
  uuid: string;
  taskId: string;
  product: AgiGenerationProduct;
  mode: AgiGenerationMode;
  status: AgiExecutionStatus;
  prompt?: string;
  negativePrompt?: string;
  provider: string;
  providerModel: string;
  remoteJobId?: string | null;
  progress?: number;
  errorCode?: string | null;
  errorMessage?: string | null;
  inputRefs: MediaInputRef[];
  artifacts: MagicStudioGenerationArtifact[];
  primaryArtifact?: MagicStudioGenerationArtifact | null;
  parameters?: Record<string, unknown>;
  providerPayload?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
  cancelledAt?: string | null;
}

export interface MagicStudioGenerationPromptEnhanceRequest {
  prompt: string;
  scene?: string;
  style?: string;
  language?: string;
  maxWords?: number;
}

export interface MagicStudioGenerationPromptEnhanceResult {
  prompt: string;
}

export interface MagicStudioImageGenerationRequest {
  prompt?: string | null;
  negativePrompt?: string | null;
  referenceImage?: MediaInputRef | null;
  referenceImages?: MediaInputRef[];
  width?: number | null;
  height?: number | null;
  aspectRatio?: ImageAspectRatio | string | null;
  steps?: number | null;
  guidance?: number | null;
  seed?: number | null;
  style?: ImageStyle | string | null;
  styleId?: string | null;
  model?: string | null;
  batchSize?: number | null;
  useMultiModel?: boolean | null;
  models?: string[] | null;
  mediaType?: 'image' | string | null;
  quality?: string | null;
  [key: string]: unknown;
}

export interface MagicStudioGenerationTaskListQuery {
  page?: number;
  pageSize?: number;
  product?: AgiGenerationProduct;
  status?: AgiExecutionStatus;
}

export interface MagicStudioCharacterGenerationRequest {
  prompt: string;
  description?: string;
  model?: string;
  archetype?: CharacterArchetype;
  gender?: CharacterGender;
  age?: number;
  outfit?: string;
  aspectRatio?: string;
  voiceId?: string;
  avatarMode?: string;
  hairstyle?: string;
  hairColor?: string;
  eyeColor?: string;
  skinTone?: string;
  accessories?: string;
  avatar?: MediaInputRef | null;
}

export type MagicStudioAudioGenerationMode =
  | 'text-to-speech'
  | 'transcription'
  | 'translation';

export interface MagicStudioAudioGenerationRequest {
  mode?: MagicStudioAudioGenerationMode;
  prompt?: string;
  negativePrompt?: string;
  model?: string;
  voice?: string;
  duration?: number;
  seed?: number;
  sourceAudio?: MediaInputRef | null;
  language?: string;
  format?: string;
  sourceLanguage?: string;
  targetLanguage?: string;
  idempotencyKey?: string;
}

export interface MagicStudioMusicGenerationRequest {
  prompt: string;
  title?: string;
  lyrics?: string;
  style?: string;
  duration?: number;
  model?: string;
  customMode?: boolean;
  instrumental?: boolean;
}

export interface MagicStudioMusicSimilarRequest {
  source: MediaInputRef;
  duration?: number;
  model?: string;
  idempotencyKey?: string;
}

export interface MagicStudioMusicRemixRequest {
  source: MediaInputRef;
  style: string;
  model?: string;
  idempotencyKey?: string;
}

export interface MagicStudioMusicExtendRequest {
  source: MediaInputRef;
  extendDuration: number;
  style?: string;
  model?: string;
  idempotencyKey?: string;
}

export interface MagicStudioSfxGenerationRequest {
  prompt: string;
  model: string;
  duration: number;
  mediaType?: string;
}

export interface MagicStudioSfxCategory {
  id: string;
  label: string;
  description?: string;
}

export interface MagicStudioImageEditRequest {
  source: MediaInputRef;
  mask?: MediaInputRef | null;
  prompt?: string;
  negativePrompt?: string;
  model?: string;
  strength?: number;
  format?: string;
  n?: number;
  width?: number;
  height?: number;
}

export interface MagicStudioImageUpscaleRequest {
  source: MediaInputRef;
  prompt?: string;
  negativePrompt?: string;
  model?: string;
  scale?: 2 | 3 | 4;
  targetWidth?: number;
  targetHeight?: number;
  format?: string;
  n?: number;
}

export interface MagicStudioVideoGenerationRequest extends UnifiedVideoGenerationRequest {}
