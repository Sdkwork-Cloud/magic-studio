import { createCanonicalGenerationTaskStore } from '@sdkwork/magic-studio-generation-history';
import { resolveEntityKey } from '@sdkwork/magic-studio-types/entity';
import { type Page, type PageRequest } from '@sdkwork/magic-studio-types/pagination';
import { Result, type ServiceResult } from '@sdkwork/magic-studio-types/service';

import { type VoiceTask } from '../entities';
import { createVoiceServerClient } from './voiceServerClient';
import { buildVoiceSpeechTaskUpsertRequest } from './voiceRequestBuilder';
import { mapCanonicalVoiceTask } from './voiceTaskMapper';
import { safeIdString } from './voiceService.shared';

const createServerClient = () => createVoiceServerClient('VoiceHistoryService');
const voiceTaskGovernance = createCanonicalGenerationTaskStore<VoiceTask>({
  feature: 'VoiceHistoryService',
  mapper: {
    fromTask: (task) => mapCanonicalVoiceTask(task),
  },
  query: {
    product: 'speech',
  },
});

class VoiceHistoryService {
  async save(entity: Partial<VoiceTask>): Promise<ServiceResult<VoiceTask>> {
    const taskKey =
      safeIdString(entity.id) ||
      safeIdString(entity.uuid);
    if (!taskKey) {
      return Result.error('Voice history save requires an existing task identity', 400);
    }
    const payload = buildVoiceSpeechTaskUpsertRequest(entity);
    if (!payload.text) {
      return Result.error('Voice history save requires task text', 400);
    }
    if (!payload.speakerId) {
      return Result.error('Voice history save requires speaker identity', 400);
    }

    const response = await createServerClient().upsertVoiceSpeechTask(taskKey, payload);
    const task = response.data;
    if (!task) {
      return Result.error('Voice history save did not return a task payload', 500);
    }

    return Result.success(mapCanonicalVoiceTask(task));
  }

  async saveAll(entities: Partial<VoiceTask>[]): Promise<ServiceResult<VoiceTask[]>> {
    const results: VoiceTask[] = [];
    for (const entity of entities) {
      const response = await this.save(entity);
      if (response.success && response.data) {
        results.push(response.data);
      }
    }

    return Result.success(results);
  }

  async findById(id: string): Promise<ServiceResult<VoiceTask | null>> {
    return voiceTaskGovernance.findById(id);
  }

  async existsById(id: string): Promise<boolean> {
    const result = await this.findById(id);
    return !!(result.success && result.data);
  }

  async findAll(pageRequest?: PageRequest): Promise<ServiceResult<Page<VoiceTask>>> {
    return voiceTaskGovernance.findAll(pageRequest);
  }

  async findAllById(ids: string[]): Promise<ServiceResult<VoiceTask[]>> {
    const results = await Promise.all(ids.map((id) => this.findById(id)));
    return Result.success(
      results
        .filter((item): item is ServiceResult<VoiceTask> => !!item.success && !!item.data)
        .map((item) => item.data as VoiceTask)
    );
  }

  async count(): Promise<number> {
    const firstPage = await this.findAll({ page: 0, size: 1 });
    return firstPage.data?.totalElements ?? 0;
  }

  async deleteById(id: string): Promise<ServiceResult<void>> {
    return voiceTaskGovernance.deleteById(id);
  }

  async delete(entity: VoiceTask): Promise<ServiceResult<void>> {
    return this.deleteById(resolveEntityKey(entity));
  }

  async deleteAll(ids: string[]): Promise<ServiceResult<void>> {
    for (const id of ids) {
      await this.deleteById(id);
    }
    return Result.success(undefined);
  }

  async toggleFavorite(id: string): Promise<void> {
    const taskRes = await this.findById(id);
    if (taskRes.success && taskRes.data) {
      await createServerClient().updateVoiceSpeechTask(id, {
        isFavorite: !taskRes.data.isFavorite,
      });
    }
  }

  async clear(): Promise<ServiceResult<void>> {
    while (true) {
      const response = await voiceTaskGovernance.findAll({ page: 0, size: 200 });
      if (!response.success || !response.data) {
        return Result.error(
          response.message || 'Failed to clear voice history.',
          response.code ?? 500,
        );
      }

      const tasks = response.data.content;
      if (tasks.length === 0) {
        break;
      }

      const deleteResults = await Promise.all(
        tasks.map((task) => this.deleteById(resolveEntityKey(task)))
      );
      const failedDelete = deleteResults.find((item) => !item.success);
      if (failedDelete) {
        return Result.error(
          failedDelete.message || 'Failed to clear voice history.',
          failedDelete.code ?? 500,
        );
      }

      if (tasks.length < 200) {
        break;
      }
    }

    return Result.success(undefined);
  }
}

export const voiceHistoryService = new VoiceHistoryService();
