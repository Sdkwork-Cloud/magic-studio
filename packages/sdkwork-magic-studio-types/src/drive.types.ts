export type DriveItemKind = 'folder' | 'file';

export type DriveListScope = 'my-drive' | 'starred' | 'recent' | 'trash';

export type DriveItemStatus = 'active' | 'trashed';

export type DriveContentEncoding = 'utf-8' | 'base64';

export interface DriveRootDescriptor {
  rootPath: string;
  defaultScope: DriveListScope;
  scopes: DriveListScope[];
}

export interface DriveItem {
  id: string;
  parentId: string | null;
  name: string;
  kind: DriveItemKind;
  path: string;
  size: number;
  mimeType?: string;
  extension?: string;
  status: DriveItemStatus;
  createdAt: string;
  updatedAt: string;
  accessedAt?: string;
  trashedAt?: string | null;
  isFavorite?: boolean;
  hasChildren?: boolean;
}

export interface DriveStats {
  usedBytes: number;
  totalBytes: number;
  fileCount: number;
  folderCount: number;
  trashedCount: number;
  favoriteCount: number;
}

export interface DriveFileContent {
  itemId: string;
  mimeType?: string;
  encoding: DriveContentEncoding;
  content: string;
  updatedAt: string;
}
