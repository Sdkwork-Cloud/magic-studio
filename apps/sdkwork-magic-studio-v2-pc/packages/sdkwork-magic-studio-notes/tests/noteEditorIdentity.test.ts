import { describe, expect, it } from 'vitest';

import {
  buildNoteEditorBreadcrumbs,
  resolveNoteEditorKey,
} from '../src/components/noteEditorIdentity';

describe('noteEditorIdentity', () => {
  it('prefers uuid as the editor key', () => {
    expect(
      resolveNoteEditorKey({
        id: 'note-db-1',
        uuid: 'note-uuid-1',
      })
    ).toBe('note-uuid-1');
  });

  it('builds breadcrumbs through folder chains using canonical identity matching', () => {
    const folders = [
      {
        id: 'folder-db-root',
        uuid: 'folder-uuid-root',
        name: 'Workspace',
        parentId: null,
      },
      {
        id: 'folder-db-child',
        uuid: 'folder-uuid-child',
        name: 'Drafts',
        parentId: 'folder-db-root',
      },
    ];

    expect(buildNoteEditorBreadcrumbs('folder-db-child', folders)).toEqual(['Workspace', 'Drafts']);
    expect(buildNoteEditorBreadcrumbs('folder-uuid-child', folders)).toEqual(['Workspace', 'Drafts']);
  });
});
