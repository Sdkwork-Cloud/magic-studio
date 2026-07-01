import {
  createCanonicalCreationHistoryStore,
  type CanonicalCreationHistoryStore,
} from '@sdkwork/magic-studio-generation-history';
import type { EntityIdentityLike } from '@sdkwork/magic-studio-types/entity';
import type { Page, PageRequest } from '@sdkwork/magic-studio-types/pagination';
import type { ServiceResult } from '@sdkwork/magic-studio-types/service';

import type { SfxTask } from '../entities';
import { sfxCreationHistoryMapper } from './sfxCreationHistoryMapper';

export type SfxHistoryTask = SfxTask & EntityIdentityLike;

export interface SfxHistoryService extends CanonicalCreationHistoryStore<SfxHistoryTask> {
  findAll(pageRequest?: PageRequest): Promise<ServiceResult<Page<SfxHistoryTask>>>;
  findById(id: string): Promise<ServiceResult<SfxHistoryTask | null>>;
  save(task: Partial<SfxHistoryTask>): Promise<ServiceResult<SfxHistoryTask>>;
  deleteById(id: string): Promise<ServiceResult<void>>;
  clear(): Promise<ServiceResult<void>>;
  toggleFavorite(id: string): Promise<void>;
}

export const sfxHistoryService: SfxHistoryService = createCanonicalCreationHistoryStore<SfxHistoryTask>({
  feature: 'MagicStudioSfxHistoryService',
  mapper: sfxCreationHistoryMapper,
});
