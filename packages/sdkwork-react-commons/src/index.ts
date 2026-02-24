export * from './utils';
export * from './constants';
export * from './algorithms';

// Export types from types.ts
export * from './types';
// Explicitly re-export commonly used types to avoid tree-shaking issues
// Note: Enums (ThemeMode, MediaResourceType, etc.) are exported via export * above
export type {
    BaseEntity,
    ServiceResult,
    Sort,
    Pageable,
    PageRequest,
    Page,
    ObjectRef,
    UserSettings,
    TagsContent,
    MediaResource,
    FileMediaResource,
    VideoMediaResource,
    ImageMediaResource,
    AudioMediaResource,
    MusicMediaResource,
    CharacterMediaResource,
    AssetMediaResource,
    GenerationProduct,
    GenerationPlatform,
    AnyMediaResource,
    ModelInfo,
    ChannelInfo,
    ModelInfoResponse,
    IBaseService,
    FileViewerProps,
    ChatMessage,
    EditorFile,
    IFileSystemProvider,
    FileStat,
    ICompressionProvider,
    IDEDefinition,
    PlatformKey,
    IPlacementStrategy,
    DragInput,
    DragContext,
    PlacementResult,
    FBO,
    RenderContext,
    RenderOverrideClip,
    IMediaEncoder,
    IFileSaveStrategy,
    ExportResolution,
    ExportConfig,
    ExportOptions,
    ExportProgressCallback,
    IStorageProvider,
    StorageObject,
    UploadResult,
    ServerStorageProtocol,
    UploadIntentResponse,
    AccessUrlResponse,
    AspectRatio,
    MediaType,
    ProjectType,
    ImageStyle,
    GenerationConfig,
    GeneratedResult,
    ImageTask,
    Asset,
    Note,
    NoteType,
    NoteSummary,
    NoteFolder,
    User,
    ArticleDraft,
    ArticlePayload,
    PublishResult,
    PublishTarget,
    MusicTask,
    VideoTask,
    VideoConfig,
    SfxTask,
    VoiceTask,
    GeneratedMusicResult,
    WindowControlsProps,
    PortalTab,
    StyleOption,
    UploadedFile,
    SettingInputProps,
    SettingSelectProps,
    SettingToggleProps,
    BaseProps,
    ModelProviderId,
    ModelProvider,
    VideoGenerationMode,
    AssetType,
} from './types';
// Re-export enum values
export { GenerationType, MediaResourceType, AudioFormat, MediaScene } from './types';

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
export { Tree, type TreeItem } from './components/Tree';
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
