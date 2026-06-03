// Base type definitions
// This is the foundation for all entities in the SDKWork React application.

export type EntityId = string | null;

export type EntityTimestamp = string | number;

export interface EntityIdentityLike {
  id?: string | null;
  uuid?: string | null;
}

// ============================================================================
// Canonical client identity
// ============================================================================

export interface ClientEntityIdentity {
  /**
   * Database identity. This is null until the entity is persisted.
   */
  id: EntityId;

  /**
   * Immutable client identity. This is created when the entity is created and
   * must remain stable for the entity lifetime.
   */
  uuid: string;

  /**
   * Creation timestamp in ISO 8601 format or Unix timestamp.
   */
  createdAt: EntityTimestamp;

  /**
   * Last update timestamp in ISO 8601 format or Unix timestamp.
   */
  updatedAt: EntityTimestamp;

  /**
   * Soft delete timestamp in ISO 8601 format.
   */
  deletedAt?: string | null;
}

// ============================================================================
// Legacy shared entity base
// ============================================================================

export interface BaseEntity {
  /**
   * Existing application modules still expect a non-null local/runtime id.
   * The AGI-native canonical contract is `ClientEntityIdentity`, and modules
   * must migrate to that contract phase by phase.
   */
  id: string;
  uuid: string;
  createdAt: EntityTimestamp;
  updatedAt: EntityTimestamp;
  deletedAt?: string | null;
}

export type CreateClientEntityIdentityInput = Partial<ClientEntityIdentity>;

const normalizeEntityIdentityValue = (value: string | null | undefined): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const createFallbackUuid = (): string => {
  const randomHex = (length: number): string =>
    Array.from({ length }, () => Math.floor(Math.random() * 16).toString(16)).join('');

  const part1 = randomHex(8);
  const part2 = randomHex(4);
  const part3 = `4${randomHex(3)}`;
  const variant = (8 + Math.floor(Math.random() * 4)).toString(16);
  const part4 = `${variant}${randomHex(3)}`;
  const part5 = randomHex(12);

  return `${part1}-${part2}-${part3}-${part4}-${part5}`;
};

export const createUuid = (): string => {
  if (
    typeof globalThis !== 'undefined' &&
    globalThis.crypto &&
    typeof globalThis.crypto.randomUUID === 'function'
  ) {
    return globalThis.crypto.randomUUID();
  }

  return createFallbackUuid();
};

export const hasPersistentEntityId = (
  value: string | null | undefined
): value is string => normalizeEntityIdentityValue(value) !== null;

export const deriveClientEntityUuidFromId = (
  value: string
): string => {
  const normalized = normalizeEntityIdentityValue(value);
  if (!normalized) {
    throw new Error('Persistent entity id is required to derive a client uuid.');
  }

  return `client-entity:${normalized}`;
};

export const resolveEntityKeys = (entity: EntityIdentityLike | null | undefined): string[] => {
  if (!entity) {
    return [];
  }

  const keys: string[] = [];
  const uuid = normalizeEntityIdentityValue(entity.uuid);
  const id = normalizeEntityIdentityValue(entity.id);

  if (uuid) {
    keys.push(uuid);
  }

  if (id && id !== uuid) {
    keys.push(id);
  }

  return keys;
};

export const resolveEntityKey = (entity: EntityIdentityLike): string => {
  const [key] = resolveEntityKeys(entity);
  if (key) {
    return key;
  }
  throw new Error('Entity key missing');
};

export const matchesEntityKey = (
  entity: EntityIdentityLike | null | undefined,
  key: string | null | undefined
): boolean => {
  const normalizedKey = normalizeEntityIdentityValue(key);
  if (!normalizedKey) {
    return false;
  }

  return resolveEntityKeys(entity).includes(normalizedKey);
};

export const entityKeysEqual = (
  left: EntityIdentityLike | null | undefined,
  right: EntityIdentityLike | null | undefined
): boolean => {
  if (!left || !right) {
    return false;
  }

  const leftKeys = resolveEntityKeys(left);
  if (leftKeys.length === 0) {
    return false;
  }

  return leftKeys.some((key) => matchesEntityKey(right, key));
};

export const createClientEntityIdentity = (
  input: CreateClientEntityIdentityInput = {}
): ClientEntityIdentity => {
  const now = Date.now();
  const createdAt = input.createdAt ?? now;
  const updatedAt = input.updatedAt ?? createdAt;

  return {
    id: normalizeEntityIdentityValue(input.id) ?? null,
    uuid: normalizeEntityIdentityValue(input.uuid) ?? createUuid(),
    createdAt,
    updatedAt,
    ...(typeof input.deletedAt !== 'undefined' ? { deletedAt: input.deletedAt ?? null } : {})
  };
};

// ============================================================================
// Note: All other types have been moved to dedicated files:
// - common.types.ts - Common types (ServiceResult, Page, User, etc.)
// - media.types.ts - MediaResource types
// - infrastructure.types.ts - Infrastructure types (FileSystem, Rendering, etc.)
// - film.types.ts - Film types
// - video.types.ts - Video types
// - audio.types.ts - Audio types
// - music.types.ts - Music types
// - sfx.types.ts - SFX types
// - image.types.ts - Image types
// - canvas.types.ts - Canvas types
// - magiccut.types.ts - MagicCut types
// - assets.types.ts - Assets types
// - character.types.ts - Character types
// - chat.types.ts - Chat types
// - chatppt.types.ts - ChatPPT types
// - notes.types.ts - Notes types
//
// Please import from the specific file or from the package root:
//   import { SomeType } from '@sdkwork/magic-studio-types/entity';
// ============================================================================
