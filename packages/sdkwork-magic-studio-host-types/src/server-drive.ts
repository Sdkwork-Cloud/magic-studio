import type {
  DriveContentEncoding,
  DriveListScope,
} from '@sdkwork/magic-studio-types/drive';

export interface MagicStudioDriveEntriesQuery {
  scope?: DriveListScope;
  parentId?: string;
  parentPath?: string;
  keyword?: string;
}

export interface MagicStudioDriveCreateFolderRequest {
  name: string;
  parentId?: string;
  parentPath?: string;
}

export interface MagicStudioDriveUploadFileRequest {
  name: string;
  content: string;
  encoding?: DriveContentEncoding;
  parentId?: string;
  parentPath?: string;
  mimeType?: string;
}

export interface MagicStudioDriveImportFileRequest {
  sourcePath: string;
  name?: string;
  parentId?: string;
  parentPath?: string;
  mimeType?: string;
}

export interface MagicStudioDriveUpdateFileContentRequest {
  content: string;
  encoding?: DriveContentEncoding;
}

export interface MagicStudioDriveRenameRequest {
  itemId: string;
  name: string;
}

export interface MagicStudioDriveMoveRequest {
  itemIds: string[];
  targetParentId?: string;
  targetParentPath?: string;
}

export interface MagicStudioDriveDeleteRequest {
  itemIds: string[];
}

export interface MagicStudioDriveRestoreRequest {
  itemIds: string[];
}

export interface MagicStudioDriveFavoriteRequest {
  itemId: string;
  isFavorite: boolean;
}
