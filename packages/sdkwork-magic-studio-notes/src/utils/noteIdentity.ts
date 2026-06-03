import {
  matchesEntityKey,
  resolveEntityKey,
  resolveEntityKeys,
  type EntityIdentityLike,
} from '@sdkwork/magic-studio-types/entity';

const normalizeNoteIdentityValue = (
  value: string | null | undefined
): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export const matchesNoteEntityKey = (
  entity: EntityIdentityLike | null | undefined,
  key: string | null | undefined
): boolean => matchesEntityKey(entity, key);

export const resolveNoteEntityKey = (entity: EntityIdentityLike): string =>
  resolveEntityKey(entity);

export const findNoteEntityByKey = <T extends EntityIdentityLike>(
  items: readonly T[],
  key: string | null | undefined
): T | undefined => items.find((item) => matchesNoteEntityKey(item, key));

export const hasNoteEntityKeyInSet = (
  entity: EntityIdentityLike | null | undefined,
  keys: ReadonlySet<string>
): boolean => resolveEntityKeys(entity).some((key) => keys.has(key));

export const reconcileNoteEntityKeySet = <T extends EntityIdentityLike>(
  items: readonly T[],
  selectionKeys: ReadonlySet<string>
): Set<string> => {
  const next = new Set<string>();

  items.forEach((item) => {
    if (resolveEntityKeys(item).some((key) => selectionKeys.has(key))) {
      next.add(resolveNoteEntityKey(item));
    }
  });

  return next;
};

export const mapNoteEntitiesByKey = <T extends EntityIdentityLike>(
  items: readonly T[],
  key: string | null | undefined,
  updater: (entity: T) => T
): T[] =>
  items.map((item) => (matchesNoteEntityKey(item, key) ? updater(item) : item));

export const excludeNoteEntitiesByKey = <T extends EntityIdentityLike>(
  items: readonly T[],
  key: string | null | undefined
): T[] => items.filter((item) => !matchesNoteEntityKey(item, key));

export const resolveNotePersistedIdByKey = <T extends EntityIdentityLike>(
  items: readonly T[],
  key: string | null | undefined
): string | null => {
  const matched = findNoteEntityByKey(items, key);
  const persistedId = normalizeNoteIdentityValue(matched?.id);
  if (persistedId) {
    return persistedId;
  }

  return normalizeNoteIdentityValue(key);
};
