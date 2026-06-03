export * from './utils';
export * from './constants';
export * from './algorithms';
export * from './services';

// Export commons-specific types (MediaResource, FileSystem, etc.)
export * from './types';

// Re-export common/base types from focused Magic Studio types subpaths for convenience
export {
  // Service Result
  Result,
  type IBaseService,
  type ServiceResult,
} from '@sdkwork/magic-studio-types/service';
export {

  // Pagination
  type Sort,
  type Pageable,
  type PageRequest,
  type Page,
  DEFAULT_PAGE_SIZE,
} from '@sdkwork/magic-studio-types/pagination';
export {

  // Object Reference
  type ObjectRef,
} from '@sdkwork/magic-studio-types/media';
export {

  // Identity
  type ClientEntityIdentity,
  type EntityIdentityLike,
  createClientEntityIdentity,
  createUuid,
  entityKeysEqual,
  hasPersistentEntityId,
  matchesEntityKey,
  resolveEntityKey,
  resolveEntityKeys,
} from '@sdkwork/magic-studio-types/entity';
export {

  // Base Enums
  MediaResourceType,
  MediaScene,
  AudioFormat,
  NotificationType,
  ModelProviderId,
  RemixIntent,
} from '@sdkwork/magic-studio-types/vocabulary';
export { GenerationType } from '@sdkwork/magic-studio-types/catalog';
export { ThemeMode } from '@sdkwork/magic-studio-types/theme-mode';
export {

  // Video Types
  type VideoGenerationMode,
  type VideoResolution,
} from '@sdkwork/magic-studio-types/video';
export {
  // User & Settings
  type User,
  type UserSettings,

  // Notifications
  type AppNotification,
} from '@sdkwork/magic-studio-types/user';
export {

  // Storage
  type StorageObject,
  type UploadResult,
  type IStorageProvider,
} from '@sdkwork/magic-studio-types/storage';
export {

  // Tags & Content
  type TagsContent,
  type GalleryAuthor,
  type GalleryItem,
  type GalleryItemType,
  type InputAttachmentData,
  type LocalizedText,
  type LocalizedTextLike,
  type StyleAsset,
  type StyleOption,
} from '@sdkwork/magic-studio-types/content';
export {

  // Project
  type ProjectType,
  type StudioProject,
  type StudioWorkspace,
} from '@sdkwork/magic-studio-types/workspace';
export {

  // Type Aliases
  type AspectRatio,
  type MediaType,
  type ExportResolution,
  type PlatformKey,
} from '@sdkwork/magic-studio-types/vocabulary';
export {

  // Model Info
  type ChannelInfo,
  type GenerationMode,
  type ModelInfo,
  type ModelInfoResponse,
} from '@sdkwork/magic-studio-types/catalog';
export type {
  VideoAspectRatio,
} from '@sdkwork/magic-studio-types/video';
export {

  // AGI-native generation contracts
  type MediaInputRef,
  type GenerationRecipe,
  type GenerationExecution,
  type GeneratedArtifact,
  type ArtifactSet,
  type ArtifactDeliveryView,
  type GenerationOutcome,
} from '@sdkwork/magic-studio-types/agi';

// Re-export domain-specific types from focused @sdkwork/magic-studio-types subpaths
export type {
  // Film types
  FilmProject,
  FilmUserInput,
  FilmScript,
  FilmCharacter,
  FilmCharacterType,
  FilmLocation,
  FilmProp,
  FilmScene,
  FilmShot,
  FilmDialogueItem,
  FilmSettings,
  FilmViewMode,
  FilmImageMediaResource,
  FilmAssetMediaResource,
} from '@sdkwork/magic-studio-types/film';
export type {

  // Video types
  VideoModel,
  VideoConfig,
  VideoTask,
  VideoProject,
  VideoStyle,
  VideoPreset,
} from '@sdkwork/magic-studio-types/video';
export type {

  // Audio types
  AudioModelType,
  AudioGenerationParams,
  AudioTaskResult,
  AudioTask,
  AudioProject,
  AudioVoice,
  AudioPreset,
} from '@sdkwork/magic-studio-types/audio';
export type {

  // Music types
  MusicModelType,
  MusicStyle,
  MusicConfig,
  GeneratedMusicResult,
  MusicTask,
  MusicProject,
} from '@sdkwork/magic-studio-types/music';
export type {

  // SFX types
  SfxModelType,
  SfxConfig,
  GeneratedSfxResult,
  SfxTask,
  SfxProject,
} from '@sdkwork/magic-studio-types/sfx';
export type {

  // Image types
  ImageAspectRatio,
  ImageStyle,
  ImageGenerationConfig,
  GeneratedImageResult,
  ImageTask,
  ImageProject,
  ImageModel,
  ImagePreset,
} from '@sdkwork/magic-studio-types/image';
export type {

  // Assets types
  AssetType,
  AssetOrigin,
  AssetCategory,
  AssetMetadata,
  Asset,
  VideoAsset,
  ImageAsset,
  AudioAsset,
  CharacterAsset,
  SfxAsset,
  TextAsset,
  EffectAsset,
  TransitionAsset,
  AnyAsset,
} from '@sdkwork/magic-studio-types/assets';
export type {

  // Character types
  CharacterArchetype,
  CharacterGender,
  CharacterConfig,
  Character,
  CharacterTask,
} from '@sdkwork/magic-studio-types/character';
export type {

  // Chat types
  ChatRole,
  MessageStatus,
  ChatMode,
  ChatMessage,
  ChatSession,
  ChatTranscript,
  ChatConfig,
} from '@sdkwork/magic-studio-types/chat';
export type {

  // ChatPPT types
  SlideElementType,
  SlideLayout,
  SlideTheme,
  SlideElement,
  Slide,
  Presentation,
  PresentationSettings,
  PresentationTemplate,
} from '@sdkwork/magic-studio-types/chatppt';
export type {

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
} from '@sdkwork/magic-studio-types/notes';
export type {

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
} from '@sdkwork/magic-studio-types/canvas';
export type {

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
} from '@sdkwork/magic-studio-types/magiccut';
export type {
  MediaResource,
  FileMediaResource,
  VideoMediaResource,
  ImageMediaResource,
  AudioMediaResource,
  AssetAtomicMediaResource,
  AnyMediaResource,
} from '@sdkwork/magic-studio-types/media';

// Export components
export { AspectRatioSelector } from './components/AspectRatioSelector';
export type { Resolution } from './components/AspectRatioSelector';
export { Button, type ButtonProps } from './components/Button';
export { Card } from './components/Card';
export { Confirm, useConfirm } from './components/Confirm';
export { ErrorBoundary } from './components/ErrorBoundary';
export { GalleryCard } from './components/Gallery';
export { InputAttachment } from './components/InputAttachment';
export { MarketLayout, MarketCard } from './components/Market';
export { ModelSelector } from './components/ModelSelector';
export { PageContainer } from './components/PageContainer';
export { Popover, type PopoverProps } from './components/Popover';
export { PromptText } from './components/PromptText';
export { Tabs, type TabItem } from './components/Tabs';
export { Tree, type TreeItem as TreeComponentItem } from './components/Tree';
export { WindowControls } from './components/Desktop/WindowControls/WindowControls';
export {
  getDesktopShellDragRegionProps,
  type DesktopShellDragRegionProps,
} from './components/Desktop/WindowControls/dragRegion';
export {
  AppShell,
  type AppShellHandle,
  type AppShellProps,
  ActionToolbar,
  type ActionToolbarProps,
  DataPanel,
  type DataPanelHandle,
  type DataPanelProps,
  SplitView,
  type SplitViewHandle,
  type SplitViewProps,
  FormPanel,
  type FormPanelHandle,
  type FormPanelProps,
  VirtualizedList,
  type VirtualizedListHandle,
  type VirtualizedListProps,
  CommandPalette,
  type CommandPaletteHandle,
  type CommandPaletteProps,
  EntityCollectionPanel,
  type EntityCollectionItem,
  type EntityCollectionPanelProps,
  DEFAULT_FRAMEWORK_THEME,
  buildFrameworkCssVariables,
  buildFrameworkStyle,
  type FrameworkTheme,
  type FrameworkColorTokens,
  type FrameworkSpacingTokens,
  type FrameworkRadiusTokens,
  type FrameworkMotionTokens,
  type FrameworkComponentProps,
  type FrameworkComponentStatus,
  type FrameworkEventContext,
  type FrameworkEventHandler,
  type FrameworkSelectMode,
  type SelectionChangeMeta,
  type ToolbarAction,
  type DataPanelItemRenderContext,
  type FrameworkResizeSource,
  type SplitViewSizeChangeMeta,
  type FormFieldType,
  type FormFieldOption,
  type FormFieldDefinition,
  type FormPanelValues,
  type FormValueChangeMeta,
  type FormPanelSubmitMeta,
  type VirtualizedListItemRenderContext,
  type CommandPaletteCommand,
  type CommandPaletteSelectMeta,
} from './components/framework';

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
  formatLocaleCurrency,
  formatLocaleDate,
  formatLocaleDateTime,
  formatLocaleNumber,
  formatLocaleTime,
  formatRelativeTime,
  debounce,
  throttle,
  deepClone,
  deepMerge,
  pathUtils,
} from './utils';

// Note: Layouts are excluded due to complex dependencies on router and other modules.
// They should be imported directly from the application or a dedicated layout package.
