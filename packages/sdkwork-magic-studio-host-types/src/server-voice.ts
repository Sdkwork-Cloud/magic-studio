import type { AgiExecutionStatus, MediaInputRef } from '@sdkwork/magic-studio-types/agi';

export type MagicStudioVoiceSpeakerSource = 'market' | 'workspace' | 'custom';

export type MagicStudioVoiceSpeakerGender = 'male' | 'female' | 'neutral';

export interface MagicStudioVoiceSpeakerConfig {
  speed?: number;
  pitch?: number;
  stability?: number;
  similarityBoost?: number;
}

export interface MagicStudioVoiceSpeaker {
  id: string;
  uuid: string;
  source: MagicStudioVoiceSpeakerSource;
  name: string;
  gender: MagicStudioVoiceSpeakerGender;
  style: string;
  language: string;
  provider: string;
  providerVoiceId?: string | null;
  previewUrl?: string | null;
  previewText?: string | null;
  avatarUrl?: string | null;
  description?: string | null;
  tags: string[];
  referenceAudio?: MediaInputRef | null;
  config?: MagicStudioVoiceSpeakerConfig | null;
  isFavorite?: boolean | null;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface MagicStudioVoiceListQuery {
  page?: number;
  size?: number;
  keyword?: string;
  source?: MagicStudioVoiceSpeakerSource;
  language?: string;
  gender?: MagicStudioVoiceSpeakerGender;
  style?: string;
  provider?: string;
}

export interface MagicStudioCustomVoiceCreateRequest {
  name: string;
  gender: MagicStudioVoiceSpeakerGender;
  style: string;
  language: string;
  provider?: string;
  providerVoiceId?: string | null;
  previewUrl?: string | null;
  previewText?: string | null;
  avatarUrl?: string | null;
  description?: string | null;
  tags?: string[];
  referenceAudio?: MediaInputRef | null;
  config?: MagicStudioVoiceSpeakerConfig | null;
  isFavorite?: boolean | null;
  metadata?: Record<string, unknown>;
}

export interface MagicStudioCustomVoiceUpdateRequest {
  name?: string;
  gender?: MagicStudioVoiceSpeakerGender;
  style?: string;
  language?: string;
  provider?: string;
  providerVoiceId?: string | null;
  previewUrl?: string | null;
  previewText?: string | null;
  avatarUrl?: string | null;
  description?: string | null;
  tags?: string[];
  referenceAudio?: MediaInputRef | null;
  config?: MagicStudioVoiceSpeakerConfig | null;
  isFavorite?: boolean | null;
  metadata?: Record<string, unknown>;
}

export interface MagicStudioVoiceCloneTaskCreateRequest {
  speakerId: string;
  sampleAudio?: MediaInputRef | null;
  sampleAudioUrl?: string;
  language: string;
  model?: string;
  idempotencyKey?: string;
  previewText?: string;
  autoUpdatePreview?: boolean;
}

export interface MagicStudioVoiceCloneTaskListQuery {
  page?: number;
  pageSize?: number;
  status?: AgiExecutionStatus;
  speakerId?: string;
}

export interface MagicStudioVoiceCloneTask {
  id: string;
  uuid: string;
  taskId: string;
  speakerId: string;
  speakerName?: string | null;
  status: AgiExecutionStatus;
  language: string;
  model?: string | null;
  provider: string;
  remoteJobId?: string | null;
  progress?: number | null;
  idempotencyKey?: string | null;
  sampleAudio?: MediaInputRef | null;
  sampleAudioUrl?: string | null;
  previewText?: string | null;
  previewAudioUrl?: string | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  providerPayload?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
  cancelledAt?: string | null;
}

export interface MagicStudioVoicePreviewRequest {
  previewText?: string;
  previewAudioUrl?: string;
}

export type MagicStudioVoiceSpeechMode = 'design' | 'clone';

export type MagicStudioVoiceReferenceInputMethod = 'upload' | 'mic';

export interface MagicStudioVoiceSpeechTaskCreateRequest {
  speakerId: string;
  text: string;
  model?: string;
  speed?: number;
  pitch?: number;
  stability?: number;
  similarityBoost?: number;
  format?: string;
  language?: string;
  voiceId?: string;
  avatarUrl?: string;
  description?: string;
  mode?: MagicStudioVoiceSpeechMode;
  inputMethod?: MagicStudioVoiceReferenceInputMethod;
  referenceAudio?: MediaInputRef | null;
}

export interface MagicStudioVoiceSpeechTaskListQuery {
  page?: number;
  pageSize?: number;
  status?: AgiExecutionStatus;
  speakerId?: string;
}

export interface MagicStudioVoiceSpeechTaskUpdateRequest {
  isFavorite?: boolean;
}

export interface MagicStudioVoiceSpeechTaskUpsertRequest {
  id?: string | null;
  uuid?: string;
  text: string;
  speakerId: string;
  speakerName?: string;
  status?: AgiExecutionStatus;
  provider?: string;
  providerModel?: string;
  remoteJobId?: string | null;
  progress?: number;
  errorCode?: string | null;
  errorMessage?: string | null;
  language?: string;
  format?: string;
  voiceId?: string;
  avatarUrl?: string;
  description?: string;
  mode?: MagicStudioVoiceSpeechMode;
  inputMethod?: MagicStudioVoiceReferenceInputMethod;
  speed?: number;
  pitch?: number;
  stability?: number;
  similarityBoost?: number;
  isFavorite?: boolean;
  referenceAudio?: MediaInputRef | null;
  artifacts?: import('./server-generation.ts').MagicStudioGenerationArtifact[];
  primaryArtifact?: import('./server-generation.ts').MagicStudioGenerationArtifact | null;
  createdAt?: string;
  updatedAt?: string;
  completedAt?: string | null;
  cancelledAt?: string | null;
}
