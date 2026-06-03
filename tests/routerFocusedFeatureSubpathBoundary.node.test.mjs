import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..');

const readSource = (relativePath) =>
  fs.readFileSync(path.resolve(workspaceRoot, relativePath), 'utf8');
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const rootImportPattern = (specifier) =>
  new RegExp(
    `(?:^\\s*import(?:.+?from\\s*)?['"]${escapeRegex(specifier)}['"]|import\\(['"]${escapeRegex(specifier)}['"]\\))`,
    'm',
  );

test('router registry uses focused feature subpaths for extended package route surfaces', () => {
  const source = readSource('src/router/registry/runtime.tsx');

  const expectations = [
    {
      packageName: 'character',
      disallowedRoot: rootImportPattern('@sdkwork/magic-studio-character'),
      expectedSubpaths: [
        '@sdkwork/magic-studio-character/pages',
        '@sdkwork/magic-studio-character/store',
        '@sdkwork/magic-studio-character/panels',
      ],
    },
    {
      packageName: 'film',
      disallowedRoot: rootImportPattern('@sdkwork/magic-studio-film'),
      expectedSubpaths: ['@sdkwork/magic-studio-film/pages'],
    },
    {
      packageName: 'portal-video',
      disallowedRoot: rootImportPattern('@sdkwork/magic-studio-portal-video'),
      expectedSubpaths: ['@sdkwork/magic-studio-portal-video/pages'],
    },
    {
      packageName: 'skills',
      disallowedRoot: rootImportPattern('@sdkwork/magic-studio-skills'),
      expectedSubpaths: ['@sdkwork/magic-studio-skills/pages'],
    },
    {
      packageName: 'plugins',
      disallowedRoot: rootImportPattern('@sdkwork/magic-studio-plugins'),
      expectedSubpaths: ['@sdkwork/magic-studio-plugins/pages'],
    },
    {
      packageName: 'chatppt',
      disallowedRoot: rootImportPattern('@sdkwork/magic-studio-chatppt'),
      expectedSubpaths: [
        '@sdkwork/magic-studio-chatppt/pages',
        '@sdkwork/magic-studio-chatppt/store',
        '@sdkwork/magic-studio-chatppt/panels',
      ],
    },
    {
      packageName: 'canvas',
      disallowedRoot: rootImportPattern('@sdkwork/magic-studio-canvas'),
      expectedSubpaths: ['@sdkwork/magic-studio-canvas/pages'],
    },
    {
      packageName: 'trade',
      disallowedRoot: rootImportPattern('@sdkwork/magic-studio-trade'),
      expectedSubpaths: ['@sdkwork/magic-studio-trade/pages'],
    },
    {
      packageName: 'browser',
      disallowedRoot: rootImportPattern('@sdkwork/magic-studio-browser'),
      expectedSubpaths: ['@sdkwork/magic-studio-browser/pages'],
    },
    {
      packageName: 'prompt',
      disallowedRoot: rootImportPattern('@sdkwork/magic-studio-prompt'),
      expectedSubpaths: ['@sdkwork/magic-studio-prompt/pages'],
    },
  ];

  for (const { packageName, disallowedRoot, expectedSubpaths } of expectations) {
    assert.doesNotMatch(
      source,
      disallowedRoot,
      `Expected src/router/registry/runtime.tsx to stop consuming @sdkwork/magic-studio-${packageName} from the broad package root.`,
    );

    for (const subpath of expectedSubpaths) {
      assert.match(
        source,
        new RegExp(escapeRegex(subpath)),
        `Expected src/router/registry/runtime.tsx to import from ${subpath}.`,
      );
    }
  }
});

test('route preloading uses focused feature subpaths for extended package route surfaces', () => {
  const source = readSource('src/router/routePreload.ts');

  const expectations = [
    {
      packageName: 'character',
      expectedSubpaths: [
        '@sdkwork/magic-studio-character/pages',
        '@sdkwork/magic-studio-character/store',
        '@sdkwork/magic-studio-character/panels',
      ],
    },
    {
      packageName: 'film',
      expectedSubpaths: ['@sdkwork/magic-studio-film/pages'],
    },
    {
      packageName: 'portal-video',
      expectedSubpaths: ['@sdkwork/magic-studio-portal-video/pages'],
    },
    {
      packageName: 'skills',
      expectedSubpaths: ['@sdkwork/magic-studio-skills/pages'],
    },
    {
      packageName: 'plugins',
      expectedSubpaths: ['@sdkwork/magic-studio-plugins/pages'],
    },
    {
      packageName: 'chatppt',
      expectedSubpaths: [
        '@sdkwork/magic-studio-chatppt/pages',
        '@sdkwork/magic-studio-chatppt/store',
        '@sdkwork/magic-studio-chatppt/panels',
      ],
    },
    {
      packageName: 'canvas',
      expectedSubpaths: ['@sdkwork/magic-studio-canvas/pages'],
    },
    {
      packageName: 'trade',
      expectedSubpaths: ['@sdkwork/magic-studio-trade/pages'],
    },
  ];

  for (const { packageName, expectedSubpaths } of expectations) {
    assert.doesNotMatch(
      source,
      new RegExp(`import\\(['"]@sdkwork/magic-studio-${packageName}['"]\\)`),
      `Expected src/router/routePreload.ts to stop preloading @sdkwork/magic-studio-${packageName} from the broad package root.`,
    );

    for (const subpath of expectedSubpaths) {
      assert.match(
        source,
        new RegExp(escapeRegex(subpath)),
        `Expected src/router/routePreload.ts to preload ${subpath}.`,
      );
    }
  }
});

test('plugins package consumes portal header through a focused portal-video subpath', () => {
  const pluginsPageSource = readSource('packages/sdkwork-magic-studio-plugins/src/pages/PluginsPage.tsx');
  const portalVideoPackageJson = JSON.parse(
    readSource('packages/sdkwork-magic-studio-portal-video/package.json'),
  );
  const rootTsconfig = JSON.parse(readSource('tsconfig.json'));
  const gitSdkTsconfig = JSON.parse(readSource('tsconfig.git-sdk.json'));
  const npmSdkTsconfig = JSON.parse(readSource('tsconfig.npm-sdk.json'));
  const viteConfigSource = readSource('vite.config.ts');

  assert.doesNotMatch(
    pluginsPageSource,
    rootImportPattern('@sdkwork/magic-studio-portal-video'),
    'Expected PluginsPage.tsx to stop importing PortalHeader through the broad portal-video root entry.',
  );
  assert.match(
    pluginsPageSource,
    /@sdkwork\/magic-studio-portal-video\/portal-header/,
    'Expected PluginsPage.tsx to import PortalHeader from the focused portal-header subpath.',
  );

  assert.deepEqual(
    portalVideoPackageJson.exports?.['./portal-header'],
    {
      import: './src/portal-header/index.ts',
      types: './src/portal-header/index.ts',
    },
    'Expected @sdkwork/magic-studio-portal-video to export the focused ./portal-header subpath.',
  );

  for (const [label, tsconfig] of [
    ['root tsconfig', rootTsconfig],
    ['git sdk tsconfig', gitSdkTsconfig],
    ['npm sdk tsconfig', npmSdkTsconfig],
  ]) {
    assert.deepEqual(
      tsconfig.compilerOptions?.paths?.['@sdkwork/magic-studio-portal-video/portal-header'],
      ['packages/sdkwork-magic-studio-portal-video/src/portal-header/index.ts'],
      `Expected ${label} to expose @sdkwork/magic-studio-portal-video/portal-header.`,
    );
  }

  assert.match(
    viteConfigSource,
    /find:\s*'@sdkwork\/magic-studio-portal-video\/portal-header'/,
    'Expected vite config to alias the focused portal-header subpath.',
  );
});

test('bootstrap deferred i18n registration uses focused feature i18n subpaths', () => {
  const source = readSource('src/app/bootstrap.ts');

  for (const packageName of ['character', 'film', 'prompt']) {
    const rootImportPattern = new RegExp(
      `@sdkwork/magic-studio-${packageName}['"]\\)\\.then\\(\\(module\\) => module\\.defaultI18nConfig\\)`,
    );

    assert.doesNotMatch(
      source,
      rootImportPattern,
      `Expected src/app/bootstrap.ts to stop resolving defaultI18nConfig from the @sdkwork/magic-studio-${packageName} root entry.`,
    );
    assert.match(
      source,
      new RegExp(`@sdkwork/magic-studio-${packageName}/i18n`),
      `Expected src/app/bootstrap.ts to resolve defaultI18nConfig from @sdkwork/magic-studio-${packageName}/i18n.`,
    );
  }
});
