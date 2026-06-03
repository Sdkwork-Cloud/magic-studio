import {
  type EntityIdentityLike,
} from '@sdkwork/magic-studio-types/entity';
import {
  matchesNoteEntityKey,
  reconcileNoteEntityKeySet,
  resolveNoteEntityKey,
} from '../utils/noteIdentity';

export const resolveNoteSidebarKey = (entity: EntityIdentityLike): string =>
  resolveNoteEntityKey(entity);

export const matchesNoteSidebarKey = (
  entity: EntityIdentityLike | null | undefined,
  key: string | null | undefined
): boolean => matchesNoteEntityKey(entity, key);

export const findNoteSidebarEntityByKey = <T extends EntityIdentityLike>(
  items: readonly T[],
  key: string | null | undefined
): T | undefined => items.find((item) => matchesNoteSidebarKey(item, key));

export const isNoteSidebarFolderExpanded = (
  folder: EntityIdentityLike,
  expandedKeys: ReadonlySet<string>
): boolean => {
  return matchesNoteSidebarKey(folder, folder.uuid) && !!folder.uuid && expandedKeys.has(folder.uuid)
    ? true
    : matchesNoteSidebarKey(folder, folder.id) && !!folder.id && expandedKeys.has(folder.id);
};

export const reconcileNoteSidebarSelectionKeys = <T extends EntityIdentityLike>(
  items: readonly T[],
  selectionKeys: ReadonlySet<string>
): Set<string> => reconcileNoteEntityKeySet(items, selectionKeys);
