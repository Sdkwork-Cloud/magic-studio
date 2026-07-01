import fs from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'vitest';

import { ToolkitJobClient } from '../jobClient.ts';
import {
  createJsonResponse,
  createMockRuntime,
  installMockWindowLocation,
} from './magicStudioServerTestSupport.ts';

test('uses canonical rust server job routes instead of the native bridge', async () => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const jobClientSource = fs.readFileSync(new URL('../jobClient.ts', import.meta.url), 'utf8');
  const runtime = createMockRuntime('desktop', async (url, init) => {
    calls.push({ url, init });

    if (url.endsWith('/cancel')) {
      return createJsonResponse({
        requestId: 'req-cancel',
        timestamp: '2026-04-18T00:00:00Z',
        data: {
          id: 'job-1',
          kind: 'toolkit',
          operation: 'videoTranscode',
          status: 'cancelled',
          progress: 100,
          stage: 'cancelled',
          createdAtMs: 1,
          updatedAtMs: 2,
          error: {
            code: 'JOB_CANCELLED',
            message: 'job execution was cancelled',
          },
          result: null,
        },
        meta: {
          version: 'v1',
        },
      });
    }

    if (url.endsWith('/jobs/job-1')) {
      return createJsonResponse({
        requestId: 'req-get',
        timestamp: '2026-04-18T00:00:00Z',
        data: {
          id: 'job-1',
          kind: 'toolkit',
          operation: 'videoTranscode',
          status: 'running',
          progress: 42,
          stage: 'videoTranscode: processing',
          createdAtMs: 1,
          updatedAtMs: 2,
          error: null,
          result: null,
        },
        meta: {
          version: 'v1',
        },
      });
    }

    if (url.endsWith('/jobs')) {
      if (init?.method === 'GET') {
        return createJsonResponse({
          requestId: 'req-list',
          timestamp: '2026-04-18T00:00:00Z',
          items: [
            {
              id: 'job-1',
              kind: 'toolkit',
              operation: 'videoTranscode',
              status: 'running',
              progress: 42,
              stage: 'videoTranscode: processing',
              createdAtMs: 1,
              updatedAtMs: 2,
              error: null,
              result: null,
            },
          ],
          meta: {
            page: 1,
            pageSize: 1,
            total: 1,
            version: 'v1',
          },
        });
      }

      return createJsonResponse({
        requestId: 'req-submit',
        timestamp: '2026-04-18T00:00:00Z',
        data: {
          id: 'job-1',
          kind: 'toolkit',
          operation: 'videoTranscode',
          status: 'pending',
          progress: 0,
          stage: 'queued',
          createdAtMs: 1,
          updatedAtMs: 1,
          error: null,
          result: null,
        },
        meta: {
          version: 'v1',
        },
      });
    }

    throw new Error(`Unexpected url ${url}`);
  });

  const client = new ToolkitJobClient(runtime);

  assert.match(jobClientSource, /ToolkitCommandResult/);
  assert.match(jobClientSource, /ToolkitOperationResult/);
  assert.match(jobClientSource, /ToolkitOperation/);
  assert.doesNotMatch(jobClientSource, /ToolkitNativeCommandResult/);
  assert.doesNotMatch(jobClientSource, /ToolkitNativeOperationResult/);
  assert.doesNotMatch(jobClientSource, /ToolkitNativeOperation/);

  assert.equal(client.isSupported(), true);
  await client.submitToolkitJob({
    kind: 'videoTranscode',
    inputPath: '/workspace/video.mp4',
    outputPath: '/workspace/video-h264.mp4',
    videoCodec: 'libx264',
    audioCodec: 'aac',
    overwrite: true,
  });
  await client.getJob('job-1');
  await client.listJobs();
  await client.cancelJob('job-1');

  assert.deepEqual(
    calls.map((call) => ({
      url: call.url,
      method: call.init?.method,
      body: call.init?.body ? JSON.parse(String(call.init.body)) : null,
    })),
    [
      {
        url: 'http://127.0.0.1:4318/api/core/v1/jobs',
        method: 'POST',
        body: {
          kind: 'toolkit',
          operation: {
            kind: 'videoTranscode',
            inputPath: '/workspace/video.mp4',
            outputPath: '/workspace/video-h264.mp4',
            videoCodec: 'libx264',
            audioCodec: 'aac',
            overwrite: true,
          },
        },
      },
      {
        url: 'http://127.0.0.1:4318/api/core/v1/jobs/job-1',
        method: 'GET',
        body: null,
      },
      {
        url: 'http://127.0.0.1:4318/api/core/v1/jobs',
        method: 'GET',
        body: null,
      },
      {
        url: 'http://127.0.0.1:4318/api/core/v1/jobs/job-1/cancel',
        method: 'POST',
        body: null,
      },
    ],
  );
});

test('submits canonical imageResize job payloads', async () => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const runtime = createMockRuntime('desktop', async (url, init) => {
    calls.push({ url, init });
    return createJsonResponse({
      requestId: 'req-submit',
      timestamp: '2026-04-18T00:00:00Z',
      data: {
        id: 'job-2',
        kind: 'toolkit',
        operation: 'imageResize',
        status: 'pending',
        progress: 0,
        stage: 'queued',
        createdAtMs: 1,
        updatedAtMs: 1,
        error: null,
        result: null,
      },
      meta: {
        version: 'v1',
      },
    });
  });

  const client = new ToolkitJobClient(runtime);
  await client.submitToolkitJob({
    kind: 'imageResize',
    inputPath: '/workspace/input.png',
    outputPath: '/workspace/output.png',
    width: 512,
    height: 512,
    overwrite: false,
  });

  assert.deepEqual(
    calls.map((call) => ({
      url: call.url,
      method: call.init?.method,
      body: call.init?.body ? JSON.parse(String(call.init.body)) : null,
    })),
    [
      {
        url: 'http://127.0.0.1:4318/api/core/v1/jobs',
        method: 'POST',
        body: {
          kind: 'toolkit',
          operation: {
            kind: 'imageResize',
            inputPath: '/workspace/input.png',
            outputPath: '/workspace/output.png',
            width: 512,
            height: 512,
            overwrite: false,
          },
        },
      },
    ],
  );
});

test('submits canonical videoConcat job payloads', async () => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const runtime = createMockRuntime('desktop', async (url, init) => {
    calls.push({ url, init });
    return createJsonResponse({
      requestId: 'req-submit',
      timestamp: '2026-04-19T00:00:00Z',
      data: {
        id: 'job-3',
        kind: 'toolkit',
        operation: 'videoConcat',
        status: 'pending',
        progress: 0,
        stage: 'queued',
        createdAtMs: 1,
        updatedAtMs: 1,
        error: null,
        result: null,
      },
      meta: {
        version: 'v1',
      },
    });
  });

  const client = new ToolkitJobClient(runtime);
  await client.submitToolkitJob({
    kind: 'videoConcat',
    inputPaths: ['/workspace/input-a.mp4', '/workspace/input-b.mp4'],
    outputPath: '/workspace/output.mp4',
    overwrite: true,
  });

  assert.deepEqual(
    calls.map((call) => ({
      url: call.url,
      method: call.init?.method,
      body: call.init?.body ? JSON.parse(String(call.init.body)) : null,
    })),
    [
      {
        url: 'http://127.0.0.1:4318/api/core/v1/jobs',
        method: 'POST',
        body: {
          kind: 'toolkit',
          operation: {
            kind: 'videoConcat',
            inputPaths: ['/workspace/input-a.mp4', '/workspace/input-b.mp4'],
            outputPath: '/workspace/output.mp4',
            overwrite: true,
          },
        },
      },
    ],
  );
});

test('uses same-origin job routes for standalone server runtime', async () => {
  const restoreWindow = installMockWindowLocation('https://studio.example.com');

  try {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const runtime = createMockRuntime('server', async (url, init) => {
      calls.push({ url, init });
      return createJsonResponse({
        requestId: 'req-list',
        timestamp: '2026-04-18T00:00:00Z',
        items: [],
        meta: {
          page: 1,
          pageSize: 0,
          total: 0,
          version: 'v1',
        },
      });
    });

    const client = new ToolkitJobClient(runtime);

    assert.equal(client.isSupported(), true);
    await client.listJobs();

    assert.equal(calls[0]?.url, 'https://studio.example.com/api/core/v1/jobs');
  } finally {
    restoreWindow();
  }
});
