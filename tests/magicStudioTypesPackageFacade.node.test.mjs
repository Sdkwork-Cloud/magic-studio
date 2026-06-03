import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const workspaceRoot = process.cwd();
const typesIndexSourcePath = path.join(
  workspaceRoot,
  'packages',
  'sdkwork-magic-studio-host-types',
  'src',
  'index.ts',
);
const hostSourcePath = path.join(
  workspaceRoot,
  'packages',
  'sdkwork-magic-studio-host-types',
  'src',
  'host.ts',
);
const pluginManifestSourcePath = path.join(
  workspaceRoot,
  'packages',
  'sdkwork-magic-studio-host-types',
  'src',
  'plugin-manifest.ts',
);
const serverApiSourcePath = path.join(
  workspaceRoot,
  'packages',
  'sdkwork-magic-studio-host-types',
  'src',
  'server-api.ts',
);

function readExportNames(source) {
  const exportNames = new Set();
  const exportPattern = /export\s+(?:const|type|interface)\s+([A-Za-z0-9_]+)\b/g;

  for (const match of source.matchAll(exportPattern)) {
    exportNames.add(match[1]);
  }

  return [...exportNames].sort();
}

test('magic studio host types package root exposes an explicit canonical host/runtime facade', () => {
  const indexSource = fs.readFileSync(typesIndexSourcePath, 'utf8');
  const hostSource = fs.readFileSync(hostSourcePath, 'utf8');
  const pluginManifestSource = fs.readFileSync(pluginManifestSourcePath, 'utf8');
  const serverApiSource = fs.readFileSync(serverApiSourcePath, 'utf8');

  assert.doesNotMatch(
    indexSource,
    /export \* from '\.\//,
    'Expected @sdkwork/magic-studio-host-types root to avoid wildcard exports.',
  );

  for (const exportName of [
    ...readExportNames(hostSource),
    ...readExportNames(pluginManifestSource),
    ...readExportNames(serverApiSource),
  ]) {
    assert.match(
      indexSource,
      new RegExp(`\\b${exportName}\\b`),
      `Expected @sdkwork/magic-studio-host-types root to explicitly export ${exportName}.`,
    );
  }

  assert.doesNotMatch(
    serverApiSource,
    /\/api\/(core|app|admin)\/v1/,
    'Expected @sdkwork/magic-studio-host-types server-api surface to stay route-neutral and avoid canonical API path ownership.',
  );
  assert.doesNotMatch(
    serverApiSource,
    /\bMAGIC_STUDIO_SERVER_API_VERSION\b|\bMAGIC_STUDIO_API_SURFACES\b/,
    'Expected @sdkwork/magic-studio-host-types server-api surface to avoid owning canonical server version or surface inventory constants.',
  );
  assert.doesNotMatch(
    indexSource,
    /\bMAGIC_STUDIO_API_PREFIXES\b|\bMAGIC_STUDIO_SERVER_API_VERSION\b|\bMAGIC_STUDIO_API_SURFACES\b/,
    'Expected @sdkwork/magic-studio-host-types root to stop exporting canonical server authority constants.',
  );
});
