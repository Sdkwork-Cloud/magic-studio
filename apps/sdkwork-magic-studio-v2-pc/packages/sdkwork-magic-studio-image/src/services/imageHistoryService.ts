import {
  createCanonicalCreationHistoryStore,
  type CanonicalCreationHistoryStore,
} from '@sdkwork/magic-studio-generation-history';
import type { EntityIdentityLike } from '@sdkwork/magic-studio-types/entity';
import type { Page, PageRequest } from '@sdkwork/magic-studio-types/pagination';
import type { ServiceResult } from '@sdkwork/magic-studio-types/service';

import type { ImageTask } from '../entities';
import { imageCreationHistoryMapper } from './imageCreationHistoryMapper';

export type ImageHistoryTask = ImageTask & EntityIdentityLike;

export interface ImageHistoryService extends CanonicalCreationHistoryStore<ImageHistoryTask> {
  findAll(pageRequest?: PageRequest): Promise<ServiceResult<Page<ImageHistoryTask>>>;
  findById(id: string): Promise<ServiceResult<ImageHistoryTask | null>>;
  save(task: Partial<ImageHistoryTask>): Promise<ServiceResult<ImageHistoryTask>>;
  deleteById(id: string): Promise<ServiceResult<void>>;
  clear(): Promise<ServiceResult<void>>;
  toggleFavorite(id: string): Promise<void>;
}

export const imageHistoryService: ImageHistoryService = createCanonicalCreationHistoryStore<ImageHistoryTask>({
  feature: 'MagicStudioImageHistoryService',
  mapper: imageCreationHistoryMapper,
});
