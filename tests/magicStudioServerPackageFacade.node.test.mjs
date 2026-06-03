import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const workspaceRoot = process.cwd();
const serverContractSourcePath = path.join(
  workspaceRoot,
  'packages',
  'sdkwork-magic-studio-server',
  'src',
  'contract.ts',
);
const serverIndexSourcePath = path.join(
  workspaceRoot,
  'packages',
  'sdkwork-magic-studio-server',
  'src',
  'index.ts',
);
const hostTypesIndexSourcePath = path.join(
  workspaceRoot,
  'packages',
  'sdkwork-magic-studio-host-types',
  'src',
  'index.ts',
);
const serverClientSourcePath = path.join(
  workspaceRoot,
  'packages',
  'sdkwork-magic-studio-server',
  'src',
  'client.ts',
);

function readCanonicalContractExports(source) {
  const exportNames = new Set();
  const exportPattern =
    /export\s+(?:const|function)\s+(MAGIC_STUDIO_SERVER_[A-Z0-9_]+(?:_PATH)?|buildMagicStudioServerRouteCatalog|buildMagicStudioServerRouteDefinitions|createMagicStudioServerGatewaySummary|createMagicStudioServerHostDescriptor|createMagicStudioServerOpenApiDocument|resolveMagicStudioServerHostDescriptor|resolveMagicStudioServerRoutePath|resolveMagicStudioServerOpenApiPath)\b/g;

  for (const match of source.matchAll(exportPattern)) {
    exportNames.add(match[1]);
  }

  return [...exportNames].sort();
}

function readCanonicalClientTypeExports(source) {
  const exportNames = new Set();
  const exportPattern = /export\s+(?:interface|type)\s+([A-Za-z0-9_]+)\b/g;

  for (const match of source.matchAll(exportPattern)) {
    exportNames.add(match[1]);
  }

  return [...exportNames].sort();
}

function readCanonicalSharedTypeExports(source) {
  const exportNames = new Set();
  const exportBlocks = source.matchAll(/export\s*\{[\s\S]*?\}\s*from\s*['"][^'"]+['"];/g);

  for (const block of exportBlocks) {
    for (const match of block[0].matchAll(/\btype\s+([A-Za-z0-9_]+)\b/g)) {
      exportNames.add(match[1]);
    }
  }

  return [...exportNames].sort();
}

test('magic studio server package root exports the full canonical contract facade', () => {
  const contractSource = fs.readFileSync(serverContractSourcePath, 'utf8');
  const indexSource = fs.readFileSync(serverIndexSourcePath, 'utf8');
  const canonicalExports = readCanonicalContractExports(contractSource);

  assert.ok(
    canonicalExports.length > 0,
    'Expected to discover canonical server contract exports from contract.ts.',
  );

  for (const exportName of canonicalExports) {
    assert.match(
      indexSource,
      new RegExp(`\\b${exportName}\\b`),
      `Expected package root index.ts to export canonical contract symbol ${exportName}.`,
    );
  }
});

test('magic studio server package root exposes an explicit client facade without compatibility aliases', () => {
  const clientSource = fs.readFileSync(serverClientSourcePath, 'utf8');
  const indexSource = fs.readFileSync(serverIndexSourcePath, 'utf8');
  const canonicalTypeExports = readCanonicalClientTypeExports(clientSource);

  assert.ok(
    canonicalTypeExports.length > 0,
    'Expected to discover canonical client type exports from client.ts.',
  );

  assert.doesNotMatch(
    clientSource,
    /\bMAGIC_STUDIO_SERVER_DOCS_ROUTE\b/,
    'Expected client.ts to avoid compatibility aliases for canonical route constants.',
  );
  assert.doesNotMatch(
    indexSource,
    /export \* from '\.\/client\.ts';/,
    'Expected package root index.ts to use explicit client exports instead of a wildcard facade.',
  );
  assert.match(
    indexSource,
    /\bcreateMagicStudioServerClient\b/,
    'Expected package root index.ts to explicitly export createMagicStudioServerClient.',
  );

  for (const exportName of canonicalTypeExports) {
    assert.match(
      indexSource,
      new RegExp(`\\b${exportName}\\b`),
      `Expected package root index.ts to explicitly export canonical client type ${exportName}.`,
    );
  }
});

test('magic studio server package root re-exports the canonical shared transport facade used by its public api', () => {
  const indexSource = fs.readFileSync(serverIndexSourcePath, 'utf8');

  for (const exportName of [
    'MagicStudioHostDescriptor',
    'MagicStudioHostMode',
    'MagicStudioRuntimeMode',
    'MagicStudioPluginManifest',
    'MagicStudioPluginPermissionScope',
    'MagicStudioApiAuthMode',
    'MagicStudioApiContractMeta',
    'MagicStudioApiContractRoute',
    'MagicStudioApiContractSurface',
    'MagicStudioApiEnvelope',
    'MagicStudioApiGatewaySummary',
    'MagicStudioApiGatewaySurfaceSummary',
    'MagicStudioApiListEnvelope',
    'MagicStudioApiMeta',
    'MagicStudioApiProblemDetails',
    'MagicStudioApiProblemEnvelope',
    'MagicStudioApiRouteCatalogEntry',
    'MagicStudioApiRouteDefinition',
    'MagicStudioApiSurface',
    'MagicStudioServerContract',
  ]) {
    assert.match(
      indexSource,
      new RegExp(`\\b${exportName}\\b`),
      `Expected package root index.ts to re-export canonical shared transport symbol ${exportName}.`,
    );
  }
});

test('magic studio server package root re-exports the full shared type facade consumed by its public api', () => {
  const hostTypesIndexSource = fs.readFileSync(hostTypesIndexSourcePath, 'utf8');
  const indexSource = fs.readFileSync(serverIndexSourcePath, 'utf8');
  const canonicalSharedTypeExports = readCanonicalSharedTypeExports(hostTypesIndexSource);

  assert.ok(
    canonicalSharedTypeExports.length > 0,
    'Expected to discover canonical host/runtime type exports from @sdkwork/magic-studio-host-types.',
  );

  for (const exportName of canonicalSharedTypeExports) {
    assert.match(
      indexSource,
      new RegExp(`\\b${exportName}\\b`),
      `Expected package root index.ts to re-export canonical shared type ${exportName}.`,
    );
  }
});

test('magic studio server package root owns host resolution input typing instead of re-exporting host-core discovery types', () => {
  const contractSource = fs.readFileSync(serverContractSourcePath, 'utf8');
  const indexSource = fs.readFileSync(serverIndexSourcePath, 'utf8');

  assert.match(
    contractSource,
    /\bexport interface MagicStudioServerHostResolutionInput\b/,
    'Expected contract.ts to define the canonical server-owned host resolution input type.',
  );
  assert.match(
    contractSource,
    /\bexport function resolveMagicStudioServerRoutePath\b[\s\S]*\bexport function resolveMagicStudioServerOpenApiPath\b/,
    'Expected contract.ts to define canonical route-id-based helpers for materialized public paths and OpenAPI paths.',
  );
  assert.match(
    indexSource,
    /\bMagicStudioServerHostResolutionInput\b/,
    'Expected index.ts to export the canonical server-owned host resolution input type.',
  );
  assert.match(
    indexSource,
    /\bresolveMagicStudioServerRoutePath\b/,
    'Expected index.ts to export the canonical route-id-based public path helper.',
  );
  assert.match(
    indexSource,
    /\bresolveMagicStudioServerOpenApiPath\b/,
    'Expected index.ts to export the canonical route-id-based path helpers.',
  );
  assert.doesNotMatch(
    indexSource,
    /\bMagicStudioHostDiscoveryInput\b/,
    'Expected index.ts to avoid re-exporting host-core discovery input types through the server package facade.',
  );
});
