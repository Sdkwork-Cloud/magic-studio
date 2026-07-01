import type { PlatformRuntime } from '../runtime';
import type {
  PlatformToolKit,
  ToolkitAudioConvertOptions,
  ToolkitAudioMixInput,
  ToolkitAudioMixOptions,
  ToolkitAudioNormalizeOptions,
  ToolkitMediaSource,
  ToolkitImageMetadata,
  ToolkitVideoMetadata,
  ToolkitAudioMetadata,
  ToolkitFrameCaptureOptions,
  ToolkitRecorderHandle,
  ToolkitRecordOptions,
  ToolkitScreenRecordOptions,
  ToolkitZipEntry,
  ToolkitMediaProbeResult,
  ToolkitMediaCommandResult,
  ToolkitSqlExecuteResult,
  ToolkitDatabaseRow,
  ToolkitSqlTransaction,
  ToolkitLocalWorkspaceDirs,
  ToolkitVideoConcatOptions,
  ToolkitVideoTranscodeOptions,
  ToolkitVideoTrimOptions
} from './types';
import {
  buildMagicStudioRootLayout,
  buildMagicStudioWorkspaceLayout,
} from '../../storage/magicStudioPaths.ts';
import { loadMagicStudioStorageConfigFromStorage } from '../../storage/magicStudioSettings.ts';
import {
  isRenderableAssetUrl,
  resolveRuntimeMagicStudioAssetUrl,
} from '../../storage/runtimeMagicStudioAssets.ts';
import {
  createRuntimeMagicStudioServerClient,
  isMagicStudioServerRuntimeSupported,
} from './magicStudioServerRuntime.ts';

const DEFAULT_RECORD_MIME = 'video/webm;codecs=vp9,opus';
const DEFAULT_AUDIO_RECORD_MIME = 'audio/webm;codecs=opus';
const DB_KV_PREFIX = 'platform.toolkit.db.';
const DEFAULT_APP_NAME = 'magic-studio';

const isBrowserRuntimeAvailable = (): boolean =>
  typeof window !== 'undefined' &&
  typeof document !== 'undefined' &&
  typeof URL !== 'undefined';

const ensurePath = (value: string, field: string): string => {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error(`[PlatformToolKit] ${field} is required`);
  }
  return normalized;
};

const normalizeSource = async (
  runtime: PlatformRuntime,
  source: ToolkitMediaSource
): Promise<{ url: string; cleanup: () => void }> => {
  if (typeof source === 'string') {
    if (!isRenderableAssetUrl(source)) {
      return {
        url: await resolveRuntimeMagicStudioAssetUrl(runtime, source),
        cleanup: () => {},
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

const parseMediaProbeAsVideoMetadata = (payload: ToolkitMediaProbeResult): ToolkitVideoMetadata => {
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

const parseMediaProbeAsAudioMetadata = (payload: ToolkitMediaProbeResult): ToolkitAudioMetadata => {
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

const ensureMediaCommandSucceeded = (
  result: ToolkitMediaCommandResult,
  label: string,
): ToolkitMediaCommandResult => {
  if (result.code !== 0) {
    const detail = result.stderr || result.stdout || `exit code ${result.code}`;
    throw new Error(`[PlatformToolKit] ${label} failed: ${detail}`);
  }
  return result;
};

const readServerMediaCommandResult = async (
  request: Promise<{ data: ToolkitMediaCommandResult }>,
  label: string,
): Promise<ToolkitMediaCommandResult> => ensureMediaCommandSucceeded((await request).data, label);

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
  const serverSupported = isMagicStudioServerRuntimeSupported(runtime);
  const serverClient = createRuntimeMagicStudioServerClient(runtime);
  const ensureServerSupport = (feature: string): void => {
    if (!serverSupported) {
      throw new Error(
        `[PlatformToolKit] ${feature} requires the canonical Magic Studio Rust server runtime`,
      );
    }
  };

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
    const normalized = await normalizeSource(runtime, source);
    const imageLoaded = await new Promise<{ image: HTMLImageElement; cleanup: () => void }>((resolve, reject) => {
      const image = new Image();
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
    ensureServerSupport('sqlite execute');
    return (await serverClient.executeSql({ dbPath, sql, params })).data;
  };

  const querySql = async <T extends ToolkitDatabaseRow = ToolkitDatabaseRow>(
    dbPath: string,
    sql: string,
    params: unknown[] = []
  ): Promise<T[]> => {
    ensureServerSupport('sqlite query');
    return (await serverClient.querySql<T>({ dbPath, sql, params })).items;
  };

  const executeSqlBatch = async (dbPath: string, sqlBatch: string): Promise<void> => {
    ensureServerSupport('sqlite batch execution');
    await serverClient.executeSqlBatch({ dbPath, sqlBatch });
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
        const normalized = await normalizeSource(runtime, source);
        return new Promise((resolve, reject) => {
          const image = new Image();
          const { url, cleanup } = normalized;
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
        if (typeof source === 'string') {
          try {
            const payload = (await serverClient.mediaProbe({ input: source })).data;
            if (payload && typeof payload === 'object' && 'streams' in payload) {
              return parseMediaProbeAsVideoMetadata(payload);
            }
          } catch {
            // fall back to browser metadata.
          }
        }

        ensureDom();
        const normalized = await normalizeSource(runtime, source);
        return new Promise((resolve, reject) => {
          const video = document.createElement('video');
          video.preload = 'metadata';
          const { url, cleanup } = normalized;
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
        const normalized = await normalizeSource(runtime, source);

        return new Promise((resolve, reject) => {
          const video = document.createElement('video');
          video.preload = 'auto';
          video.muted = true;
          const { url, cleanup } = normalized;

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
      transcode: async (inputPath: string, outputPath: string, options?: ToolkitVideoTranscodeOptions): Promise<ToolkitMediaCommandResult> => {
        const input = ensurePath(inputPath, 'video input path');
        const output = ensurePath(outputPath, 'video output path');
        ensureServerSupport('video transcode');
        return readServerMediaCommandResult(
          serverClient.mediaVideoTranscode({
            inputPath: input,
            outputPath: output,
            videoCodec: options?.videoCodec,
            audioCodec: options?.audioCodec,
            fps: options?.fps,
            width: options?.width,
            height: options?.height,
            videoBitrateKbps: options?.videoBitrateKbps,
            audioBitrateKbps: options?.audioBitrateKbps,
            overwrite: options?.overwrite !== false,
          }),
          'video transcode',
        );
      },
      trim: async (inputPath: string, outputPath: string, options: ToolkitVideoTrimOptions): Promise<ToolkitMediaCommandResult> => {
        const input = ensurePath(inputPath, 'video input path');
        const output = ensurePath(outputPath, 'video output path');
        ensureServerSupport('video trim');
        return readServerMediaCommandResult(
          serverClient.mediaVideoTrim({
            inputPath: input,
            outputPath: output,
            startSeconds: options.startSeconds,
            durationSeconds: options.durationSeconds,
            overwrite: options.overwrite !== false,
          }),
          'video trim',
        );
      },
      concat: async (inputPaths: string[], outputPath: string, options?: ToolkitVideoConcatOptions): Promise<ToolkitMediaCommandResult> => {
        if (!inputPaths.length) {
          throw new Error('[PlatformToolKit] concat requires at least one input');
        }
        const normalizedInputPaths = inputPaths.map((path) => ensurePath(path, 'video input path'));
        const output = ensurePath(outputPath, 'video output path');
        ensureServerSupport('video concat');
        return readServerMediaCommandResult(
          serverClient.mediaVideoConcat({
            inputPaths: normalizedInputPaths,
            outputPath: output,
            overwrite: options?.overwrite !== false,
          }),
          'video concat',
        );
      },
      extractAudio: async (inputPath: string, outputPath: string, overwrite = true): Promise<ToolkitMediaCommandResult> => {
        const input = ensurePath(inputPath, 'video input path');
        const output = ensurePath(outputPath, 'audio output path');
        ensureServerSupport('extract audio');
        return readServerMediaCommandResult(
          serverClient.mediaVideoExtractAudio({
            inputPath: input,
            outputPath: output,
            overwrite,
          }),
          'extract audio',
        );
      },
      createThumbnail: async (inputPath: string, outputPath: string, options?: ToolkitFrameCaptureOptions): Promise<ToolkitMediaCommandResult> => {
        const input = ensurePath(inputPath, 'video input path');
        const output = ensurePath(outputPath, 'thumbnail output path');
        ensureServerSupport('thumbnail');
        return readServerMediaCommandResult(
          serverClient.mediaVideoCreateThumbnail({
            inputPath: input,
            outputPath: output,
            timeSeconds: options?.timeSeconds,
            width: options?.width,
            height: options?.height,
          }),
          'thumbnail',
        );
      }
    },
    audio: {
      getMetadata: async (source: ToolkitMediaSource): Promise<ToolkitAudioMetadata> => {
        if (typeof source === 'string') {
          try {
            const payload = (await serverClient.mediaProbe({ input: source })).data;
            if (payload && typeof payload === 'object' && 'streams' in payload) {
              return parseMediaProbeAsAudioMetadata(payload);
            }
          } catch {
            // fall back to browser metadata.
          }
        }
        ensureDom();
        const normalized = await normalizeSource(runtime, source);
        return new Promise((resolve, reject) => {
          const audio = document.createElement('audio');
          audio.preload = 'metadata';
          const { url, cleanup } = normalized;
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
      convert: async (inputPath: string, outputPath: string, options?: ToolkitAudioConvertOptions): Promise<ToolkitMediaCommandResult> => {
        const input = ensurePath(inputPath, 'audio input path');
        const output = ensurePath(outputPath, 'audio output path');
        ensureServerSupport('audio convert');
        return readServerMediaCommandResult(
          serverClient.mediaAudioConvert({
            inputPath: input,
            outputPath: output,
            codec: options?.codec,
            bitrateKbps: options?.bitrateKbps,
            sampleRate: options?.sampleRate,
            channels: options?.channels,
            overwrite: options?.overwrite !== false,
          }),
          'audio convert',
        );
      },
      normalize: async (inputPath: string, outputPath: string, options?: ToolkitAudioNormalizeOptions): Promise<ToolkitMediaCommandResult> => {
        const input = ensurePath(inputPath, 'audio input path');
        const output = ensurePath(outputPath, 'audio output path');
        ensureServerSupport('audio normalize');
        return readServerMediaCommandResult(
          serverClient.mediaAudioNormalize({
            inputPath: input,
            outputPath: output,
            overwrite: options?.overwrite !== false,
          }),
          'audio normalize',
        );
      },
      mix: async (inputs: ToolkitAudioMixInput[], outputPath: string, options?: ToolkitAudioMixOptions): Promise<ToolkitMediaCommandResult> => {
        if (!inputs.length) {
          throw new Error('[PlatformToolKit] audio mix requires at least one input');
        }
        const output = ensurePath(outputPath, 'audio output path');
        const normalizedInputs = inputs.map((item) => ({
          path: ensurePath(item.path, 'audio input path'),
          volume: typeof item.volume === 'number' && Number.isFinite(item.volume) ? item.volume : 1
        }));
        ensureServerSupport('audio mix');
        return readServerMediaCommandResult(
          serverClient.mediaAudioMix({
            inputs: normalizedInputs,
            outputPath: output,
            overwrite: options?.overwrite !== false,
          }),
          'audio mix',
        );
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
        ensureServerSupport('zip local paths');
        const result = await serverClient.zipLocalPaths({ sourcePaths });
        return new Uint8Array(result.data.bytes);
      },
      unzipToDirectory: async (zipPath: string, targetDirectory: string): Promise<void> => {
        ensureServerSupport('unzip to directory');
        await serverClient.unzipToDirectory({
          zipPath,
          targetDir: targetDirectory,
        });
      }
    },
    media: {
      available: async (): Promise<boolean> => {
        if (!serverSupported) {
          return false;
        }
        return (await serverClient.readToolkitCapabilities()).data.mediaProbeAvailable;
      },
      probe: async (pathOrUrl: string): Promise<ToolkitMediaProbeResult> => {
        ensureServerSupport('media probe');
        return (await serverClient.mediaProbe({ input: pathOrUrl })).data;
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
      sqliteAvailable: (): boolean => serverSupported,
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
        await executeSqlBatch(dbPath, sqlBatch);
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
        await executeSqlBatch(ensurePath(dbPath, 'database path'), ensurePath(schemaSql, 'schema sql'));
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
