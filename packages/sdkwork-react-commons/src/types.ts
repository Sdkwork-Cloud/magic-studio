import type { BaseEntity as Base } from '@sdkwork/react-types';
import type {
  MediaResource,
  FileMediaResource,
  VideoMediaResource,
  ImageMediaResource,
  AudioMediaResource,
  MusicMediaResource,
  CharacterMediaResource,
  AssetMediaResource,
  AnyMediaResource,
  GenerationProduct,
  GenerationPlatform
} from '@sdkwork/react-types';

// Re-export MediaResource types from sdkwork-react-types
export type {
  MediaResource,
  FileMediaResource,
  VideoMediaResource,
  ImageMediaResource,
  AudioMediaResource,
  MusicMediaResource,
  CharacterMediaResource,
  AssetMediaResource,
  AnyMediaResource,
  GenerationProduct,
  GenerationPlatform
} from '@sdkwork/react-types';

// Re-export infrastructure types from sdkwork-react-types
export type {
  // File System
  IFileSystemProvider,
  FileStat,
  FileEntry,
  ICompressionProvider,
  
  // IDE
  IDEDefinition,
  
  // Drag and Drop
  IPlacementStrategy,
  DragInput,
  DragContext,
  PlacementResult,
  
  // WebGL / Rendering
  FBO,
  RenderContext,
  RenderOverrideClip,
  
  // Media Encoder
  IMediaEncoder,
  
  // Export
  ExportOptions,
  ExportProgressCallback,
  
  // File Save
  IFileSaveStrategy,
  
  // Window Controls
  WindowControlsProps,
  
  // Portal
  PortalTab,
  
  // Settings
  SettingInputProps,
  SettingSelectProps,
  SettingToggleProps,
  
  // Base
  BaseProps,
  
  // Model Provider
  ModelProvider,
  
  // Card
  CardProps,
  
  // Other
  Bookmark,
  HistoryItem,
  DriveMetadata,
  Effect
} from '@sdkwork/react-types';

// Re-export enums from sdkwork-react-types
export {
  ThemeMode,
  MediaResourceType,
  MediaScene,
  AudioFormat,
  NotificationType,
  GenerationType,
  ModelProviderId,
  RemixIntent
} from '@sdkwork/react-types';

// Re-export BaseEntity from types package for consistency
// Note: BaseEntity in sdkwork-react-types already includes uuid: string (required)
export interface BaseEntity extends Base {}

// ============================================================================
// Gallery Types (Commons-specific extensions)
// ============================================================================

export interface GalleryAuthor {
  id: string;
  name: string;
  avatar?: string;
  initial?: string;
  color?: string;
  followers?: string;
  isFollowing?: boolean;
}

export interface GalleryItem {
  id: string;
  type: import('@sdkwork/react-types').GalleryItemType;
  title: string;
  prompt: string;
  url: string;
  videoUrl?: string;
  aspectRatio: string;
  author: GalleryAuthor;
  stats: {
    views: number;
    likes: number;
    isLiked?: boolean;
    comments?: number;
  };
  model: string;
  negativePrompt?: string;
  tags?: string[];
  createdAt: string; // ISO 8601 format: yyyy-MM-dd HH:mm:ss
  badges?: {
    text?: string;
    color?: string;
    icon?: 'fire' | 'new' | 'trending' | 'official';
  }[];
}

// ============================================================================
// Input Attachment
// ============================================================================

export interface InputAttachmentData {
  id: string;
  type: 'image' | 'video' | 'audio' | 'file' | 'script';
  url?: string;
  name?: string;
  size?: number;
  mimeType?: string;
  thumbnail?: string;
}

export function getAssetLabel(attachment: InputAttachmentData | number, fallback?: string): string {
  if (typeof attachment === 'number') {
    return fallback || `Attachment ${attachment + 1}`;
  }
  return attachment.name || (attachment.url?.split('/').pop()) || fallback || 'Unknown';
}

// ============================================================================
// File Viewer
// ============================================================================

export interface FileViewerProps {
  file?: {
    id: string;
    name: string;
    path: string;
    url?: string;
    mimeType?: string;
    size?: number;
  };
  item: any;
  url: string;
  headerElement?: React.ReactNode | HTMLElement;
  onSave?: (content?: string) => Promise<void>;
  isReadOnly?: boolean;
  onClose: () => void;
}

// ============================================================================
// Chat Message (Commons-specific)
// ============================================================================

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'ai';
  content: string;
  timestamp: number;
  attachments?: InputAttachmentData[];
  isStreaming?: boolean;
  error?: string;
}

// ============================================================================
// Editor File
// ============================================================================

export interface EditorFile {
  id: string;
  name: string;
  path: string;
  content: string;
  language?: string;
  isModified?: boolean;
  isDirty?: boolean;
  isPreview?: boolean;
}

// ============================================================================
// Export Config (Commons-specific with React types)
// ============================================================================

export interface ExportConfig {
  width?: number;
  height?: number;
  fps?: number;
  frameRate?: number;
  duration?: number;
  format?: 'mp4' | 'webm' | 'gif' | 'txt' | 'mov';
  quality?: 'low' | 'medium' | 'high';
  resolution?: string | import('@sdkwork/react-types').ExportResolution;
  bitrate?: number | 'lower' | 'higher' | 'recommended';
  exportAudio?: boolean;
  exportVideo?: boolean;
}

// ============================================================================
// Gallery Card
// ============================================================================

export interface GalleryCard {
  id: string;
  title: string;
  url: string;
  author: string;
  views: number;
  likes: number;
}

// ============================================================================
// Uploaded File
// ============================================================================

export interface UploadedFile {
  name: string;
  path?: string;
  url?: string;
  size?: number;
  type?: string;
}

// ============================================================================
// Workspace and Project types (Commons-specific)
// ============================================================================

export interface StudioProject extends BaseEntity {
  id: string;
  uuid: string;
  name: string;
  type: import('@sdkwork/react-types').ProjectType;
  description: string;
  workspaceId: string;
  path?: string;
  thumbnailUrl?: string;
  coverImage?: ImageMediaResource;
}

export interface StudioWorkspace extends BaseEntity {
  id: string;
  uuid: string;
  name: string;
  description?: string;
  projects: StudioProject[];
  path?: string;
  icon?: string;
}
