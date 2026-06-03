export const FileSystemErrorType = {
  FileNotFound: 'FileNotFound',
  FileExists: 'FileExists',
  PermissionDenied: 'PermissionDenied',
  DirectoryNotEmpty: 'DirectoryNotEmpty',
  Unknown: 'Unknown',
} as const;
export type FileSystemErrorType = (typeof FileSystemErrorType)[keyof typeof FileSystemErrorType];

export class FileSystemError extends Error {
  public readonly type: FileSystemErrorType;
  public readonly originalError?: any;

  constructor(
    type: FileSystemErrorType,
    message: string,
    originalError?: any
  ) {
    super(message);
    this.name = 'FileSystemError';
    this.type = type;
    this.originalError = originalError;
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
