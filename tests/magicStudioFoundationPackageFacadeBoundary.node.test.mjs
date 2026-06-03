import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const workspaceRoot = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(workspaceRoot, relativePath), 'utf8');
}

test('magic studio foundation packages consume each other through package facades instead of sibling source paths', () => {
  const hostCoreDescriptorSource = read(
    'packages/sdkwork-magic-studio-host-core/src/descriptor.ts',
  );
  const hostCoreDiscoverySource = read(
    'packages/sdkwork-magic-studio-host-core/src/discovery.ts',
  );
  const serverContractSource = read('packages/sdkwork-magic-studio-server/src/contract.ts');
  const serverClientSource = read('packages/sdkwork-magic-studio-server/src/client.ts');
  const serverIndexSource = read('packages/sdkwork-magic-studio-server/src/index.ts');

  for (const [label, source] of [
    ['host-core descriptor', hostCoreDescriptorSource],
    ['host-core discovery', hostCoreDiscoverySource],
    ['server contract', serverContractSource],
    ['server client', serverClientSource],
    ['server index', serverIndexSource],
  ]) {
    assert.doesNotMatch(
      source,
      /\.\.\/\.\.\/sdkwork-magic-studio-(?:types|host-core)\/src\//,
      `Expected ${label} to avoid sibling source imports across foundation package boundaries.`,
    );
  }

  assert.match(
    hostCoreDescriptorSource,
    /@sdkwork\/magic-studio-host-types/,
    'Expected host-core descriptor to use the shared host-types package facade.',
  );
  assert.match(
    hostCoreDiscoverySource,
    /@sdkwork\/magic-studio-host-types/,
    'Expected host-core discovery to use the shared host-types package facade.',
  );
  assert.match(
    serverContractSource,
    /@sdkwork\/magic-studio-host-core/,
    'Expected server contract to use the host-core package facade.',
  );
  assert.match(
    serverContractSource,
    /@sdkwork\/magic-studio-host-types/,
    'Expected server contract to use the shared host-types package facade.',
  );
  assert.match(
    serverClientSource,
    /@sdkwork\/magic-studio-types/,
    'Expected server client to use the shared types package facade.',
  );
  assert.match(
    serverIndexSource,
    /@sdkwork\/magic-studio-host-types/,
    'Expected server index to re-export host/server contracts through the published package facade.',
  );
});
