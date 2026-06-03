import type { MagicStudioToolkitJobKind } from './server-governance.ts';

export interface MagicStudioMediaProbeRequest {
  input: string;
}

export interface MagicStudioMediaProbeResult {
  [key: string]: unknown;
  format?: Record<string, unknown> | null;
  streams: Record<string, unknown>[];
  chapters?: Record<string, unknown>[] | null;
}

export interface MagicStudioMediaImageResizeRequest {
  inputPath: string;
  outputPath: string;
  width: number;
  height: number;
  overwrite?: boolean;
}

export interface MagicStudioMediaVideoConcatRequest {
  inputPaths: string[];
  outputPath: string;
  overwrite?: boolean;
}

export interface MagicStudioMediaVideoTranscodeRequest {
  inputPath: string;
  outputPath: string;
  videoCodec?: string;
  audioCodec?: string;
  fps?: number;
  width?: number;
  height?: number;
  videoBitrateKbps?: number;
  audioBitrateKbps?: number;
  overwrite?: boolean;
}

export interface MagicStudioMediaVideoTrimRequest {
  inputPath: string;
  outputPath: string;
  startSeconds: number;
  durationSeconds?: number;
  overwrite?: boolean;
}

export interface MagicStudioMediaVideoExtractAudioRequest {
  inputPath: string;
  outputPath: string;
  overwrite?: boolean;
}

export interface MagicStudioMediaVideoThumbnailRequest {
  inputPath: string;
  outputPath: string;
  timeSeconds?: number;
  width?: number;
  height?: number;
}

export interface MagicStudioMediaAudioConvertRequest {
  inputPath: string;
  outputPath: string;
  codec?: string;
  bitrateKbps?: number;
  sampleRate?: number;
  channels?: number;
  overwrite?: boolean;
}

export interface MagicStudioMediaAudioNormalizeRequest {
  inputPath: string;
  outputPath: string;
  overwrite?: boolean;
}

export interface MagicStudioMediaAudioMixInput {
  path: string;
  volume?: number;
}

export interface MagicStudioMediaAudioMixRequest {
  inputs: MagicStudioMediaAudioMixInput[];
  outputPath: string;
  overwrite?: boolean;
}

export interface MagicStudioFileSystemEntry {
  name: string;
  path: string;
  isDirectory: boolean;
}

export type MagicStudioFileSystemNodeKind =
  | 'file'
  | 'directory'
  | 'symlink'
  | 'unknown';

export interface MagicStudioFileSystemStat {
  kind: MagicStudioFileSystemNodeKind;
  size: number;
  lastModified?: number | null;
  createdAt?: number | null;
  readonly: boolean;
}

export interface MagicStudioFileSystemPathRequest {
  path: string;
}

export interface MagicStudioFileSystemWriteTextRequest {
  path: string;
  text: string;
}

export interface MagicStudioFileSystemTextPayload {
  text: string;
}

export interface MagicStudioFileSystemWriteBytesRequest {
  path: string;
  bytesBase64: string;
}

export interface MagicStudioFileSystemBytesPayload {
  bytesBase64: string;
}

export interface MagicStudioFileSystemExistsResult {
  exists: boolean;
}

export interface MagicStudioFileSystemRenameRequest {
  oldPath: string;
  newPath: string;
}

export interface MagicStudioFileSystemCopyFileRequest {
  sourcePath: string;
  destinationPath: string;
}

export interface MagicStudioCompressionZipRequest {
  sourcePaths: string[];
}

export interface MagicStudioCompressionZipResult {
  bytes: number[];
}

export interface MagicStudioCompressionUnzipRequest {
  zipPath: string;
  targetDir: string;
}

export interface MagicStudioOperationOkResult {
  ok: boolean;
}

export interface MagicStudioSqlExecuteRequest {
  dbPath: string;
  sql: string;
  params?: unknown[];
}

export interface MagicStudioSqlExecuteBatchRequest {
  dbPath: string;
  sqlBatch: string;
}

export interface MagicStudioSqlRow {
  [key: string]: unknown;
}

export interface MagicStudioSqlExecuteResult {
  affectedRows: number;
  lastInsertRowid: number;
}

export type MagicStudioToolkitOperation =
  | ({
      kind: 'mediaProbe';
    } & MagicStudioMediaProbeRequest)
  | ({
      kind: 'imageResize';
    } & MagicStudioMediaImageResizeRequest)
  | ({
      kind: 'videoConcat';
    } & MagicStudioMediaVideoConcatRequest)
  | ({
      kind: 'videoTranscode';
    } & MagicStudioMediaVideoTranscodeRequest)
  | ({
      kind: 'videoTrim';
    } & MagicStudioMediaVideoTrimRequest)
  | ({
      kind: 'videoExtractAudio';
    } & MagicStudioMediaVideoExtractAudioRequest)
  | ({
      kind: 'videoThumbnail';
    } & MagicStudioMediaVideoThumbnailRequest)
  | ({
      kind: 'audioConvert';
    } & MagicStudioMediaAudioConvertRequest)
  | ({
      kind: 'audioNormalize';
    } & MagicStudioMediaAudioNormalizeRequest)
  | ({
      kind: 'audioMix';
    } & MagicStudioMediaAudioMixRequest)
  | ({
      kind: 'zipAssets';
    } & MagicStudioCompressionZipRequest)
  | {
      kind: 'recordAudio';
      output: string;
      durationSeconds?: number | null;
      inputDevice?: string | null;
    }
  | {
      kind: 'recordScreen';
      output: string;
      durationSeconds?: number | null;
      source?: string | null;
    };

export interface MagicStudioToolkitJobSubmission {
  kind: MagicStudioToolkitJobKind;
  operation: MagicStudioToolkitOperation;
}
