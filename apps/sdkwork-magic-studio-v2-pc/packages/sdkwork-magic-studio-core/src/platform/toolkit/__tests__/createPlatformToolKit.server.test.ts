import fs from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'vitest';

import type { PlatformRuntime } from '../../runtime/types.ts';
import { createPlatformToolKit } from '../createPlatformToolKit.ts';
import {
  createJsonResponse,
  installMockWindowLocation,
} from './magicStudioServerTestSupport.ts';

type RuntimeKind = 'desktop' | 'server' | 'unsupported';
type BridgeInvoke = (command: string, payload?: Record<string, unknown>) => Promise<unknown>;

function createToolKitRuntime(
  kind: RuntimeKind,
  requestImpl: (url: string, init?: RequestInit) => Promise<Response>,
  options?: {
    bridgeAvailable?: boolean;
    bridgeInvoke?: BridgeInvoke;
  },
): PlatformRuntime {
  const bridgeAvailable = options?.bridgeAvailable ?? false;
  const bridgeInvoke = options?.bridgeInvoke;

  return {
    raw: {} as never,
    bridge: {
      available: () => bridgeAvailable,
      invoke: async (command: string, payload?: Record<string, unknown>) => {
        if (bridgeInvoke) {
          return bridgeInvoke(command, payload);
        }
        throw new Error('native bridge unavailable');
      },
      listen: async () => () => {},
    },
    system: {
      kind: () =>
        (kind === 'unsupported'
          ? 'unsupported'
          : kind) as unknown as PlatformRuntime['system']['kind'] extends () => infer T
          ? T
          : never,
      path: async (name: string) => `/tmp/${name}`,
      commandExists: async () => false,
    },
    storage: {
      get: async () => null,
      set: async () => {},
      remove: async () => {},
      clear: async () => {},
      getJson: async <T>(_key: string, fallbackValue: T) => fallbackValue,
      setJson: async () => {},
    },
    fileSystem: {
      convertFileSrc: (filePath: string) => filePath,
      writeText: async () => {},
      remove: async () => {},
      createDir: async () => {},
      readJson: async () => ({}),
      writeJson: async () => {},
      copy: async () => {},
    },
    network: {
      request: requestImpl,
    },
  } as unknown as PlatformRuntime;
}

test('rejects server-owned toolkit operations when the canonical rust server runtime is unavailable', async () => {
  const calls: Array<{ command: string; payload?: Record<string, unknown> }> = [];
  const runtime = createToolKitRuntime(
    'unsupported',
    async (url) => {
      throw new Error(`Unexpected url ${url}`);
    },
    {
      bridgeAvailable: true,
      bridgeInvoke: async (command, payload) => {
        calls.push({ command, payload });

        switch (command) {
          case 'media_probe_available':
            return true;
          case 'media_probe':
            return {
              format: { duration: '12.5', bit_rate: '456000' },
              streams: [
                {
                  codec_type: 'video',
                  width: 1280,
                  height: 720,
                  avg_frame_rate: '30/1',
                  codec_name: 'h264',
                },
              ],
            };
          case 'media_command_execute':
            return {
              code: 0,
              stdout: '',
              stderr: '',
            };
          case 'compression_zip_bytes':
            return [80, 75, 3, 4];
          case 'compression_unzip':
            return undefined;
          case 'database_execute':
            return {
              affectedRows: 1,
              lastInsertRowid: 9,
            };
          case 'database_query':
            return [{ value: 1 }];
          case 'database_execute_batch':
            return undefined;
          default:
            throw new Error(`Unexpected command ${command}`);
        }
      },
    },
  );

  const toolkit = createPlatformToolKit(runtime);

  assert.equal(await toolkit.media.available(), false);

  await assert.rejects(
    () => toolkit.media.probe('/workspace/video.mp4'),
    (error: unknown) =>
      error instanceof Error
      && error.message
        === '[PlatformToolKit] media probe requires the canonical Magic Studio Rust server runtime',
  );

  await assert.rejects(
    () =>
      toolkit.video.transcode('/workspace/input.mp4', '/workspace/output.mp4', {
        overwrite: true,
      }),
    (error: unknown) =>
      error instanceof Error
      && error.message
        === '[PlatformToolKit] video transcode requires the canonical Magic Studio Rust server runtime',
  );

  assert.deepEqual(calls, []);
});

test('uses canonical rust server typed media routes instead of the native bridge', async () => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const runtime = createToolKitRuntime('desktop', async (url, init) => {
    calls.push({ url, init });

    if (url.endsWith('/toolkit/capabilities')) {
      return createJsonResponse({
        requestId: 'req-capabilities',
        timestamp: '2026-04-18T00:00:00Z',
        data: {
          mediaProbeAvailable: true,
          imageProcessing: true,
          videoProcessing: true,
          audioProcessing: true,
          compression: true,
          fileSystem: true,
          audioRecording: true,
          screenRecording: true,
          sqliteEmbedded: true,
          runtimeOs: 'windows',
          runtimeArch: 'x86_64',
        },
        meta: { version: 'v1' },
      });
    }

    if (url.endsWith('/media/probe')) {
      return createJsonResponse({
        requestId: 'req-probe',
        timestamp: '2026-04-18T00:00:00Z',
        data: {
          format: { duration: '12.5', bit_rate: '456000' },
          streams: [
            {
              codec_type: 'video',
              width: 1280,
              height: 720,
              avg_frame_rate: '30/1',
              codec_name: 'h264',
            },
          ],
        },
        meta: { version: 'v1' },
      });
    }

    if (
      url.endsWith('/media/video/transcode')
      || url.endsWith('/media/video/trim')
      || url.endsWith('/media/video/extract-audio')
      || url.endsWith('/media/video/thumbnail')
      || url.endsWith('/media/audio/convert')
      || url.endsWith('/media/audio/normalize')
      || url.endsWith('/media/audio/mix')
    ) {
      return createJsonResponse({
        requestId: 'req-media',
        timestamp: '2026-04-18T00:00:00Z',
        data: {
          code: 0,
          stdout: '',
          stderr: '',
        },
        meta: { version: 'v1' },
      });
    }

    throw new Error(`Unexpected url ${url}`);
  });

  const toolkit = createPlatformToolKit(runtime);
  const toolkitTypesSource = fs.readFileSync(new URL('../types.ts', import.meta.url), 'utf8');
  const toolkitSource = fs.readFileSync(new URL('../createPlatformToolKit.ts', import.meta.url), 'utf8');

  assert.match(toolkitTypesSource, /ToolkitMediaCommandResult/);
  assert.doesNotMatch(toolkitTypesSource, /ToolkitFfmpegExecResult/);
  assert.match(toolkitSource, /parseMediaProbeAsVideoMetadata/);
  assert.match(toolkitSource, /parseMediaProbeAsAudioMetadata/);
  assert.doesNotMatch(toolkitSource, /parseFfprobeAsVideoMetadata/);
  assert.doesNotMatch(toolkitSource, /parseFfprobeAsAudioMetadata/);

  assert.equal('ffmpeg' in toolkit, false);
  assert.equal('media' in toolkit, true);
  assert.equal(await toolkit.media.available(), true);
  assert.equal('exec' in toolkit.media, false);
  assert.deepEqual(await toolkit.media.probe('/workspace/video.mp4'), {
    format: { duration: '12.5', bit_rate: '456000' },
    streams: [
      {
        codec_type: 'video',
        width: 1280,
        height: 720,
        avg_frame_rate: '30/1',
        codec_name: 'h264',
      },
    ],
  });
  await toolkit.video.transcode('/workspace/input.mp4', '/workspace/output.mp4', {
    width: 1920,
    height: 1080,
    fps: 30,
    videoCodec: 'libx264',
    audioCodec: 'aac',
    videoBitrateKbps: 2400,
    audioBitrateKbps: 192,
  });
  await toolkit.video.trim('/workspace/input.mp4', '/workspace/trimmed.mp4', {
    startSeconds: 4,
    durationSeconds: 8,
    overwrite: false,
  });
  await toolkit.video.extractAudio('/workspace/input.mp4', '/workspace/output.m4a', false);
  await toolkit.video.createThumbnail('/workspace/input.mp4', '/workspace/thumbnail.jpg', {
    timeSeconds: 5,
    width: 640,
    height: 360,
  });
  await toolkit.audio.convert('/workspace/input.wav', '/workspace/output.mp3', {
    codec: 'mp3',
    bitrateKbps: 192,
    sampleRate: 48000,
    channels: 2,
    overwrite: false,
  });
  await toolkit.audio.normalize('/workspace/input.wav', '/workspace/normalized.wav', {
    overwrite: false,
  });
  await toolkit.audio.mix(
    [
      { path: '/workspace/voice.wav', volume: 1 },
      { path: '/workspace/music.wav', volume: 0.4 },
    ],
    '/workspace/mix.wav',
    { overwrite: false },
  );

  assert.equal(calls.some((call) => call.url.endsWith('/media/ffmpeg/exec')), false);
  assert.deepEqual(
    calls.map((call) => ({
      url: call.url,
      method: call.init?.method,
      body: call.init?.body ? JSON.parse(String(call.init.body)) : null,
    })),
    [
      {
        url: 'http://127.0.0.1:4318/api/core/v1/toolkit/capabilities',
        method: 'GET',
        body: null,
      },
      {
        url: 'http://127.0.0.1:4318/api/core/v1/media/probe',
        method: 'POST',
        body: { input: '/workspace/video.mp4' },
      },
      {
        url: 'http://127.0.0.1:4318/api/core/v1/media/video/transcode',
        method: 'POST',
        body: {
          inputPath: '/workspace/input.mp4',
          outputPath: '/workspace/output.mp4',
          width: 1920,
          height: 1080,
          fps: 30,
          videoCodec: 'libx264',
          audioCodec: 'aac',
          videoBitrateKbps: 2400,
          audioBitrateKbps: 192,
          overwrite: true,
        },
      },
      {
        url: 'http://127.0.0.1:4318/api/core/v1/media/video/trim',
        method: 'POST',
        body: {
          inputPath: '/workspace/input.mp4',
          outputPath: '/workspace/trimmed.mp4',
          startSeconds: 4,
          durationSeconds: 8,
          overwrite: false,
        },
      },
      {
        url: 'http://127.0.0.1:4318/api/core/v1/media/video/extract-audio',
        method: 'POST',
        body: {
          inputPath: '/workspace/input.mp4',
          outputPath: '/workspace/output.m4a',
          overwrite: false,
        },
      },
      {
        url: 'http://127.0.0.1:4318/api/core/v1/media/video/thumbnail',
        method: 'POST',
        body: {
          inputPath: '/workspace/input.mp4',
          outputPath: '/workspace/thumbnail.jpg',
          timeSeconds: 5,
          width: 640,
          height: 360,
        },
      },
      {
        url: 'http://127.0.0.1:4318/api/core/v1/media/audio/convert',
        method: 'POST',
        body: {
          inputPath: '/workspace/input.wav',
          outputPath: '/workspace/output.mp3',
          codec: 'mp3',
          bitrateKbps: 192,
          sampleRate: 48000,
          channels: 2,
          overwrite: false,
        },
      },
      {
        url: 'http://127.0.0.1:4318/api/core/v1/media/audio/normalize',
        method: 'POST',
        body: {
          inputPath: '/workspace/input.wav',
          outputPath: '/workspace/normalized.wav',
          overwrite: false,
        },
      },
      {
        url: 'http://127.0.0.1:4318/api/core/v1/media/audio/mix',
        method: 'POST',
        body: {
          inputs: [
            { path: '/workspace/voice.wav', volume: 1 },
            { path: '/workspace/music.wav', volume: 0.4 },
          ],
          outputPath: '/workspace/mix.wav',
          overwrite: false,
        },
      },
    ],
  );
});

test('uses the canonical rust server concat route without local temp manifest staging', async () => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  let tempPathReads = 0;
  let tempManifestWrites = 0;
  let tempManifestRemovals = 0;

  const baseRuntime = createToolKitRuntime('desktop', async (url, init) => {
    calls.push({ url, init });

    if (url.endsWith('/media/video/concat')) {
      return createJsonResponse({
        requestId: 'req-concat',
        timestamp: '2026-04-18T00:00:00Z',
        data: {
          code: 0,
          stdout: '',
          stderr: '',
        },
        meta: { version: 'v1' },
      });
    }

    throw new Error(`Unexpected url ${url}`);
  });

  const runtime = {
    ...baseRuntime,
    system: {
      ...baseRuntime.system,
      path: async (name: string) => {
        tempPathReads += 1;
        return `/tmp/${name}`;
      },
    },
    fileSystem: {
      ...baseRuntime.fileSystem,
      writeText: async () => {
        tempManifestWrites += 1;
      },
      remove: async () => {
        tempManifestRemovals += 1;
      },
    },
  } as PlatformRuntime;

  const toolkit = createPlatformToolKit(runtime);
  await toolkit.video.concat(
    ['/workspace/input-a.mp4', '/workspace/input-b.mp4'],
    '/workspace/output.mp4',
  );

  assert.equal(tempPathReads, 0);
  assert.equal(tempManifestWrites, 0);
  assert.equal(tempManifestRemovals, 0);
  assert.equal(calls.some((call) => call.url.endsWith('/media/ffmpeg/concat')), false);
  assert.deepEqual(
    calls.map((call) => ({
      url: call.url,
      method: call.init?.method,
      body: call.init?.body ? JSON.parse(String(call.init.body)) : null,
    })),
    [
      {
        url: 'http://127.0.0.1:4318/api/core/v1/media/video/concat',
        method: 'POST',
        body: {
          inputPaths: ['/workspace/input-a.mp4', '/workspace/input-b.mp4'],
          outputPath: '/workspace/output.mp4',
          overwrite: true,
        },
      },
    ],
  );
});

test('uses same-origin rust server compression and sqlite routes for standalone runtime', async () => {
  const restoreWindow = installMockWindowLocation('https://studio.example.com');

  try {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const runtime = createToolKitRuntime('server', async (url, init) => {
      calls.push({ url, init });

      if (url.endsWith('/compression/zip')) {
        return createJsonResponse({
          requestId: 'req-zip',
          timestamp: '2026-04-18T00:00:00Z',
          data: {
            bytes: [80, 75, 3, 4],
          },
          meta: { version: 'v1' },
        });
      }

      if (url.endsWith('/compression/unzip')) {
        return createJsonResponse({
          requestId: 'req-unzip',
          timestamp: '2026-04-18T00:00:00Z',
          data: { ok: true },
          meta: { version: 'v1' },
        });
      }

      if (url.endsWith('/database/sqlite/execute')) {
        return createJsonResponse({
          requestId: 'req-execute',
          timestamp: '2026-04-18T00:00:00Z',
          data: {
            affectedRows: 1,
            lastInsertRowid: 7,
          },
          meta: { version: 'v1' },
        });
      }

      if (url.endsWith('/database/sqlite/query')) {
        return createJsonResponse({
          requestId: 'req-query',
          timestamp: '2026-04-18T00:00:00Z',
          items: [{ value: 1 }],
          meta: {
            page: 1,
            pageSize: 1,
            total: 1,
            version: 'v1',
          },
        });
      }

      if (url.endsWith('/database/sqlite/execute-batch')) {
        return createJsonResponse({
          requestId: 'req-batch',
          timestamp: '2026-04-18T00:00:00Z',
          data: { ok: true },
          meta: { version: 'v1' },
        });
      }

      throw new Error(`Unexpected url ${url}`);
    });

    const toolkit = createPlatformToolKit(runtime);

    assert.deepEqual(
      Array.from(await toolkit.compression.zipLocalPaths(['/workspace/assets'])),
      [80, 75, 3, 4],
    );
    await toolkit.compression.unzipToDirectory('/workspace/archive.zip', '/workspace/output');
    assert.deepEqual(
      await toolkit.database.execute(
        '/workspace/app.db',
        'INSERT INTO demo(name) VALUES (?)',
        ['alpha'],
      ),
      {
        affectedRows: 1,
        lastInsertRowid: 7,
      },
    );
    assert.deepEqual(
      await toolkit.database.query('/workspace/app.db', 'SELECT 1 AS value'),
      [{ value: 1 }],
    );
    assert.equal(toolkit.database.sqliteAvailable(), true);
    await toolkit.database.executeBatch('/workspace/app.db', 'BEGIN; COMMIT;');
    await toolkit.database.initSchema(
      '/workspace/app.db',
      'CREATE TABLE demo(id INTEGER PRIMARY KEY);',
    );

    assert.deepEqual(
      calls.map((call) => ({
        url: call.url,
        method: call.init?.method,
        body: call.init?.body ? JSON.parse(String(call.init.body)) : null,
      })),
      [
        {
          url: 'https://studio.example.com/api/core/v1/compression/zip',
          method: 'POST',
          body: { sourcePaths: ['/workspace/assets'] },
        },
        {
          url: 'https://studio.example.com/api/core/v1/compression/unzip',
          method: 'POST',
          body: {
            zipPath: '/workspace/archive.zip',
            targetDir: '/workspace/output',
          },
        },
        {
          url: 'https://studio.example.com/api/core/v1/database/sqlite/execute',
          method: 'POST',
          body: {
            dbPath: '/workspace/app.db',
            sql: 'INSERT INTO demo(name) VALUES (?)',
            params: ['alpha'],
          },
        },
        {
          url: 'https://studio.example.com/api/core/v1/database/sqlite/query',
          method: 'POST',
          body: {
            dbPath: '/workspace/app.db',
            sql: 'SELECT 1 AS value',
            params: [],
          },
        },
        {
          url: 'https://studio.example.com/api/core/v1/database/sqlite/execute-batch',
          method: 'POST',
          body: {
            dbPath: '/workspace/app.db',
            sqlBatch: 'BEGIN; COMMIT;',
          },
        },
        {
          url: 'https://studio.example.com/api/core/v1/database/sqlite/execute-batch',
          method: 'POST',
          body: {
            dbPath: '/workspace/app.db',
            sqlBatch: 'CREATE TABLE demo(id INTEGER PRIMARY KEY);',
          },
        },
      ],
    );
  } finally {
    restoreWindow();
  }
});
