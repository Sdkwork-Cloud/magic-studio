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

const readJson = (relativePath) =>
  JSON.parse(readSource(relativePath));

test('entry-critical app files use focused auth/settings/workspace/notification subpaths instead of broad package roots', () => {
  const sourceExpectations = [
    {
      relativePath: 'src/app/AppProvider.tsx',
      disallowedPatterns: [
        /from\s+['"]@sdkwork\/magic-studio-auth['"]/,
        /from\s+['"]@sdkwork\/magic-studio-settings['"]/,
        /from\s+['"]@sdkwork\/magic-studio-workspace['"]/,
        /from\s+['"]@sdkwork\/magic-studio-notifications['"]/,
      ],
      expectedPatterns: [
        /@sdkwork\/magic-studio-auth\/store/,
        /@sdkwork\/magic-studio-settings\/store/,
        /@sdkwork\/magic-studio-workspace\/store/,
        /@sdkwork\/magic-studio-notifications\/store/,
      ],
    },
    {
      relativePath: 'src/app/bootstrap.ts',
      disallowedPatterns: [
        /from\s+['"]@sdkwork\/magic-studio-auth['"]/,
        /from\s+['"]@sdkwork\/magic-studio-user['"]/,
      ],
      expectedPatterns: [
        /@sdkwork\/magic-studio-auth\/i18n/,
        /@sdkwork\/magic-studio-user\/i18n/,
      ],
    },
    {
      relativePath: 'src/app/theme/ThemeManager.ts',
      disallowedPatterns: [
        /from\s+['"]@sdkwork\/magic-studio-settings['"]/,
      ],
      expectedPatterns: [
        /@sdkwork\/magic-studio-settings\/constants/,
        /@sdkwork\/magic-studio-settings\/services/,
      ],
    },
    {
      relativePath: 'src/layouts/MainLayout/MainGlobalHeader.tsx',
      disallowedPatterns: [
        /from\s+['"]@sdkwork\/magic-studio-auth['"]/,
        /from\s+['"]@sdkwork\/magic-studio-workspace['"]/,
        /from\s+['"]@sdkwork\/magic-studio-settings['"]/,
      ],
      expectedPatterns: [
        /@sdkwork\/magic-studio-auth\/store/,
        /@sdkwork\/magic-studio-workspace\/store/,
        /@sdkwork\/magic-studio-workspace\/components/,
        /@sdkwork\/magic-studio-settings\/store/,
      ],
    },
    {
      relativePath: 'src/layouts/MainLayout/MainSidebar.tsx',
      disallowedPatterns: [
        /from\s+['"]@sdkwork\/magic-studio-auth['"]/,
        /from\s+['"]@sdkwork\/magic-studio-settings['"]/,
      ],
      expectedPatterns: [
        /@sdkwork\/magic-studio-auth\/store/,
        /@sdkwork\/magic-studio-settings\/store/,
        /@sdkwork\/magic-studio-settings\/entities/,
        /@sdkwork\/magic-studio-settings\/constants/,
      ],
    },
    {
      relativePath: 'src/layouts/NotesLayout/NotesHeader.tsx',
      disallowedPatterns: [
        /from\s+['"]@sdkwork\/magic-studio-workspace['"]/,
      ],
      expectedPatterns: [
        /@sdkwork\/magic-studio-workspace\/components/,
      ],
    },
    {
      relativePath: 'src/layouts/MagicCutLayout/MagicCutLayoutHeader.tsx',
      disallowedPatterns: [
        /from\s+['"]@sdkwork\/magic-studio-workspace['"]/,
      ],
      expectedPatterns: [
        /@sdkwork\/magic-studio-workspace\/components/,
      ],
    },
  ];

  for (const { relativePath, disallowedPatterns, expectedPatterns } of sourceExpectations) {
    const source = readSource(relativePath);

    for (const pattern of disallowedPatterns) {
      assert.doesNotMatch(
        source,
        pattern,
        `Expected ${relativePath} to stop using broad root package imports on the app-entry hot path.`,
      );
    }

    for (const pattern of expectedPatterns) {
      assert.match(
        source,
        pattern,
        `Expected ${relativePath} to use focused package subpaths.`,
      );
    }
  }
});

test('tooling and package exports expose focused app-entry subpaths for auth/settings/workspace/notifications', () => {
  const tsconfigSource = readSource('tsconfig.json');
  const viteConfigSource = readSource('vite.config.ts');

  const aliasExpectations = [
    '@sdkwork/magic-studio-auth/store',
    '@sdkwork/magic-studio-auth/i18n',
    '@sdkwork/magic-studio-user/i18n',
    '@sdkwork/magic-studio-settings/store',
    '@sdkwork/magic-studio-settings/services',
    '@sdkwork/magic-studio-settings/entities',
    '@sdkwork/magic-studio-settings/constants',
    '@sdkwork/magic-studio-workspace/store',
    '@sdkwork/magic-studio-workspace/components',
    '@sdkwork/magic-studio-notifications/store',
  ];

  for (const alias of aliasExpectations) {
    assert.match(
      tsconfigSource,
      new RegExp(`"${alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`),
      `Expected tsconfig.json to expose the ${alias} path alias.`,
    );
    assert.match(
      viteConfigSource,
      new RegExp(`'${alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'`),
      `Expected vite.config.ts to expose the ${alias} alias.`,
    );
  }

  const packageExportsExpectations = [
    {
      relativePath: 'packages/sdkwork-magic-studio-auth/package.json',
      expectedKeys: ['./store', './i18n'],
    },
    {
      relativePath: 'packages/sdkwork-magic-studio-user/package.json',
      expectedKeys: ['./i18n'],
    },
    {
      relativePath: 'packages/sdkwork-magic-studio-settings/package.json',
      expectedKeys: ['./store', './services', './entities', './constants'],
    },
    {
      relativePath: 'packages/sdkwork-magic-studio-workspace/package.json',
      expectedKeys: ['./store', './components'],
    },
    {
      relativePath: 'packages/sdkwork-magic-studio-notifications/package.json',
      expectedKeys: ['./store'],
    },
  ];

  for (const { relativePath, expectedKeys } of packageExportsExpectations) {
    const packageJson = readJson(relativePath);
    const exportsField = packageJson.exports ?? {};

    for (const expectedKey of expectedKeys) {
      assert.ok(
        exportsField[expectedKey],
        `Expected ${relativePath} to export ${expectedKey}.`,
      );
    }
  }
});
