export enum FileSystemErrorType {
  FileNotFound = 'FileNotFound',
  FileExists = 'FileExists',
  PermissionDenied = 'PermissionDenied',
  DirectoryNotEmpty = 'DirectoryNotEmpty',
  Unknown = 'Unknown',
}

export class FileSystemError extends Error {
  constructor(
    public type: FileSystemErrorType,
    message: string,
    public originalError?: any
  ) {
    super(message);
    this.name = 'FileSystemError';
  }

  static from(error: any): FileSystemError {
    const msg = error?.message || String(error);
    
    if (msg.includes('No such file') || msg.includes('not found')) {
      return new FileSystemError(FileSystemErrorType.FileNotFound, 'File not found', error);
    }
    if (msg.includes('exists')) {
      return new FileSystemError(FileSystemErrorType.FileExists, 'File already exists', error);
    }
    if (msg.includes('denied') || msg.includes('permission')) {
      return new FileSystemError(FileSystemErrorType.PermissionDenied, 'Permission denied', error);
    }
    
    return new FileSystemError(FileSystemErrorType.Unknown, msg, error);
  }
}
