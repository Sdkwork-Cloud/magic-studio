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

const EXPECTED_ALIAS_SUBPATHS = [
  '@sdkwork/magic-studio-commons/hooks',
  '@sdkwork/magic-studio-commons/framework/tokens',
  '@sdkwork/magic-studio-commons/types',
  '@sdkwork/magic-studio-core/platform',
  '@sdkwork/magic-studio-types/asset-reference',
  '@sdkwork/magic-studio-core/utils',
];

const TARGET_FILE_EXPECTATIONS = [
  {
    relativePath: 'packages/sdkwork-magic-studio-assets/src/pages/AssetsPage.tsx',
    forbiddenRoots: ['@sdkwork/magic-studio-core'],
    expectedSubpaths: ['@sdkwork/magic-studio-core/platform'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-assets/src/components/AssetGrid.tsx',
    forbiddenRoots: ['@sdkwork/magic-studio-commons'],
    expectedSubpaths: ['@sdkwork/magic-studio-types'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-assets/src/components/AssetSidebar.tsx',
    forbiddenRoots: ['@sdkwork/magic-studio-commons'],
    expectedSubpaths: ['@sdkwork/magic-studio-commons/framework/tokens'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-assets/src/components/assetSelectionIdentity.ts',
    forbiddenRoots: ['@sdkwork/magic-studio-commons'],
    expectedSubpaths: ['@sdkwork/magic-studio-types'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-assets/src/hooks/useAssetUrl.ts',
    forbiddenRoots: ['@sdkwork/magic-studio-commons'],
    expectedSubpaths: ['@sdkwork/magic-studio-commons/hooks', '@sdkwork/magic-studio-types'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-assets/src/store/assetStore.tsx',
    forbiddenRoots: ['@sdkwork/magic-studio-commons', '@sdkwork/magic-studio-core'],
    expectedSubpaths: ['@sdkwork/magic-studio-core/utils', '@sdkwork/magic-studio-types'],
  },
];

test('vite and tsconfig expose focused shared workspace subpaths for assets-center runtime files', () => {
  const viteSource = readSource('vite.config.ts');
  const tsconfigSource = readSource('tsconfig.json');

  for (const subpath of EXPECTED_ALIAS_SUBPATHS) {
    assert.match(
      viteSource,
      new RegExp(subpath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
      `Expected vite.config.ts to define alias support for ${subpath}.`,
    );
    assert.match(
      tsconfigSource,
      new RegExp(subpath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
      `Expected tsconfig.json to define path support for ${subpath}.`,
    );
  }
});

test('assets-center runtime files use focused shared workspace subpaths instead of broad package roots', () => {
  for (const { relativePath, forbiddenRoots, expectedSubpaths } of TARGET_FILE_EXPECTATIONS) {
    const source = readSource(relativePath);

    for (const forbiddenRoot of forbiddenRoots) {
      assert.doesNotMatch(
        source,
        new RegExp(`from '${forbiddenRoot.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}'|from "${forbiddenRoot.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}"`),
        `Expected ${relativePath} to stop importing runtime capabilities from ${forbiddenRoot}.`,
      );
    }

    for (const subpath of expectedSubpaths) {
      assert.match(
        source,
        new RegExp(subpath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
        `Expected ${relativePath} to import from ${subpath}.`,
      );
    }
  }
});
