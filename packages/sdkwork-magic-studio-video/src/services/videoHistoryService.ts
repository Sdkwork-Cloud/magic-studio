import {
  createCanonicalCreationHistoryStore,
  type CanonicalCreationHistoryStore,
} from '@sdkwork/magic-studio-generation-history';
import type { EntityIdentityLike } from '@sdkwork/magic-studio-types/entity';
import type { Page, PageRequest } from '@sdkwork/magic-studio-types/pagination';
import type { ServiceResult } from '@sdkwork/magic-studio-types/service';

import type { VideoTask } from '../entities';
import { videoCreationHistoryMapper } from './videoCreationHistoryMapper';

export type VideoHistoryTask = VideoTask & EntityIdentityLike;

export interface VideoHistoryService extends CanonicalCreationHistoryStore<VideoHistoryTask> {
  findAll(pageRequest?: PageRequest): Promise<ServiceResult<Page<VideoHistoryTask>>>;
  findById(id: string): Promise<ServiceResult<VideoHistoryTask | null>>;
  save(task: Partial<VideoHistoryTask>): Promise<ServiceResult<VideoHistoryTask>>;
  deleteById(id: string): Promise<ServiceResult<void>>;
  clear(): Promise<ServiceResult<void>>;
  toggleFavorite(id: string): Promise<void>;
}

export const videoHistoryService: VideoHistoryService = createCanonicalCreationHistoryStore<VideoHistoryTask>({
  feature: 'MagicStudioVideoHistoryService',
  mapper: videoCreationHistoryMapper,
});
