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

test('route preloading is budgeted and serialized instead of bursting heavy imports in parallel', () => {
  const source = readSource('src/router/routePreload.ts');

  assert.match(
    source,
    /from '\.\/registry\/specs'|from "\.\/registry\/specs"/,
    'Expected routePreload to derive adjacent feature preload choices from the canonical route specs.',
  );
  assert.match(
    source,
    /matchRoutePrefix/,
    'Expected routePreload to reuse the shared route-prefix matcher instead of maintaining a private path-matching implementation.',
  );
  assert.match(
    source,
    /MAX_PRELOAD_KEYS_PER_ROUTE\s*=\s*2/,
    'Expected routePreload to define a hard cap for adjacent heavy-module preloads.',
  );
  assert.match(
    source,
    /return\s+[\s\S]*\.slice\(0,\s*MAX_PRELOAD_KEYS_PER_ROUTE\)/,
    'Expected routePreload to clamp each route to the configured preload budget.',
  );
  assert.match(
    source,
    /await preloadByKey\(key\)/,
    'Expected routePreload to await preloads sequentially instead of launching every heavy import at once.',
  );
  assert.doesNotMatch(
    source,
    /candidateKeys\s*=/,
    'Expected routePreload to stop hardcoding per-route preload arrays outside the canonical route specs.',
  );
});

test('bootstrap defers heavy feature packages instead of statically importing them all at startup', () => {
  const source = readSource('src/app/bootstrap.ts');

  assert.doesNotMatch(
    source,
    /import\s+\{\s*defaultI18nConfig\s+as\s+\w+\s*\}\s+from\s+'@sdkwork\/magic-studio-(audio|assets|character|chat|film|image|music|prompt|sfx|video|voice)'/,
    'Expected bootstrap.ts to stop statically importing all heavy feature-package i18n configs up front.',
  );
  assert.match(
    source,
    /defaultI18nConfig\s+as\s+userI18nConfig/,
    'Expected bootstrap.ts to eagerly register the host-owned user i18n namespace for immediate account-center localization.',
  );
  assert.doesNotMatch(
    source,
    /import\s+\{\s*initializeAssetServices,\s*assetCenterService\s*\}\s+from\s+'@sdkwork\/magic-studio-assets'/,
    'Expected bootstrap.ts to lazy-load asset center initialization instead of pulling magic-studio-assets into the initial startup graph.',
  );
  assert.doesNotMatch(
    source,
    /import\('@sdkwork\/magic-studio-assets'\)|import\("@sdkwork\/magic-studio-assets"\)/,
    'Expected bootstrap.ts to stop lazy-loading the broad magic-studio-assets root entry and use focused subpath entries instead.',
  );
  assert.match(
    source,
    /import\('@sdkwork\/magic-studio-assets\/i18n'\)|import\("@sdkwork\/magic-studio-assets\/i18n"\)/,
    'Expected bootstrap.ts to load assets i18n through the focused i18n subpath.',
  );
  assert.match(
    source,
    /import\('@sdkwork\/magic-studio-assets\/services'\)|import\("@sdkwork\/magic-studio-assets\/services"\)/,
    'Expected bootstrap.ts to load asset service initialization through the focused services subpath.',
  );
  assert.match(
    source,
    /import\('@sdkwork\/magic-studio-assets\/asset-center'\)|import\("@sdkwork\/magic-studio-assets\/asset-center"\)/,
    'Expected bootstrap.ts to load asset center initialization through the focused asset-center subpath.',
  );
  assert.match(
    source,
    /let\s+bootstrapPromise\s*:\s*Promise<void>\s*\|\s*null\s*=\s*null/,
    'Expected bootstrap.ts to keep a module-level bootstrap promise so dev StrictMode does not schedule startup twice.',
  );
  assert.match(
    source,
    /if\s*\(\s*bootstrapPromise\s*\)\s*\{\s*return\s+bootstrapPromise;\s*\}/,
    'Expected bootstrap.ts to short-circuit duplicate startup calls once bootstrap has already begun.',
  );
});

test('hot-path sidebars do not keep debug console logging enabled', () => {
  const mainSidebarSource = readSource('src/layouts/MainLayout/MainSidebar.tsx');
  const generationSidebarSource = readSource('src/layouts/GenerationLayout/GenerationLayoutSidebar.tsx');

  assert.doesNotMatch(
    mainSidebarSource,
    /console\.log\(/,
    'Expected MainSidebar to stop logging on every path and active-state change.',
  );
  assert.doesNotMatch(
    generationSidebarSource,
    /console\.log\(/,
    'Expected GenerationLayoutSidebar to stop logging on every route change.',
  );
});
