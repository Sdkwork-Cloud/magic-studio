import type { BaseEntity as Base } from '@sdkwork/magic-studio-types/entity';
import type { InputAttachmentData } from '@sdkwork/magic-studio-types/content';
import type { ExportResolution } from '@sdkwork/magic-studio-types/vocabulary';
export type {
  GalleryAuthor,
  GalleryItem,
  GalleryItemType,
  InputAttachmentData,
  LocalizedText,
  LocalizedTextLike,
  StyleAsset,
  StyleOption,
} from '@sdkwork/magic-studio-types/content';

// Re-export MediaResource types from focused Magic Studio types subpaths
export type {
  MediaResource,
  FileMediaResource,
  VideoMediaResource,
  ImageMediaResource,
  AudioMediaResource,
  MusicMediaResource,
  CharacterMediaResource,
  AssetAtomicMediaResource,
  AssetMediaResource,
  AnyMediaResource,
  GenerationProduct,
  GenerationPlatform
} from '@sdkwork/magic-studio-types/media';

// Re-export infrastructure types from focused Magic Studio types subpaths
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
} from '@sdkwork/magic-studio-types/infrastructure';

// Re-export enums from focused Magic Studio types subpaths
export {
  MediaResourceType,
  MediaScene,
  AudioFormat,
  NotificationType,
  ModelProviderId,
  RemixIntent
} from '@sdkwork/magic-studio-types/vocabulary';
export { GenerationType } from '@sdkwork/magic-studio-types/catalog';
export { ThemeMode } from '@sdkwork/magic-studio-types/theme-mode';

// Re-export BaseEntity from the canonical entity subpath for consistency
// Note: BaseEntity already includes uuid: string (required)
export type BaseEntity = Base;

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
  resolution?: string | ExportResolution;
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
// Workspace and Project types
// ============================================================================

export type { StudioProject, StudioWorkspace } from '@sdkwork/magic-studio-types/workspace';
