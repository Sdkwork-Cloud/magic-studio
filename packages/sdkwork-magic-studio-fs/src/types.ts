// File system types are exported from @sdkwork/magic-studio-types
// This file re-exports them for the filesystem facade.
export type { FileEntry, FileStat, IFileSystemProvider } from '@sdkwork/magic-studio-types/infrastructure';

export const FileChangeType = {
  Changed: 1,
  Created: 2,
  Deleted: 3,
} as const;
export type FileChangeType = (typeof FileChangeType)[keyof typeof FileChangeType];

export interface FileChangeEvent {
  type: FileChangeType;
  path: string;
}
