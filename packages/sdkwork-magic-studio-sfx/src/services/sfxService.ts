import { assertRuntimeMagicStudioExecutionOperationReady } from '@sdkwork/magic-studio-core/platform';
import { waitForCanonicalTaskResult } from '@sdkwork/magic-studio-core/services';
import type {
  MagicStudioGenerationTask,
  MagicStudioSfxCategory,
  MagicStudioSfxGenerationRequest,
} from '@sdkwork/magic-studio-host-types';
import type { GenerationOutcome } from '@sdkwork/magic-studio-types/agi';
import type { SfxCategory, SfxConfig } from '../entities';
import { normalizeSfxModel } from '../utils/sfxModel';
import { createSfxServerClient } from './sfxServerClient';
import {
  isSfxGenerationTaskTerminalStatus,
  mapCanonicalSfxTaskToGenerationOutcome,
} from './sfxTaskMapper';

const TASK_POLL_INTERVAL_MS = 250;
const TASK_POLL_MAX_ATTEMPTS = 40;

const safeString = (value: unknown): string => {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return '';
};

const safeIdString = (value: unknown): string => {
  return safeString(value);
};

const createServerClient = () => createSfxServerClient('SfxService');

const shouldReturnTask = (task: MagicStudioGenerationTask): boolean =>
  isSfxGenerationTaskTerminalStatus(task) ||
  !!task.primaryArtifact ||
  (Array.isArray(task.artifacts) && task.artifacts.length > 0);

const buildSfxGenerationRequest = (
  config: SfxConfig,
): MagicStudioSfxGenerationRequest => ({
  prompt: config.prompt,
  model: normalizeSfxModel(config.model),
  duration: config.duration,
  mediaType: config.mediaType,
});

const assertTaskSucceeded = (task: MagicStudioGenerationTask): void => {
  if (task.status === 'failed' || task.status === 'cancelled') {
    throw new Error(
      task.errorMessage || 'SFX generation did not produce a canonical artifact',
    );
  }
};

const mapSfxCategory = (category: MagicStudioSfxCategory): SfxCategory | null => {
  const id = safeString(category.id);
  const name = safeString(category.label) || id;
  if (!id || !name) {
    return null;
  }

  return {
    id,
    name,
    description: safeString(category.description) || undefined,
  };
};

const resolveFinalTask = async (
  task: MagicStudioGenerationTask,
): Promise<MagicStudioGenerationTask> => {
  if (shouldReturnTask(task)) {
    return task;
  }

  const taskId = safeIdString(task.taskId);
  if (!taskId) {
    throw new Error(task.errorMessage || 'SFX generation did not return a task id');
  }

  const serverClient = createServerClient();
  return waitForCanonicalTaskResult({
    taskId,
    readTask: async (readTaskId) =>
      (await serverClient.readSfxGenerationTask(readTaskId)).data || null,
    shouldReturnTask,
    waitMs: TASK_POLL_INTERVAL_MS,
    maxAttempts: TASK_POLL_MAX_ATTEMPTS,
    timeoutMessage: 'SFX generation timed out before output became available',
  });
};

class SfxService {
  isConfigured(): boolean {
    return true;
  }

  async generateSfx(config: SfxConfig): Promise<GenerationOutcome> {
    const normalizedModel = normalizeSfxModel(config.model);

    await assertRuntimeMagicStudioExecutionOperationReady(
      'sfx-generation',
      'create',
      { feature: 'SfxService' },
    );

    const serverClient = createServerClient();
    const response = await serverClient.createSfxGenerationTask(
      buildSfxGenerationRequest({
        ...config,
        model: normalizedModel,
      }),
    );
    const task = response.data;

    if (!task) {
      throw new Error('SFX generation did not return a task payload');
    }

    const finalTask = await resolveFinalTask(task);
    assertTaskSucceeded(finalTask);

    return mapCanonicalSfxTaskToGenerationOutcome(finalTask, {
      prompt: config.prompt,
      duration: config.duration,
      model: normalizedModel,
      mediaType: config.mediaType,
    });
  }

  async getCategories(): Promise<SfxCategory[]> {
    const response = await createServerClient().listSfxGenerationCategories();
    return (response.items ?? [])
      .map((category) => mapSfxCategory(category))
      .filter((category): category is SfxCategory => Boolean(category));
  }
}

export const sfxService = new SfxService();
