import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const workspaceRoot = process.cwd();

const readSource = (relativePath) =>
  fs.readFileSync(path.join(workspaceRoot, relativePath), 'utf8');

test('storage settings and service boundaries reject shadow server proxy contracts', () => {
  const storageServicesIndexSource = readSource(
    'packages/sdkwork-magic-studio-core/src/services/storage/index.ts',
  );
  const storageManagerSource = readSource(
    'packages/sdkwork-magic-studio-core/src/services/storage/StorageManager.ts',
  );
  const storageTypesSource = readSource(
    'packages/sdkwork-magic-studio-core/src/services/storage/types.ts',
  );
  const settingsEntitySource = readSource(
    'packages/sdkwork-magic-studio-settings/src/entities/settings.entity.ts',
  );
  const storageSettingsSource = readSource(
    'packages/sdkwork-magic-studio-settings/src/components/StorageSettings.tsx',
  );
  const settingsServiceSource = readSource(
    'packages/sdkwork-magic-studio-settings/src/services/settingsService.ts',
  );
  const unifiedHostStandardSource = readSource('docs/magic-studio-unified-host-api-standard.md');
  const rustServerStandardSource = readSource(
    'docs/standards/magic-studio-rust-server-api-standard.md',
  );

  assert.equal(
    fs.existsSync(
      path.join(
        workspaceRoot,
        'packages/sdkwork-magic-studio-core/src/services/storage/providers/ServerProvider.ts',
      ),
    ),
    false,
    'Expected the legacy ServerProvider shadow storage proxy to be removed.',
  );
  assert.doesNotMatch(
    storageServicesIndexSource,
    /ServerProvider/,
    'Expected the storage public surface to stop exporting ServerProvider.',
  );
  assert.doesNotMatch(
    storageManagerSource,
    /mode === 'server'|new ServerProvider|apiEndpoint|authHeaderName|authToken/,
    'Expected StorageManager to stop branching on shadow server proxy config.',
  );
  assert.doesNotMatch(
    storageTypesSource,
    /ServerStorageProtocol|mode: 'client' \| 'server'/,
    'Expected storage service types to reject server-proxy protocol vocabulary.',
  );
  assert.doesNotMatch(
    settingsEntitySource,
    /StorageConnectionMode|mode: StorageConnectionMode|apiEndpoint\?:|authHeaderName\?:|authToken\?:/,
    'Expected settings entities to remove shadow storage proxy fields.',
  );
  assert.doesNotMatch(
    storageSettingsSource,
    /Server Proxy|mode === 'server'|mode: 'client'|apiEndpoint|authHeaderName|authToken/,
    'Expected the settings UI to remove storage server-proxy controls.',
  );
  assert.match(
    settingsServiceSource,
    /normalizeStorageSettings/,
    'Expected settingsService to normalize storage configs through the canonical direct-provider model.',
  );
  assert.match(
    unifiedHostStandardSource,
    /Ad hoc storage proxy HTTP contracts are not part of the standard\./,
    'Expected the unified host standard to ban ad hoc storage proxy HTTP contracts.',
  );
  assert.match(
    rustServerStandardSource,
    /Storage workflows that need server participation must be authored here as canonical Rust server routes\./,
    'Expected the Rust server standard to keep storage server participation inside the canonical server contract.',
  );
});
