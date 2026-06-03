import { describe, expect, it } from 'vitest';

import {
  findNoteSidebarEntityByKey,
  isNoteSidebarFolderExpanded,
  matchesNoteSidebarKey,
  reconcileNoteSidebarSelectionKeys,
  resolveNoteSidebarKey,
} from '../src/components/noteSidebarIdentity';

describe('noteSidebarIdentity', () => {
  it('prefers uuid as the canonical sidebar key', () => {
    expect(
      resolveNoteSidebarKey({
        id: 'note-db-1',
        uuid: 'note-uuid-1',
      })
    ).toBe('note-uuid-1');
  });

  it('matches both uuid and persisted id during sidebar selection lookups', () => {
    const entity = {
      id: 'note-db-2',
      uuid: 'note-uuid-2',
    };

    expect(matchesNoteSidebarKey(entity, 'note-uuid-2')).toBe(true);
    expect(matchesNoteSidebarKey(entity, 'note-db-2')).toBe(true);
  });

  it('finds entities by uuid-first sidebar keys', () => {
    const items = [
      { id: 'folder-db-1', uuid: 'folder-uuid-1' },
      { id: 'folder-db-2', uuid: 'folder-uuid-2' },
    ];

    expect(findNoteSidebarEntityByKey(items, 'folder-uuid-2')).toEqual(items[1]);
  });

  it('treats a folder as expanded when either uuid or id key is present', () => {
    const folder = {
      id: 'folder-db-3',
      uuid: 'folder-uuid-3',
    };

    expect(isNoteSidebarFolderExpanded(folder, new Set(['folder-uuid-3']))).toBe(true);
    expect(isNoteSidebarFolderExpanded(folder, new Set(['folder-db-3']))).toBe(true);
    expect(isNoteSidebarFolderExpanded(folder, new Set(['other-folder']))).toBe(false);
  });

  it('reconciles trash selection keys against canonical sidebar identities', () => {
    const items = [
      { id: 'trash-db-1', uuid: 'trash-uuid-1' },
      { id: 'trash-db-2', uuid: 'trash-uuid-2' },
    ];

    expect(
      reconcileNoteSidebarSelectionKeys(items, new Set(['trash-uuid-1', 'missing']))
    ).toEqual(new Set(['trash-uuid-1']));
  });

  it('upgrades legacy id selections to canonical uuid sidebar keys during reconciliation', () => {
    const items = [
      { id: 'trash-db-3', uuid: 'trash-uuid-3' },
    ];

    expect(
      reconcileNoteSidebarSelectionKeys(items, new Set(['trash-db-3']))
    ).toEqual(new Set(['trash-uuid-3']));
  });
});
