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

const MAGICCUT_RESOURCE_FILE_EXPECTATIONS = [
  {
    relativePath: 'packages/sdkwork-magic-studio-magiccut/src/components/Resources/SkimmableAssetCard.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-assets/entities'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-magiccut/src/components/Resources/panels/VideoResourcePanel.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-assets/entities'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-magiccut/src/components/Resources/panels/TextResourcePanel.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-assets/entities'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-magiccut/src/components/Resources/panels/ImageResourcePanel.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-assets/entities'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-magiccut/src/components/Resources/panels/AudioResourcePanel.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-assets/entities'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-magiccut/src/components/Resources/grid/VisualResourceGrid.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-assets/entities'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-magiccut/src/components/Resources/list/MusicResourceList.tsx',
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
  {
    relativePath: 'packages/sdkwork-magic-studio-magiccut/src/components/Resources/panels/EffectResourcePanel.tsx',
    expectedSubpaths: [
      '@sdkwork/magic-studio-assets/entities',
      '@sdkwork/magic-studio-assets/hooks',
    ],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-magiccut/src/components/Resources/grid/EffectResourceGrid.tsx',
    expectedSubpaths: [
      '@sdkwork/magic-studio-assets/entities',
      '@sdkwork/magic-studio-assets/hooks',
    ],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-magiccut/src/components/Resources/grid/TemplateResourceGrid.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-assets/hooks'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-magiccut/src/components/Resources/list/AudioResourceList.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-assets/entities'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-magiccut/src/domain/assets/favoriteToggle.ts',
    expectedSubpaths: [
      '@sdkwork/magic-studio-assets/entities',
      '@sdkwork/magic-studio-assets/asset-center',
    ],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-magiccut/src/domain/assets/magicCutAssetState.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-assets/asset-center'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-magiccut/src/domain/assets/resourcePanelAssets.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-assets/entities'],
  },
];

test('magiccut resource and domain asset files use focused magic-studio-assets subpaths instead of the broad package root', () => {
  for (const { relativePath, expectedSubpaths } of MAGICCUT_RESOURCE_FILE_EXPECTATIONS) {
    const source = readSource(relativePath);

    assert.doesNotMatch(
      source,
      /from '@sdkwork\/magic-studio-assets'|from "@sdkwork\/magic-studio-assets"/,
      `Expected ${relativePath} to stop importing runtime or type capabilities from the broad magic-studio-assets root entry.`,
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

const MAGICCUT_THUMBNAIL_REFERENCE_FILES = [
  'packages/sdkwork-magic-studio-magiccut/src/components/Resources/SkimmableAssetCard.tsx',
  'packages/sdkwork-magic-studio-magiccut/src/components/Resources/list/MusicResourceList.tsx',
  'packages/sdkwork-magic-studio-magiccut/src/components/Resources/panels/MusicResourcePanel.tsx',
  'packages/sdkwork-magic-studio-magiccut/src/components/Resources/panels/TransitionResourcePanel.tsx',
  'packages/sdkwork-magic-studio-magiccut/src/components/Resources/panels/EffectResourcePanel.tsx',
  'packages/sdkwork-magic-studio-magiccut/src/components/Resources/grid/EffectResourceGrid.tsx',
  'packages/sdkwork-magic-studio-magiccut/src/components/Resources/grid/TemplateResourceGrid.tsx',
  'packages/sdkwork-magic-studio-magiccut/src/components/MagicCutDragOverlay.tsx',
  'packages/sdkwork-magic-studio-magiccut/src/components/Export/ExportModal.tsx',
];

test('magiccut thumbnail-bearing surfaces resolve canonical thumbnail references instead of trusting raw thumbnailUrl fields directly', () => {
  for (const relativePath of MAGICCUT_THUMBNAIL_REFERENCE_FILES) {
    const source = readSource(relativePath);

    assert.match(
      source,
      /resolveMagicCutThumbnailReference/,
      `Expected ${relativePath} to resolve thumbnail references through the shared canonical helper.`,
    );
  }
});

test('magiccut template metadata exposes thumbnailPath for canonical persisted references', () => {
  const source = readSource('packages/sdkwork-magic-studio-types/src/magiccut.types.ts');

  assert.match(
    source,
    /thumbnailPath\?: string;/,
    'Expected TemplateMetadata to expose thumbnailPath as the canonical persisted thumbnail reference.',
  );
});

test('magiccut domain asset registration prefers canonical path authority over render urls', () => {
  const favoriteToggleSource = readSource('packages/sdkwork-magic-studio-magiccut/src/domain/assets/favoriteToggle.ts');
  const assetStateSource = readSource('packages/sdkwork-magic-studio-magiccut/src/domain/assets/magicCutAssetState.ts');
  const resourceUtilsSource = readSource('packages/sdkwork-magic-studio-magiccut/src/utils/resourceUtils.ts');

  assert.match(
    favoriteToggleSource,
    /const assetLocator = asset\.path \|\| asset\.url \|\| `assets:\/\/\$\{assetKey\}`;/,
    'Expected favorite registration to prefer canonical asset paths over delivery urls.',
  );
  assert.match(
    assetStateSource,
    /const locatorValue = resolveCanonicalLocatorReference\(/,
    'Expected MagicCut asset state normalization to centralize canonical locator selection.',
  );
  assert.match(
    assetStateSource,
    /const deliveryUrl = resolveDeliveryUrl\(/,
    'Expected MagicCut asset state normalization to keep delivery-url selection separate from locator selection.',
  );
  assert.match(
    resourceUtilsSource,
    /return resource\.path \|\| resource\.localFile\?\.path \|\| resource\.url \|\| '';/,
    'Expected MagicCut synchronous resource fallbacks to prefer canonical paths before render urls.',
  );
});
