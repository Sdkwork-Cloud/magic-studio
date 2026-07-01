import type {
  MagicStudioAudioGenerationRequest,
  MagicStudioGenerationTask,
} from '@sdkwork/magic-studio-host-types';
import { assertRuntimeMagicStudioExecutionOperationReady } from '@sdkwork/magic-studio-core/platform';
import { waitForCanonicalTaskResult } from '@sdkwork/magic-studio-core/services';
import type { GenerationOutcome, MediaInputRef } from '@sdkwork/magic-studio-types/agi';
import { resolveInputResourceReference } from '@sdkwork/magic-studio-types/input-resource';

import type { AudioGenerationParams } from '../entities';
import { resolveAudioInputResourceKey } from '../entities';
import { createAudioServerClient } from './audioServerClient';
import {
  isAudioGenerationTaskTerminalStatus,
  mapCanonicalAudioTaskToGenerationOutcome,
} from './audioTaskMapper';
import {
  normalizeAudioTextModel,
  normalizeAudioTtsModel,
} from '../utils/audioModel';

type AudioMode = NonNullable<AudioGenerationParams['mode']>;

const TASK_POLL_INTERVAL_MS = 250;
const TASK_POLL_MAX_ATTEMPTS = 40;

const safeIdString = (value: unknown): string => {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return '';
};

const resolveAudioMode = (mode?: AudioGenerationParams['mode']): AudioMode =>
  mode || 'text-to-speech';

const createServerClient = () => createAudioServerClient('AudioService');

const buildSourceAudioInputRef = (
  params: AudioGenerationParams,
): MediaInputRef | null => {
  const sourceAudio = params.sourceAudio;
  if (!sourceAudio) {
    return null;
  }

  const key =
    resolveAudioInputResourceKey(sourceAudio) ||
    resolveInputResourceReference(sourceAudio);
  if (!key) {
    return null;
  }

  return {
    ...sourceAudio,
    assetId: sourceAudio.assetId ?? null,
    assetUuid: sourceAudio.assetUuid ?? null,
    primaryResourceId: sourceAudio.primaryResourceId ?? null,
    primaryResourceUuid: sourceAudio.primaryResourceUuid ?? null,
    resourceViewId: sourceAudio.resourceViewId ?? null,
    resourceViewUuid: sourceAudio.resourceViewUuid ?? null,
    role: 'input',
    resource: sourceAudio.resource ? { ...sourceAudio.resource } : undefined,
  };
};

const buildAudioRequest = (
  params: AudioGenerationParams,
): MagicStudioAudioGenerationRequest => {
  const mode = resolveAudioMode(params.mode);
  const model =
    mode === 'text-to-speech'
      ? normalizeAudioTtsModel(params.model)
      : normalizeAudioTextModel(params.model);

  return {
    mode,
    prompt: params.prompt || undefined,
    negativePrompt: params.negativePrompt || undefined,
    model,
    voice: params.voice || undefined,
    duration: params.duration,
    seed: params.seed,
    sourceAudio: buildSourceAudioInputRef(params),
    language: params.language || undefined,
    format:
      mode === 'text-to-speech'
        ? 'wav'
        : params.format || 'text',
    sourceLanguage: params.sourceLanguage || undefined,
    targetLanguage: params.targetLanguage || undefined,
    idempotencyKey: params.idempotencyKey || undefined,
  };
};

const resolveOperationKey = (
  mode: AudioMode,
): 'text-to-speech' | 'transcription' | 'translation' => {
  switch (mode) {
    case 'transcription':
      return 'transcription';
    case 'translation':
      return 'translation';
    case 'text-to-speech':
    default:
      return 'text-to-speech';
  }
};

const shouldReturnTask = (task: MagicStudioGenerationTask): boolean =>
  isAudioGenerationTaskTerminalStatus(task) ||
  !!task.primaryArtifact ||
  (Array.isArray(task.artifacts) && task.artifacts.length > 0);

const createCanonicalAudioTask = async (
  params: AudioGenerationParams,
): Promise<MagicStudioGenerationTask> => {
  const mode = resolveAudioMode(params.mode);
  await assertRuntimeMagicStudioExecutionOperationReady(
    'audio-generation',
    resolveOperationKey(mode),
    { feature: 'AudioService' },
  );

  const serverClient = createServerClient();
  const payload = buildAudioRequest(params);

  const response =
    mode === 'transcription'
      ? await serverClient.createAudioTranscriptionTask(payload)
      : mode === 'translation'
        ? await serverClient.createAudioTranslationTask(payload)
        : await serverClient.createAudioTextToSpeechTask(payload);
  const task = response.data;

  if (!task) {
    throw new Error('Audio generation did not return a task payload');
  }

  return task;
};

const resolveFinalTask = async (
  task: MagicStudioGenerationTask,
): Promise<MagicStudioGenerationTask> => {
  if (shouldReturnTask(task)) {
    return task;
  }

  const taskId = safeIdString(task.taskId);
  if (!taskId) {
    throw new Error(task.errorMessage || 'Audio generation did not return a task id');
  }

  const serverClient = createServerClient();
  return waitForCanonicalTaskResult({
    taskId,
    readTask: async (readTaskId) =>
      (await serverClient.readAudioGenerationTask(readTaskId)).data || null,
    shouldReturnTask,
    waitMs: TASK_POLL_INTERVAL_MS,
    maxAttempts: TASK_POLL_MAX_ATTEMPTS,
    timeoutMessage: 'Audio generation timed out before output became available',
  });
};

const assertTaskSucceeded = (task: MagicStudioGenerationTask): void => {
  if (task.status === 'failed' || task.status === 'cancelled') {
    throw new Error(
      task.errorMessage || 'Audio generation did not produce a canonical artifact',
    );
  }
};

class AudioService {
  async generateAudio(params: AudioGenerationParams): Promise<GenerationOutcome> {
    const task = await createCanonicalAudioTask(params);
    const finalTask = await resolveFinalTask(task);
    assertTaskSucceeded(finalTask);
    return mapCanonicalAudioTaskToGenerationOutcome(finalTask, params);
  }
}

export const audioService = new AudioService();
