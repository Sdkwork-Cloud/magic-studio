import type {
  MagicStudioGenerationTask,
  MagicStudioGenerationTaskListQuery,
} from '@sdkwork/magic-studio-server';
import {
  DEFAULT_PAGE_SIZE,
  type Page,
  type PageRequest,
} from '@sdkwork/magic-studio-types/pagination';
import {
  Result,
  type ServiceResult,
} from '@sdkwork/magic-studio-types/service';

import {
  getCanonicalMagicStudioServerClient,
  isServerClientNotFound,
  toPageEnvelope,
  toServerClientErrorCode,
  toServerClientErrorMessage,
} from './serverClient';

export interface CanonicalGenerationTaskMapper<TTask> {
  fromTask(task: MagicStudioGenerationTask): TTask;
}

export interface CanonicalGenerationTaskStoreOptions<TTask> {
  feature: string;
  mapper: CanonicalGenerationTaskMapper<TTask>;
  query?: Omit<MagicStudioGenerationTaskListQuery, 'page' | 'pageSize'>;
}

export interface CanonicalGenerationTaskStore<TTask> {
  findAll(
    pageRequest?: PageRequest,
    query?: Omit<MagicStudioGenerationTaskListQuery, 'page' | 'pageSize'>,
  ): Promise<ServiceResult<Page<TTask>>>;
  findById(id: string): Promise<ServiceResult<TTask | null>>;
  deleteById(id: string): Promise<ServiceResult<void>>;
  cancelById(id: string): Promise<ServiceResult<TTask>>;
}

export function createCanonicalGenerationTaskStore<TTask>(
  options: CanonicalGenerationTaskStoreOptions<TTask>,
): CanonicalGenerationTaskStore<TTask> {
  const { feature, mapper } = options;
  const baseQuery = options.query || {};

  const readTaskOrNull = async (
    id: string,
  ): Promise<MagicStudioGenerationTask | null> => {
    try {
      const response = await getCanonicalMagicStudioServerClient(feature).readGenerationTask(id);
      return response.data || null;
    } catch (error) {
      if (isServerClientNotFound(error)) {
        return null;
      }
      throw error;
    }
  };

  return {
    async findAll(
      pageRequest?: PageRequest,
      query?: Omit<MagicStudioGenerationTaskListQuery, 'page' | 'pageSize'>,
    ): Promise<ServiceResult<Page<TTask>>> {
      const page = Math.max(0, pageRequest?.page ?? 0);
      const size = Math.max(1, pageRequest?.size ?? DEFAULT_PAGE_SIZE);

      try {
        const response = await getCanonicalMagicStudioServerClient(feature).listGenerationTasks({
          ...baseQuery,
          ...query,
          page: page + 1,
          pageSize: size,
        });
        const items = Array.isArray(response.items)
          ? response.items.map((task) => mapper.fromTask(task))
          : [];
        const total = response.meta?.total ?? items.length;
        const currentPage = Math.max(0, (response.meta?.page ?? page + 1) - 1);
        const currentSize = Math.max(1, response.meta?.pageSize ?? size);

        return Result.success(
          toPageEnvelope(items, currentPage, currentSize, total),
        );
      } catch (error) {
        return Result.error(
          toServerClientErrorMessage(error, 'Failed to load generation tasks.'),
          toServerClientErrorCode(error),
        );
      }
    },

    async findById(id: string): Promise<ServiceResult<TTask | null>> {
      try {
        const task = await readTaskOrNull(id);
        return Result.success(task ? mapper.fromTask(task) : null);
      } catch (error) {
        return Result.error(
          toServerClientErrorMessage(error, 'Failed to read generation task.'),
          toServerClientErrorCode(error),
        );
      }
    },

    async deleteById(id: string): Promise<ServiceResult<void>> {
      try {
        await getCanonicalMagicStudioServerClient(feature).deleteGenerationTask(id);
        return Result.success(undefined);
      } catch (error) {
        if (isServerClientNotFound(error)) {
          return Result.success(undefined);
        }
        return Result.error(
          toServerClientErrorMessage(error, 'Failed to delete generation task.'),
          toServerClientErrorCode(error),
        );
      }
    },

    async cancelById(id: string): Promise<ServiceResult<TTask>> {
      try {
        const response = await getCanonicalMagicStudioServerClient(feature).cancelGenerationTask(id);
        if (!response.data) {
          return Result.error(
            'Generation task cancel did not return a task payload.',
            500,
          );
        }
        return Result.success(mapper.fromTask(response.data));
      } catch (error) {
        return Result.error(
          toServerClientErrorMessage(error, 'Failed to cancel generation task.'),
          toServerClientErrorCode(error),
        );
      }
    },
  };
}
