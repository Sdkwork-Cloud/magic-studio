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

test('asset sdk query service uses the canonical asset server client instead of the broad app client singleton', () => {
  const source = readSource('packages/sdkwork-magic-studio-assets/src/services/assetSdkQueryService.ts');

  assert.doesNotMatch(
    source,
    /getAppSdkClientWithSession/,
    'Expected assetSdkQueryService to stop pulling the broad app client into the assets hot path.',
  );
  assert.match(
    source,
    /getAssetServerClient/,
    'Expected assetSdkQueryService to resolve host-owned asset flows through the canonical Magic Studio server client.',
  );
  assert.match(
    source,
    /readAssetServerRuntime/,
    'Expected assetSdkQueryService to resolve runtime storage through the same canonical server runtime.',
  );
});

test('remote asset index repository stays on the canonical Magic Studio server asset boundary', () => {
  const source = readSource('packages/sdkwork-magic-studio-assets/src/asset-center/infrastructure/RemoteAssetIndexRepository.ts');

  assert.doesNotMatch(
    source,
    /getAppSdkClientWithSession/,
    'Expected RemoteAssetIndexRepository to stop importing the broad app client helper.',
  );
  assert.match(
    source,
    /getAssetServerClient/,
    'Expected RemoteAssetIndexRepository to resolve host-owned asset flows through the canonical Magic Studio server client.',
  );
  assert.match(
    source,
    /upsertAsset/,
    'Expected RemoteAssetIndexRepository save semantics to use the canonical server upsertAsset method instead of an app-sdk aggregate.',
  );
  assert.doesNotMatch(
    source,
    /getAssetCenterSdkClientWithSession|AssetCenterApi|createAssetCenterApi|@sdkwork\/app-sdk/,
    'Expected RemoteAssetIndexRepository to avoid retired app-sdk asset-center surfaces.',
  );
});

test('magic-studio-core sdk facade no longer exports an app-sdk asset-center compatibility helper', () => {
  const sdkIndexSource = readSource('packages/sdkwork-magic-studio-core/src/sdk/index.ts');

  assert.doesNotMatch(
    sdkIndexSource,
    /assetCenterClient/,
    'Expected magic-studio-core/sdk to stop exporting the retired app-sdk asset-center helper.',
  );
  assert.equal(
    fs.existsSync(path.resolve(workspaceRoot, 'packages/sdkwork-magic-studio-core/src/sdk/assetCenterClient.ts')),
    false,
    'Expected the retired app-sdk asset-center helper file to be removed instead of kept as dead compatibility code.',
  );
});

test('vite sdk aliasing resolves @sdkwork/app-sdk subpath imports to the selected source checkout', () => {
  const source = readSource('vite.config.ts');

  assert.match(
    source,
    /\^@sdkwork\\\/app-sdk\\\/\(\.\+\)\$/,
    'Expected vite.config.ts to define a regex alias for @sdkwork/app-sdk subpath imports.',
  );
});

test('asset store uses precise service and asset-center subpath imports instead of broad barrels', () => {
  const source = readSource('packages/sdkwork-magic-studio-assets/src/store/assetStore.tsx');

  assert.doesNotMatch(
    source,
    /from '\.\.\/services'|from "\.\.\/services"/,
    'Expected assetStore.tsx to stop importing from the broad ../services barrel.',
  );
  assert.doesNotMatch(
    source,
    /from '\.\.\/asset-center'|from "\.\.\/asset-center"/,
    'Expected assetStore.tsx to stop importing from the broad ../asset-center barrel.',
  );
  assert.match(
    source,
    /from '\.\.\/services\/assetBusinessService'|from "\.\.\/services\/assetBusinessService"/,
    'Expected assetStore.tsx to import assetBusinessService directly from its file.',
  );
  assert.match(
    source,
    /from '\.\.\/asset-center\/application\/assetCenterAdapters'|from "\.\.\/asset-center\/application\/assetCenterAdapters"/,
    'Expected assetStore.tsx to import paging helpers from assetCenterAdapters directly.',
  );
  assert.match(
    source,
    /from '\.\.\/asset-center\/domain\/assetCategory\.domain'|from "\.\.\/asset-center\/domain\/assetCategory\.domain"/,
    'Expected assetStore.tsx to import asset category helpers directly from assetCategory.domain.',
  );
});

test('asset preview and selection components import asset-center helpers from precise subpaths', () => {
  const assetGridSource = readSource('packages/sdkwork-magic-studio-assets/src/components/AssetGrid.tsx');
  const assetPreviewModalSource = readSource('packages/sdkwork-magic-studio-assets/src/components/AssetPreviewModal.tsx');
  const chooseAssetSource = readSource('packages/sdkwork-magic-studio-assets/src/components/ChooseAsset.tsx');
  const assetTypeTabsSource = readSource('packages/sdkwork-magic-studio-assets/src/components/AssetTypeTabs.tsx');
  const assetSidebarSource = readSource('packages/sdkwork-magic-studio-assets/src/components/AssetSidebar.tsx');

  assert.doesNotMatch(
    assetGridSource,
    /from '\.\.\/asset-center'|from "\.\.\/asset-center"/,
    'Expected AssetGrid.tsx to stop importing the broad ../asset-center barrel.',
  );
  assert.match(
    assetGridSource,
    /from '\.\.\/asset-center\/application\/assetUrlResolver'|from "\.\.\/asset-center\/application\/assetUrlResolver"/,
    'Expected AssetGrid.tsx to import resolveAssetUrlByAssetIdFirst from assetUrlResolver directly.',
  );

  assert.doesNotMatch(
    assetPreviewModalSource,
    /from '\.\.\/asset-center'|from "\.\.\/asset-center"/,
    'Expected AssetPreviewModal.tsx to stop importing the broad ../asset-center barrel.',
  );
  assert.match(
    assetPreviewModalSource,
    /from '\.\.\/asset-center\/application\/assetUrlResolver'|from "\.\.\/asset-center\/application\/assetUrlResolver"/,
    'Expected AssetPreviewModal.tsx to import resolveAssetUrlByAssetIdFirst from assetUrlResolver directly.',
  );

  assert.doesNotMatch(
    chooseAssetSource,
    /from '\.\.\/asset-center'|from "\.\.\/asset-center"/,
    'Expected ChooseAsset.tsx to stop importing the broad ../asset-center barrel.',
  );
  assert.doesNotMatch(
    chooseAssetSource,
    /from '\.\.\/services'|from "\.\.\/services"/,
    'Expected ChooseAsset.tsx to stop importing the broad ../services barrel.',
  );
  assert.match(
    chooseAssetSource,
    /from '\.\.\/asset-center\/domain\/assetCategory\.domain'|from "\.\.\/asset-center\/domain\/assetCategory\.domain"/,
    'Expected ChooseAsset.tsx to import asset category helpers directly from assetCategory.domain.',
  );
  assert.match(
    chooseAssetSource,
    /from '\.\.\/asset-center\/application\/assetUrlResolver'|from "\.\.\/asset-center\/application\/assetUrlResolver"/,
    'Expected ChooseAsset.tsx to import resolveAssetUrlByAssetIdFirst from assetUrlResolver directly.',
  );
  assert.match(
    chooseAssetSource,
    /from '\.\.\/services\/assetBusinessService'|from "\.\.\/services\/assetBusinessService"/,
    'Expected ChooseAsset.tsx to import assetBusinessService directly from its file.',
  );

  assert.doesNotMatch(
    assetTypeTabsSource,
    /from '\.\.\/asset-center'|from "\.\.\/asset-center"/,
    'Expected AssetTypeTabs.tsx to stop importing the broad ../asset-center barrel.',
  );
  assert.match(
    assetTypeTabsSource,
    /from '\.\.\/asset-center\/domain\/assetCategory\.domain'|from "\.\.\/asset-center\/domain\/assetCategory\.domain"/,
    'Expected AssetTypeTabs.tsx to import ASSET_CENTER_CATEGORIES directly from assetCategory.domain.',
  );

  assert.doesNotMatch(
    assetSidebarSource,
    /from '\.\.\/asset-center'|from "\.\.\/asset-center"/,
    'Expected AssetSidebar.tsx to stop importing the broad ../asset-center barrel.',
  );
  assert.match(
    assetSidebarSource,
    /from '\.\.\/asset-center\/domain\/assetCategory\.domain'|from "\.\.\/asset-center\/domain\/assetCategory\.domain"/,
    'Expected AssetSidebar.tsx to import ASSET_CENTER_CATEGORIES directly from assetCategory.domain.',
  );
});

test('asset preview modal renders only canonical resolved urls or already-renderable fallbacks', () => {
  const assetPreviewModalSource = readSource('packages/sdkwork-magic-studio-assets/src/components/AssetPreviewModal.tsx');

  assert.match(
    assetPreviewModalSource,
    /const fallbackPreviewUrl = isRenderableAssetUrl\(asset\.path\) \? asset\.path : null;/,
    'Expected AssetPreviewModal.tsx to gate any fallback preview path behind the renderable-url check.',
  );
  assert.match(
    assetPreviewModalSource,
    /const previewUrl = url \|\| fallbackPreviewUrl;/,
    'Expected AssetPreviewModal.tsx to keep the canonical hook as the primary preview authority.',
  );
  assert.doesNotMatch(
    assetPreviewModalSource,
    /const previewUrl = url \|\| asset\.path;/,
    'Expected AssetPreviewModal.tsx to stop rendering raw locator paths as direct preview urls.',
  );
});

test('creation chat mention previews resolve attachment locators through the canonical asset hook', () => {
  const mentionListSource = readSource(
    'packages/sdkwork-magic-studio-assets/src/components/CreationChatInput/components/MentionList.tsx'
  );
  const mentionPreviewPopoverSource = readSource(
    'packages/sdkwork-magic-studio-assets/src/components/CreationChatInput/components/MentionPreviewPopover.tsx'
  );

  assert.match(
    mentionListSource,
    /useAssetUrl\(item\.url\)/,
    'Expected MentionList.tsx to resolve mention thumbnails through the canonical asset hook.',
  );
  assert.doesNotMatch(
    mentionListSource,
    /<img src=\{item\.url\}/,
    'Expected MentionList.tsx to stop rendering mention thumbnails from raw item.url values.',
  );
  assert.match(
    mentionPreviewPopoverSource,
    /useAssetUrl\(attachment\?\.url \|\| null\)/,
    'Expected MentionPreviewPopover.tsx to resolve locator-backed attachment previews through the canonical asset hook.',
  );
  assert.doesNotMatch(
    mentionPreviewPopoverSource,
    /<img src=\{attachment\.url\}|<video src=\{attachment\.url\}|<audio src=\{attachment\.url\}/,
    'Expected MentionPreviewPopover.tsx to stop rendering raw attachment.url locator values directly.',
  );
});

test('cover generation and style selector previews resolve asset-like urls through the canonical asset hook', () => {
  const aiGenerateCoverModalSource = readSource(
    'packages/sdkwork-magic-studio-assets/src/components/AIGenerateCoverModal.tsx'
  );
  const styleSelectorSource = readSource(
    'packages/sdkwork-magic-studio-assets/src/components/CreationChatInput/StyleSelector.tsx'
  );

  assert.match(
    aiGenerateCoverModalSource,
    /useAssetUrl\(generatedImage\?\.path \|\| generatedImage\?\.url \|\| null\)/,
    'Expected AIGenerateCoverModal.tsx to resolve generated cover previews through the canonical asset hook.',
  );
  assert.doesNotMatch(
    aiGenerateCoverModalSource,
    /<img src=\{generatedImage\?\.url/,
    'Expected AIGenerateCoverModal.tsx to stop rendering generatedImage.url directly.',
  );

  assert.match(
    styleSelectorSource,
    /const resolveStyleAssetReference = \(asset\?: StyleAsset \| null\): string \| null =>/,
    'Expected StyleSelector.tsx to centralize style asset reference selection through a shared helper.',
  );
  assert.match(
    styleSelectorSource,
    /useAssetUrl\(resolveStyleAssetReference\(displayOption\?\.assets\?\.scene\)\)/,
    'Expected StyleSelector.tsx to resolve the active scene preview through the canonical asset hook.',
  );
  assert.match(
    styleSelectorSource,
    /useAssetUrl\(resolveStyleAssetReference\(displayOption\?\.assets\?\.portrait\)\)/,
    'Expected StyleSelector.tsx to resolve the active portrait preview through the canonical asset hook.',
  );
  assert.match(
    styleSelectorSource,
    /useAssetUrl\(resolveStyleAssetReference\(displayOption\?\.assets\?\.sheet\)\)/,
    'Expected StyleSelector.tsx to resolve the active sheet preview through the canonical asset hook.',
  );
  assert.match(
    styleSelectorSource,
    /const thumbnailSource = resolveStyleAssetReference\(style\.assets\?\.scene\) \|\| resolveStyleAssetReference\(style\.assets\?\.portrait\);/,
    'Expected StyleSelector.tsx to centralize style card thumbnail source selection.',
  );
  assert.match(
    styleSelectorSource,
    /useAssetUrl\(thumbnailSource\)/,
    'Expected StyleSelector.tsx to resolve style card thumbnails through the canonical asset hook.',
  );
  assert.match(
    styleSelectorSource,
    /path\?: string;/,
    'Expected StyleAsset to expose a canonical path field for locator-backed previews.',
  );
  assert.match(
    readSource('packages/sdkwork-magic-studio-assets/src/services/creationCapabilityService.ts'),
    /const path = normalizeText\(asset\.path\) \|\| undefined;[\s\S]*return \{[\s\S]*path,/,
    'Expected creation capability style assets to preserve a canonical path field.',
  );
});

test('asset url resolver stays on focused service files instead of the broad services barrel', () => {
  const source = readSource('packages/sdkwork-magic-studio-assets/src/asset-center/application/assetUrlResolver.ts');

  assert.doesNotMatch(
    source,
    /from '\.\.\/\.\.\/services'|from "\.\.\/\.\.\/services"/,
    'Expected assetUrlResolver.ts to stop importing the broad ../../services barrel.',
  );
  assert.match(
    source,
    /from '\.\.\/\.\.\/services\/assetBusinessService'|from "\.\.\/\.\.\/services\/assetBusinessService"/,
    'Expected assetUrlResolver.ts to import assetBusinessService directly from its file.',
  );
});
