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

test('ChooseAssetModal lazy-loads heavy asset center internals instead of statically importing them', () => {
  const modalSource = readSource('packages/sdkwork-magic-studio-assets/src/components/ChooseAssetModal.tsx');

  assert.match(
    modalSource,
    /lazy\(\(\)\s*=>\s*import\('.\/ChooseAssetModalContent'\)|lazy\(\(\)\s*=>\s*import\("\.\/ChooseAssetModalContent"\)/,
    'Expected ChooseAssetModal to lazy-load the heavy modal content module.',
  );
  assert.doesNotMatch(
    modalSource,
    /from '\.\/AssetSidebar'|from "\.\/AssetSidebar"|from '\.\/AssetGrid'|from "\.\/AssetGrid"|from '\.\.\/store\/assetStore'|from "\.\.\/store\/assetStore"/,
    'Expected ChooseAssetModal wrapper to stop statically importing asset-center internals.',
  );
});

test('ChooseAssetModalContent owns the heavy asset center dependencies behind the lazy boundary', () => {
  const modalContentSource = readSource('packages/sdkwork-magic-studio-assets/src/components/ChooseAssetModalContent.tsx');

  assert.match(
    modalContentSource,
    /from '\.\/AssetSidebar'|from "\.\/AssetSidebar"/,
    'Expected ChooseAssetModalContent to import AssetSidebar behind the lazy boundary.',
  );
  assert.match(
    modalContentSource,
    /from '\.\/AssetGrid'|from "\.\/AssetGrid"/,
    'Expected ChooseAssetModalContent to import AssetGrid behind the lazy boundary.',
  );
  assert.match(
    modalContentSource,
    /from '\.\.\/store\/assetStore'|from "\.\.\/store\/assetStore"/,
    'Expected ChooseAssetModalContent to import AssetStoreProvider behind the lazy boundary.',
  );
});
