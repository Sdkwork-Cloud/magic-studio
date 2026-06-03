import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..');

function readSource(relativePath) {
  return fs.readFileSync(path.resolve(workspaceRoot, relativePath), 'utf8');
}

test('root route registries use focused assets subpaths instead of the broad package root', () => {
  const registryCompositionSource = readSource('src/router/registry.tsx');
  const registryRuntimeSource = readSource('src/router/registry/runtime.tsx');
  const packageRouteLoaderSource = readSource('src/router/packageRouteLoader.tsx');
  const packageRoutesSource = readSource('src/router/packageRoutes.tsx');

  assert.match(
    registryCompositionSource,
    /from '\.\/registry\/sections'|from "\.\/registry\/sections"/,
    'Expected registry.tsx to remain the canonical composition root over internal route sections.',
  );

  assert.doesNotMatch(
    registryRuntimeSource,
    /@sdkwork\/magic-studio-assets'\)\.then\(m\s*=>\s*\(\{\s*default:\s*m\.(AssetsPage|AssetStoreProvider)\s*\}\)\)/,
    'Expected src/router/registry/runtime.tsx to stop loading AssetsPage and AssetStoreProvider from the broad magic-studio-assets root entry.',
  );
  assert.match(
    registryRuntimeSource,
    /@sdkwork\/magic-studio-assets\/pages/,
    'Expected src/router/registry/runtime.tsx to lazy-load AssetsPage from the focused pages subpath.',
  );
  assert.match(
    registryRuntimeSource,
    /@sdkwork\/magic-studio-assets\/store/,
    'Expected src/router/registry/runtime.tsx to lazy-load AssetStoreProvider from the focused store subpath.',
  );

  assert.doesNotMatch(
    packageRouteLoaderSource,
    /@sdkwork\/magic-studio-assets'\)\.then\(m\s*=>\s*\(\{\s*default:\s*m\.(AssetsPage|AssetStoreProvider)\s*\}\)\)/,
    'Expected packageRouteLoader.tsx to stop loading AssetsPage and AssetStoreProvider from the broad magic-studio-assets root entry.',
  );
  assert.match(
    packageRouteLoaderSource,
    /from '\.\/registry'|from "\.\/registry"/,
    'Expected packageRouteLoader.tsx to delegate to the canonical registry.',
  );
  assert.match(
    packageRouteLoaderSource,
    /COMPLETE_ROUTE_REGISTRY|PACKAGE_BASED_ROUTES/,
    'Expected packageRouteLoader.tsx to expose legacy route-loader aliases from the canonical registry.',
  );

  assert.match(
    packageRoutesSource,
    /from '\.\/registry'|from "\.\/registry"/,
    'Expected packageRoutes.tsx to delegate to the canonical registry.',
  );
});

test('route preloading uses focused assets subpaths instead of the broad package root', () => {
  const source = readSource('src/router/routePreload.ts');

  assert.doesNotMatch(
    source,
    /assets:\s*\(\)\s*=>\s*import\('@sdkwork\/magic-studio-assets'\)|assets:\s*\(\)\s*=>\s*import\("@sdkwork\/magic-studio-assets"\)/,
    'Expected routePreload.ts to stop preloading the broad magic-studio-assets root entry.',
  );
  assert.match(
    source,
    /import\('@sdkwork\/magic-studio-assets\/pages'\)|import\("@sdkwork\/magic-studio-assets\/pages"\)/,
    'Expected routePreload.ts to preload the focused assets pages subpath.',
  );
  assert.match(
    source,
    /import\('@sdkwork\/magic-studio-assets\/store'\)|import\("@sdkwork\/magic-studio-assets\/store"\)/,
    'Expected routePreload.ts to preload the focused assets store subpath.',
  );
});
