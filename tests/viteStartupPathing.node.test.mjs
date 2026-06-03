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

test('vite launcher scripts use native config loading through the shared runtime env helper', () => {
  const devSource = readSource('scripts/run-vite-dev.mjs');
  const buildSource = readSource('scripts/run-app-build.mjs');

  assert.match(
    devSource,
    /withViteRuntimeEnv|resolveViteConfigLoader/,
    'Expected run-vite-dev.mjs to use the shared Vite runtime helper path.',
  );
  assert.match(
    buildSource,
    /withViteRuntimeEnv|resolveViteConfigLoader/,
    'Expected run-app-build.mjs to use the shared Vite runtime helper path.',
  );
  assert.match(
    devSource,
    /--configLoader\s+\$\{configLoader\}|--configLoader native/,
    'Expected run-vite-dev.mjs to force a non-bundled config loader.',
  );
  assert.match(
    buildSource,
    /--configLoader\s+\$\{configLoader\}|--configLoader native/,
    'Expected run-app-build.mjs to force a non-bundled config loader.',
  );
  assert.match(
    devSource,
    /preferWorkspaceLocalCache:\s*process\.platform\s*===\s*['"]win32['"]/,
    'Expected run-vite-dev.mjs to prefer a workspace-local Vite cache on Windows.',
  );
});

test('vite config resolves cacheDir through the shared cache path helper', () => {
  const viteConfigSource = readSource('vite.config.ts');

  assert.match(
    viteConfigSource,
    /resolveViteCacheDir/,
    'Expected vite.config.ts to import and use resolveViteCacheDir.',
  );
  assert.match(
    viteConfigSource,
    /cacheDir:\s*resolveViteCacheDir\(/,
    'Expected vite.config.ts to set a non-default cacheDir through resolveViteCacheDir().',
  );
  assert.match(
    viteConfigSource,
    /find:\s*'@sdkwork\/magic-studio-server'/,
    'Expected vite.config.ts to alias @sdkwork/magic-studio-server for workspace source resolution.',
  );
  assert.match(
    viteConfigSource,
    /find:\s*'@sdkwork\/magic-studio-host-core'/,
    'Expected vite.config.ts to alias @sdkwork/magic-studio-host-core for canonical server contract resolution.',
  );
  assert.match(
    viteConfigSource,
    /find:\s*'@sdkwork\/magic-studio-host-types'/,
    'Expected vite.config.ts to alias @sdkwork/magic-studio-host-types for canonical server type resolution.',
  );
});
