import { describe, expect, it } from 'vitest';

import {
  createClientEntityIdentity,
  deriveClientEntityUuidFromId,
  entityKeysEqual,
  hasPersistentEntityId,
  matchesEntityKey,
  resolveEntityKey,
  resolveEntityKeys,
} from './base.types';

describe('base identity helpers', () => {
  it('prefers uuid when resolving the canonical entity key', () => {
    expect(
      resolveEntityKey({
        id: 'db-1',
        uuid: 'uuid-1',
      })
    ).toBe('uuid-1');
  });

  it('falls back to id when uuid is absent', () => {
    expect(
      resolveEntityKey({
        id: 'db-2',
      })
    ).toBe('db-2');
  });

  it('matches both uuid and persisted id for lookup', () => {
    const entity = {
      id: 'db-3',
      uuid: 'uuid-3',
    };

    expect(matchesEntityKey(entity, 'uuid-3')).toBe(true);
    expect(matchesEntityKey(entity, 'db-3')).toBe(true);
    expect(matchesEntityKey(entity, 'missing')).toBe(false);
    expect(resolveEntityKeys(entity)).toEqual(['uuid-3', 'db-3']);
  });

  it('treats entities as equal when one side matches by uuid and the other by id fallback', () => {
    expect(
      entityKeysEqual(
        { id: 'db-4', uuid: 'uuid-4' },
        { id: 'db-4' }
      )
    ).toBe(true);
  });

  it('creates client identity with null persisted id and generated uuid by default', () => {
    const identity = createClientEntityIdentity();

    expect(identity.id).toBeNull();
    expect(identity.uuid.length).toBeGreaterThan(0);
    expect(identity.createdAt).toBe(identity.updatedAt);
  });

  it('recognizes only non-empty persisted ids', () => {
    expect(hasPersistentEntityId('db-5')).toBe(true);
    expect(hasPersistentEntityId('')).toBe(false);
    expect(hasPersistentEntityId(null)).toBe(false);
  });

  it('derives a client uuid that stays distinct from the persisted id', () => {
    expect(deriveClientEntityUuidFromId('db-6')).toBe('client-entity:db-6');
  });
});
