import {
  createUuid,
  deriveClientEntityUuidFromId,
  matchesEntityKey,
  resolveEntityKey,
  resolveEntityKeys,
  type EntityId,
  type EntityIdentityLike,
} from '@sdkwork/magic-studio-types/entity';

const normalizeIdentityValue = (value: string | null | undefined): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export const createLocalCanvasEntityIdentity = (): { id: EntityId; uuid: string } => ({
  id: null,
  uuid: createUuid(),
});

export const normalizeCanvasEntityIdentity = <T extends EntityIdentityLike>(
  entity: T
): T & { id: EntityId; uuid: string } => {
  const normalizedId = normalizeIdentityValue(entity.id);
  const normalizedUuid =
    normalizeIdentityValue(entity.uuid) ||
    (normalizedId ? deriveClientEntityUuidFromId(normalizedId) : null) ||
    createUuid();

  return {
    ...entity,
    id: normalizedId,
    uuid: normalizedUuid,
  };
};

export const resolveCanvasEntityKey = (entity: EntityIdentityLike): string =>
  resolveEntityKey(normalizeCanvasEntityIdentity(entity));

export const resolveCanvasEntityKeys = (entity: EntityIdentityLike): string[] =>
  resolveEntityKeys(normalizeCanvasEntityIdentity(entity));

export const matchesCanvasEntityKey = (
  entity: EntityIdentityLike | null | undefined,
  key: string | null | undefined
): boolean => {
  if (!entity) {
    return false;
  }

  return matchesEntityKey(normalizeCanvasEntityIdentity(entity), key);
};
