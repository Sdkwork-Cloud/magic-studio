
export type DriveItemType = 'folder' | 'file';

export interface DriveItem {
  id: string;          // Unique ID (path for local, UUID for cloud)
  parentId: string | null;
  name: string;
  type: DriveItemType;
  size: number;        // Bytes
  mimeType?: string;
  updatedAt: number;
  createdAt: number;
  owner?: string;
  isShared?: boolean;
  thumbnailUrl?: string; // For images
  
  // --- Metadata Extensions ---
  isStarred?: boolean;
  trashedAt?: number | null; // If set, item is in soft trash
  accessedAt?: number;       // For "Recent" view
}

export interface DriveStats {
  usedBytes: number;
  totalBytes: number;
  fileCount: number;
}

export interface TransferTask {
  id: string;
  name: string;
  progress: number; // 0-100
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}
