import type { MagicStudioGenerationTask } from '@sdkwork/magic-studio-host-types';
import type { GenerationOutcome } from '@sdkwork/magic-studio-types/agi';
import { hasInputResourceReference } from '@sdkwork/magic-studio-types/input-resource';
import { resolveAssetUrlByAssetIdFirst } from '@sdkwork/magic-studio-assets/asset-center';
import { generateUUID } from '@sdkwork/magic-studio-commons/utils/helpers';
import { assertRuntimeMagicStudioExecutionOperationReady } from '@sdkwork/magic-studio-core/platform';
import { waitForCanonicalTaskResult } from '@sdkwork/magic-studio-core/services';

import {
  type VoiceConfig,
  type VoiceInputResourceRef,
  type VoiceProfile,
  type VoiceTask,
  createVoiceTask as createCanonicalVoiceTask,
} from '../entities';
import { PRESET_VOICES } from '../constants';
import { buildVoiceSpeechTaskCreateRequest } from './voiceRequestBuilder';
import { createVoiceServerClient } from './voiceServerClient';
import {
  isVoiceSpeechTaskTerminalStatus,
  mapCanonicalVoiceTask,
  mapCanonicalVoiceTaskToGenerationOutcomes,
} from './voiceTaskMapper';
import { safeIdString } from './voiceService.shared';

const TASK_POLL_INTERVAL_MS = 250;
const TASK_POLL_MAX_ATTEMPTS = 40;

const createServerClient = () => createVoiceServerClient('VoiceService');

const assertReferenceAudioReady = (config: VoiceConfig): void => {
  if ((config.mode || 'design') !== 'clone') {
    return;
  }

  if (!hasInputResourceReference(config.referenceAudio)) {
    throw new Error('Voice clone generation requires a reference audio resource');
  }
};

const isRenderableVoiceReferenceUrl = (value: unknown): value is string =>
  typeof value === 'string' &&
  /^(https?:\/\/|data:)/i.test(value.trim());

const resolveReferenceAudioUrl = async (
  reference: VoiceInputResourceRef,
): Promise<string | null> => {
  const resolvedUrl = await resolveAssetUrlByAssetIdFirst(reference);
  if (resolvedUrl) {
    return resolvedUrl;
  }

  return isRenderableVoiceReferenceUrl(reference.url) ? reference.url.trim() : null;
};

const resolveVoiceConfigForCreateRequest = async (
  config: VoiceConfig,
): Promise<VoiceConfig> => {
  assertReferenceAudioReady(config);

  if ((config.mode || 'design') !== 'clone' || !config.referenceAudio) {
    return config;
  }

  const referenceAudioUrl = await resolveReferenceAudioUrl(config.referenceAudio);
  if (!referenceAudioUrl) {
    throw new Error('Voice generation requires a resolvable reference audio url');
  }

  return {
    ...config,
    referenceAudio: {
      ...config.referenceAudio,
      url: referenceAudioUrl,
    },
  };
};

const shouldReturnVoiceTask = (task: MagicStudioGenerationTask): boolean =>
  isVoiceSpeechTaskTerminalStatus(task) ||
  !!task.primaryArtifact ||
  (Array.isArray(task.artifacts) && task.artifacts.length > 0);

const createCanonicalSpeechTask = async (
  config: VoiceConfig
): Promise<MagicStudioGenerationTask> => {
  const requestConfig = await resolveVoiceConfigForCreateRequest(config);

  await assertRuntimeMagicStudioExecutionOperationReady(
    'voice-speech-tasks',
    'create-speech-task',
    { feature: 'VoiceService' }
  );

  const serverClient = createServerClient();
  const response = await serverClient.createVoiceSpeechTask(
    buildVoiceSpeechTaskCreateRequest(requestConfig)
  );
  const task = response.data;

  if (!task) {
    throw new Error('Voice generation did not return a task payload');
  }

  return task;
};

const resolveFinalTask = async (
  task: MagicStudioGenerationTask,
): Promise<MagicStudioGenerationTask> => {
  if (shouldReturnVoiceTask(task)) {
    return task;
  }

  const taskId = safeIdString(task.taskId);
  if (!taskId) {
    throw new Error(task.errorMessage || 'Voice generation did not return a task id');
  }

  const serverClient = createServerClient();
  return waitForCanonicalTaskResult({
    taskId,
    readTask: async (readTaskId) =>
      (await serverClient.readVoiceSpeechTask(readTaskId)).data || null,
    shouldReturnTask: shouldReturnVoiceTask,
    waitMs: TASK_POLL_INTERVAL_MS,
    maxAttempts: TASK_POLL_MAX_ATTEMPTS,
    timeoutMessage: 'Voice generation timed out before output became available',
  });
};

export const voiceService = {
  getVoices: async (): Promise<VoiceProfile[]> => PRESET_VOICES,

  generateTask: async (config: VoiceConfig): Promise<VoiceTask> => {
    const task = await createCanonicalSpeechTask(config);
    const finalTask = await resolveFinalTask(task);
    return mapCanonicalVoiceTask(finalTask, config);
  },

  generateSpeech: async (config: VoiceConfig): Promise<GenerationOutcome[]> => {
    const task = await createCanonicalSpeechTask(config);
    const finalTask = await resolveFinalTask(task);

    if (finalTask.status === 'failed' || finalTask.status === 'cancelled') {
      throw new Error(
        finalTask.errorMessage || 'Voice generation did not produce an audio artifact'
      );
    }

    const outcomes = mapCanonicalVoiceTaskToGenerationOutcomes(finalTask, config);
    if (outcomes.length === 0) {
      throw new Error(
        finalTask.errorMessage || 'Voice generation did not return an audio artifact'
      );
    }

    return outcomes;
  },

  isSupported: (): boolean =>
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices &&
    typeof navigator.mediaDevices.getUserMedia === 'function',

  getAudioDevices: async (): Promise<MediaDeviceInfo[]> => {
    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices ||
      typeof navigator.mediaDevices.enumerateDevices !== 'function'
    ) {
      return [];
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter((device) => device.kind === 'audioinput');
    } catch (error) {
      console.error('Failed to enumerate audio devices:', error);
      return [];
    }
  },

  createVoiceTask: (task: Partial<VoiceTask>): VoiceTask => {
    const taskUuid = task.uuid || generateUUID();

    return createCanonicalVoiceTask({
      ...task,
      id: Object.prototype.hasOwnProperty.call(task, 'id') ? task.id ?? null : null,
      uuid: taskUuid,
      speakerId: task.speakerId || '',
      text: task.text || '',
      type: task.type || 'VOICE_TASK',
      status: task.status ?? 'pending',
    });
  },

  audioToBlob: async (
    audioBuffer: AudioBuffer,
    format = 'audio/webm'
  ): Promise<Blob> => {
    return new Blob([audioBuffer.getChannelData(0)], { type: format });
  },
};

export class VoiceService {
  private static instance: VoiceService;

  private constructor() {}

  static getInstance(): VoiceService {
    if (!VoiceService.instance) {
      VoiceService.instance = new VoiceService();
    }
    return VoiceService.instance;
  }

  async generateTask(config: VoiceConfig): Promise<VoiceTask> {
    return voiceService.generateTask(config);
  }

  async generateSpeech(config: VoiceConfig): Promise<GenerationOutcome[]> {
    return voiceService.generateSpeech(config);
  }

  isSupported(): boolean {
    return voiceService.isSupported();
  }

  async getAudioDevices(): Promise<MediaDeviceInfo[]> {
    return voiceService.getAudioDevices();
  }

  createVoiceTask(task: Partial<VoiceTask>): VoiceTask {
    return voiceService.createVoiceTask(task);
  }

  async audioToBlob(audioBuffer: AudioBuffer, format = 'audio/webm'): Promise<Blob> {
    return voiceService.audioToBlob(audioBuffer, format);
  }
}
