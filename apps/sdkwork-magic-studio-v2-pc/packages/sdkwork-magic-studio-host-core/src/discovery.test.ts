import assert from 'node:assert/strict';
import { test } from 'vitest';

import {
  resolveMagicStudioHostConnection,
  resolveMagicStudioLocalApiBaseUrl,
} from './discovery.ts';

test('defaults desktop runtime to the local rust server connection descriptor', () => {
  const descriptor = resolveMagicStudioHostConnection({
    runtimeMode: 'desktop',
  });

  assert.equal(descriptor.kind, 'desktop');
  assert.equal(descriptor.host, '127.0.0.1');
  assert.equal(descriptor.port, 4318);
  assert.equal(descriptor.apiBaseUrl, 'http://127.0.0.1:4318');
  assert.equal('docsPath' in descriptor, false);
  assert.equal('healthPath' in descriptor, false);
});

test('uses same-origin api base url for standalone server runtime when requested', () => {
  const descriptor = resolveMagicStudioHostConnection({
    runtimeMode: 'server',
    preferSameOrigin: true,
    locationOrigin: 'https://studio.example.com',
  });

  assert.equal(descriptor.kind, 'server');
  assert.equal(descriptor.apiBaseUrl, 'https://studio.example.com');
  assert.equal(
    resolveMagicStudioLocalApiBaseUrl({
      runtimeMode: 'server',
      preferSameOrigin: true,
      locationOrigin: 'https://studio.example.com',
    }),
    'https://studio.example.com',
  );
});
