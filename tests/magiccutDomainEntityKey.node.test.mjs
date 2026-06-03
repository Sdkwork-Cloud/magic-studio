import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..');

const read = (relativePath) => fs.readFileSync(path.resolve(workspaceRoot, relativePath), 'utf8');

test('magiccut controller/domain layers avoid direct nullable id indexing and string-return assumptions', () => {
  const playerControllerSource = read('packages/sdkwork-magic-studio-magiccut/src/controllers/PlayerController.ts');
  const dropPreviewSource = read('packages/sdkwork-magic-studio-magiccut/src/domain/dnd/dropPreview.ts');
  const importDropSequenceSource = read('packages/sdkwork-magic-studio-magiccut/src/domain/dnd/importDropSequence.ts');
  const effectPlacementSource = read('packages/sdkwork-magic-studio-magiccut/src/domain/effects/effectPlacement.ts');
  const transitionPlaybackSource = read('packages/sdkwork-magic-studio-magiccut/src/domain/playback/transitionPlayback.ts');

  assert.doesNotMatch(
    playerControllerSource,
    /state\.tracks\[trackRef\.id\]|state\.clips\[clipRef\.id\]|resourcesToLoad\.add\(clip\.resource\.id\)|audibleTrackIds\.has\(track\.id\)/,
    'Expected PlayerController audio preload logic to use canonical entity keys instead of nullable ids.',
  );
  assert.doesNotMatch(
    dropPreviewSource,
    /trackId:\s*clip\.track\.id,|trackId:\s*fromClip\.track\.id,/,
    'Expected dropPreview results to use canonical track keys instead of track.id.',
  );
  assert.doesNotMatch(
    importDropSequenceSource,
    /trackId:\s*initialTrack\.id,|groupId:\s*`existing:\$\{initialTrack\.id\}`/,
    'Expected importDropSequence to avoid nullable initialTrack.id as a stable string key.',
  );
  assert.doesNotMatch(
    effectPlacementSource,
    /resources\[clip\.resource\.id\]|clips\[ref\.id\]|return matchedClip\.id;|fromClipId:\s*currentClip\.id,|toClipId:\s*nextClip\.id,/,
    'Expected effectPlacement helpers to resolve canonical clip/resource keys instead of direct ids.',
  );
  assert.doesNotMatch(
    transitionPlaybackSource,
    /clips\[clipRef\.id\]|layers\[layerRef\.id\]/,
    'Expected transitionPlayback to resolve clip/layer refs through canonical keys instead of ref.id.',
  );
});
