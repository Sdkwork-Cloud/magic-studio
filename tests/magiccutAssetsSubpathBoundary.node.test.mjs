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

const MAGICCUT_FILE_EXPECTATIONS = [
  {
    relativePath: 'packages/sdkwork-magic-studio-magiccut/src/components/Resources/MagicCutResourcePanel.tsx',
    expectedSubpaths: [
      '@sdkwork/magic-studio-assets/asset-center',
      '@sdkwork/magic-studio-assets/entities',
      '@sdkwork/magic-studio-assets/services',
    ],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-magiccut/src/store/magicCutStore.tsx',
    expectedSubpaths: [
      '@sdkwork/magic-studio-assets/asset-center',
      '@sdkwork/magic-studio-assets/services',
    ],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-magiccut/src/components/Properties/panels/VoiceSettingsPanel.tsx',
    expectedSubpaths: [
      '@sdkwork/magic-studio-assets/generation',
      '@sdkwork/magic-studio-assets/services',
    ],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-magiccut/src/components/Properties/panels/TextSettingsPanel.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-assets/generation'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-magiccut/src/components/Timeline/MagicCutTimelineToolbar.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-assets/generation'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-magiccut/src/utils/generatedSelectionImport.ts',
    expectedSubpaths: [
      '@sdkwork/magic-studio-assets/asset-center',
      '@sdkwork/magic-studio-assets/services',
    ],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-magiccut/src/utils/magicCutTrackCoverImport.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-assets/services'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-magiccut/src/utils/assetUrlResolver.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-assets/asset-center'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-magiccut/src/hooks/useResourceUrl.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-assets/hooks'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-magiccut/src/components/Resources/panels/EffectResourcePanel.tsx',
    expectedSubpaths: [
      '@sdkwork/magic-studio-assets/entities',
      '@sdkwork/magic-studio-assets/hooks',
    ],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-magiccut/src/components/Resources/panels/MusicResourcePanel.tsx',
    expectedSubpaths: [
      '@sdkwork/magic-studio-assets/entities',
      '@sdkwork/magic-studio-assets/hooks',
    ],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-magiccut/src/components/Resources/panels/TransitionResourcePanel.tsx',
    expectedSubpaths: [
      '@sdkwork/magic-studio-assets/entities',
      '@sdkwork/magic-studio-assets/hooks',
    ],
  },
];

test('magiccut runtime files use focused magic-studio-assets subpaths instead of the broad package root', () => {
  for (const { relativePath, expectedSubpaths } of MAGICCUT_FILE_EXPECTATIONS) {
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
