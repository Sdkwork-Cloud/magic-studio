import {
  assertRuntimeMagicStudioExecutionOperationReady,
} from '@sdkwork/magic-studio-core/platform';
import {
  createRuntimeMagicStudioServerClient,
  readDefaultPlatformRuntime,
} from '@sdkwork/magic-studio-core/sdk';
import { waitForCanonicalTaskResult } from '@sdkwork/magic-studio-core/services';
import { createCanonicalGenerationTaskStore } from '@sdkwork/magic-studio-generation-history';
import type { CharacterConfig, CharacterTask } from '../entities';
import { buildCharacterCreateRequest } from './characterRequestBuilder';
import {
  isCharacterGenerationTaskTerminalStatus,
  mapCharacterGenerationTask,
} from './characterTaskMapper';
import { safeIdString } from './characterService.shared';

const TASK_POLL_INTERVAL_MS = 50;
const TASK_POLL_MAX_ATTEMPTS = 20;

const createServerClient = () => {
  const runtime = readDefaultPlatformRuntime('CharacterService');
  return createRuntimeMagicStudioServerClient(runtime);
};
const characterTaskGovernance = createCanonicalGenerationTaskStore<CharacterTask>({
  feature: 'CharacterService',
  mapper: {
    fromTask: (task) => mapCharacterGenerationTask(task),
  },
  query: {
    product: 'character',
  },
});

class CharacterService {
  async generate(config: CharacterConfig): Promise<CharacterTask> {
    await assertRuntimeMagicStudioExecutionOperationReady(
      'character-generation',
      'create',
      { feature: 'CharacterService' }
    );

    const serverClient = createServerClient();
    const requestBody = await buildCharacterCreateRequest(config);
    const response = await serverClient.createCharacterGenerationTask(requestBody);
    const task = response.data;

    if (!task) {
      throw new Error('Character generation did not return a task payload');
    }

    if (
      isCharacterGenerationTaskTerminalStatus(task) ||
      task.primaryArtifact ||
      task.artifacts.length > 0
    ) {
      return mapCharacterGenerationTask(task, config);
    }

    const taskId = safeIdString(task.taskId);
    if (!taskId) {
      throw new Error(task.errorMessage || 'Character generation did not return a task id');
    }

    const finalTask = await waitForCanonicalTaskResult({
      taskId,
      readTask: async (readTaskId) =>
        (await serverClient.readCharacterGenerationTask(readTaskId)).data || null,
      shouldReturnTask: isCharacterGenerationTaskTerminalStatus,
      waitMs: TASK_POLL_INTERVAL_MS,
      maxAttempts: TASK_POLL_MAX_ATTEMPTS,
      timeoutMessage: 'Character generation timed out before output became available',
    });
    return mapCharacterGenerationTask(finalTask, config);
  }

  async listTasks(): Promise<CharacterTask[]> {
    const response = await characterTaskGovernance.findAll({ page: 0, size: 50 });
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to load character tasks');
    }

    return response.data.content;
  }

  async deleteTask(taskId: string): Promise<void> {
    const response = await characterTaskGovernance.cancelById(taskId);
    if (!response.success) {
      throw new Error(response.message || 'Failed to cancel character task');
    }
  }
}

export const characterService = new CharacterService();
