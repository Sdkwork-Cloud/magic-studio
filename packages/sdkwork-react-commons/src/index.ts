export * from './utils';
export * from './constants';
export * from './algorithms';

// Export commons-specific types (MediaResource, FileSystem, etc.)
export * from './types';

// Re-export common/base types from sdkwork-react-types for convenience
export {
  // Service Result
  Result,
  type ServiceResult,

  // Pagination
  type Sort,
  type Pageable,
  type PageRequest,
  type Page,
  DEFAULT_PAGE_SIZE,

  // Object Reference
  type ObjectRef,

  // Base Enums
  ThemeMode,
  MediaResourceType,
  MediaScene,
  AudioFormat,
  NotificationType,
  GenerationType,
  ModelProviderId,
  RemixIntent,

  // Video Types
  type VideoGenerationMode,
  type VideoResolution,

  // User & Settings
  type User,
  type UserSettings,

  // Notifications
  type AppNotification,

  // Storage
  type StorageObject,
  type UploadResult,
  type UploadIntentResponse,
  type AccessUrlResponse,
  type ServerStorageProtocol,
  type IStorageProvider,

  // Tags & Content
  type TagsContent,

  // Base Service
  type IBaseService,

  // Project
  type ProjectType,

  // Type Aliases
  type AspectRatio,
  type MediaType,
  type VideoAspectRatio,
  type ExportResolution,

  // Model Info
  type ModelInfo,
  type ChannelInfo,
  type ModelInfoResponse,

  // Gallery (from local types, not @sdkwork/react-types)
  type GalleryAuthor,

  // Input & Style
  type InputAttachmentData,

  // Generation
  type GenerationMode,

  // Platform
  type PlatformKey,
} from '@sdkwork/react-types';

// Re-export domain-specific types from sdkwork-react-types
export type {
  // Film types
  FilmProject,
  FilmUserInput,
  FilmScript,
  FilmCharacter,
  FilmLocation,
  FilmProp,
  FilmScene,
  FilmShot,
  FilmDialogueItem,
  FilmSettings,
  FilmViewMode,

  // Video types
  VideoModel,
  VideoConfig,
  VideoTask,
  VideoProject,
  VideoAsset,
  VideoStyle,
  VideoPreset,

  // Audio types
  AudioModelType,
  AudioGenerationParams,
  AudioTaskResult,
  AudioTask,
  AudioProject,
  AudioVoice,
  AudioPreset,

  // Music types
  MusicModelType,
  MusicStyle,
  MusicConfig,
  GeneratedMusicResult,
  MusicTask,
  MusicProject,

  // SFX types
  SfxModelType,
  SfxConfig,
  GeneratedSfxResult,
  SfxTask,
  SfxProject,

  // Image types
  ImageAspectRatio,
  ImageStyle,
  ImageGenerationConfig,
  GeneratedImageResult,
  ImageTask,
  ImageProject,
  ImageModel,
  ImagePreset,

  // Assets types
  AssetType,
  AssetOrigin,
  AssetCategory,
  AssetMetadata,
  Asset,
  MediaResource,
  FileMediaResource,
  VideoMediaResource,
  ImageMediaResource,
  AudioMediaResource,
  AnyMediaResource,
  ImageAsset,
  AudioAsset,
  DigitalHumanAsset,
  SfxAsset,
  TextAsset,
  EffectAsset,
  TransitionAsset,
  AnyAsset,

  // Character types
  CharacterArchetype,
  CharacterGender,
  CharacterConfig,
  Character,
  CharacterTask,

  // Chat types
  ChatRole,
  MessageStatus,
  ChatMode,
  ChatMessage,
  ChatSession,
  ChatTranscript,
  ChatConfig,

  // ChatPPT types
  SlideElementType,
  SlideLayout,
  SlideTheme,
  SlideElement,
  Slide,
  Presentation,
  PresentationSettings,
  PresentationTemplate,

  // Notes types
  NoteType,
  PublishStatus,
  NoteMetadata,
  NoteSummary,
  Note,
  NoteFolder,
  TreeNote,
  TreeFolder,
  TreeItem,
  PublishTarget,
  ArticlePayload,
  PublishResult,

  // Canvas types
  CanvasElementType,
  CanvasExportMode,
  CanvasNodeData,
  CanvasMediaResource,
  CanvasElement,
  Viewport,
  CanvasBoard,
  CanvasSettings,
  CanvasProject,

  // MagicCut types
  CutTrackType,
  CutLayerType,
  EasingType,
  BlendMode,
  CutProjectSettings,
  CutProject,
  CutTemplate,
  TimelineMarker,
  CutTimeline,
  CutTrack,
  CutClip,
  CutLayer,
  AudioEffectConfig,
  ColorGradeSettings,
  CutClipTransform,
  KeyframePoint,
  KeyframeMap,
} from '@sdkwork/react-types';

// Export components
export { AspectRatioSelector } from './components/AspectRatioSelector';
export { Button, type ButtonProps } from './components/Button';
export { Card } from './components/Card';
export { Confirm, useConfirm } from './components/Confirm';
export { ErrorBoundary } from './components/ErrorBoundary';
export { GalleryCard } from './components/Gallery';
export type { GalleryItem, GalleryItemType } from './types';
export { InputAttachment } from './components/InputAttachment';
export { MarketLayout, MarketCard } from './components/Market';
export { ModelSelector } from './components/ModelSelector';
export { PageContainer } from './components/PageContainer';
export { Popover, type PopoverProps } from './components/Popover';
export { PromptText } from './components/PromptText';
export { Tabs, type TabItem } from './components/Tabs';
export { Tree, type TreeItem as TreeComponentItem } from './components/Tree';
export { WindowControls } from './components/Desktop/WindowControls/WindowControls';

// Upload Components
export {
  ImageUpload,
  VideoUpload,
  AudioUpload,
  FileUpload,
  type BaseUploadProps,
  type UploadedFile as UploadFile,
} from './components/upload';

// Export hooks
export { useAssetUrl } from './hooks/useAssetUrl';
export { useTheme, themeManager } from './hooks/useTheme';

// Export utils with explicit names
export {
  Logger,
  logger,
  createLogger,
  type LogLevel,
  type LoggerConfig,
  generateUUID,
  getAssetLabel,
  getIconComponent,
  iconMap,
  markdownUtils,
  audioUtils,
  cn,
  formatBytes,
  formatDuration,
  formatNumber,
  formatDate,
  debounce,
  throttle,
  deepClone,
  deepMerge,
  pathUtils,
} from './utils';

// Note: Layouts are excluded due to complex dependencies on router and other modules.
// They should be imported directly from the application or a dedicated layout package.
