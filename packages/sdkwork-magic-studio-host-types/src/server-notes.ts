import type {
  NoteMetadata,
  NoteType,
} from '@sdkwork/magic-studio-types/notes';

export interface MagicStudioNotesListQuery {
  page?: number;
  pageSize?: number;
  folderId?: string;
  keyword?: string;
  type?: NoteType;
  isFavorite?: boolean;
}

export interface MagicStudioNoteCreateRequest {
  title: string;
  type: NoteType;
  parentId?: string | null;
  tags?: string[];
  isFavorite?: boolean;
  content?: string;
  metadata?: NoteMetadata;
}

export interface MagicStudioNoteUpdateRequest {
  title?: string;
  type?: NoteType;
  tags?: string[];
  isFavorite?: boolean;
  content?: string;
  metadata?: NoteMetadata;
}

export interface MagicStudioNoteFolderCreateRequest {
  name: string;
  parentId?: string | null;
}

export interface MagicStudioNoteFolderRenameRequest {
  name: string;
}

export interface MagicStudioNoteMoveRequest {
  targetFolderId?: string | null;
}

export interface MagicStudioNoteFolderMoveRequest {
  targetFolderId?: string | null;
}

export interface MagicStudioNotePublishRequest {
  platform: string;
  targetName?: string;
  originalUrl?: string;
}
