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

const EXPECTATIONS = [
  {
    relativePath: 'packages/sdkwork-magic-studio-canvas/src/components/CanvasDrawer.tsx',
    forbiddenRoots: ['@sdkwork/magic-studio-image', '@sdkwork/magic-studio-video'],
    requiredSubpaths: [
      '@sdkwork/magic-studio-image/panels',
      '@sdkwork/magic-studio-image/store',
      '@sdkwork/magic-studio-video/panels',
      '@sdkwork/magic-studio-video/store',
    ],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-canvas/src/components/CanvasNode.tsx',
    forbiddenRoots: ['@sdkwork/magic-studio-image', '@sdkwork/magic-studio-video'],
    requiredSubpaths: [
      '@sdkwork/magic-studio-image/selectors',
      '@sdkwork/magic-studio-video/selectors',
    ],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-canvas/src/services/canvasGenerationService.ts',
    forbiddenRoots: ['@sdkwork/magic-studio-image', '@sdkwork/magic-studio-video'],
    requiredSubpaths: [
      '@sdkwork/magic-studio-image/entities',
      '@sdkwork/magic-studio-image/services',
      '@sdkwork/magic-studio-video/entities',
      '@sdkwork/magic-studio-video/services',
    ],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-assets/src/services/coverGenerationService.ts',
    forbiddenRoots: ['@sdkwork/magic-studio-image'],
    requiredSubpaths: [
      './coverGenerationAdapter',
    ],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-character/src/components/CharacterLeftGeneratorPanel.tsx',
    forbiddenRoots: ['@sdkwork/magic-studio-image', '@sdkwork/magic-studio-voicespeaker'],
    requiredSubpaths: [
      '@sdkwork/magic-studio-image/modals',
      '@sdkwork/magic-studio-image/constants',
      '@sdkwork/magic-studio-image/selectors',
      '@sdkwork/magic-studio-image/services',
      '@sdkwork/magic-studio-voicespeaker/picker',
      '@sdkwork/magic-studio-voicespeaker/constants',
    ],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-film/src/components/ShotModal.tsx',
    forbiddenRoots: ['@sdkwork/magic-studio-image'],
    requiredSubpaths: ['@sdkwork/magic-studio-image/modals'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-film/src/components/PropModal.tsx',
    forbiddenRoots: ['@sdkwork/magic-studio-image'],
    requiredSubpaths: ['@sdkwork/magic-studio-image/modals'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-film/src/components/LocationModal.tsx',
    forbiddenRoots: ['@sdkwork/magic-studio-image'],
    requiredSubpaths: ['@sdkwork/magic-studio-image/modals'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-film/src/components/CharacterModal.tsx',
    forbiddenRoots: ['@sdkwork/magic-studio-image', '@sdkwork/magic-studio-voicespeaker'],
    requiredSubpaths: [
      '@sdkwork/magic-studio-image/modals',
      '@sdkwork/magic-studio-voicespeaker/picker',
      '@sdkwork/magic-studio-voicespeaker/constants',
    ],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-film/src/services/filmService.ts',
    forbiddenRoots: ['@sdkwork/magic-studio-image', '@sdkwork/magic-studio-video'],
    requiredSubpaths: [
      '@sdkwork/magic-studio-image/services',
      '@sdkwork/magic-studio-video/entities',
      '@sdkwork/magic-studio-video/services',
    ],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-film/src/services/filmPromptService.ts',
    forbiddenRoots: ['@sdkwork/magic-studio-image'],
    requiredSubpaths: ['@sdkwork/magic-studio-image/services'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-film/src/store/filmStore.tsx',
    forbiddenRoots: ['@sdkwork/magic-studio-audio'],
    requiredSubpaths: ['@sdkwork/magic-studio-audio/services'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-film/src/pages/FilmHomePage.tsx',
    forbiddenRoots: ['@sdkwork/magic-studio-image'],
    requiredSubpaths: ['@sdkwork/magic-studio-generation-history'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-magiccut/src/services/magicCutPromptService.ts',
    forbiddenRoots: ['@sdkwork/magic-studio-image'],
    requiredSubpaths: ['@sdkwork/magic-studio-image/services'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-magiccut/src/components/Timeline/MagicCutTimelineToolbar.tsx',
    forbiddenRoots: [
      '@sdkwork/magic-studio-image',
      '@sdkwork/magic-studio-video',
      '@sdkwork/magic-studio-audio',
      '@sdkwork/magic-studio-sfx',
      '@sdkwork/magic-studio-music',
    ],
    requiredSubpaths: [
      '@sdkwork/magic-studio-image/modals',
      '@sdkwork/magic-studio-video/modals',
      '@sdkwork/magic-studio-audio/modals',
      '@sdkwork/magic-studio-sfx/modals',
      '@sdkwork/magic-studio-music/modals',
    ],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-magiccut/src/domain/voice/voiceGeneration.ts',
    forbiddenRoots: ['@sdkwork/magic-studio-voicespeaker'],
    requiredSubpaths: ['@sdkwork/magic-studio-voicespeaker/entities'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-magiccut/src/components/Properties/panels/VoiceSettingsPanel.tsx',
    forbiddenRoots: ['@sdkwork/magic-studio-voicespeaker'],
    requiredSubpaths: [
      '@sdkwork/magic-studio-voicespeaker/constants',
      '@sdkwork/magic-studio-voicespeaker/services',
    ],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-portal-video/src/components/CommunityGallery.tsx',
    forbiddenRoots: ['@sdkwork/magic-studio-image'],
    requiredSubpaths: ['@sdkwork/magic-studio-generation-history'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-portal-video/src/pages/CommunityPage.tsx',
    forbiddenRoots: ['@sdkwork/magic-studio-image'],
    requiredSubpaths: ['@sdkwork/magic-studio-generation-history'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-portal-video/src/pages/DiscoverPage.tsx',
    forbiddenRoots: ['@sdkwork/magic-studio-image'],
    requiredSubpaths: ['@sdkwork/magic-studio-generation-history'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-portal-video/src/pages/TheaterPage.tsx',
    forbiddenRoots: ['@sdkwork/magic-studio-image'],
    requiredSubpaths: ['@sdkwork/magic-studio-generation-history'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-voicespeaker/src/components/VoicePanel.tsx',
    forbiddenRoots: ['@sdkwork/magic-studio-audio'],
    requiredSubpaths: ['@sdkwork/magic-studio-audio/recorder'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-voicespeaker/src/components/panel/VoiceCloneTabPanel.tsx',
    forbiddenRoots: ['@sdkwork/magic-studio-audio'],
    requiredSubpaths: ['@sdkwork/magic-studio-audio/recorder'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-voicespeaker/src/components/voicespeaker/VoiceLabModal.tsx',
    forbiddenRoots: ['@sdkwork/magic-studio-image', '@sdkwork/magic-studio-audio'],
    requiredSubpaths: [
      '@sdkwork/magic-studio-image/modals',
      '@sdkwork/magic-studio-audio/recorder',
    ],
  },
];

test('cross-package consumers use focused media public entries instead of media package roots', () => {
  for (const expectation of EXPECTATIONS) {
    const source = readSource(expectation.relativePath);

    for (const forbiddenRoot of expectation.forbiddenRoots) {
      assert.doesNotMatch(
        source,
        new RegExp(`${forbiddenRoot}(?:'|")`),
        `Expected ${expectation.relativePath} to stop consuming ${forbiddenRoot} from the broad package root.`,
      );
    }

    for (const requiredSubpath of expectation.requiredSubpaths) {
      assert.match(
        source,
        new RegExp(requiredSubpath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
        `Expected ${expectation.relativePath} to consume ${requiredSubpath}.`,
      );
    }
  }
});
