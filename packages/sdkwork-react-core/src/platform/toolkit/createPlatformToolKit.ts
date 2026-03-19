import type { PlatformRuntime } from '../runtime';
import type {
  PlatformToolKit,
  ToolkitMediaSource,
  ToolkitImageMetadata,
  ToolkitVideoMetadata,
  ToolkitAudioMetadata,
  ToolkitFrameCaptureOptions,
  ToolkitRecorderHandle,
  ToolkitRecordOptions,
  ToolkitScreenRecordOptions,
  ToolkitZipEntry,
  ToolkitFfmpegExecResult,
  ToolkitSqlExecuteResult,
  ToolkitDatabaseRow,
  ToolkitSqlTransaction,
  ToolkitLocalWorkspaceDirs
} from './types';
import {
  buildMagicStudioRootLayout,
  buildMagicStudioWorkspaceLayout,
  loadMagicStudioStorageConfigFromStorage,
} from '../../storage';

const DEFAULT_RECORD_MIME = 'video/webm;codecs=vp9,opus';
const DEFAULT_AUDIO_RECORD_MIME = 'audio/webm;codecs=opus';
const DB_KV_PREFIX = 'platform.toolkit.db.';
const DEFAULT_APP_NAME = 'magic-studio';

const isBrowserRuntimeAvailable = (): boolean =>
  typeof window !== 'undefined' &&
  typeof document !== 'undefined' &&
  typeof URL !== 'undefined';

const isLikelyUrl = (value: string): boolean =>
  /^(https?:|blob:|data:|file:|asset:|assets:\/\/)/i.test(value);

const ensureBridge = (runtime: PlatformRuntime, feature: string): void => {
  if (!runtime.bridge.available()) {
    throw new Error(`[PlatformToolKit] ${feature} requires desktop native bridge`);
  }
};

const ensurePath = (value: string, field: string): string => {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error(`[PlatformToolKit] ${field} is required`);
  }
  return normalized;
};

const normalizeSource = (
  runtime: PlatformRuntime,
  source: ToolkitMediaSource
): { url: string; cleanup: () => void } => {
  if (typeof source === 'string') {
    if (runtime.system.kind() === 'desktop' && !isLikelyUrl(source)) {
      return {
        url: runtime.fileSystem.convertFileSrc(source),
        cleanup: () => {}
      };
    }
    return { url: source, cleanup: () => {} };
  }

  const url = URL.createObjectURL(source);
  return {
    url,
    cleanup: () => URL.revokeObjectURL(url)
  };
};

const loadJsZip = async (): Promise<{
  new (): {
    file(name: string, data: Uint8Array | ArrayBuffer | Blob | string): void;
    generateAsync(options: { type: 'uint8array' }): Promise<Uint8Array>;
  };
}> => {
  const moduleName = 'jszip';
  const module = (await import(
    /* @vite-ignore */
    moduleName
  )) as unknown;
  const ctor =
    typeof module === 'object' &&
    module !== null &&
    'default' in module
      ? (module as { default: unknown }).default
      : undefined;
  if (typeof ctor !== 'function') {
    throw new Error('[PlatformToolKit] JSZip is unavailable in this runtime');
  }
  return ctor as {
    new (): {
      file(name: string, data: Uint8Array | ArrayBuffer | Blob | string): void;
      generateAsync(options: { type: 'uint8array' }): Promise<Uint8Array>;
    };
  };
};

const createRecorder = async (
  stream: MediaStream,
  options: ToolkitRecordOptions | undefined,
  fallbackMimeType: string,
  cleanupStreams: MediaStream[]
): Promise<ToolkitRecorderHandle> => {
  if (typeof MediaRecorder === 'undefined') {
    throw new Error('[PlatformToolKit] MediaRecorder is unavailable');
  }

  const mimeType = options?.mimeType || fallbackMimeType;
  const recorder = new MediaRecorder(stream, {
    mimeType,
    bitsPerSecond: options?.bitsPerSecond
  });
  const chunks: BlobPart[] = [];

  recorder.addEventListener('dataavailable', (event: BlobEvent) => {
    if (event.data && event.data.size > 0) {
      chunks.push(event.data);
    }
  });

  recorder.start();

  const stopStreams = (): void => {
    cleanupStreams.forEach((targetStream) => {
      targetStream.getTracks().forEach((track) => track.stop());
    });
  };

  return {
    stop: async (): Promise<Blob> =>
      new Promise((resolve, reject) => {
        recorder.addEventListener('error', () => {
          stopStreams();
          reject(new Error('[PlatformToolKit] MediaRecorder failed'));
        });
        recorder.addEventListener('stop', () => {
          stopStreams();
          const outputType = recorder.mimeType || mimeType || 'application/octet-stream';
          resolve(new Blob(chunks, { type: outputType }));
        });
        recorder.stop();
      }),
    pause: (): void => {
      if (recorder.state === 'recording') {
        recorder.pause();
      }
    },
    resume: (): void => {
      if (recorder.state === 'paused') {
        recorder.resume();
      }
    },
    getStream: (): MediaStream => stream
  };
};

const parseFfprobeAsVideoMetadata = (payload: Record<string, unknown>): ToolkitVideoMetadata => {
  const streams = Array.isArray(payload.streams) ? payload.streams : [];
  const format = payload.format && typeof payload.format === 'object'
    ? (payload.format as Record<string, unknown>)
    : {};
  const videoStream = streams.find(
    (stream) => stream && typeof stream === 'object' && (stream as Record<string, unknown>).codec_type === 'video'
  ) as Record<string, unknown> | undefined;

  const width = Number(videoStream?.width || 0);
  const height = Number(videoStream?.height || 0);
  const duration = Number(format.duration || videoStream?.duration || 0);
  const bitrate = Number(format.bit_rate || videoStream?.bit_rate || 0);
  const fpsValue = String(videoStream?.avg_frame_rate || '');
  let fps: number | undefined;
  if (fpsValue.includes('/')) {
    const [num, den] = fpsValue.split('/').map((item) => Number(item));
    if (Number.isFinite(num) && Number.isFinite(den) && den !== 0) {
      fps = num / den;
    }
  }

  return {
    width,
    height,
    duration,
    fps,
    bitrate: Number.isFinite(bitrate) ? bitrate : undefined,
    codec: typeof videoStream?.codec_name === 'string' ? videoStream.codec_name : undefined
  };
};

const parseFfprobeAsAudioMetadata = (payload: Record<string, unknown>): ToolkitAudioMetadata => {
  const streams = Array.isArray(payload.streams) ? payload.streams : [];
  const format = payload.format && typeof payload.format === 'object'
    ? (payload.format as Record<string, unknown>)
    : {};
  const audioStream = streams.find(
    (stream) => stream && typeof stream === 'object' && (stream as Record<string, unknown>).codec_type === 'audio'
  ) as Record<string, unknown> | undefined;

  const duration = Number(format.duration || audioStream?.duration || 0);
  const bitrate = Number(format.bit_rate || audioStream?.bit_rate || 0);
  const sampleRate = Number(audioStream?.sample_rate || 0);
  const channels = Number(audioStream?.channels || 0);

  return {
    duration,
    sampleRate: Number.isFinite(sampleRate) && sampleRate > 0 ? sampleRate : undefined,
    channels: Number.isFinite(channels) && channels > 0 ? channels : undefined,
    bitrate: Number.isFinite(bitrate) && bitrate > 0 ? bitrate : undefined,
    codec: typeof audioStream?.codec_name === 'string' ? audioStream.codec_name : undefined
  };
};

const pushOverwriteArg = (args: string[], overwrite: boolean | undefined): void => {
  args.push(overwrite === false ? '-n' : '-y');
};

const toEvenNumber = (value: number): number => {
  const rounded = Math.max(2, Math.round(value));
  return rounded % 2 === 0 ? rounded : rounded - 1;
};

const buildScaleFilter = (width?: number, height?: number): string | null => {
  const nextWidth = typeof width === 'number' && width > 0 ? toEvenNumber(width) : undefined;
  const nextHeight = typeof height === 'number' && height > 0 ? toEvenNumber(height) : undefined;
  if (!nextWidth && !nextHeight) {
    return null;
  }
  return `scale=${nextWidth || -2}:${nextHeight || -2}`;
};

const runFfmpegStrict = async (
  runtime: PlatformRuntime,
  args: string[],
  label: string
): Promise<ToolkitFfmpegExecResult> => {
  ensureBridge(runtime, `FFmpeg ${label}`);
  const result = await runtime.bridge.invoke<ToolkitFfmpegExecResult>('media_ffmpeg_exec', { args });
  if (result.code !== 0) {
    const detail = result.stderr || result.stdout || `exit code ${result.code}`;
    throw new Error(`[PlatformToolKit] ${label} failed: ${detail}`);
  }
  return result;
};

const joinPath = (basePath: string, ...segments: string[]): string => {
  const separator = basePath.includes('\\') ? '\\' : '/';
  const trimEdge = (value: string): string => value.replace(/^[\\/]+|[\\/]+$/g, '');
  let output = basePath.replace(/[\\/]+$/g, '');
  segments.forEach((segment) => {
    const value = trimEdge(segment);
    if (!value) {
      return;
    }
    output = `${output}${separator}${value}`;
  });
  return output;
};

const resolveSpeechRecognitionCtor = (): (new () => any) | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  const target = window as Window & {
    SpeechRecognition?: new () => any;
    webkitSpeechRecognition?: new () => any;
  };
  return target.SpeechRecognition || target.webkitSpeechRecognition || null;
};

const sanitizePathSegment = (name: string): string => {
  const sanitized = name.trim().replace(/[<>:"/\\|?*]/g, '-');
  return sanitized || DEFAULT_APP_NAME;
};

export const createPlatformToolKit = (runtime: PlatformRuntime): PlatformToolKit => {
  const ensureDom = (): void => {
    if (!isBrowserRuntimeAvailable()) {
      throw new Error('[PlatformToolKit] Browser runtime APIs are not available');
    }
  };

  const encodeImage = async (
    source: ToolkitMediaSource,
    options: { width?: number; height?: number; type?: ToolkitFrameCaptureOptions['type']; quality?: number }
  ): Promise<Blob> => {
    ensureDom();
    const imageLoaded = await new Promise<{ image: HTMLImageElement; cleanup: () => void }>((resolve, reject) => {
      const image = new Image();
      const normalized = normalizeSource(runtime, source);
      image.onload = () => resolve({ image, cleanup: normalized.cleanup });
      image.onerror = () => {
        normalized.cleanup();
        reject(new Error('[PlatformToolKit] Failed to load image source'));
      };
      image.src = normalized.url;
    });

    const naturalWidth = imageLoaded.image.naturalWidth || imageLoaded.image.width;
    const naturalHeight = imageLoaded.image.naturalHeight || imageLoaded.image.height;
    const width = options.width && options.width > 0 ? Math.round(options.width) : naturalWidth;
    const height = options.height && options.height > 0 ? Math.round(options.height) : naturalHeight;
    const type = options.type || 'image/png';
    const quality = options.quality ?? 0.92;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) {
      imageLoaded.cleanup();
      throw new Error('[PlatformToolKit] 2D context is unavailable');
    }
    context.drawImage(imageLoaded.image, 0, 0, width, height);
    imageLoaded.cleanup();

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('[PlatformToolKit] Failed to encode image blob'));
            return;
          }
          resolve(blob);
        },
        type,
        quality
      );
    });
  };

  const executeSql = async (dbPath: string, sql: string, params: unknown[] = []): Promise<ToolkitSqlExecuteResult> => {
    ensureBridge(runtime, 'SQLite execute');
    return runtime.bridge.invoke<ToolkitSqlExecuteResult>('db_execute', { dbPath, sql, params });
  };

  const querySql = async <T extends ToolkitDatabaseRow = ToolkitDatabaseRow>(
    dbPath: string,
    sql: string,
    params: unknown[] = []
  ): Promise<T[]> => {
    ensureBridge(runtime, 'SQLite query');
    return runtime.bridge.invoke<T[]>('db_query', { dbPath, sql, params });
  };

  const resolveWorkspaceDirs = async (appName?: string): Promise<ToolkitLocalWorkspaceDirs> => {
    const homePath = await runtime.system.path('home');
    const workspaceId = sanitizePathSegment(appName || DEFAULT_APP_NAME);
    const storageConfig = await loadMagicStudioStorageConfigFromStorage(
      (key) => runtime.storage.get(key),
      homePath
    );
    const rootLayout = buildMagicStudioRootLayout(storageConfig);
    const workspaceLayout = buildMagicStudioWorkspaceLayout({
      ...storageConfig,
      workspaceId,
    });
    const workspaceTempRoot = joinPath(
      rootLayout.systemTempRoot,
      'workspaces',
      workspaceId
    );

    return {
      root: rootLayout.rootDir,
      projects: workspaceLayout.projectsRoot,
      media: workspaceLayout.workspaceRoot,
      imports: joinPath(workspaceTempRoot, 'imports'),
      exports: storageConfig.exportsRootDir
        ? joinPath(storageConfig.exportsRootDir, workspaceId, 'toolkit', 'exports')
        : joinPath(workspaceTempRoot, 'exports'),
      cache: storageConfig.cacheRootDir
        ? joinPath(storageConfig.cacheRootDir, workspaceId, 'toolkit', 'cache')
        : joinPath(workspaceTempRoot, 'cache'),
      temp: joinPath(workspaceTempRoot, 'temp'),
      recordings: joinPath(workspaceTempRoot, 'recordings'),
      database: rootLayout.systemIndexesRoot,
      logs: rootLayout.systemLogsRoot
    };
  };

  return {
    runtime,
    image: {
      getMetadata: async (source: ToolkitMediaSource): Promise<ToolkitImageMetadata> => {
        ensureDom();
        return new Promise((resolve, reject) => {
          const image = new Image();
          const { url, cleanup } = normalizeSource(runtime, source);
          image.onload = () => {
            const width = image.naturalWidth || image.width;
            const height = image.naturalHeight || image.height;
            cleanup();
            resolve({
              width,
              height,
              ratio: height > 0 ? width / height : 0,
              mimeType: source instanceof Blob ? source.type : undefined
            });
          };
          image.onerror = () => {
            cleanup();
            reject(new Error('[PlatformToolKit] Failed to load image source'));
          };
          image.src = url;
        });
      },
      resize: async (
        source: ToolkitMediaSource,
        options: { width: number; height: number; type?: ToolkitFrameCaptureOptions['type']; quality?: number }
      ): Promise<Blob> => {
        return encodeImage(source, options);
      },
      optimize: async (
        source: ToolkitMediaSource,
        options?: { quality?: number; type?: ToolkitFrameCaptureOptions['type'] }
      ): Promise<Blob> => {
        return encodeImage(source, {
          quality: options?.quality ?? 0.82,
          type: options?.type
        });
      },
      convert: async (
        source: ToolkitMediaSource,
        options?: { width?: number; height?: number; type?: ToolkitFrameCaptureOptions['type']; quality?: number }
      ): Promise<Blob> => {
        return encodeImage(source, {
          width: options?.width,
          height: options?.height,
          type: options?.type,
          quality: options?.quality
        });
      }
    },
    video: {
      getMetadata: async (source: ToolkitMediaSource): Promise<ToolkitVideoMetadata> => {
        if (typeof source === 'string' && runtime.bridge.available()) {
          try {
            const payload = await runtime.bridge.invoke<Record<string, unknown>>('media_ffprobe_json', {
              input: source
            });
            if (payload && typeof payload === 'object' && 'streams' in payload) {
              return parseFfprobeAsVideoMetadata(payload);
            }
          } catch {
            // fall back to browser metadata.
          }
        }

        ensureDom();
        return new Promise((resolve, reject) => {
          const video = document.createElement('video');
          video.preload = 'metadata';
          const { url, cleanup } = normalizeSource(runtime, source);
          video.onloadedmetadata = () => {
            cleanup();
            resolve({
              width: video.videoWidth,
              height: video.videoHeight,
              duration: Number.isFinite(video.duration) ? video.duration : 0
            });
          };
          video.onerror = () => {
            cleanup();
            reject(new Error('[PlatformToolKit] Failed to load video metadata'));
          };
          video.src = url;
        });
      },
      captureFrame: async (
        source: ToolkitMediaSource,
        options?: ToolkitFrameCaptureOptions
      ): Promise<Blob> => {
        ensureDom();
        const captureType = options?.type || 'image/jpeg';
        const captureQuality = options?.quality ?? 0.9;
        const captureAt = options?.timeSeconds ?? 0;

        return new Promise((resolve, reject) => {
          const video = document.createElement('video');
          video.preload = 'auto';
          video.muted = true;
          const { url, cleanup } = normalizeSource(runtime, source);

          const finish = (blob: Blob | null): void => {
            cleanup();
            if (!blob) {
              reject(new Error('[PlatformToolKit] Failed to capture video frame'));
              return;
            }
            resolve(blob);
          };

          video.onloadeddata = () => {
            const targetWidth = options?.width || video.videoWidth;
            const targetHeight = options?.height || video.videoHeight;
            const canvas = document.createElement('canvas');
            canvas.width = targetWidth;
            canvas.height = targetHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              cleanup();
              reject(new Error('[PlatformToolKit] Failed to create frame canvas'));
              return;
            }
            ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
            canvas.toBlob((blob) => finish(blob), captureType, captureQuality);
          };

          video.onseeked = () => {
            if (video.readyState >= 2) {
              video.onloadeddata?.(new Event('loadeddata'));
            }
          };

          video.onloadedmetadata = () => {
            if (captureAt > 0 && Number.isFinite(video.duration)) {
              video.currentTime = Math.min(captureAt, Math.max(video.duration - 0.05, 0));
            }
          };

          video.onerror = () => {
            cleanup();
            reject(new Error('[PlatformToolKit] Failed to decode video source'));
          };

          video.src = url;
        });
      },
      transcode: async (inputPath: string, outputPath: string, options?: {
        videoCodec?: string;
        audioCodec?: string;
        fps?: number;
        width?: number;
        height?: number;
        videoBitrateKbps?: number;
        audioBitrateKbps?: number;
        overwrite?: boolean;
        extraArgs?: string[];
      }): Promise<ToolkitFfmpegExecResult> => {
        const input = ensurePath(inputPath, 'video input path');
        const output = ensurePath(outputPath, 'video output path');
        const args: string[] = [];
        pushOverwriteArg(args, options?.overwrite);
        args.push('-i', input);
        const scaleFilter = buildScaleFilter(options?.width, options?.height);
        if (scaleFilter) {
          args.push('-vf', scaleFilter);
        }
        if (typeof options?.fps === 'number' && options.fps > 0) {
          args.push('-r', String(Math.round(options.fps)));
        }
        if (options?.videoCodec) {
          args.push('-c:v', options.videoCodec);
        }
        if (options?.audioCodec) {
          args.push('-c:a', options.audioCodec);
        }
        if (typeof options?.videoBitrateKbps === 'number' && options.videoBitrateKbps > 0) {
          args.push('-b:v', `${Math.round(options.videoBitrateKbps)}k`);
        }
        if (typeof options?.audioBitrateKbps === 'number' && options.audioBitrateKbps > 0) {
          args.push('-b:a', `${Math.round(options.audioBitrateKbps)}k`);
        }
        if (options?.extraArgs?.length) {
          args.push(...options.extraArgs);
        }
        args.push(output);
        return runFfmpegStrict(runtime, args, 'video transcode');
      },
      trim: async (inputPath: string, outputPath: string, options: { startSeconds: number; durationSeconds?: number; overwrite?: boolean }): Promise<ToolkitFfmpegExecResult> => {
        const input = ensurePath(inputPath, 'video input path');
        const output = ensurePath(outputPath, 'video output path');
        const args: string[] = [];
        pushOverwriteArg(args, options.overwrite);
        args.push('-ss', String(Math.max(0, options.startSeconds || 0)), '-i', input);
        if (typeof options.durationSeconds === 'number' && options.durationSeconds > 0) {
          args.push('-t', String(options.durationSeconds));
        }
        args.push('-c', 'copy', output);
        return runFfmpegStrict(runtime, args, 'video trim');
      },
      concat: async (inputPaths: string[], outputPath: string, options?: { overwrite?: boolean }): Promise<ToolkitFfmpegExecResult> => {
        if (!inputPaths.length) {
          throw new Error('[PlatformToolKit] concat requires at least one input');
        }
        ensureBridge(runtime, 'FFmpeg concat');
        const output = ensurePath(outputPath, 'video output path');
        const tempDir = await runtime.system.path('temp');
        const listPath = joinPath(tempDir, `sdkwork_concat_${Date.now()}_${Math.random().toString(16).slice(2)}.txt`);
        const listContent = inputPaths.map((path) => `file '${ensurePath(path, 'video input path').replace(/'/g, "'\\''")}'`).join('\n');
        await runtime.fileSystem.writeText(listPath, listContent);
        try {
          const args: string[] = [];
          pushOverwriteArg(args, options?.overwrite);
          args.push('-f', 'concat', '-safe', '0', '-i', listPath, '-c', 'copy', output);
          return await runFfmpegStrict(runtime, args, 'video concat');
        } finally {
          try {
            await runtime.fileSystem.remove(listPath);
          } catch {
            // ignore cleanup error.
          }
        }
      },
      extractAudio: async (inputPath: string, outputPath: string, overwrite = true): Promise<ToolkitFfmpegExecResult> => {
        const input = ensurePath(inputPath, 'video input path');
        const output = ensurePath(outputPath, 'audio output path');
        const args: string[] = [];
        pushOverwriteArg(args, overwrite);
        args.push('-i', input, '-vn', '-c:a', 'aac', '-b:a', '192k', output);
        return runFfmpegStrict(runtime, args, 'extract audio');
      },
      createThumbnail: async (inputPath: string, outputPath: string, options?: ToolkitFrameCaptureOptions): Promise<ToolkitFfmpegExecResult> => {
        const input = ensurePath(inputPath, 'video input path');
        const output = ensurePath(outputPath, 'thumbnail output path');
        const args: string[] = ['-y', '-ss', String(Math.max(0, options?.timeSeconds || 0)), '-i', input, '-frames:v', '1'];
        const scaleFilter = buildScaleFilter(options?.width, options?.height);
        if (scaleFilter) {
          args.push('-vf', scaleFilter);
        }
        args.push(output);
        return runFfmpegStrict(runtime, args, 'thumbnail');
      }
    },
    audio: {
      getMetadata: async (source: ToolkitMediaSource): Promise<ToolkitAudioMetadata> => {
        if (typeof source === 'string' && runtime.bridge.available()) {
          try {
            const payload = await runtime.bridge.invoke<Record<string, unknown>>('media_ffprobe_json', {
              input: source
            });
            if (payload && typeof payload === 'object' && 'streams' in payload) {
              return parseFfprobeAsAudioMetadata(payload);
            }
          } catch {
            // fall back to browser metadata.
          }
        }
        ensureDom();
        return new Promise((resolve, reject) => {
          const audio = document.createElement('audio');
          audio.preload = 'metadata';
          const { url, cleanup } = normalizeSource(runtime, source);
          audio.onloadedmetadata = () => {
            cleanup();
            resolve({
              duration: Number.isFinite(audio.duration) ? audio.duration : 0
            });
          };
          audio.onerror = () => {
            cleanup();
            reject(new Error('[PlatformToolKit] Failed to load audio metadata'));
          };
          audio.src = url;
        });
      },
      convert: async (inputPath: string, outputPath: string, options?: { codec?: string; bitrateKbps?: number; sampleRate?: number; channels?: number; overwrite?: boolean }): Promise<ToolkitFfmpegExecResult> => {
        const input = ensurePath(inputPath, 'audio input path');
        const output = ensurePath(outputPath, 'audio output path');
        const args: string[] = [];
        pushOverwriteArg(args, options?.overwrite);
        args.push('-i', input);
        if (options?.codec) {
          args.push('-c:a', options.codec);
        }
        if (typeof options?.bitrateKbps === 'number' && options.bitrateKbps > 0) {
          args.push('-b:a', `${Math.round(options.bitrateKbps)}k`);
        }
        if (typeof options?.sampleRate === 'number' && options.sampleRate > 0) {
          args.push('-ar', String(Math.round(options.sampleRate)));
        }
        if (typeof options?.channels === 'number' && options.channels > 0) {
          args.push('-ac', String(Math.round(options.channels)));
        }
        args.push(output);
        return runFfmpegStrict(runtime, args, 'audio convert');
      },
      normalize: async (inputPath: string, outputPath: string, options?: { overwrite?: boolean }): Promise<ToolkitFfmpegExecResult> => {
        const input = ensurePath(inputPath, 'audio input path');
        const output = ensurePath(outputPath, 'audio output path');
        const args: string[] = [];
        pushOverwriteArg(args, options?.overwrite);
        args.push('-i', input, '-af', 'loudnorm', output);
        return runFfmpegStrict(runtime, args, 'audio normalize');
      },
      mix: async (inputs: Array<{ path: string; volume?: number }>, outputPath: string, options?: { overwrite?: boolean }): Promise<ToolkitFfmpegExecResult> => {
        if (!inputs.length) {
          throw new Error('[PlatformToolKit] audio mix requires at least one input');
        }
        const output = ensurePath(outputPath, 'audio output path');
        const normalizedInputs = inputs.map((item) => ({
          path: ensurePath(item.path, 'audio input path'),
          volume: typeof item.volume === 'number' && Number.isFinite(item.volume) ? item.volume : 1
        }));
        if (normalizedInputs.length === 1) {
          const args: string[] = [];
          pushOverwriteArg(args, options?.overwrite);
          args.push('-i', normalizedInputs[0].path, output);
          return runFfmpegStrict(runtime, args, 'audio single copy');
        }
        const args: string[] = [];
        pushOverwriteArg(args, options?.overwrite);
        normalizedInputs.forEach((item) => {
          args.push('-i', item.path);
        });
        const filterParts: string[] = [];
        const mixInputs: string[] = [];
        normalizedInputs.forEach((item, index) => {
          const inputTag = `${index}:a`;
          if (item.volume === 1) {
            mixInputs.push(`[${inputTag}]`);
            return;
          }
          const outputTag = `a${index}`;
          filterParts.push(`[${inputTag}]volume=${item.volume}[${outputTag}]`);
          mixInputs.push(`[${outputTag}]`);
        });
        filterParts.push(`${mixInputs.join('')}amix=inputs=${normalizedInputs.length}:duration=longest:normalize=0[outa]`);
        args.push('-filter_complex', filterParts.join(';'), '-map', '[outa]', output);
        return runFfmpegStrict(runtime, args, 'audio mix');
      }
    },
    compression: {
      zipEntries: async (entries: ToolkitZipEntry[]): Promise<Uint8Array> => {
        const JSZip = await loadJsZip();
        const zip = new JSZip();
        entries.forEach((entry) => {
          zip.file(entry.name, entry.data);
        });
        return zip.generateAsync({ type: 'uint8array' });
      },
      zipLocalPaths: async (sourcePaths: string[]): Promise<Uint8Array> => {
        ensureBridge(runtime, 'zipLocalPaths');
        const data = await runtime.bridge.invoke<number[]>('native_zip_bytes', { sourcePaths });
        return new Uint8Array(data);
      },
      unzipToDirectory: async (zipPath: string, targetDirectory: string): Promise<void> => {
        ensureBridge(runtime, 'unzipToDirectory');
        await runtime.bridge.invoke<void>('native_unzip', {
          zipPath,
          targetDir: targetDirectory
        });
      }
    },
    ffmpeg: {
      available: async (): Promise<boolean> => {
        if (runtime.bridge.available()) {
          try {
            return await runtime.bridge.invoke<boolean>('media_ffmpeg_available');
          } catch {
            // fallback below.
          }
        }
        return runtime.system.commandExists('ffmpeg');
      },
      exec: async (args: string[]): Promise<ToolkitFfmpegExecResult> => {
        ensureBridge(runtime, 'FFmpeg execution');
        return runtime.bridge.invoke<ToolkitFfmpegExecResult>('media_ffmpeg_exec', { args });
      },
      probe: async (pathOrUrl: string): Promise<Record<string, unknown>> => {
        ensureBridge(runtime, 'FFprobe');
        const payload = await runtime.bridge.invoke<Record<string, unknown> | string>('media_ffprobe_json', {
          input: pathOrUrl
        });
        if (typeof payload === 'string') {
          return JSON.parse(payload) as Record<string, unknown>;
        }
        return payload;
      }
    },
    recorder: {
      startAudioRecording: async (options?: ToolkitRecordOptions): Promise<ToolkitRecorderHandle> => {
        ensureDom();
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error('[PlatformToolKit] getUserMedia is unavailable');
        }
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        return createRecorder(stream, options, DEFAULT_AUDIO_RECORD_MIME, [stream]);
      },
      startScreenRecording: async (
        options?: ToolkitScreenRecordOptions
      ): Promise<ToolkitRecorderHandle> => {
        ensureDom();
        if (!navigator.mediaDevices?.getDisplayMedia) {
          throw new Error('[PlatformToolKit] getDisplayMedia is unavailable');
        }

        const displayStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: options?.withSystemAudio ?? true
        });
        let microphoneStream: MediaStream | null = null;
        if (options?.withMicrophone) {
          microphoneStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        }

        const tracks = [
          ...displayStream.getVideoTracks(),
          ...displayStream.getAudioTracks(),
          ...(microphoneStream?.getAudioTracks() || [])
        ];
        const mergedStream = new MediaStream(tracks);
        const cleanup = microphoneStream ? [mergedStream, displayStream, microphoneStream] : [mergedStream, displayStream];
        return createRecorder(mergedStream, options, DEFAULT_RECORD_MIME, cleanup);
      },
      startCameraRecording: async (options?: ToolkitRecordOptions): Promise<ToolkitRecorderHandle> => {
        ensureDom();
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error('[PlatformToolKit] getUserMedia is unavailable');
        }
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        return createRecorder(stream, options, DEFAULT_RECORD_MIME, [stream]);
      }
    },
    fileSystem: {
      ensureDir: async (path: string): Promise<void> => {
        await runtime.fileSystem.createDir(path);
      },
      readJson: async <T>(path: string): Promise<T> => runtime.fileSystem.readJson<T>(path),
      writeJson: async <T>(path: string, value: T, indent = 2): Promise<void> =>
        runtime.fileSystem.writeJson(path, value, indent),
      copy: async (source: string, destination: string): Promise<void> =>
        runtime.fileSystem.copy(source, destination),
      remove: async (path: string): Promise<void> => runtime.fileSystem.remove(path)
    },
    database: {
      sqliteAvailable: (): boolean => runtime.system.kind() === 'desktop' && runtime.bridge.available(),
      execute: async (
        dbPath: string,
        sql: string,
        params: unknown[] = []
      ): Promise<ToolkitSqlExecuteResult> => {
        return executeSql(dbPath, sql, params);
      },
      query: async <T extends ToolkitDatabaseRow = ToolkitDatabaseRow>(
        dbPath: string,
        sql: string,
        params: unknown[] = []
      ): Promise<T[]> => {
        return querySql<T>(dbPath, sql, params);
      },
      executeBatch: async (dbPath: string, sqlBatch: string): Promise<void> => {
        ensureBridge(runtime, 'SQLite batch execution');
        await runtime.bridge.invoke<void>('db_execute_batch', { dbPath, sqlBatch });
      },
      kvGet: async <T>(key: string, fallback: T): Promise<T> => {
        return runtime.storage.getJson<T>(`${DB_KV_PREFIX}${key}`, fallback);
      },
      kvSet: async <T>(key: string, value: T): Promise<void> => {
        await runtime.storage.setJson(`${DB_KV_PREFIX}${key}`, value);
      },
      kvDelete: async (key: string): Promise<void> => {
        await runtime.storage.remove(`${DB_KV_PREFIX}${key}`);
      },
      initSchema: async (dbPath: string, schemaSql: string): Promise<void> => {
        ensureBridge(runtime, 'SQLite init schema');
        await runtime.bridge.invoke<void>('db_execute_batch', {
          dbPath: ensurePath(dbPath, 'database path'),
          sqlBatch: ensurePath(schemaSql, 'schema sql')
        });
      },
      withTransaction: async <T>(
        dbPath: string,
        runner: (transaction: ToolkitSqlTransaction) => Promise<T>
      ): Promise<T> => {
        const targetDbPath = ensurePath(dbPath, 'database path');
        await executeSql(targetDbPath, 'BEGIN IMMEDIATE');
        const transaction: ToolkitSqlTransaction = {
          execute: async (sql: string, params: unknown[] = []): Promise<ToolkitSqlExecuteResult> =>
            executeSql(targetDbPath, sql, params),
          query: async <R extends ToolkitDatabaseRow = ToolkitDatabaseRow>(
            sql: string,
            params: unknown[] = []
          ): Promise<R[]> => querySql<R>(targetDbPath, sql, params)
        };
        try {
          const result = await runner(transaction);
          await executeSql(targetDbPath, 'COMMIT');
          return result;
        } catch (error) {
          try {
            await executeSql(targetDbPath, 'ROLLBACK');
          } catch {
            // ignore rollback failure.
          }
          throw error;
        }
      }
    },
    speech: {
      supported: (): boolean => {
        if (!isBrowserRuntimeAvailable()) {
          return false;
        }
        const hasSynthesis =
          typeof window.speechSynthesis !== 'undefined' &&
          typeof window.SpeechSynthesisUtterance !== 'undefined';
        return hasSynthesis || Boolean(resolveSpeechRecognitionCtor());
      },
      speak: async (
        text: string,
        options?: { lang?: string; rate?: number; pitch?: number; volume?: number; voiceName?: string }
      ): Promise<void> => {
        ensureDom();
        const message = text.trim();
        if (!message) {
          return;
        }
        if (typeof window.speechSynthesis === 'undefined' || typeof window.SpeechSynthesisUtterance === 'undefined') {
          throw new Error('[PlatformToolKit] Speech synthesis is unavailable');
        }
        await new Promise<void>((resolve, reject) => {
          const utterance = new window.SpeechSynthesisUtterance(message);
          if (options?.lang) {
            utterance.lang = options.lang;
          }
          if (typeof options?.rate === 'number') {
            utterance.rate = options.rate;
          }
          if (typeof options?.pitch === 'number') {
            utterance.pitch = options.pitch;
          }
          if (typeof options?.volume === 'number') {
            utterance.volume = options.volume;
          }
          if (options?.voiceName) {
            const voice = window.speechSynthesis
              .getVoices()
              .find((item) => item.name.toLowerCase() === options.voiceName?.toLowerCase());
            if (voice) {
              utterance.voice = voice;
            }
          }
          utterance.onend = () => resolve();
          utterance.onerror = () => reject(new Error('[PlatformToolKit] Speech synthesis failed'));
          window.speechSynthesis.speak(utterance);
        });
      },
      stop: (): void => {
        if (typeof window !== 'undefined' && window.speechSynthesis) {
          window.speechSynthesis.cancel();
        }
      },
      recognize: async (options?: {
        lang?: string;
        continuous?: boolean;
        interimResults?: boolean;
        maxAlternatives?: number;
        timeoutMs?: number;
      }): Promise<{ transcript: string; confidence?: number }> => {
        ensureDom();
        const RecognitionCtor = resolveSpeechRecognitionCtor();
        if (!RecognitionCtor) {
          throw new Error('[PlatformToolKit] Speech recognition is unavailable');
        }
        return new Promise((resolve, reject) => {
          const recognition = new RecognitionCtor() as any;
          recognition.lang = options?.lang || 'zh-CN';
          recognition.continuous = Boolean(options?.continuous);
          recognition.interimResults = Boolean(options?.interimResults);
          recognition.maxAlternatives = options?.maxAlternatives || 1;

          let timeoutId: ReturnType<typeof setTimeout> | null = null;
          let settled = false;
          const complete = (fn: () => void): void => {
            if (settled) {
              return;
            }
            settled = true;
            if (timeoutId) {
              clearTimeout(timeoutId);
              timeoutId = null;
            }
            recognition.onresult = null;
            recognition.onerror = null;
            recognition.onend = null;
            fn();
          };

          if (typeof options?.timeoutMs === 'number' && options.timeoutMs > 0) {
            timeoutId = setTimeout(() => {
              recognition.stop();
              complete(() => reject(new Error('[PlatformToolKit] Speech recognition timeout')));
            }, options.timeoutMs);
          }

          recognition.onresult = (event: any) => {
            let transcript = '';
            let confidence: number | undefined;
            for (let i = 0; i < event.results.length; i += 1) {
              const alternatives = event.results[i];
              if (!alternatives || !alternatives[0]) {
                continue;
              }
              const candidate = alternatives[0];
              transcript += candidate.transcript || '';
              if (typeof candidate.confidence === 'number' && Number.isFinite(candidate.confidence)) {
                confidence = candidate.confidence;
              }
            }
            const normalized = transcript.trim();
            if (!normalized) {
              return;
            }
            recognition.stop();
            complete(() => resolve({ transcript: normalized, confidence }));
          };

          recognition.onerror = (event: any) => {
            complete(() => reject(new Error(`[PlatformToolKit] Speech recognition failed: ${event?.error || 'unknown error'}`)));
          };

          recognition.onend = () => {
            complete(() => reject(new Error('[PlatformToolKit] Speech recognition ended without result')));
          };

          recognition.start();
        });
      }
    },
    workspace: {
      resolveLocalDirs: async (appName?: string): Promise<ToolkitLocalWorkspaceDirs> => {
        return resolveWorkspaceDirs(appName);
      },
      ensureLocalDirs: async (appName?: string): Promise<ToolkitLocalWorkspaceDirs> => {
        const dirs = await resolveWorkspaceDirs(appName);
        await Promise.all([
          dirs.root,
          dirs.projects,
          dirs.media,
          dirs.imports,
          dirs.exports,
          dirs.cache,
          dirs.temp,
          dirs.recordings,
          dirs.database,
          dirs.logs
        ].map((path) => runtime.fileSystem.createDir(path)));
        return dirs;
      }
    }
  };
};
