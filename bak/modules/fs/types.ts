
import { FileEntry, FileStat } from '../../platform/types';

export enum FileChangeType {
  Changed = 1,
  Created = 2,
  Deleted = 3,
}

export interface FileChangeEvent {
  type: FileChangeType;
  path: string;
}

/**
 * Interface for specific file system implementations (Local, S3, WebDAV, etc.)
 * Adheres to the Open/Closed Principle allowing new providers to be added without modifying core logic.
 */
export interface IFileSystemProvider {
  scheme: string; // e.g., 'file', 's3', 'ssh'
  
  capabilities: {
    readonly: boolean;
    supportsStreaming?: boolean;
    supportsWatcher?: boolean;
  };

  readDir(path: string): Promise<FileEntry[]>;
  
  // Text
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  
  // Binary
  readFileBinary(path: string): Promise<Uint8Array>;
  writeFileBinary(path: string, content: Uint8Array): Promise<void>;
  
  // Blob (High Performance)
  readFileBlob(path: string): Promise<Blob>;
  writeFileBlob(path: string, content: Blob): Promise<void>;

  // Meta
  stat(path: string): Promise<FileStat>;

  // Operations
  createDir(path: string): Promise<void>;
  delete(path: string): Promise<void>;
  rename(oldPath: string, newPath: string): Promise<void>;
  copy(sourcePath: string, destPath: string): Promise<void>;

  // Events (Optional)
  watch?(path: string, onChange: (events: FileChangeEvent[]) => void): () => void;
}
