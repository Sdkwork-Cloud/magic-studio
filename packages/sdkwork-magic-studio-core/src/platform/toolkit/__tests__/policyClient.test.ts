import assert from 'node:assert/strict';
import { test } from 'vitest';

import { PolicyClient } from '../policyClient.ts';
import {
  createJsonResponse,
  createMockRuntime,
} from './magicStudioServerTestSupport.ts';

test('uses the canonical rust server policy routes even when the desktop bridge is unavailable', async () => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const runtime = createMockRuntime('desktop', async (url, init) => {
    calls.push({ url, init });

    if (url.endsWith('/snapshot')) {
      return createJsonResponse({
        requestId: 'req-snapshot',
        timestamp: '2026-04-18T00:00:00Z',
        data: {
          allowDangerousCommands: false,
          allowSystemPaths: false,
          blockedCommands: ['rm'],
          blockedPathPrefixes: ['/etc'],
          preferredWorkRoots: ['/workspace'],
        },
        meta: {
          version: 'v1',
        },
      });
    }

    return createJsonResponse({
      requestId: 'req-validate-path',
      timestamp: '2026-04-18T00:00:00Z',
      data: {
        allowed: true,
        code: null,
        reason: null,
        matchedRule: 'workspace-root',
      },
      meta: {
        version: 'v1',
      },
    });
  });

  const client = new PolicyClient(runtime);

  assert.equal(client.isSupported(), true);
  await client.snapshot();
  await client.validatePath('/workspace/project', 'read');

  assert.deepEqual(
    calls.map((call) => ({
      url: call.url,
      method: call.init?.method,
      body: call.init?.body ? JSON.parse(String(call.init.body)) : null,
    })),
    [
      {
        url: 'http://127.0.0.1:4318/api/core/v1/policy/snapshot',
        method: 'GET',
        body: null,
      },
      {
        url: 'http://127.0.0.1:4318/api/core/v1/policy/validate-path',
        method: 'POST',
        body: {
          path: '/workspace/project',
          access: 'read',
        },
      },
    ],
  );
});

test('surfaces problem-envelope messages from the rust server policy api', async () => {
  const runtime = createMockRuntime('desktop', async () =>
    createJsonResponse(
      {
        requestId: 'req-problem',
        timestamp: '2026-04-18T00:00:00Z',
        error: {
          code: 'policy_denied',
          message: 'policy snapshot is unavailable',
          retryable: false,
        },
      },
      { status: 503 },
    ),
  );

  const client = new PolicyClient(runtime);

  await assert.rejects(() => client.snapshot(), /policy snapshot is unavailable/);
});
