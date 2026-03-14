import type { PlatformRuntime } from '../runtime';

export type ToolkitMediaSource = string | Blob | File;

export interface ToolkitImageMetadata {
  width: number;
  height: number;
  ratio: number;
  mimeType?: string;
}

export interface ToolkitVideoMetadata {
  width: number;
  height: number;
  duration: number;
  fps?: number;
  bitrate?: number;
  codec?: string;
}

export interface ToolkitAudioMetadata {
  duration: number;
  sampleRate?: number;
  channels?: number;
  bitrate?: number;
  codec?: string;
}

export interface ToolkitImageConvertOptions {
  width?: number;
  height?: number;
  type?: ToolkitFrameCaptureOptions['type'];
  quality?: number;
}

export interface ToolkitImageOptimizeOptions {
  quality?: number;
  type?: ToolkitFrameCaptureOptions['type'];
}

export interface ToolkitFrameCaptureOptions {
  timeSeconds?: number;
  type?: 'image/png' | 'image/jpeg' | 'image/webp';
  quality?: number;
  width?: number;
  height?: number;
}

export interface ToolkitVideoTranscodeOptions {
  videoCodec?: string;
  audioCodec?: string;
  fps?: number;
  width?: number;
  height?: number;
  videoBitrateKbps?: number;
  audioBitrateKbps?: number;
  overwrite?: boolean;
  extraArgs?: string[];
}

export interface ToolkitVideoTrimOptions {
  startSeconds: number;
  durationSeconds?: number;
  overwrite?: boolean;
}

export interface ToolkitVideoConcatOptions {
  overwrite?: boolean;
}

export interface ToolkitAudioConvertOptions {
  codec?: string;
  bitrateKbps?: number;
  sampleRate?: number;
  channels?: number;
  overwrite?: boolean;
}

export interface ToolkitAudioNormalizeOptions {
  overwrite?: boolean;
}

export interface ToolkitAudioMixInput {
  path: string;
  volume?: number;
}

export interface ToolkitAudioMixOptions {
  overwrite?: boolean;
}

export interface ToolkitRecorderHandle {
  stop(): Promise<Blob>;
  pause(): void;
  resume(): void;
  getStream(): MediaStream;
}

export interface ToolkitRecordOptions {
  mimeType?: string;
  bitsPerSecond?: number;
}

export interface ToolkitScreenRecordOptions extends ToolkitRecordOptions {
  withMicrophone?: boolean;
  withSystemAudio?: boolean;
}

export interface ToolkitZipEntry {
  name: string;
  data: Uint8Array | ArrayBuffer | Blob | string;
}

export interface ToolkitFfmpegExecResult {
  code: number;
  stdout: string;
  stderr: string;
}

export interface ToolkitSqlExecuteResult {
  affectedRows: number;
  lastInsertRowid: number;
}

export interface ToolkitDatabaseRow {
  [key: string]: unknown;
}

export interface ToolkitSqlTransaction {
  execute(
    sql: string,
    params?: unknown[]
  ): Promise<ToolkitSqlExecuteResult>;
  query<T extends ToolkitDatabaseRow = ToolkitDatabaseRow>(
    sql: string,
    params?: unknown[]
  ): Promise<T[]>;
}

export interface ToolkitSpeechSynthesisOptions {
  lang?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  voiceName?: string;
}

export interface ToolkitSpeechRecognizeOptions {
  lang?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
  timeoutMs?: number;
}

export interface ToolkitSpeechRecognizeResult {
  transcript: string;
  confidence?: number;
}

export interface ToolkitLocalWorkspaceDirs {
  root: string;
  projects: string;
  media: string;
  imports: string;
  exports: string;
  cache: string;
  temp: string;
  recordings: string;
  database: string;
  logs: string;
}

export interface PlatformImageToolkit {
  getMetadata(source: ToolkitMediaSource): Promise<ToolkitImageMetadata>;
  resize(
    source: ToolkitMediaSource,
    options: { width: number; height: number; type?: ToolkitFrameCaptureOptions['type']; quality?: number }
  ): Promise<Blob>;
  optimize(source: ToolkitMediaSource, options?: ToolkitImageOptimizeOptions): Promise<Blob>;
  convert(source: ToolkitMediaSource, options?: ToolkitImageConvertOptions): Promise<Blob>;
}

export interface PlatformVideoToolkit {
  getMetadata(source: ToolkitMediaSource): Promise<ToolkitVideoMetadata>;
  captureFrame(source: ToolkitMediaSource, options?: ToolkitFrameCaptureOptions): Promise<Blob>;
  transcode(inputPath: string, outputPath: string, options?: ToolkitVideoTranscodeOptions): Promise<ToolkitFfmpegExecResult>;
  trim(inputPath: string, outputPath: string, options: ToolkitVideoTrimOptions): Promise<ToolkitFfmpegExecResult>;
  concat(inputPaths: string[], outputPath: string, options?: ToolkitVideoConcatOptions): Promise<ToolkitFfmpegExecResult>;
  extractAudio(inputPath: string, outputPath: string, overwrite?: boolean): Promise<ToolkitFfmpegExecResult>;
  createThumbnail(inputPath: string, outputPath: string, options?: ToolkitFrameCaptureOptions): Promise<ToolkitFfmpegExecResult>;
}

export interface PlatformAudioToolkit {
  getMetadata(source: ToolkitMediaSource): Promise<ToolkitAudioMetadata>;
  convert(inputPath: string, outputPath: string, options?: ToolkitAudioConvertOptions): Promise<ToolkitFfmpegExecResult>;
  normalize(inputPath: string, outputPath: string, options?: ToolkitAudioNormalizeOptions): Promise<ToolkitFfmpegExecResult>;
  mix(inputs: ToolkitAudioMixInput[], outputPath: string, options?: ToolkitAudioMixOptions): Promise<ToolkitFfmpegExecResult>;
}

export interface PlatformCompressionToolkit {
  zipEntries(entries: ToolkitZipEntry[]): Promise<Uint8Array>;
  zipLocalPaths(sourcePaths: string[]): Promise<Uint8Array>;
  unzipToDirectory(zipPath: string, targetDirectory: string): Promise<void>;
}

export interface PlatformFfmpegToolkit {
  available(): Promise<boolean>;
  exec(args: string[]): Promise<ToolkitFfmpegExecResult>;
  probe(pathOrUrl: string): Promise<Record<string, unknown>>;
}

export interface PlatformDatabaseToolkit {
  sqliteAvailable(): boolean;
  execute(
    dbPath: string,
    sql: string,
    params?: unknown[]
  ): Promise<ToolkitSqlExecuteResult>;
  query<T extends ToolkitDatabaseRow = ToolkitDatabaseRow>(
    dbPath: string,
    sql: string,
    params?: unknown[]
  ): Promise<T[]>;
  executeBatch(dbPath: string, sqlBatch: string): Promise<void>;
  kvGet<T>(key: string, fallback: T): Promise<T>;
  kvSet<T>(key: string, value: T): Promise<void>;
  kvDelete(key: string): Promise<void>;
  initSchema(dbPath: string, schemaSql: string): Promise<void>;
  withTransaction<T>(dbPath: string, runner: (transaction: ToolkitSqlTransaction) => Promise<T>): Promise<T>;
}

export interface PlatformRecorderToolkit {
  startAudioRecording(options?: ToolkitRecordOptions): Promise<ToolkitRecorderHandle>;
  startScreenRecording(options?: ToolkitScreenRecordOptions): Promise<ToolkitRecorderHandle>;
  startCameraRecording(options?: ToolkitRecordOptions): Promise<ToolkitRecorderHandle>;
}

export interface PlatformFileSystemToolkit {
  ensureDir(path: string): Promise<void>;
  readJson<T>(path: string): Promise<T>;
  writeJson<T>(path: string, value: T, indent?: number): Promise<void>;
  copy(source: string, destination: string): Promise<void>;
  remove(path: string): Promise<void>;
}

export interface PlatformSpeechToolkit {
  supported(): boolean;
  speak(text: string, options?: ToolkitSpeechSynthesisOptions): Promise<void>;
  stop(): void;
  recognize(options?: ToolkitSpeechRecognizeOptions): Promise<ToolkitSpeechRecognizeResult>;
}

export interface PlatformWorkspaceToolkit {
  resolveLocalDirs(appName?: string): Promise<ToolkitLocalWorkspaceDirs>;
  ensureLocalDirs(appName?: string): Promise<ToolkitLocalWorkspaceDirs>;
}

export interface PlatformToolKit {
  readonly runtime: PlatformRuntime;
  readonly image: PlatformImageToolkit;
  readonly video: PlatformVideoToolkit;
  readonly audio: PlatformAudioToolkit;
  readonly compression: PlatformCompressionToolkit;
  readonly ffmpeg: PlatformFfmpegToolkit;
  readonly recorder: PlatformRecorderToolkit;
  readonly fileSystem: PlatformFileSystemToolkit;
  readonly database: PlatformDatabaseToolkit;
  readonly speech: PlatformSpeechToolkit;
  readonly workspace: PlatformWorkspaceToolkit;
}
