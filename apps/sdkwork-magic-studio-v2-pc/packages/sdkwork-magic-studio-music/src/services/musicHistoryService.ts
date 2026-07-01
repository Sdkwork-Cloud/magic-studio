import {
  createCanonicalCreationHistoryStore,
  type CanonicalCreationHistoryStore,
} from '@sdkwork/magic-studio-generation-history';
import type { EntityIdentityLike } from '@sdkwork/magic-studio-types/entity';
import type { Page, PageRequest } from '@sdkwork/magic-studio-types/pagination';
import type { ServiceResult } from '@sdkwork/magic-studio-types/service';

import type { MusicTask } from '../entities';
import { musicCreationHistoryMapper } from './musicCreationHistoryMapper';

export type MusicHistoryTask = MusicTask & EntityIdentityLike;

export interface MusicHistoryService extends CanonicalCreationHistoryStore<MusicHistoryTask> {
  findAll(pageRequest?: PageRequest): Promise<ServiceResult<Page<MusicHistoryTask>>>;
  findById(id: string): Promise<ServiceResult<MusicHistoryTask | null>>;
  save(task: Partial<MusicHistoryTask>): Promise<ServiceResult<MusicHistoryTask>>;
  deleteById(id: string): Promise<ServiceResult<void>>;
  clear(): Promise<ServiceResult<void>>;
  toggleFavorite(id: string): Promise<void>;
}

export const musicHistoryService: MusicHistoryService = createCanonicalCreationHistoryStore<MusicHistoryTask>({
  feature: 'MagicStudioMusicHistoryService',
  mapper: musicCreationHistoryMapper,
});
