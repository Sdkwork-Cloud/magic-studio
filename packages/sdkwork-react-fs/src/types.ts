// File system types are now exported from sdkwork-react-types
// This file re-exports them for backward compatibility
export type { FileEntry, FileStat, IFileSystemProvider } from '@sdkwork/react-types';

export enum FileChangeType {
  Changed = 1,
  Created = 2,
  Deleted = 3,
}

export interface FileChangeEvent {
  type: FileChangeType;
  path: string;
}
