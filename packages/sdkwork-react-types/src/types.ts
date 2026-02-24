// Type definitions for SDKWork React applications
// This package exists to break circular dependencies between commons and core
// All base types should be defined here, not imported from commons

// Base entity types
export interface BaseEntity {
  id: string;
  createdAt: string | number;
  updatedAt: string | number;
  deletedAt?: string | number;
}

// Service types
export interface ServiceResult<T> {
  code: number;
  data: T;
  message?: string;
}

export interface Sort {
  property: string;
  direction: 'ASC' | 'DESC';
}

export interface Pageable {
  pageNumber: number;
  pageSize: number;
  sort?: Sort;
}

export interface PageRequest {
  page?: number;
  size?: number;
  sort?: Sort;
}

export interface Page<T> {
  content: T[];
  pageable: Pageable;
  totalElements: number;
  totalPages: number;
  last: boolean;
  first: boolean;
  numberOfElements: number;
  empty: boolean;
}

// Media types
export interface ObjectRef {
  type: string;
  id: string;
  url?: string;
}

export interface MediaResource {
  id: string;
  type: MediaType;
  url: string;
  thumbnailUrl?: string;
  duration?: number;
  size?: number;
  width?: number;
  height?: number;
  format?: string;
}

export interface FileMediaResource extends MediaResource {
  fileId: string;
  fileName: string;
}

export interface VideoMediaResource extends FileMediaResource {
  type: 'video';
  coverUrl?: string;
  fps?: number;
  bitrate?: number;
}

export interface ImageMediaResource extends FileMediaResource {
  type: 'image';
  aspectRatio?: number;
}

export interface AudioMediaResource extends FileMediaResource {
  type: 'audio';
  bitrate?: number;
  sampleRate?: number;
}

export interface MusicMediaResource extends FileMediaResource {
  type: 'music';
  title?: string;
  artist?: string;
  album?: string;
}

export interface SpeechMediaResource extends FileMediaResource {
  type: 'speech';
  voiceId?: string;
  text?: string;
}

// File System types
export interface FileEntry {
  path: string;
  name: string;
  isDirectory: boolean;
  isFile: boolean;
  size?: number;
  createdAt?: number;
  updatedAt?: number;
}

export interface FileStat {
  isFile: boolean;
  isDirectory: boolean;
  size: number;
  createdAt: number;
  updatedAt: number;
  path?: string;
  name?: string;
}

export interface IFileSystemProvider {
  scheme: string;
  capabilities: {
    readonly: boolean;
    supportsStreaming?: boolean;
    supportsWatcher?: boolean;
  };
  readDir(path: string): Promise<FileEntry[]>;
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  readFileBinary(path: string): Promise<Uint8Array>;
  writeFileBinary(path: string, content: Uint8Array): Promise<void>;
  readFileBlob(path: string): Promise<Blob>;
  writeFileBlob(path: string, content: Blob): Promise<void>;
  stat(path: string): Promise<FileStat>;
  createDir(path: string): Promise<void>;
  delete(path: string): Promise<void>;
  rename(oldPath: string, newPath: string): Promise<void>;
  copy(sourcePath: string, destPath: string): Promise<void>;
  watch?(path: string, onChange: (events: any[]) => void): () => void;
}

export interface AssetMediaResource extends FileMediaResource {
  assetId: string;
  assetType: AssetType;
}

export interface AnyMediaResource extends MediaResource {
  [key: string]: any;
}

// Generation types
export interface GenerationProduct {
  id: string;
  url: string;
  thumbnailUrl?: string;
  prompt?: string;
  negativePrompt?: string;
  seed?: number;
  steps?: number;
  guidance?: number;
  width?: number;
  height?: number;
}

export interface GenerationConfig {
  prompt: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
  steps?: number;
  guidance?: number;
  seed?: number;
  aspectRatio?: AspectRatio;
  [key: string]: any;
}

export interface GeneratedResult {
  id: string;
  url: string;
  thumbnailUrl?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  errorMessage?: string;
}

// Task types
export interface ImageTask extends GeneratedResult {
  type: 'image';
  prompt: string;
  negativePrompt?: string;
  style?: ImageStyle;
}

export interface VideoTask extends GeneratedResult {
  type: 'video';
  prompt?: string;
  imageUrl?: string;
  duration?: number;
  fps?: number;
}

export interface VideoConfig {
  prompt?: string;
  imageUrl?: string;
  duration?: number;
  fps?: number;
  width?: number;
  height?: number;
  [key: string]: any;
}

export interface AudioTask extends GeneratedResult {
  type: 'audio';
  prompt?: string;
  duration?: number;
}

export interface MusicTask extends GeneratedResult {
  type: 'music';
  prompt?: string;
  duration?: number;
  style?: string;
  tempo?: number;
}

export interface SfxTask extends GeneratedResult {
  type: 'sfx';
  prompt: string;
  duration?: number;
}

export interface VoiceTask extends GeneratedResult {
  type: 'voice';
  text?: string;
  voiceId?: string;
  language?: string;
}

export interface GeneratedMusicResult extends GeneratedResult {
  title?: string;
  artist?: string;
  lyrics?: string;
}

// Asset types
export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  url: string;
  thumbnailUrl?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  size?: number;
  format?: string;
  width?: number;
  height?: number;
  duration?: number;
}

export type AssetType = 'image' | 'video' | 'audio' | 'music' | 'voice' | 'document' | 'other';

// User types
export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  nickname?: string;
  bio?: string;
  settings?: UserSettings;
  createdAt: string;
  updatedAt: string;
}

export interface UserSettings {
  theme?: ThemeMode;
  language?: string;
  notifications?: boolean;
  [key: string]: any;
}

export type ThemeMode = 'light' | 'dark' | 'system';

// Note types
export interface Note {
  id: string;
  title: string;
  content: string;
  type: NoteType;
  folderId?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  pinned?: boolean;
  archived?: boolean;
}

export interface NoteFolder {
  id: string;
  name: string;
  parentId?: string;
  createdAt: string;
  updatedAt: string;
}

export type NoteType = 'text' | 'markdown' | 'rich-text';

export interface NoteSummary {
  id: string;
  title: string;
  preview: string;
  updatedAt: string;
  type: NoteType;
}

// Article types
export interface ArticleDraft {
  id: string;
  title: string;
  content: string;
  status: 'draft' | 'published' | 'archived';
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ArticlePayload {
  title: string;
  content: string;
  tags?: string[];
  coverImage?: string;
}

export interface PublishTarget {
  id: string;
  name: string;
  platform: string;
  connected: boolean;
}

export interface PublishResult {
  success: boolean;
  url?: string;
  error?: string;
}

// Model types
export interface ModelInfo {
  id: string;
  name: string;
  provider: ModelProviderId;
  version?: string;
  description?: string;
  capabilities: string[];
  maxTokens?: number;
  contextWindow?: number;
}

export interface ModelInfoResponse {
  models: ModelInfo[];
  total: number;
}

export interface ChannelInfo {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
}

export type ModelProviderId = 'gemini' | 'openai' | 'anthropic' | 'stability' | 'runway' | 'elevenlabs' | 'custom';

export interface ModelProvider {
  id: ModelProviderId;
  name: string;
  logo?: string;
  models: ModelInfo[];
}

// Platform types
export type PlatformKey = 'web' | 'tauri' | 'electron';

export interface PlatformInfo {
  key: PlatformKey;
  name: string;
  version: string;
}

// Compression types
export interface CompressionOptions {
  level?: number;
  format?: 'zip' | 'tar' | 'gz';
}

// IDE types
export interface IDEDefinition {
  path: string;
  line?: number;
  column?: number;
}

// Placement types
export interface DragInput {
  x: number;
  y: number;
}

export interface DragContext {
  width: number;
  height: number;
  padding: number;
}

export interface PlacementResult {
  x: number;
  y: number;
  score: number;
}

export interface IPlacementStrategy {
  findPlacement(drag: DragInput, context: DragContext): PlacementResult;
}

// Storage types
export interface StorageObject {
  key: string;
  url: string;
  size: number;
  contentType?: string;
  metadata?: Record<string, any>;
}

export interface UploadResult {
  success: boolean;
  url?: string;
  key?: string;
  error?: string;
}

export interface UploadIntentResponse {
  uploadUrl: string;
  objectKey: string;
  accessUrl?: string;
}

export interface AccessUrlResponse {
  accessUrl: string;
  expiresAt: string;
}

// Export types
export interface ExportResolution {
  width: number;
  height: number;
}

export interface ExportConfig {
  resolution: ExportResolution;
  fps: number;
  bitrate: number;
  format: string;
}

export interface ExportOptions {
  config: ExportConfig;
  outputPath?: string;
}

export type ExportProgressCallback = (progress: number) => void;

// Aspect ratio types
export type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4' | '21:9' | '9:21' | 'custom';

// Image style types
export type ImageStyle = 'realistic' | 'anime' | 'painting' | 'sketch' | '3d' | 'abstract' | 'custom';

// Media type
export type MediaType = 'image' | 'video' | 'audio' | 'voice' | 'music' | 'speech';

// Project type
export type ProjectType = 'image' | 'video' | 'audio' | 'music' | 'notes' | 'mixed';

// Chat types
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  attachments?: ObjectRef[];
}

// Editor types
export interface EditorFile {
  id: string;
  name: string;
  path: string;
  language?: string;
  content?: string;
}

// Notification types
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
}

// VIP types
export interface VIPPlan {
  id: string;
  name: string;
  price: number;
  duration: number;
  features: string[];
}

export interface VIPStatus {
  active: boolean;
  plan?: VIPPlan;
  expiresAt?: string;
  creditsRemaining: number;
}

// Workspace types
export interface Workspace {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  memberIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  type: ProjectType;
  workspaceId: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
}

// Settings types
export interface AppSettings {
  theme: ThemeMode;
  language: string;
  autoSave: boolean;
  autoSaveInterval: number;
  defaultExportFormat: string;
  defaultResolution: ExportResolution;
}

// Plugin types
export interface Plugin {
  id: string;
  name: string;
  version: string;
  description: string;
  enabled: boolean;
  author: string;
}

// Skill types
export interface Skill {
  id: string;
  name: string;
  description: string;
  icon?: string;
  category: string;
  enabled: boolean;
}

// Voice speaker types
export interface VoiceSpeaker {
  id: string;
  name: string;
  language: string;
  gender: 'male' | 'female' | 'neutral';
  previewUrl?: string;
  provider: string;
}

// Character types
export interface Character {
  id: string;
  name: string;
  description?: string;
  avatarUrl?: string;
  voiceId?: string;
  personality?: string;
}

// Generation history types
export interface GenerationHistory {
  id: string;
  type: MediaType;
  prompt: string;
  resultUrl: string;
  thumbnailUrl?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  config?: Record<string, any>;
}

// Service interfaces
export interface IBaseService<T = any> {
  getById(id: string): Promise<T>;
  list(page?: PageRequest): Promise<Page<T>>;
  create(data: Partial<T>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
}

export interface IFileSystemProvider {
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  readDir(path: string): Promise<FileStat[]>;
  mkdir(path: string): Promise<void>;
  exists(path: string): Promise<boolean>;
  stat(path: string): Promise<FileStat>;
  delete(path: string): Promise<void>;
}

export interface ICompressionProvider {
  compress(files: string[], options?: CompressionOptions): Promise<string>;
  extract(archive: string, dest?: string): Promise<string>;
}

export interface IStorageProvider {
  upload(file: File, options?: any): Promise<UploadResult>;
  download(key: string): Promise<Blob>;
  delete(key: string): Promise<void>;
  getUrl(key: string): Promise<string>;
  list(prefix?: string): Promise<StorageObject[]>;
}

export interface IMediaEncoder {
  encode(input: string, config: ExportConfig, onProgress?: ExportProgressCallback): Promise<string>;
  decode(input: string): Promise<any>;
}

export interface IFileSaveStrategy {
  save(file: File, destination: string): Promise<string>;
}

// File viewer types
export interface FileViewerProps {
  src: string;
  type?: string;
  alt?: string;
  className?: string;
}

// Window controls types
export interface WindowControlsProps {
  className?: string;
}

// Portal types
export interface PortalTab {
  id: string;
  title: string;
  url: string;
  icon?: string;
}

// UI helper types
export interface UploadedFile {
  file: File;
  url: string;
  name: string;
  size: number;
}

export interface SettingInputProps {
  label: string;
  value: string | number;
  onChange: (value: string | number) => void;
  placeholder?: string;
  type?: 'text' | 'number' | 'password';
}

export interface SettingSelectProps {
  label: string;
  value: string | number;
  options: Array<{ label: string; value: string | number }>;
  onChange: (value: string | number) => void;
}

export interface SettingToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description?: string;
}

// Base component props
export interface BaseProps {
  className?: string;
  children?: React.ReactNode;
}

// Tags content type
export interface TagsContent {
  tags: string[];
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
}
