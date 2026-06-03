import {
  type MagicStudioCreationHistoryEntry,
  type MagicStudioCreationHistoryListQuery,
  type MagicStudioCreationHistoryProduct,
  type MagicStudioUpsertCreationHistoryEntryRequest,
} from '@sdkwork/magic-studio-server';
import {
  resolveEntityKey,
  type EntityIdentityLike,
} from '@sdkwork/magic-studio-types/entity';
import { DEFAULT_PAGE_SIZE, type Page, type PageRequest } from '@sdkwork/magic-studio-types/pagination';
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

function resolveOptionalEntityKey(entity: EntityIdentityLike | null | undefined): string | null {
  try {
    return entity ? resolveEntityKey(entity) : null;
  } catch {
    return null;
  }
}

export interface CanonicalCreationHistoryMapper<TTask extends EntityIdentityLike> {
  readonly product: MagicStudioCreationHistoryProduct;
  fromEntry(entry: MagicStudioCreationHistoryEntry): TTask;
  toUpsertRequest(task: TTask): MagicStudioUpsertCreationHistoryEntryRequest;
  merge?(current: TTask, patch: Partial<TTask>): TTask;
}

export interface CanonicalCreationHistoryStoreOptions<
  TTask extends EntityIdentityLike,
> {
  feature: string;
  mapper: CanonicalCreationHistoryMapper<TTask>;
  query?: Omit<
    MagicStudioCreationHistoryListQuery,
    'page' | 'pageSize' | 'product'
  >;
}

export interface CanonicalCreationHistoryStore<TTask extends EntityIdentityLike> {
  findAll(pageRequest?: PageRequest): Promise<ServiceResult<Page<TTask>>>;
  findById(id: string): Promise<ServiceResult<TTask | null>>;
  save(task: Partial<TTask>): Promise<ServiceResult<TTask>>;
  deleteById(id: string): Promise<ServiceResult<void>>;
  clear(): Promise<ServiceResult<void>>;
  toggleFavorite(id: string): Promise<void>;
}

export function createCanonicalCreationHistoryStore<
  TTask extends EntityIdentityLike,
>(
  options: CanonicalCreationHistoryStoreOptions<TTask>,
): CanonicalCreationHistoryStore<TTask> {
  const { feature, mapper } = options;
  const baseQuery = options.query || {};

  const readEntryOrNull = async (
    id: string,
  ): Promise<MagicStudioCreationHistoryEntry | null> => {
    try {
      const response = await getCanonicalMagicStudioServerClient(feature).readCreationHistoryEntry(id);
      return response.data || null;
    } catch (error) {
      if (isServerClientNotFound(error)) {
        return null;
      }
      throw error;
    }
  };

  const readTaskOrNull = async (id: string): Promise<TTask | null> => {
    const entry = await readEntryOrNull(id);
    return entry ? mapper.fromEntry(entry) : null;
  };

  const mergeTask = (current: TTask, patch: Partial<TTask>): TTask => {
    if (typeof mapper.merge === 'function') {
      return mapper.merge(current, patch);
    }
    return {
      ...current,
      ...patch,
    } as TTask;
  };

  return {
    async findAll(pageRequest?: PageRequest): Promise<ServiceResult<Page<TTask>>> {
      const page = Math.max(0, pageRequest?.page ?? 0);
      const size = Math.max(1, pageRequest?.size ?? DEFAULT_PAGE_SIZE);

      try {
        const response = await getCanonicalMagicStudioServerClient(feature).listCreationHistory({
          ...baseQuery,
          product: mapper.product,
          page: page + 1,
          pageSize: size,
        });
        const items = Array.isArray(response.items)
          ? response.items.map((entry) => mapper.fromEntry(entry))
          : [];
        const total = response.meta?.total ?? items.length;
        const currentPage = Math.max(0, (response.meta?.page ?? page + 1) - 1);
        const currentSize = Math.max(1, response.meta?.pageSize ?? size);

        return Result.success(
          toPageEnvelope(items, currentPage, currentSize, total),
        );
      } catch (error) {
        return Result.error(
          toServerClientErrorMessage(error, 'Failed to load creation history.'),
          toServerClientErrorCode(error),
        );
      }
    },

    async findById(id: string): Promise<ServiceResult<TTask | null>> {
      try {
        return Result.success(await readTaskOrNull(id));
      } catch (error) {
        return Result.error(
          toServerClientErrorMessage(error, 'Failed to read creation history entry.'),
          toServerClientErrorCode(error),
        );
      }
    },

    async save(task: Partial<TTask>): Promise<ServiceResult<TTask>> {
      const taskKey = resolveOptionalEntityKey(task);

      try {
        let nextTask = task as TTask;
        if (taskKey) {
          const existingEntry = await readEntryOrNull(taskKey);
          if (existingEntry?.source === 'imported') {
            nextTask = mergeTask(mapper.fromEntry(existingEntry), task);
          }
        }

        const response = await getCanonicalMagicStudioServerClient(feature).upsertCreationHistoryEntry(
          mapper.toUpsertRequest(nextTask),
        );
        return Result.success(mapper.fromEntry(response.data));
      } catch (error) {
        return Result.error(
          toServerClientErrorMessage(error, 'Failed to save creation history entry.'),
          toServerClientErrorCode(error),
        );
      }
    },

    async deleteById(id: string): Promise<ServiceResult<void>> {
      try {
        await getCanonicalMagicStudioServerClient(feature).deleteCreationHistoryEntry(id);
        return Result.success(undefined);
      } catch (error) {
        if (isServerClientNotFound(error)) {
          return Result.success(undefined);
        }
        return Result.error(
          toServerClientErrorMessage(error, 'Failed to delete creation history entry.'),
          toServerClientErrorCode(error),
        );
      }
    },

    async clear(): Promise<ServiceResult<void>> {
      try {
        await getCanonicalMagicStudioServerClient(feature).clearCreationHistory({
          ...baseQuery,
          product: mapper.product,
        });
        return Result.success(undefined);
      } catch (error) {
        return Result.error(
          toServerClientErrorMessage(error, 'Failed to clear creation history.'),
          toServerClientErrorCode(error),
        );
      }
    },

    async toggleFavorite(id: string): Promise<void> {
      const entry = await readEntryOrNull(id);
      if (!entry) {
        return;
      }

      await getCanonicalMagicStudioServerClient(feature).setCreationHistoryEntryFavorite(
        id,
        { isFavorite: !Boolean(entry.isFavorite) },
      );
    },
  };
}
