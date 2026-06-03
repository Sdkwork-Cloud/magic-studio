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

const MEDIA_PACKAGES = [
  'image',
  'video',
  'audio',
  'music',
  'sfx',
  'voicespeaker',
];

const ROUTER_FILES = [
  'src/router/registry/runtime.tsx',
];

test('router composition files use focused media subpaths instead of broad package roots', () => {
  for (const relativePath of ROUTER_FILES) {
    const source = readSource(relativePath);

    for (const packageName of MEDIA_PACKAGES) {
      const packagePrefix = `@sdkwork/magic-studio-${packageName}`;
      assert.doesNotMatch(
        source,
        new RegExp(`${packagePrefix}(?:'|")`),
        `Expected ${relativePath} to stop consuming ${packagePrefix} from the broad package root.`,
      );
      assert.match(
        source,
        new RegExp(`${packagePrefix}/pages`),
        `Expected ${relativePath} to consume ${packagePrefix}/pages for route page loading.`,
      );
      assert.match(
        source,
        new RegExp(`${packagePrefix}/store`),
        `Expected ${relativePath} to consume ${packagePrefix}/store for provider loading.`,
      );
      assert.match(
        source,
        new RegExp(`${packagePrefix}/panels`),
        `Expected ${relativePath} to consume ${packagePrefix}/panels for left pane loading.`,
      );
    }
  }
});

test('legacy router facade files delegate to the canonical registry', () => {
  for (const relativePath of [
    'src/router/packageRouteLoader.tsx',
    'src/router/packageRoutes.tsx',
  ]) {
    const source = readSource(relativePath);

    assert.match(
      source,
      /from '\.\/registry'|from "\.\/registry"/,
      `Expected ${relativePath} to delegate to src/router/registry.tsx.`,
    );
  }
});

test('route preloading uses focused media subpaths instead of broad package roots', () => {
  const source = readSource('src/router/routePreload.ts');

  for (const packageName of MEDIA_PACKAGES) {
    const packagePrefix = `@sdkwork/magic-studio-${packageName}`;
    assert.doesNotMatch(
      source,
      new RegExp(`import\\('${packagePrefix}'\\)|import\\("${packagePrefix}"\\)`),
      `Expected routePreload.ts to stop preloading ${packagePrefix} from the broad package root.`,
    );
    assert.match(
      source,
      new RegExp(`${packagePrefix}/pages`),
      `Expected routePreload.ts to preload ${packagePrefix}/pages.`,
    );
    assert.match(
      source,
      new RegExp(`${packagePrefix}/store`),
      `Expected routePreload.ts to preload ${packagePrefix}/store.`,
    );
    assert.match(
      source,
      new RegExp(`${packagePrefix}/panels`),
      `Expected routePreload.ts to preload ${packagePrefix}/panels.`,
    );
  }
});

test('bootstrap deferred i18n registration uses focused media i18n subpaths', () => {
  const source = readSource('src/app/bootstrap.ts');

  for (const packageName of MEDIA_PACKAGES) {
    const packagePrefix = `@sdkwork/magic-studio-${packageName}`;
    assert.doesNotMatch(
      source,
      new RegExp(`${packagePrefix}'\\)\\.then\\(\\(module\\) => module\\.defaultI18nConfig\\)|${packagePrefix}"\\)\\.then\\(\\(module\\) => module\\.defaultI18nConfig\\)`),
      `Expected bootstrap.ts to stop resolving defaultI18nConfig from ${packagePrefix} root entry.`,
    );
    assert.match(
      source,
      new RegExp(`${packagePrefix}/i18n`),
      `Expected bootstrap.ts to resolve defaultI18nConfig from ${packagePrefix}/i18n.`,
    );
  }
});
