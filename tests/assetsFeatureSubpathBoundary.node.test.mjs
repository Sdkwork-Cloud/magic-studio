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
  '@sdkwork/magic-studio-assets/generation',
  '@sdkwork/magic-studio-assets/creation-chat',
  '@sdkwork/magic-studio-assets/choose-asset',
  '@sdkwork/magic-studio-assets/hooks',
  '@sdkwork/magic-studio-assets/entities',
  '@sdkwork/magic-studio-assets/style-selector',
  '@sdkwork/magic-studio-assets/asset-service',
];

const FEATURE_FILE_EXPECTATIONS = [
  {
    relativePath: 'packages/sdkwork-magic-studio-image/src/components/AIImageGeneratorModalContent.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-assets/services'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-image/src/components/ControlPanel.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-assets/generation'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-image/src/components/ImageGeneratorModalContent.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-assets/generation'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-image/src/components/ImageGridEditor.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-assets/services'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-image/src/components/ImageLeftGeneratorPanel.tsx',
    expectedSubpaths: [
      '@sdkwork/magic-studio-assets/choose-asset',
      '@sdkwork/magic-studio-assets/services',
    ],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-image/src/components/ImageModelSelector.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-assets/services'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-image/src/components/panel/ImageAdvancedSettingsSection.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-assets/generation'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-image/src/components/panel/ImagePromptSection.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-assets/generation'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-image/src/components/panel/ImageStyleSection.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-assets/creation-chat'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-image/src/components/panel/ImageReferenceSection.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-assets/asset-center'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-image/src/pages/ImageChatPage.tsx',
    expectedSubpaths: [
      '@sdkwork/magic-studio-assets/generation',
      '@sdkwork/magic-studio-assets/services',
    ],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-image/src/pages/ImagePage.tsx',
    expectedSubpaths: [
      '@sdkwork/magic-studio-assets/generation',
      '@sdkwork/magic-studio-assets/asset-center',
    ],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-image/src/pages/importImageTask.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-assets/generation'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-image/src/services/imageGenerationAssetPersistence.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-assets/services'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-image/src/services/imageEditorAssetPersistence.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-assets/services'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-image/src/services/imageService.ts',
    expectedSubpaths: [
      '@sdkwork/magic-studio-assets/services',
      '@sdkwork/magic-studio-assets/asset-center',
    ],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-video/src/services/videoService.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-assets/asset-center'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-video/src/services/videoGenerationAssetPersistence.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-assets/services'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-video/src/components/VideoModelSelector.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-assets/services'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-video/src/components/VideoLeftGeneratorPanel.tsx',
    expectedSubpaths: [
      '@sdkwork/magic-studio-assets/choose-asset',
      '@sdkwork/magic-studio-assets/creation-chat',
      '@sdkwork/magic-studio-assets/hooks',
      '@sdkwork/magic-studio-assets/asset-center',
    ],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-video/src/components/VideoGeneratorModal.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-assets/generation'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-video/src/components/VideoChatInput.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-assets/creation-chat'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-video/src/components/modes/SubjectReferenceSection.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-assets/choose-asset'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-video/src/components/modes/StartEndFramesSection.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-assets/choose-asset'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-video/src/components/modes/SmartFramesSection.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-assets/services'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-video/src/components/modes/LipSyncSection.tsx',
    expectedSubpaths: [
      '@sdkwork/magic-studio-assets/choose-asset',
      '@sdkwork/magic-studio-assets/generation',
    ],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-video/src/components/panel/VideoPromptStyleSection.tsx',
    expectedSubpaths: [
      '@sdkwork/magic-studio-assets/choose-asset',
      '@sdkwork/magic-studio-assets/generation',
      '@sdkwork/magic-studio-assets/creation-chat',
    ],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-video/src/pages/VideoPage.tsx',
    expectedSubpaths: [
      '@sdkwork/magic-studio-assets/generation',
      '@sdkwork/magic-studio-assets/asset-center',
    ],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-video/src/pages/VideoChatPage.tsx',
    expectedSubpaths: [
      '@sdkwork/magic-studio-assets/generation',
      '@sdkwork/magic-studio-assets/services',
    ],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-video/src/pages/importVideoTask.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-assets/generation'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-audio/src/services/audioGenerationAssetPersistence.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-assets/services'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-audio/src/components/AudioModelSelector.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-assets/services'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-audio/src/components/AudioLeftGeneratorPanel.tsx',
    expectedSubpaths: [
      '@sdkwork/magic-studio-assets/choose-asset',
      '@sdkwork/magic-studio-assets/generation',
      '@sdkwork/magic-studio-assets/services',
      '@sdkwork/magic-studio-assets/asset-center',
      '@sdkwork/magic-studio-assets/entities',
    ],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-audio/src/components/AudioGeneratorModal.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-assets/generation'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-audio/src/pages/AudioPage.tsx',
    expectedSubpaths: [
      '@sdkwork/magic-studio-assets/generation',
      '@sdkwork/magic-studio-assets/asset-center',
    ],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-audio/src/pages/AudioChatPage.tsx',
    expectedSubpaths: [
      '@sdkwork/magic-studio-assets/generation',
      '@sdkwork/magic-studio-assets/services',
    ],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-audio/src/pages/importAudioTask.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-assets/generation'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-music/src/services/musicGenerationAssetPersistence.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-assets/services'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-music/src/components/MusicModelSelector.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-assets/services'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-music/src/components/MusicLeftGeneratorPanel.tsx',
    expectedSubpaths: [
      '@sdkwork/magic-studio-assets/choose-asset',
      '@sdkwork/magic-studio-assets/generation',
      '@sdkwork/magic-studio-assets/asset-center',
      '@sdkwork/magic-studio-assets/entities',
    ],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-music/src/components/MusicGeneratorModal.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-assets/generation'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-music/src/pages/MusicPage.tsx',
    expectedSubpaths: [
      '@sdkwork/magic-studio-assets/generation',
      '@sdkwork/magic-studio-assets/asset-center',
    ],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-music/src/pages/MusicChatPage.tsx',
    expectedSubpaths: [
      '@sdkwork/magic-studio-assets/generation',
      '@sdkwork/magic-studio-assets/services',
      '@sdkwork/magic-studio-assets/asset-center',
    ],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-music/src/pages/importMusicTask.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-assets/generation'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-sfx/src/services/sfxGenerationAssetPersistence.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-assets/services'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-sfx/src/components/SfxLeftGeneratorPanel.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-assets/generation'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-sfx/src/components/SfxGeneratorModal.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-assets/generation'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-sfx/src/pages/SfxPage.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-assets/generation'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-sfx/src/pages/SfxChatPage.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-assets/generation'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-sfx/src/pages/importSfxTask.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-assets/generation'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-voicespeaker/src/services/voiceSpeakerService.ts',
    expectedSubpaths: [
      '@sdkwork/magic-studio-assets/services',
      '@sdkwork/magic-studio-assets/asset-center',
      '@sdkwork/magic-studio-assets/entities',
    ],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-voicespeaker/src/services/voiceService.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-assets/asset-center'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-voicespeaker/src/services/voiceGenerationAssetPersistence.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-assets/services'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-voicespeaker/src/components/VoiceModelSelector.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-assets/services'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-voicespeaker/src/components/VoiceLeftGeneratorPanel.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-assets/choose-asset'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-voicespeaker/src/components/panel/VoicePersonaSection.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-assets/choose-asset'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-voicespeaker/src/components/panel/VoiceDesignTabPanel.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-assets/generation'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-voicespeaker/src/components/voicespeaker/VoiceLabModal.tsx',
    expectedSubpaths: [
      '@sdkwork/magic-studio-assets/choose-asset',
      '@sdkwork/magic-studio-assets/entities',
    ],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-voicespeaker/src/pages/VoicePage.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-assets/generation'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-voicespeaker/src/pages/VoiceChatPage.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-assets/generation'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-voicespeaker/src/pages/importVoiceTask.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-assets/generation'],
  },
];

test('vite and tsconfig expose focused magic-studio-assets media feature subpaths', () => {
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

test('media feature packages use focused magic-studio-assets subpaths instead of the broad package root', () => {
  for (const { relativePath, expectedSubpaths } of FEATURE_FILE_EXPECTATIONS) {
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
