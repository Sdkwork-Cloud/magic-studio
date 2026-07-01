import { resolveEntityKey, type EntityIdentityLike } from '@sdkwork/magic-studio-types/entity';
import type { NoteFolder } from '@sdkwork/magic-studio-types/notes';

import { findNoteEntityByKey } from '../utils/noteIdentity';

type NoteEditorFolderLike = Pick<NoteFolder, 'id' | 'uuid' | 'name' | 'parentId'>;

export const resolveNoteEditorKey = (entity: EntityIdentityLike): string =>
  resolveEntityKey(entity);

export const buildNoteEditorBreadcrumbs = (
  parentKey: string | null | undefined,
  folders: readonly NoteEditorFolderLike[]
): string[] => {
  if (!parentKey) {
    return [];
  }

  const segments: string[] = [];
  const visited = new Set<string>();
  let currentParentKey: string | null | undefined = parentKey;

  while (currentParentKey) {
    if (visited.has(currentParentKey)) {
      break;
    }
    visited.add(currentParentKey);

    const folder: NoteEditorFolderLike | undefined = findNoteEntityByKey(folders, currentParentKey);
    if (!folder) {
      break;
    }

    segments.unshift(folder.name);
    currentParentKey = folder.parentId;
  }

  return segments;
};
