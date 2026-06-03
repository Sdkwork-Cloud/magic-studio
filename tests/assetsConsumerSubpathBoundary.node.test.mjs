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

const TARGET_FILE_EXPECTATIONS = [
  {
    relativePath: 'packages/sdkwork-magic-studio-browser/src/services/browserDownloadService.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-assets/services'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-prompt/src/pages/PromptOptimizerPage.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-assets/style-selector'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-portal-video/src/pages/PortalPage.tsx',
    expectedSubpaths: [
      '@sdkwork/magic-studio-assets/asset-center',
      '@sdkwork/magic-studio-assets/choose-asset',
      '@sdkwork/magic-studio-assets/creation-chat',
      '@sdkwork/magic-studio-assets/services',
    ],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-portal-video/src/utils/portalAttachmentImport.ts',
    expectedSubpaths: [
      '@sdkwork/magic-studio-assets/asset-center',
      '@sdkwork/magic-studio-assets/creation-chat',
      '@sdkwork/magic-studio-assets/services',
    ],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-portal-video/src/utils/portalGenerationSelection.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-assets/creation-chat'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-portal-video/src/components/StickyHeroBar.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-assets/creation-chat'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-character/src/pages/CharacterPage.tsx',
    expectedSubpaths: [
      '@sdkwork/magic-studio-assets/asset-center',
      '@sdkwork/magic-studio-assets/generation',
    ],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-character/src/pages/CharacterChatPage.tsx',
    expectedSubpaths: [
      '@sdkwork/magic-studio-assets/generation',
      '@sdkwork/magic-studio-assets/services',
    ],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-character/src/pages/importCharacterTask.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-assets/generation'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-character/src/components/CharacterLeftGeneratorPanel.tsx',
    expectedSubpaths: [
      '@sdkwork/magic-studio-assets/choose-asset',
      '@sdkwork/magic-studio-assets/entities',
      '@sdkwork/magic-studio-assets/generation',
      '@sdkwork/magic-studio-assets/services',
    ],
  },
];

test('browser/prompt/portal-video/character runtime files use focused magic-studio-assets subpaths', () => {
  for (const { relativePath, expectedSubpaths } of TARGET_FILE_EXPECTATIONS) {
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
