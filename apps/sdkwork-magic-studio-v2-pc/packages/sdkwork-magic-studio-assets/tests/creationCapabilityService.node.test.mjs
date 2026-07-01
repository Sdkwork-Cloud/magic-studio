import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { registerHooks } from 'node:module';
import { MagicStudioServerClientError } from '@sdkwork/magic-studio-server';

const creationCapabilityServiceState = {
  calls: [],
  nextError: null,
  nextResponse: null,
  async readCreationCapabilities(payload) {
    creationCapabilityServiceState.calls.push(payload);

    if (creationCapabilityServiceState.nextError) {
      const error = creationCapabilityServiceState.nextError;
      creationCapabilityServiceState.nextError = null;
      throw error;
    }

    return creationCapabilityServiceState.nextResponse;
  },
};

globalThis.__creationCapabilityServiceNodeTestState = creationCapabilityServiceState;

registerHooks({
  resolve(specifier, context, defaultResolve) {
    if (specifier === './creationServerClient' || specifier === './creationServerClient.ts') {
      return {
        shortCircuit: true,
        url:
          'data:text/javascript,' +
          encodeURIComponent(`
            const state = globalThis.__creationCapabilityServiceNodeTestState;
            export function getCreationServerClient() {
              return {
                readCreationCapabilities: (payload) => state.readCreationCapabilities(payload),
              };
            }
          `),
      };
    }

    return defaultResolve(specifier, context, defaultResolve);
  },
});

const {
  clearCreationCapabilityCache,
  fetchCreationCapabilities,
} = await import('../src/services/creationCapabilityService.ts');

test('fails closed for invalid auth and refetches successfully afterwards', async () => {
  creationCapabilityServiceState.calls.length = 0;
  creationCapabilityServiceState.nextResponse = null;
  creationCapabilityServiceState.nextError = new MagicStudioServerClientError('unauthorized', {
    status: 401,
    code: 'UNAUTHORIZED',
  });
  clearCreationCapabilityCache();

  await assert.rejects(
    () => fetchCreationCapabilities('video'),
    /unauthorized/,
  );
  assert.equal(creationCapabilityServiceState.calls.length, 1);

  creationCapabilityServiceState.nextResponse = {
    requestId: 'req-node-1',
    timestamp: '2026-04-22T00:00:00.000Z',
    data: {
      target: 'video',
      channels: [
        {
          channel: 'VOLCENGINE',
          name: 'Volcengine',
          models: [
            {
              model: 'film-master',
              name: 'Film Master',
            },
          ],
        },
      ],
      styleOptions: [],
    },
    meta: {
      version: 'v1',
    },
  };

  const liveSnapshot = await fetchCreationCapabilities('video');

  assert.deepEqual(liveSnapshot, {
    target: 'video',
    channels: [
      {
        channel: 'VOLCENGINE',
        name: 'Volcengine',
        models: [
          {
            model: 'film-master',
            name: 'Film Master',
          },
        ],
      },
    ],
    styleOptions: [],
  });
  assert.equal(creationCapabilityServiceState.calls.length, 2);
});

test('keeps creation capability service implementation free from direct legacy creation SDK imports', async () => {
  const source = await readFile(
    new URL('../src/services/creationCapabilityService.ts', import.meta.url),
    'utf8',
  );

  assert.equal(source.includes("from '@sdkwork/magic-studio-core/sdk'"), false);
});
