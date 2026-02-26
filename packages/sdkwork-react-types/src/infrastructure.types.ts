// Infrastructure type definitions
// Low-level infrastructure types for file system, rendering, export, etc.

import type { BaseEntity } from './base.types';

// ============================================================================
// Export Config
// ============================================================================

export interface ExportConfig {
  width?: number;
  height?: number;
  fps?: number;
  frameRate?: number;
  duration?: number;
  format?: 'mp4' | 'webm' | 'gif' | 'txt' | 'mov';
  quality?: 'low' | 'medium' | 'high';
  resolution?: string;
  bitrate?: number | 'lower' | 'higher' | 'recommended';
  exportAudio?: boolean;
  exportVideo?: boolean;
}

// ============================================================================
// File System Types
// ============================================================================

export interface IFileSystemProvider {
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  exists(path: string): Promise<boolean>;
  mkdir(path: string): Promise<void>;
  readdir(path: string): Promise<string[]>;
  stat(path: string): Promise<FileStat>;
  unlink(path: string): Promise<void>;
  rmdir(path: string): Promise<void>;
}

export interface FileStat extends BaseEntity {
  name: string;
  path?: string;
  isFile: boolean;
  isDirectory: boolean;
  size: number;
  type: 'file' | 'directory' | 'symlink' | 'unknown';
  readonly?: boolean;
}

export interface FileEntry extends FileStat {
  path: string;
}

export interface ICompressionProvider {
  compress(sourcePaths: string[]): Promise<Uint8Array>;
  decompress(data: Uint8Array, targetPath: string): Promise<void>;
  decompressFile(sourcePath: string, targetPath: string): Promise<void>;
}

// ============================================================================
// IDE Definition
// ============================================================================

export interface IDEDefinition {
  id: string;
  name: string;
  icon?: string;
  extensions?: string[];
  command?: string;
  args?: string[];
  category?: string;
}

// ============================================================================
// Drag and Drop / Placement
// ============================================================================

export interface IPlacementStrategy {
  canHandle?(input: DragInput): boolean;
  calculate(input: DragInput, context: DragContext): PlacementResult;
}

export interface DragInput {
  type?: string;
  sourceId?: string;
  targetId?: string;
  position?: { x: number; y: number };
  data?: any;
  clipId?: string;
  trackId?: string;
  frame?: number;
  clientX?: number;
  clientY?: number;
  containerRect?: DOMRect;
  scrollLeft?: number;
  scrollTop?: number;
  pixelsPerSecond?: number;
}

export interface DragContext {
  timeline?: any;
  tracks: any[];
  currentTime?: number;
  zoom?: number;
  state?: any;
  duration?: number;
  frameRate?: number;
  pixelsPerFrame?: number;
  trackLayouts: { id: string; top: number; height: number }[];
  clipsMap: Record<string, any>;
  getResource: (id: string) => any;
  validateTrackDrop: (trackId: string, resourceType: string) => boolean;
  checkCollision: (trackId: string, start: number, duration: number, exclude: Set<string>) => boolean;
  calculateSnap: (rawTime: number, duration: number, ignoreClipId?: string | null) => { time: number; lines: number[] };
}

export interface PlacementResult {
  valid?: boolean;
  trackId: string | null;
  position?: number;
  duration?: number;
  conflicts?: string[];
  time: number;
  insertIndex: number | null;
  isValid: boolean;
  hasCollision: boolean;
  snapLines: number[];
  suggestedTrackType?: 'video' | 'audio' | 'text' | 'subtitle' | 'effect' | 'ai';
}

// ============================================================================
// WebGL / Rendering
// ============================================================================

export interface FBO {
  framebuffer?: WebGLFramebuffer;
  texture: WebGLTexture;
  width: number;
  height: number;
  fbo: WebGLFramebuffer;
}

export interface RenderContext {
  gl: WebGL2RenderingContext | WebGLRenderingContext;
  width: number;
  height: number;
  time?: number;
  deltaTime?: number;
  effectSystem?: any;
  emptyTexture?: WebGLTexture;
  vaoQuad?: WebGLVertexArrayObject | WebGLVertexArrayObjectOES;
  compositor?: any;
  shaderManager?: any;
  resourceManager?: any;
  textureCache?: any;
}

export interface RenderOverrideClip {
  id: string;
  type?: string;
  start?: number;
  startFrame?: number;
  endFrame?: number;
  texture?: WebGLTexture;
  resource?: { id: string };
}

// ============================================================================
// Media Encoder
// ============================================================================

export interface IMediaEncoder {
  requiresRealtime: boolean;
  initialize(canvas: HTMLCanvasElement, audioBuffer: AudioBuffer | null, config: ExportConfig): Promise<void>;
  addFrame?(frame: ImageData): Promise<void>;
  finalize?(): Promise<Blob>;
  supported?(): boolean;
  start(): Promise<void> | void;
  captureFrame(timestamp: number, duration: number): Promise<void>;
  finish(): Promise<Blob>;
  dispose(): void;
}

// ============================================================================
// Export Types
// ============================================================================

export interface ExportOptions {
  timeline: any;
  state: any;
  config: ExportConfig & {
    fileName?: string;
    resolution?: string;
    destinationPath?: string;
    startTime?: number;
    endTime?: number;
  };
  signal?: AbortSignal;
}

export type ExportProgressCallback = (progress: number) => void;

// ============================================================================
// File Save Strategy
// ============================================================================

export interface IFileSaveStrategy {
  save(blob: Blob, filename: string, destinationPath?: string): Promise<void>;
  canSave?(): boolean;
}

// ============================================================================
// Window Controls
// ============================================================================

export interface WindowControlsProps {
  className?: string;
}

// ============================================================================
// Portal Types
// ============================================================================

export interface PortalTab {
  id: string;
  label: string;
  icon: string;
  path: string;
}

// ============================================================================
// Setting Widgets
// ============================================================================

export interface SettingInputProps {
  label?: string;
  description?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export interface SettingSelectProps {
  label?: string;
  description?: string;
  value: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
  disabled?: boolean;
}

export interface SettingToggleProps {
  label?: string;
  description?: string;
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}

// ============================================================================
// Base Props
// ============================================================================

export interface BaseProps {
  label?: string;
  description?: string;
  disabled?: boolean;
  isModified?: boolean;
  onReset?: () => void;
  error?: string;
  layout?: string;
  fullWidth?: boolean;
  labelClassName?: string;
}

// ============================================================================
// Model Provider
// ============================================================================

export interface ModelProvider {
  id: string;
  name: string;
  icon: any; // React.ReactNode
  color?: string;
  models: Array<{
    id: string;
    name: string;
    description?: string;
    badge?: string;
    badgeColor?: string;
    maxAssetsCount?: number;
    [key: string]: any;
  }>;
}

// ============================================================================
// Card Props
// ============================================================================

export interface CardProps {
  children: any; // React.ReactNode
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

// ============================================================================
// Additional Infrastructure Types
// ============================================================================

export interface Bookmark {
  id: string;
  url: string;
  title: string;
}

export interface HistoryItem {
  id: string;
  type: string;
  timestamp: string; // ISO 8601 format: yyyy-MM-dd HH:mm:ss
}

export interface DriveMetadata {
  id: string;
  name: string;
  type: 'file' | 'folder';
  size?: number;
}

export interface Effect {
  id: string;
  name: string;
  type: string;
}
