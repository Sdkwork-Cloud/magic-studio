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
  '@sdkwork/magic-studio-core/router',
  '@sdkwork/magic-studio-core/eventBus',
  '@sdkwork/magic-studio-core/platform',
  '@sdkwork/magic-studio-core/services',
  '@sdkwork/magic-studio-core/storage',
  '@sdkwork/magic-studio-core/ai',
  '@sdkwork/magic-studio-core/sdk',
];

const TARGET_FILE_EXPECTATIONS = [
  {
    relativePath: 'packages/sdkwork-magic-studio-prompt/src/pages/PromptOptimizerPage.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-core/router'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-assets/src/components/CreationChatInput/StyleSelector.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-core/platform'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-prompt/src/services/promptBusinessService.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-core/sdk'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-assets/src/services/creationCapabilityService.ts',
    expectedSubpaths: [],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-assets/src/services/creationServerClient.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-core/sdk'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-assets/src/services/assetSdkQueryService.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-core/services', '@sdkwork/magic-studio-core/storage'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-assets/src/services/assetServerClient.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-core/sdk'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-assets/src/asset-center/infrastructure/RemoteAssetIndexRepository.ts',
    expectedSubpaths: [],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-assets/src/services/generatedSelectionAssetPersistence.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-core/services'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-assets/src/services/generatedOutcomeAssetPersistence.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-core/services'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-assets/src/services/coverGenerationService.ts',
    expectedSubpaths: [],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-assets/src/services/assetService.ts',
    expectedSubpaths: [
      '@sdkwork/magic-studio-core/platform',
      '@sdkwork/magic-studio-core/services',
      '@sdkwork/magic-studio-core/storage',
    ],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-assets/src/components/generate/PromptTextInput.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-core/platform', '@sdkwork/magic-studio-core/sdk'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-assets/src/components/generate/PromptPickerDialog.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-core/sdk'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-assets/src/components/generate/PromptHistoryDialog.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-core/sdk'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-assets/src/components/generate/promptCapabilityProps.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-core/sdk'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-assets/src/components/ChooseAsset.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-core/services'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-assets/src/components/ChooseAssetModalContent.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-core/platform'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-assets/src/asset-center/infrastructure/DefaultAssetUrlResolver.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-core/platform', '@sdkwork/magic-studio-core/storage'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-assets/src/asset-center/infrastructure/CoreMediaAnalysisAdapter.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-core/services'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-assets/src/asset-center/infrastructure/RuntimeAssetVfs.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-core/platform', '@sdkwork/magic-studio-core/storage'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-assets/src/asset-center/application/magicStudioAssetLayout.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-core/storage'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-assets/src/asset-center/application/magicStudioStorageConfig.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-core/storage'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-chat/src/services/chatStoragePaths.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-core/storage'],
  },
  {
    relativePath: 'src/app/bootstrap.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-core/platform', '@sdkwork/magic-studio-core/services'],
  },
  {
    relativePath: 'src/layouts/MainLayout/MainSidebar.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-core/platform', '@sdkwork/magic-studio-core/router'],
  },
  {
    relativePath: 'src/layouts/MainLayout/MainGlobalHeader.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-core/platform', '@sdkwork/magic-studio-core/router'],
  },
  {
    relativePath: 'src/layouts/MagicCutLayout/MagicCutLayoutHeader.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-core/platform', '@sdkwork/magic-studio-core/router'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-auth/src/pages/LoginPage.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-core/platform', '@sdkwork/magic-studio-core/router'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-portal-video/src/components/PortalHeader.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-core/platform', '@sdkwork/magic-studio-core/router', '@sdkwork/magic-studio-core/sdk'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-compression/src/compressionService.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-core/platform'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-drive/src/utils/uploadHelper.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-core/platform'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-editor/src/utils/filePicker.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-core/platform'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-settings/src/components/SettingsWidgets.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-core/platform'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-magiccut/src/services/export/ExportRegistry.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-core/platform'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-magiccut/src/engine/config/renderProfile.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-core/platform'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-magiccut/src/utils/resourceUtils.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-core/services'],
  },
  {
    relativePath: 'src/app/AppProvider.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-core/router'],
  },
  {
    relativePath: 'src/app/App.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-core/router'],
  },
  {
    relativePath: 'src/router/index.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-core/router'],
  },
  {
    relativePath: 'src/shims/react-router-dom.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-core/router'],
  },
  {
    relativePath: 'src/pages/LoginPage.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-core/router'],
  },
  {
    relativePath: 'src/pages/AuthOAuthCallbackPage.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-core/router'],
  },
  {
    relativePath: 'src/layouts/VibeLayout/VibeLayoutSidebar.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-core/router'],
  },
  {
    relativePath: 'src/layouts/NotesLayout/NotesHeader.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-core/router'],
  },
  {
    relativePath: 'src/layouts/GenerationLayout/GenerationLayoutSidebar.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-core/router'],
  },
  {
    relativePath: 'src/layouts/CreationLayout/CreationLayoutSidebar.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-core/router'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-audio/src/pages/AudioPage.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-core/router'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-audio/src/pages/AudioChatPage.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-core/router', '@sdkwork/magic-studio-core/services'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-image/src/pages/ImagePage.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-core/router'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-image/src/pages/ImageChatPage.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-core/router', '@sdkwork/magic-studio-core/services'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-video/src/pages/VideoPage.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-core/router'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-video/src/pages/VideoChatPage.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-core/router', '@sdkwork/magic-studio-core/services'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-music/src/pages/MusicPage.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-core/router'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-music/src/pages/MusicChatPage.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-core/router', '@sdkwork/magic-studio-core/services'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-voicespeaker/src/pages/VoicePage.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-core/router'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-voicespeaker/src/pages/VoiceChatPage.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-core/router', '@sdkwork/magic-studio-core/services'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-film/src/pages/FilmPage.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-core/router'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-film/src/pages/FilmEditorPage.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-core/router'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-film/src/components/FilmSidebar.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-core/router'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-canvas/src/pages/CanvasPage.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-core/router'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-chat/src/pages/ChatPage.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-core/router'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-skills/src/pages/SkillsPage.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-core/router'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-character/src/pages/CharacterChatPage.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-core/router', '@sdkwork/magic-studio-core/services'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-portal-video/src/components/ToolsGrid.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-core/router', '@sdkwork/magic-studio-core/services'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-film/src/services/filmService.ts',
    expectedSubpaths: [],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-film/src/services/filmProjectService.ts',
    expectedSubpaths: [],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-film/src/services/filmServerSupport.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-core/sdk'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-voicespeaker/src/services/voiceService.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-core/platform', '@sdkwork/magic-studio-core/services'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-voicespeaker/src/services/voiceServerClient.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-core/sdk'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-voicespeaker/src/services/voiceSpeakerService.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-core/sdk'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-voicespeaker/src/services/voiceHistoryService.ts',
    expectedSubpaths: [],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-vip/src/services/vipService.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-core/sdk'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-notes/src/services/noteService.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-core/sdk'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-settings/src/services/settingsPromptService.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-core/sdk'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-character/src/services/characterService.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-core/platform', '@sdkwork/magic-studio-core/sdk', '@sdkwork/magic-studio-core/services'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-skills/src/services/skillsService.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-core/sdk'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-portal-video/src/services/portalVideoService.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-core/sdk'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-trade/src/services/paymentService.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-core/sdk'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-trade/src/services/orderService.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-core/sdk'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-notifications/src/services/notificationService.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-core/sdk'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-browser/src/services/browserHistoryService.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-core/services'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-browser/src/services/browserBookmarkService.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-core/services'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-audio/src/services/audioHistoryService.ts',
    expectedSubpaths: [],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-image/src/services/imageHistoryService.ts',
    expectedSubpaths: [],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-sfx/src/services/sfxHistoryService.ts',
    expectedSubpaths: [],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-canvas/src/services/canvasHistoryService.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-core/services'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-chatppt/src/services/chatPPTService.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-core/sdk'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-editor/src/services/editorSessionService.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-core/services'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-magiccut/src/services/magicCutProjectService.ts',
    expectedSubpaths: [],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-magiccut/src/services/magicCutServerSupport.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-core/sdk'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-character/src/pages/CharacterPage.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-core/router'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-trade/src/pages/TaskMarketPage.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-core/router'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-trade/src/pages/MyTasksPage.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-core/router'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-trade/src/components/Layout/TradeLayout.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-core/router', '@sdkwork/magic-studio-core/sdk'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-auth/src/pages/authRouteUtils.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-core/router'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-auth/src/pages/AuthOAuthCallbackPage.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-core/router'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-auth/src/components/auth/authConfig.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-core/router'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-portal-video/src/pages/DownloadAppPage.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-core/router'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-portal-video/src/pages/AIToolsPage.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-core/router'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-portal-video/src/components/FeaturedBanner.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-core/router'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-sfx/src/pages/SfxPage.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-core/router'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-sfx/src/pages/SfxChatPage.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-core/router'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-magiccut/src/pages/MagicCutPage.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-core/router'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-magiccut/src/providers/MagicCutEventProvider.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-core/eventBus'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-magiccut/src/engine/renderer/ResourceManager.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-core/services'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-magiccut/src/components/Timeline/WaveformOverlay.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-core/services'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-magiccut/src/components/Timeline/visuals/ClipFilmstrip.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-core/services'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-magiccut/src/components/Timeline/MagicCutTrackHeader.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-core/services'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-compression/src/services/runtimeCompressionService.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-core/platform'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-canvas/src/components/CanvasNode.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-core/services'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-canvas/src/components/CanvasZoomControls.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-core/platform', '@sdkwork/magic-studio-core/router', '@sdkwork/magic-studio-core/services'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-film/src/components/ShotModal.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-core/services'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-drive/src/viewers/impl/CodeViewer.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-core/services'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-image/src/services/imageEditorAssetPersistence.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-core/services'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-magiccut/src/utils/generatedSelectionImport.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-core/services'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-magiccut/src/store/magicCutStore.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-core/services'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-canvas/src/services/canvasExportService.ts',
    expectedSubpaths: [
      '@sdkwork/magic-studio-core/platform',
      '@sdkwork/magic-studio-core/services',
      '@sdkwork/magic-studio-core/storage',
    ],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-film/src/utils/filmModalAssetImport.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-core/ai', '@sdkwork/magic-studio-core/services'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-drive/src/services/driveMetadataService.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-core/services'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-notes/src/components/AIDrafterModal.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-core/ai'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-notes/src/components/NoteEditor.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-core/ai'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-prompt/src/router/types.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-core/router'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-settings/src/components/StorageSettings.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-core/services'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-portal-video/src/pages/PortalPage.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-core/router', '@sdkwork/magic-studio-core/services'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-portal-video/src/components/PortalSidebar.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-core/router', '@sdkwork/magic-studio-core/platform'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-workspace/src/services/workspaceService.ts',
    expectedSubpaths: [
      '@sdkwork/magic-studio-core/sdk',
      '@sdkwork/magic-studio-core/storage',
    ],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-auth/src/services/sdkworkAuthBridge.ts',
    expectedSubpaths: [],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-auth/src/services/appAuthService.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-core/sdk'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-auth/src/store/authStore.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-core/sdk'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-chat/src/services/chatService.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-core/ai', '@sdkwork/magic-studio-core/sdk'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-audio/src/services/audioService.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-core/platform', '@sdkwork/magic-studio-core/services'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-audio/src/services/audioServerClient.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-core/sdk'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-editor/src/services/editorService.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-core/platform'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-editor/src/components/FileExplorer.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-core/platform'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-editor/src/components/file-explorer/FileTreeNode.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-core/platform'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-editor/src/store/editorStore.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-core/platform'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-drive/src/services/driveService.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-core/platform', '@sdkwork/magic-studio-core/storage'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-drive/src/services/driveBusinessService.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-core/platform', '@sdkwork/magic-studio-core/sdk'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-magiccut/src/services/templateService.ts',
    expectedSubpaths: [],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-magiccut/src/components/Export/ExportModal.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-core/platform'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-user/src/services/userCenterService.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-core/sdk'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-film/src/pages/FilmHomePage.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-core/router', '@sdkwork/magic-studio-core/services'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-video/src/services/videoService.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-core/ai', '@sdkwork/magic-studio-core/sdk'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-image/src/services/imageService.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-core/ai', '@sdkwork/magic-studio-core/sdk', '@sdkwork/magic-studio-core/services'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-music/src/services/musicService.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-core/platform', '@sdkwork/magic-studio-core/services'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-sfx/src/services/sfxService.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-core/platform', '@sdkwork/magic-studio-core/services'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-video/src/store/videoStore.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-core/ai'],
  },
];

test('vite and tsconfig expose focused magic-studio-core subpaths for router/platform/services/sdk boundaries', () => {
  const viteSource = readSource('vite.config.ts');
  const tsconfigSource = readSource('tsconfig.json');

  for (const subpath of EXPECTED_ALIAS_SUBPATHS) {
    const escaped = subpath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    assert.match(
      viteSource,
      new RegExp(escaped),
      `Expected vite.config.ts to define alias support for ${subpath}.`,
    );
    assert.match(
      tsconfigSource,
      new RegExp(escaped),
      `Expected tsconfig.json to define path support for ${subpath}.`,
    );
  }
});

test('magic-studio-core package exports include focused ai and storage public entrypoints', () => {
  const packageJson = JSON.parse(readSource('packages/sdkwork-magic-studio-core/package.json'));
  const exportsField = packageJson.exports ?? {};

  for (const exportKey of ['./ai', './storage']) {
    assert.ok(
      exportsField[exportKey],
      `Expected @sdkwork/magic-studio-core to export ${exportKey}.`,
    );
  }
});

test('high-value prompt and assets runtime files avoid the broad magic-studio-core root entry', () => {
  for (const { relativePath, expectedSubpaths } of TARGET_FILE_EXPECTATIONS) {
    const source = readSource(relativePath);

    assert.doesNotMatch(
      source,
      /from '@sdkwork\/magic-studio-core'|from "@sdkwork\/magic-studio-core"/,
      `Expected ${relativePath} to stop importing runtime capabilities from the broad magic-studio-core root entry.`,
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
