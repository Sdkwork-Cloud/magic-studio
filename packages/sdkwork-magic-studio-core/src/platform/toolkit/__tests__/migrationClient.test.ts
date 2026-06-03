import assert from 'node:assert/strict';
import { test } from 'vitest';

import { MigrationClient } from '../migrationClient.ts';
import {
  createJsonResponse,
  createMockRuntime,
  installMockWindowLocation,
} from './magicStudioServerTestSupport.ts';

test('uses same-origin rust server migration routes for server runtime delivery', async () => {
  const restoreWindow = installMockWindowLocation('https://studio.example.com');
  const calls: Array<{ url: string; init?: RequestInit }> = [];

  try {
    const runtime = createMockRuntime('server', async (url, init) => {
      calls.push({ url, init });

      if (url.endsWith('/status')) {
        return createJsonResponse({
          requestId: 'req-status',
          timestamp: '2026-04-18T00:00:00Z',
          data: {
            currentVersion: 3,
            migrations: [],
          },
          meta: {
            version: 'v1',
          },
        });
      }

      return createJsonResponse({
        requestId: 'req-apply',
        timestamp: '2026-04-18T00:00:00Z',
        data: {
          fromVersion: 3,
          toVersion: 4,
          appliedVersions: [4],
          skippedVersions: [],
          dryRun: false,
        },
        meta: {
          version: 'v1',
        },
      });
    });

    const client = new MigrationClient(runtime);

    assert.equal(client.isSupported(), true);
    await client.status('/workspace/data/app.db');
    await client.apply('/workspace/data/app.db', {
      scripts: [
        {
          version: 4,
          name: 'create_assets',
          sql: 'create table assets(id text primary key);',
        },
      ],
    });

    assert.deepEqual(
      calls.map((call) => ({
        url: call.url,
        method: call.init?.method,
        body: call.init?.body ? JSON.parse(String(call.init.body)) : null,
      })),
      [
        {
          url: 'https://studio.example.com/api/core/v1/migrations/status',
          method: 'POST',
          body: {
            dbPath: '/workspace/data/app.db',
          },
        },
        {
          url: 'https://studio.example.com/api/core/v1/migrations/apply',
          method: 'POST',
          body: {
            dbPath: '/workspace/data/app.db',
            plan: {
              dryRun: false,
              scripts: [
                {
                  version: 4,
                  name: 'create_assets',
                  sql: 'create table assets(id text primary key);',
                },
              ],
            },
          },
        },
      ],
    );
  } finally {
    restoreWindow();
  }
});

test('surfaces problem-envelope messages from the rust server migration api', async () => {
  const runtime = createMockRuntime('server', async () =>
    createJsonResponse(
      {
        requestId: 'req-problem',
        timestamp: '2026-04-18T00:00:00Z',
        error: {
          code: 'migration_plan_invalid',
          message: 'migration plan checksum mismatch',
          retryable: false,
        },
      },
      { status: 400 },
    ),
  );

  const client = new MigrationClient(runtime);

  await assert.rejects(
    () =>
      client.apply('/workspace/data/app.db', {
        scripts: [],
      }),
    /migration plan checksum mismatch/,
  );
});
