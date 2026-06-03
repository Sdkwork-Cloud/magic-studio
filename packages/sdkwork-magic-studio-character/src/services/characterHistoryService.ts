import {
  createCanonicalCreationHistoryStore,
  type CanonicalCreationHistoryStore,
} from '@sdkwork/magic-studio-generation-history';
import type { EntityIdentityLike } from '@sdkwork/magic-studio-types/entity';
import type { Page, PageRequest } from '@sdkwork/magic-studio-types/pagination';
import type { ServiceResult } from '@sdkwork/magic-studio-types/service';

import type { CharacterTask } from '../entities';
import { characterCreationHistoryMapper } from './characterCreationHistoryMapper';

export type CharacterHistoryTask = CharacterTask & EntityIdentityLike;

export interface CharacterHistoryService extends CanonicalCreationHistoryStore<CharacterHistoryTask> {
  findAll(pageRequest?: PageRequest): Promise<ServiceResult<Page<CharacterHistoryTask>>>;
  findById(id: string): Promise<ServiceResult<CharacterHistoryTask | null>>;
  save(task: Partial<CharacterHistoryTask>): Promise<ServiceResult<CharacterHistoryTask>>;
  deleteById(id: string): Promise<ServiceResult<void>>;
  clear(): Promise<ServiceResult<void>>;
  toggleFavorite(id: string): Promise<void>;
}

export const characterHistoryService: CharacterHistoryService = createCanonicalCreationHistoryStore<CharacterHistoryTask>({
  feature: 'MagicStudioCharacterHistoryService',
  mapper: characterCreationHistoryMapper,
});
