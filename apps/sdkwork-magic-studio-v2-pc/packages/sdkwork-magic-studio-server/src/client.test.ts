import assert from 'node:assert/strict';
import fs from 'node:fs';
import { test } from 'vitest';

import {
  MagicStudioServerClientError,
  createMagicStudioServerClient,
  isMagicStudioServerResourceNotFoundError,
} from './client.ts';

test('defaults to the canonical server runtime host descriptor', () => {
  const client = createMagicStudioServerClient();
  const clientSource = fs.readFileSync(new URL('./client.ts', import.meta.url), 'utf8');

  assert.equal(client.host.kind, 'server');
  assert.equal(client.host.apiBaseUrl, 'http://127.0.0.1:4318');
  assert.doesNotMatch(clientSource, /runtimeMode:\s*'desktop'/);
});

test('does not expose production payment callback simulation APIs', () => {
  const clientSource = fs.readFileSync(new URL('./client.ts', import.meta.url), 'utf8');
  const indexSource = fs.readFileSync(new URL('./index.ts', import.meta.url), 'utf8');
  const contractSource = fs.readFileSync(
    new URL('../contracts/magic-studio-server.contract.json', import.meta.url),
    'utf8',
  );
  const openapiComponentsSource = fs.readFileSync(
    new URL('../contracts/magic-studio-server.openapi-components.json', import.meta.url),
    'utf8',
  );

  for (const source of [clientSource, indexSource, contractSource, openapiComponentsSource]) {
    assert.doesNotMatch(source, /simulateTradePaymentCallback/);
    assert.doesNotMatch(source, /appTradePaymentsSimulateCallback/);
    assert.doesNotMatch(source, /simulate-callback/);
    assert.doesNotMatch(source, /MagicStudioTradePaymentCallbackSimulationRequest/);
  }
});

test('classifies resource not found only when the server error code is expected', () => {
  const resourceMissing = new MagicStudioServerClientError('trade order missing', {
    status: 404,
    code: 'APP_TRADE_ORDER_NOT_FOUND',
  });
  const routeMissing = new MagicStudioServerClientError('HTTP 404 for /missing-route', {
    status: 404,
  });
  const wrongResource = new MagicStudioServerClientError('payment missing', {
    status: 404,
    code: 'APP_TRADE_PAYMENT_NOT_FOUND',
  });

  assert.equal(
    isMagicStudioServerResourceNotFoundError(resourceMissing, [
      'APP_TRADE_ORDER_NOT_FOUND',
    ]),
    true,
  );
  assert.equal(
    isMagicStudioServerResourceNotFoundError(routeMissing, [
      'APP_TRADE_ORDER_NOT_FOUND',
    ]),
    false,
  );
  assert.equal(
    isMagicStudioServerResourceNotFoundError(wrongResource, [
      'APP_TRADE_ORDER_NOT_FOUND',
    ]),
    false,
  );
});

test('targets the canonical local api routes', async () => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const fetchMock: typeof fetch = async (input, init) => {
    calls.push({
      url: String(input),
      init,
    });

    return new Response(
      JSON.stringify({
        requestId: 'req-1',
        timestamp: '2026-04-18T00:00:00Z',
        data: { ok: true },
        meta: { version: 'v1' },
      }),
      {
        headers: {
          'content-type': 'application/json',
        },
        status: 200,
      },
    );
  };

  const client = createMagicStudioServerClient({
    baseUrl: 'http://127.0.0.1:4318',
    fetch: fetchMock,
  });

  await client.healthz();
  await client.readRouteCatalog();
  await client.readRuntimeSummary();
  await client.readToolkitCapabilities();
  await client.readFileSystemDirectory({ path: '/workspace' });
  await client.readFileSystemText({ path: '/workspace/settings.json' });
  await client.readFileSystemBytes({ path: '/workspace/blob.bin' });
  await client.writeFileSystemText({
    path: '/workspace/settings.json',
    text: '{"theme":"dark"}',
  });
  await client.writeFileSystemBytes({
    path: '/workspace/blob.bin',
    bytesBase64: 'AQID',
  });
  await client.statFileSystemPath({ path: '/workspace/settings.json' });
  await client.checkFileSystemPathExists({ path: '/workspace/settings.json' });
  await client.ensureFileSystemDirectory({ path: '/workspace/tmp' });
  await client.removeFileSystemPath({ path: '/workspace/tmp' });
  await client.renameFileSystemPath({
    oldPath: '/workspace/settings.json',
    newPath: '/workspace/settings.next.json',
  });
  await client.copyFileSystemFile({
    sourcePath: '/workspace/settings.next.json',
    destinationPath: '/workspace/settings.copy.json',
  });
  await client.readPolicySnapshot();
  await client.mediaProbe({ input: '/workspace/video.mp4' });
  await client.mediaImageResize({
    inputPath: '/workspace/input.png',
    outputPath: '/workspace/output.png',
    width: 1024,
    height: 1024,
    overwrite: false,
  });
  await client.mediaVideoConcat({
    inputPaths: ['/workspace/input-a.mp4', '/workspace/input-b.mp4'],
    outputPath: '/workspace/output.mp4',
    overwrite: true,
  });
  await client.mediaVideoTranscode({
    inputPath: '/workspace/input.mp4',
    outputPath: '/workspace/output.mp4',
    width: 1920,
    height: 1080,
  });
  await client.mediaVideoTrim({
    inputPath: '/workspace/input.mp4',
    outputPath: '/workspace/trimmed.mp4',
    startSeconds: 3,
    durationSeconds: 5,
  });
  await client.mediaVideoExtractAudio({
    inputPath: '/workspace/input.mp4',
    outputPath: '/workspace/output.m4a',
    overwrite: true,
  });
  await client.mediaVideoCreateThumbnail({
    inputPath: '/workspace/input.mp4',
    outputPath: '/workspace/thumbnail.jpg',
    timeSeconds: 2,
    width: 640,
    height: 360,
  });
  await client.mediaAudioConvert({
    inputPath: '/workspace/input.wav',
    outputPath: '/workspace/output.mp3',
    codec: 'mp3',
    bitrateKbps: 192,
  });
  await client.mediaAudioNormalize({
    inputPath: '/workspace/input.wav',
    outputPath: '/workspace/output.wav',
  });
  await client.mediaAudioMix({
    inputs: [
      { path: '/workspace/voice.wav', volume: 1 },
      { path: '/workspace/music.wav', volume: 0.4 },
    ],
    outputPath: '/workspace/mix.wav',
  });
  await client.zipLocalPaths({ sourcePaths: ['/workspace/assets'] });
  await client.unzipToDirectory({
    zipPath: '/workspace/assets.zip',
    targetDir: '/workspace/output',
  });
  await client.executeSql({
    dbPath: '/workspace/app.db',
    sql: 'CREATE TABLE demo(id INTEGER PRIMARY KEY)',
    params: [],
  });
  await client.querySql({
    dbPath: '/workspace/app.db',
    sql: 'SELECT 1 AS value',
    params: [],
  });
  await client.executeSqlBatch({
    dbPath: '/workspace/app.db',
    sqlBatch: 'BEGIN; COMMIT;',
  });
  const clientSource = fs.readFileSync(new URL('./client.ts', import.meta.url), 'utf8');
  assert.match(clientSource, /MagicStudioServerHealthStatus/);
  assert.match(clientSource, /readRouteCatalog\(\): Promise<MagicStudioApiListEnvelope<MagicStudioApiRouteCatalogEntry>>;/);
  assert.match(clientSource, /MagicStudioToolkitCapabilityMatrix/);
  assert.match(clientSource, /MagicStudioToolkitCommandResult/);
  assert.match(clientSource, /MagicStudioToolkitOperation/);
  assert.match(clientSource, /MagicStudioToolkitJobSubmission/);
  assert.doesNotMatch(clientSource, /kind:\s*'transcodeVideoH264'/);
  assert.doesNotMatch(clientSource, /kind:\s*'extractAudioWav'/);
  assert.doesNotMatch(clientSource, /kind:\s*'mergeVideoAndAudio'/);
  assert.doesNotMatch(clientSource, /kind:\s*'resizeImage'/);
  assert.doesNotMatch(clientSource, /kind:\s*'probeMedia'/);
  assert.doesNotMatch(clientSource, /export type MagicStudioToolkitOperation\b/);
  assert.doesNotMatch(clientSource, /export interface MagicStudioToolkitJobSubmission\b/);
  assert.doesNotMatch(clientSource, /MagicStudioToolkitNativeCommandResult/);
  assert.doesNotMatch(clientSource, /MagicStudioToolkitNativeOperationResult/);
  assert.doesNotMatch(clientSource, /MagicStudioToolkitNativeOperation/);
  assert.doesNotMatch(
    clientSource,
    /MAGIC_STUDIO_SERVER_DEFAULT_CONTRACT\.meta\.(?:liveOpenApiPath|healthRouteId|routeCatalogRouteId|runtimeSummaryRouteId)/,
  );
  assert.doesNotMatch(clientSource, /ffmpegAvailable:\s*boolean/);
  assert.doesNotMatch(clientSource, /ffprobeAvailable:\s*boolean/);
  assert.match(clientSource, /mediaProbe\s*[:(]/);
  assert.match(clientSource, /mediaImageResize\s*[:(]/);
  assert.match(clientSource, /mediaVideoConcat\s*[:(]/);
  assert.match(clientSource, /MAGIC_STUDIO_SERVER_LIVE_OPENAPI_PATH/);
  assert.match(clientSource, /MAGIC_STUDIO_SERVER_ROUTE_CATALOG_PATH/);
  assert.match(clientSource, /MAGIC_STUDIO_SERVER_RUNTIME_SUMMARY_PATH/);
  assert.doesNotMatch(clientSource, /mediaFfmpegConcat\s*[:(]/);
  assert.doesNotMatch(clientSource, /mediaFfmpegExec\s*[:(]/);
  assert.doesNotMatch(clientSource, /mediaFfprobeJson\s*[:(]/);
  await client.submitToolkitJob({
    kind: 'toolkit',
    operation: {
      kind: 'mediaProbe',
      input: '/workspace/input.mp4',
    },
  });
  await client.readToolkitJob('job-1');
  await client.listToolkitJobs();
  await client.cancelToolkitJob('job-1');

  assert.deepEqual(
    calls.map((call) => [call.url, call.init?.method]),
    [
      ['http://127.0.0.1:4318/healthz', 'GET'],
      ['http://127.0.0.1:4318/api/core/v1/routes', 'GET'],
      ['http://127.0.0.1:4318/api/core/v1/runtime/summary', 'GET'],
      ['http://127.0.0.1:4318/api/core/v1/toolkit/capabilities', 'GET'],
      ['http://127.0.0.1:4318/api/core/v1/filesystem/read-dir', 'POST'],
      ['http://127.0.0.1:4318/api/core/v1/filesystem/read-text', 'POST'],
      ['http://127.0.0.1:4318/api/core/v1/filesystem/read-bytes', 'POST'],
      ['http://127.0.0.1:4318/api/core/v1/filesystem/write-text', 'POST'],
      ['http://127.0.0.1:4318/api/core/v1/filesystem/write-bytes', 'POST'],
      ['http://127.0.0.1:4318/api/core/v1/filesystem/stat', 'POST'],
      ['http://127.0.0.1:4318/api/core/v1/filesystem/exists', 'POST'],
      ['http://127.0.0.1:4318/api/core/v1/filesystem/ensure-dir', 'POST'],
      ['http://127.0.0.1:4318/api/core/v1/filesystem/remove', 'POST'],
      ['http://127.0.0.1:4318/api/core/v1/filesystem/rename', 'POST'],
      ['http://127.0.0.1:4318/api/core/v1/filesystem/copy-file', 'POST'],
      ['http://127.0.0.1:4318/api/core/v1/policy/snapshot', 'GET'],
      ['http://127.0.0.1:4318/api/core/v1/media/probe', 'POST'],
      ['http://127.0.0.1:4318/api/core/v1/media/image/resize', 'POST'],
      ['http://127.0.0.1:4318/api/core/v1/media/video/concat', 'POST'],
      ['http://127.0.0.1:4318/api/core/v1/media/video/transcode', 'POST'],
      ['http://127.0.0.1:4318/api/core/v1/media/video/trim', 'POST'],
      ['http://127.0.0.1:4318/api/core/v1/media/video/extract-audio', 'POST'],
      ['http://127.0.0.1:4318/api/core/v1/media/video/thumbnail', 'POST'],
      ['http://127.0.0.1:4318/api/core/v1/media/audio/convert', 'POST'],
      ['http://127.0.0.1:4318/api/core/v1/media/audio/normalize', 'POST'],
      ['http://127.0.0.1:4318/api/core/v1/media/audio/mix', 'POST'],
      ['http://127.0.0.1:4318/api/core/v1/compression/zip', 'POST'],
      ['http://127.0.0.1:4318/api/core/v1/compression/unzip', 'POST'],
      ['http://127.0.0.1:4318/api/core/v1/database/sqlite/execute', 'POST'],
      ['http://127.0.0.1:4318/api/core/v1/database/sqlite/query', 'POST'],
      ['http://127.0.0.1:4318/api/core/v1/database/sqlite/execute-batch', 'POST'],
      ['http://127.0.0.1:4318/api/core/v1/jobs', 'POST'],
      ['http://127.0.0.1:4318/api/core/v1/jobs/job-1', 'GET'],
      ['http://127.0.0.1:4318/api/core/v1/jobs', 'GET'],
      ['http://127.0.0.1:4318/api/core/v1/jobs/job-1/cancel', 'POST'],
    ],
  );
});
