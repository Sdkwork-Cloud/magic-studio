import type {
  MagicStudioGenerationArtifact,
  MagicStudioVoiceCloneTaskCreateRequest,
  MagicStudioVoiceSpeechTaskCreateRequest,
  MagicStudioVoiceSpeechTaskUpsertRequest,
} from '@sdkwork/magic-studio-host-types';
import type { MediaInputRef } from '@sdkwork/magic-studio-types/agi';

import type {
  GeneratedVoiceResult,
  VoiceConfig,
  VoiceInputResourceRef,
  VoiceTask,
} from '../entities';
import { safeIdString, safeString } from './voiceService.shared';

export const toMediaInputRef = (
  reference?: VoiceInputResourceRef | null
): MediaInputRef | undefined => {
  if (!reference) {
    return undefined;
  }

  return {
    id: reference.id ?? null,
    uuid: reference.uuid,
    assetId: reference.assetId ?? null,
    assetUuid: reference.assetUuid ?? null,
    primaryResourceId: reference.primaryResourceId ?? null,
    primaryResourceUuid: reference.primaryResourceUuid ?? null,
    resourceViewId: reference.resourceViewId ?? null,
    resourceViewUuid: reference.resourceViewUuid ?? null,
    path: reference.path ?? undefined,
    url: reference.url ?? undefined,
    name: reference.name ?? undefined,
    mimeType: reference.mimeType ?? undefined,
    type: reference.type,
    role: 'reference',
    resource: reference.resource ?? undefined,
    metadata: reference.metadata ?? undefined,
    createdAt: reference.createdAt,
    updatedAt: reference.updatedAt,
    deletedAt: reference.deletedAt,
  };
};

export const buildVoiceSpeechTaskCreateRequest = (
  config: VoiceConfig
): MagicStudioVoiceSpeechTaskCreateRequest => ({
  speakerId: config.voiceId,
  text: config.text,
  model: config.model,
  speed: config.speed,
  pitch: config.pitch,
  stability: config.stability,
  similarityBoost: config.similarityBoost,
  format: 'wav',
  voiceId: config.voiceId,
  avatarUrl: config.avatarUrl,
  description: config.description,
  mode: config.mode,
  inputMethod: config.inputMethod,
  referenceAudio: toMediaInputRef(config.referenceAudio),
});

export const buildVoiceCloneTaskCreateRequest = (input: {
  speakerId: string;
  sampleAudio?: VoiceInputResourceRef | null;
  sampleAudioUrl?: string;
  language: string;
  model?: string;
  idempotencyKey?: string;
  previewText?: string;
  autoUpdatePreview?: boolean;
}): MagicStudioVoiceCloneTaskCreateRequest => ({
  speakerId: input.speakerId,
  sampleAudio: toMediaInputRef(input.sampleAudio),
  sampleAudioUrl: input.sampleAudioUrl,
  language: input.language,
  model: input.model,
  idempotencyKey: input.idempotencyKey,
  previewText: input.previewText,
  autoUpdatePreview: input.autoUpdatePreview,
});

const toRequestTimestamp = (value: unknown): string | undefined => {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return new Date(value).toISOString();
  }

  return undefined;
};

const toVoiceArtifact = (
  result: GeneratedVoiceResult,
  index: number
): MagicStudioGenerationArtifact | null => {
  const url = safeString(result.resource?.url, safeString(result.url));
  if (!url) {
    return null;
  }

  const artifactId =
    safeIdString(result.artifactUuid) ||
    safeIdString(result.id) ||
    safeIdString(result.primaryResourceId) ||
    result.uuid;
  const artifactUuid = safeIdString(result.artifactUuid, result.uuid);

  return {
    id: artifactId,
    uuid: artifactUuid,
    type: 'voice',
    role: index === 0 ? 'primary' : 'preview',
    assetId: result.assetId ?? null,
    assetUuid: result.assetUuid ?? null,
    primaryResourceId: result.primaryResourceId ?? null,
    primaryResourceUuid: result.primaryResourceUuid ?? null,
    resourceViewId: result.resourceViewId ?? null,
    resourceViewUuid: result.resourceViewUuid ?? null,
    url,
    mimeType: result.resource?.mimeType || 'audio/wav',
    name: safeString(result.resource?.name, `generated-voice-${index + 1}.wav`),
    duration: result.duration,
    metadata: {
      ...(result.resource?.metadata || {}),
      path: result.resource?.path || undefined,
      text: result.text,
      speakerId: result.speakerId,
      avatarUrl: result.avatarUrl,
      modelId: result.modelId,
    },
  };
};

export const buildVoiceSpeechTaskUpsertRequest = (
  task: Partial<VoiceTask>
): MagicStudioVoiceSpeechTaskUpsertRequest => {
  const text = safeString(task.text, safeString(task.config?.text));
  const speakerId = safeIdString(task.speakerId, safeIdString(task.config?.voiceId));
  const results = Array.isArray(task.results)
    ? task.results
    : task.result
      ? [task.result]
      : [];
  const artifacts = results
    .map((result, index) => toVoiceArtifact(result, index))
    .filter((artifact): artifact is MagicStudioGenerationArtifact => artifact !== null);

  return {
    id: safeIdString(task.id) || null,
    uuid: safeIdString(task.uuid) || undefined,
    text,
    speakerId,
    status:
      task.status === 'completed'
        ? 'succeeded'
        : task.status === 'failed'
          ? 'failed'
          : task.status === 'processing'
            ? 'processing'
            : 'queued',
    provider: safeString(task.execution?.provider),
    providerModel: safeString(task.execution?.providerModel, safeString(task.config?.model)),
    progress: task.status === 'completed' ? 100 : undefined,
    errorMessage: safeString(task.error) || undefined,
    language: undefined,
    format: 'wav',
    voiceId: safeIdString(task.config?.voiceId) || undefined,
    avatarUrl: safeString(task.config?.avatarUrl) || undefined,
    description: safeString(task.config?.description) || undefined,
    mode: task.config?.mode,
    inputMethod: task.config?.inputMethod,
    speed: task.config?.speed,
    pitch: task.config?.pitch,
    stability: task.config?.stability,
    similarityBoost: task.config?.similarityBoost,
    isFavorite: task.isFavorite,
    referenceAudio: toMediaInputRef(task.config?.referenceAudio),
    artifacts,
    primaryArtifact: artifacts[0] ?? null,
    createdAt: toRequestTimestamp(task.createdAt),
    updatedAt: toRequestTimestamp(task.updatedAt),
    completedAt: task.status === 'completed' ? toRequestTimestamp(task.updatedAt) : undefined,
  };
};
