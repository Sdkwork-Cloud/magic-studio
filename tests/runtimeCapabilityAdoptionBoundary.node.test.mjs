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

const TARGET_FILES = [
  'src/layouts/MainLayout/MainGlobalHeader.tsx',
  'packages/sdkwork-magic-studio-assets/src/pages/AssetsPage.tsx',
  'packages/sdkwork-magic-studio-assets/src/components/ChooseAssetModalContent.tsx',
  'packages/sdkwork-magic-studio-assets/src/components/generate/PromptTextInput.tsx',
  'packages/sdkwork-magic-studio-assets/src/components/CreationChatInput/StyleSelector.tsx',
  'packages/sdkwork-magic-studio-settings/src/services/settingsService.ts',
  'packages/sdkwork-magic-studio-settings/src/repository/settingsRepository.ts',
  'packages/sdkwork-magic-studio-browser/src/services/browserDownloadService.ts',
  'packages/sdkwork-magic-studio-browser/src/components/AddressBar.tsx',
  'packages/sdkwork-magic-studio-browser/src/components/DownloadsPanel.tsx',
  'packages/sdkwork-magic-studio-browser/src/components/BrowserViewport.tsx',
  'packages/sdkwork-magic-studio-drive/src/services/providers/localProvider.ts',
  'packages/sdkwork-magic-studio-ide-config/src/services/ideConfigService.ts',
  'packages/sdkwork-magic-studio-film/src/repository/filmRepository.ts',
  'packages/sdkwork-magic-studio-magiccut/src/services/export/strategies/DesktopExportStrategy.ts',
  'packages/sdkwork-magic-studio-magiccut/src/services/AssetCacheService.ts',
  'packages/sdkwork-magic-studio-magiccut/src/components/MagicCutEditor.tsx',
  'packages/sdkwork-magic-studio-chat/src/components/ChatBubble.tsx',
  'packages/sdkwork-magic-studio-canvas/src/components/CanvasChatPane.tsx',
  'packages/sdkwork-magic-studio-chatppt/src/components/PPTChatPane.tsx',
  'packages/sdkwork-magic-studio-video/src/components/VideoGenerationItem.tsx',
  'packages/sdkwork-magic-studio-notes/src/components/HtmlSourceModal.tsx',
  'packages/sdkwork-magic-studio-notes/src/components/EditorContextMenu.tsx',
  'packages/sdkwork-magic-studio-editor/src/components/modals/PublishAppModal.tsx',
  'packages/sdkwork-magic-studio-editor/src/components/AIChatPane.tsx',
  'packages/sdkwork-magic-studio-skills/src/pages/SkillDetailPage.tsx',
  'packages/sdkwork-magic-studio-image/src/components/GalleryGrid.tsx',
  'packages/sdkwork-magic-studio-image/src/components/ImageGridEditor.tsx',
  'packages/sdkwork-magic-studio-generation-history/src/components/GenerationItem.tsx',
  'packages/sdkwork-magic-studio-generation-history/src/components/GenerationPreview.tsx',
  'packages/sdkwork-magic-studio-magiccut/src/components/Resources/MagicCutResourcePanel.tsx',
];

test('runtime capability adoption targets prefer getPlatformRuntime over legacy platform compatibility calls', () => {
  for (const relativePath of TARGET_FILES) {
    const source = readSource(relativePath);

    assert.match(
      source,
      /@sdkwork\/magic-studio-core\/platform/,
      `Expected ${relativePath} to use the focused magic-studio-core platform subpath.`,
    );
    assert.doesNotMatch(
      source,
      /from '@sdkwork\/magic-studio-core'|from "@sdkwork\/magic-studio-core"/,
      `Expected ${relativePath} to avoid the broad magic-studio-core root entry for runtime capability work.`,
    );
    assert.match(
      source,
      /getPlatformRuntime/,
      `Expected ${relativePath} to adopt getPlatformRuntime().`,
    );
    assert.doesNotMatch(
      source,
      /import\s*\{\s*platform\s*\}/,
      `Expected ${relativePath} to stop importing the legacy platform compatibility object.`,
    );
    assert.doesNotMatch(
      source,
      /\bplatform\./,
      `Expected ${relativePath} to stop calling legacy platform compatibility methods.`,
    );
  }
});
