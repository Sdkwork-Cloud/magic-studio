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

const FILM_FILE_EXPECTATIONS = [
  {
    relativePath: 'packages/sdkwork-magic-studio-film/src/utils/filmModalAssetImport.ts',
    expectedSubpaths: [
      '@sdkwork/magic-studio-assets/asset-center',
      '@sdkwork/magic-studio-assets/services',
    ],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-film/src/utils/filmHomeAttachment.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-assets/creation-chat'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-film/src/utils/filmAssetUrlResolver.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-assets/asset-center'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-film/src/pages/FilmHomePage.tsx',
    expectedSubpaths: [
      '@sdkwork/magic-studio-assets/creation-chat',
      '@sdkwork/magic-studio-assets/services',
    ],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-film/src/components/ShotModal.tsx',
    expectedSubpaths: [
      '@sdkwork/magic-studio-assets/asset-center',
      '@sdkwork/magic-studio-assets/choose-asset',
      '@sdkwork/magic-studio-assets/creation-chat',
      '@sdkwork/magic-studio-assets/generation',
    ],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-film/src/components/CharacterModal.tsx',
    expectedSubpaths: [
      '@sdkwork/magic-studio-assets/choose-asset',
      '@sdkwork/magic-studio-assets/generation',
    ],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-film/src/components/PropModal.tsx',
    expectedSubpaths: [
      '@sdkwork/magic-studio-assets/choose-asset',
      '@sdkwork/magic-studio-assets/entities',
      '@sdkwork/magic-studio-assets/generation',
    ],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-film/src/components/LocationModal.tsx',
    expectedSubpaths: [
      '@sdkwork/magic-studio-assets/choose-asset',
      '@sdkwork/magic-studio-assets/entities',
      '@sdkwork/magic-studio-assets/generation',
    ],
  },
];

test('film runtime files use focused magic-studio-assets subpaths instead of the broad package root', () => {
  for (const { relativePath, expectedSubpaths } of FILM_FILE_EXPECTATIONS) {
    const source = readSource(relativePath);

    assert.doesNotMatch(
      source,
      /from '@sdkwork\/magic-studio-assets'|from "@sdkwork\/magic-studio-assets"/,
      `Expected ${relativePath} to stop importing runtime capabilities from the broad magic-studio-assets root entry.`,
    );

    for (const subpath of expectedSubpaths) {
      assert.match(
        source,
        new RegExp(subpath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
        `Expected ${relativePath} to import from ${subpath}.`,
      );
    }
  }
});
