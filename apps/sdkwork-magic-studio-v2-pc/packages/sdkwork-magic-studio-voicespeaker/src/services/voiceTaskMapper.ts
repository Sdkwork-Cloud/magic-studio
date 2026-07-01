import type {
  MagicStudioGenerationArtifact,
  MagicStudioGenerationTask,
} from '@sdkwork/magic-studio-host-types';
import { createGenerationOutcome } from '@sdkwork/magic-studio-core/services';
import type { GenerationOutcome } from '@sdkwork/magic-studio-types/agi';
import { MediaResourceType } from '@sdkwork/magic-studio-types/vocabulary';

import {
  createGeneratedVoiceResult,
  createVoiceInputResourceRef,
  createVoiceTask,
  type GeneratedVoiceResult,
  type VoiceConfig,
  type VoiceTask,
} from '../entities';
import {
  estimateDuration,
  normalizeVoiceInputMethod,
  normalizeVoiceMode,
  normalizeVoiceModel,
  readMetadataString,
  readRecordBoolean,
  readRecordNumber,
  readRecordString,
  safeIdString,
  safeString,
  safeTimestamp,
} from './voiceService.shared';

const resolveTaskParameters = (
  task: MagicStudioGenerationTask
): Record<string, unknown> | undefined =>
  task.parameters && typeof task.parameters === 'object'
    ? task.parameters
    : undefined;

const resolveVoiceTaskStatus = (
  status?: MagicStudioGenerationTask['status']
): VoiceTask['status'] => {
  switch (status) {
    case 'processing':
      return 'processing';
    case 'succeeded':
      return 'completed';
    case 'failed':
    case 'cancelled':
      return 'failed';
    case 'draft':
    case 'queued':
    default:
      return 'pending';
  }
};

const toVoiceInputResourceRef = (
  input: MagicStudioGenerationTask['inputRefs'][number] | undefined
) => {
  if (!input) {
    return undefined;
  }

  return createVoiceInputResourceRef({
    id: input.id ?? null,
    uuid: input.uuid,
    assetId: input.assetId ?? null,
    assetUuid: input.assetUuid ?? null,
    primaryResourceId: input.primaryResourceId ?? null,
    primaryResourceUuid: input.primaryResourceUuid ?? null,
    resourceViewId: input.resourceViewId ?? null,
    resourceViewUuid: input.resourceViewUuid ?? null,
    path: input.path,
    url: input.url,
    name: input.name,
    mimeType: input.mimeType,
    type: input.type === 'voice' ? 'voice' : 'audio',
    resource: input.resource ?? undefined,
    metadata: input.metadata ?? undefined,
    createdAt: input.createdAt,
    updatedAt: input.updatedAt,
    deletedAt: input.deletedAt,
  });
};

const buildVoiceConfigFromTask = (
  task: MagicStudioGenerationTask,
  fallbackConfig?: VoiceConfig
): VoiceConfig => {
  if (fallbackConfig) {
    return fallbackConfig;
  }

  const parameters = resolveTaskParameters(task);
  const speakerId =
    readRecordString(parameters, 'speakerId') ||
    readRecordString(parameters, 'voiceId') ||
    safeIdString(task.taskId);
  const text = safeString(task.prompt);
  const referenceAudio = task.inputRefs.find(
    (item) => safeString(item.role) === 'reference'
  );

  return {
    text,
    previewText: text,
    voiceId: speakerId,
    model: normalizeVoiceModel(task.providerModel),
    speed: readRecordNumber(parameters, 'speed') ?? 1,
    pitch: readRecordNumber(parameters, 'pitch') ?? 1,
    stability: readRecordNumber(parameters, 'stability'),
    similarityBoost: readRecordNumber(parameters, 'similarityBoost'),
    avatarUrl: readRecordString(parameters, 'avatarUrl'),
    description: readRecordString(parameters, 'description'),
    mode: normalizeVoiceMode(readRecordString(parameters, 'mode')),
    inputMethod: normalizeVoiceInputMethod(
      readRecordString(parameters, 'inputMethod')
    ),
    referenceAudio: toVoiceInputResourceRef(referenceAudio),
    mediaType: 'voice',
  };
};

const normalizeCanonicalVoiceArtifacts = (
  task: MagicStudioGenerationTask
): MagicStudioGenerationArtifact[] => {
  const seen = new Set<string>();
  const artifacts: MagicStudioGenerationArtifact[] = [];
  const candidates = [
    task.primaryArtifact || null,
    ...(Array.isArray(task.artifacts) ? task.artifacts : []),
  ];

  for (const artifact of candidates) {
    if (!artifact) {
      continue;
    }

    const artifactType = safeString(artifact.type);
    const artifactRole = safeString(artifact.role);
    const artifactUrl = safeString(artifact.url);

    if (!artifactUrl) {
      continue;
    }
    if (artifactRole === 'reference' || artifactRole === 'source' || artifactRole === 'mask') {
      continue;
    }
    if (artifactType && artifactType !== 'voice' && artifactType !== 'audio') {
      continue;
    }

    const key =
      safeIdString(artifact.uuid) ||
      safeIdString(artifact.id) ||
      artifactUrl;
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    artifacts.push(artifact);
  }

  return artifacts;
};

const mapVoiceArtifactToGeneratedVoiceResult = (
  artifact: MagicStudioGenerationArtifact,
  task: MagicStudioGenerationTask,
  config: VoiceConfig,
  index: number
): GeneratedVoiceResult | null => {
  const url = safeString(artifact.url);
  if (!url) {
    return null;
  }

  const key =
    safeIdString(artifact.uuid) ||
    safeIdString(artifact.id) ||
    `voice-result-${index + 1}`;
  const metadata =
    typeof artifact.metadata === 'object' && artifact.metadata !== null
      ? {
          ...artifact.metadata,
          assetId: safeString(artifact.assetId) || undefined,
          assetUuid: safeString(artifact.assetUuid) || undefined,
          primaryResourceId: safeString(artifact.primaryResourceId) || undefined,
          primaryResourceUuid:
            safeString(artifact.primaryResourceUuid) || undefined,
          resourceViewId: safeString(artifact.resourceViewId) || undefined,
          resourceViewUuid: safeString(artifact.resourceViewUuid) || undefined,
        }
      : {
          assetId: safeString(artifact.assetId) || undefined,
          assetUuid: safeString(artifact.assetUuid) || undefined,
          primaryResourceId:
            safeString(artifact.primaryResourceId) || undefined,
          primaryResourceUuid:
            safeString(artifact.primaryResourceUuid) || undefined,
          resourceViewId: safeString(artifact.resourceViewId) || undefined,
          resourceViewUuid: safeString(artifact.resourceViewUuid) || undefined,
        };
  const text = safeString(task.prompt, config.text);

  return createGeneratedVoiceResult({
    id: safeString(artifact.id) || null,
    uuid: key,
    assetId: safeString(artifact.assetId) || null,
    assetUuid: safeString(artifact.assetUuid) || null,
    primaryResourceId: safeString(artifact.primaryResourceId) || null,
    primaryResourceUuid: safeString(artifact.primaryResourceUuid) || null,
    resourceViewId: safeString(artifact.resourceViewId) || null,
    resourceViewUuid: safeString(artifact.resourceViewUuid) || null,
    url,
    duration: artifact.duration ?? estimateDuration(text),
    text,
    speakerId: config.voiceId,
    avatarUrl: config.avatarUrl,
    modelId: config.model,
    resource: {
      id: safeString(artifact.primaryResourceId) || undefined,
      uuid:
        safeString(artifact.primaryResourceUuid) ||
        safeString(artifact.resourceViewUuid) ||
        safeString(artifact.assetUuid) ||
        key,
      assetId: safeString(artifact.assetId) || null,
      primaryResourceId: safeString(artifact.primaryResourceId) || null,
      resourceViewId: safeString(artifact.resourceViewId) || null,
      type: MediaResourceType.VOICE,
      name: safeString(artifact.name, `generated-voice-${index + 1}.wav`),
      url,
      path:
        readMetadataString(metadata, 'path') ||
        readMetadataString(metadata, 'canonicalPath') ||
        readMetadataString(metadata, 'sourcePath') ||
        url,
      mimeType: safeString(artifact.mimeType) || undefined,
      duration: artifact.duration ?? estimateDuration(text),
      metadata,
    },
  });
};

export const isVoiceSpeechTaskTerminalStatus = (
  task?: Pick<MagicStudioGenerationTask, 'status'> | null
): boolean => {
  return (
    task?.status === 'succeeded' ||
    task?.status === 'failed' ||
    task?.status === 'cancelled'
  );
};

export const mapCanonicalVoiceTask = (
  task: MagicStudioGenerationTask,
  fallbackConfig?: VoiceConfig
): VoiceTask => {
  const config = buildVoiceConfigFromTask(task, fallbackConfig);
  const parameters = resolveTaskParameters(task);
  const results = normalizeCanonicalVoiceArtifacts(task)
    .map((artifact, index) =>
      mapVoiceArtifactToGeneratedVoiceResult(artifact, task, config, index)
    )
    .filter((item): item is GeneratedVoiceResult => item !== null);

  return createVoiceTask({
    id: task.id,
    uuid: task.uuid,
    createdAt: safeTimestamp(task.createdAt),
    updatedAt: safeTimestamp(task.updatedAt),
    speakerId:
      readRecordString(parameters, 'speakerId') ||
      readRecordString(parameters, 'voiceId') ||
      config.voiceId,
    text: safeString(task.prompt, config.text),
    status: resolveVoiceTaskStatus(task.status),
    config,
    result: results[0],
    results,
    isFavorite: readRecordBoolean(parameters, 'isFavorite'),
    error: safeString(task.errorMessage) || undefined,
  });
};

export const mapCanonicalVoiceTaskToGenerationOutcomes = (
  task: MagicStudioGenerationTask,
  fallbackConfig: VoiceConfig
): GenerationOutcome[] => {
  const mappedTask = mapCanonicalVoiceTask(task, fallbackConfig);
  const results = Array.isArray(mappedTask.results) ? mappedTask.results : [];

  return results.map((result, index) =>
    createGenerationOutcome({
      product: 'speech',
      mode: 'text-to-speech',
      provider: safeString(task.provider, 'magic-studio-server'),
      providerModel: fallbackConfig.model,
      prompt: mappedTask.text,
      status: task.status === 'succeeded' ? 'succeeded' : 'failed',
      progress: task.progress,
      remoteJobId: safeString(task.remoteJobId) || safeString(task.taskId) || null,
      parameters: {
        voiceId: mappedTask.config.voiceId,
        speakerId: mappedTask.speakerId,
        speed: mappedTask.config.speed,
        pitch: mappedTask.config.pitch,
        stability: mappedTask.config.stability,
        similarityBoost: mappedTask.config.similarityBoost,
        generationMode: mappedTask.config.mode || 'design',
        inputMethod: mappedTask.config.inputMethod || 'upload',
        description: mappedTask.config.description || null,
        avatarUrl: mappedTask.config.avatarUrl || null,
      },
      inputRefs: task.inputRefs,
      providerPayload: task.providerPayload,
      artifact: {
        type: 'voice',
        url: safeString(result.resource.url) || safeString(result.url),
        mimeType: safeString(result.resource.mimeType) || 'audio/wav',
        name:
          safeString(result.resource.name) ||
          `generated-voice-${index + 1}.wav`,
        duration: result.duration,
        metadata: {
          speakerId: mappedTask.speakerId,
          voiceId: mappedTask.config.voiceId,
          avatarUrl: mappedTask.config.avatarUrl,
          model: mappedTask.config.model,
        },
      },
    })
  );
};
