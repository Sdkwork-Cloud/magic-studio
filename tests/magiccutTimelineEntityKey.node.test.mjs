import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..');

const read = (relativePath) => fs.readFileSync(path.resolve(workspaceRoot, relativePath), 'utf8');

test('magiccut timeline components avoid direct nullable EntityId usage for state keys and resource lookups', () => {
  const dragOverlaySource = read('packages/sdkwork-magic-studio-magiccut/src/components/Timeline/canvas/DragOverlay.tsx');
  const useClipDragSource = read('packages/sdkwork-magic-studio-magiccut/src/components/Timeline/canvas/hooks/useClipDrag.ts');
  const useSnapPointsSource = read('packages/sdkwork-magic-studio-magiccut/src/components/Timeline/canvas/hooks/useSnapPoints.ts');
  const magicCutClipSource = read('packages/sdkwork-magic-studio-magiccut/src/components/Timeline/MagicCutClip.tsx');
  const magicCutTrackSource = read('packages/sdkwork-magic-studio-magiccut/src/components/Timeline/MagicCutTrack.tsx');

  assert.doesNotMatch(
    dragOverlaySource,
    /getResource\((?:fromClip|toClip|clip)\.resource\.id\)/,
    'Expected DragOverlay resource lookups to use canonical entity keys instead of resource.id.',
  );
  assert.doesNotMatch(
    useClipDragSource,
    /clipsMap\[ref\.id\]/,
    'Expected useClipDrag to resolve clip refs through canonical keys instead of ref.id.',
  );
  assert.doesNotMatch(
    useClipDragSource,
    /indicesRef\.current\.set\(track\.id,\s*index\)/,
    'Expected useClipDrag to avoid nullable track.id as the interval-index map key.',
  );
  assert.doesNotMatch(
    useSnapPointsSource,
    /stateRef\.current\.tracks\[trackRef\.id\]/,
    'Expected useSnapPoints to resolve track refs through canonical keys instead of trackRef.id.',
  );
  assert.doesNotMatch(
    useSnapPointsSource,
    /stateRef\.current\.clips\[clipRef\.id\]/,
    'Expected useSnapPoints to resolve clip refs through canonical keys instead of clipRef.id.',
  );
  assert.doesNotMatch(
    magicCutClipSource,
    /clipId:\s*clip\.id,/,
    'Expected MagicCutClip interactions to use canonical clip keys instead of clip.id.',
  );
  assert.doesNotMatch(
    magicCutClipSource,
    /initialTrackId:\s*clip\.track\.id,|currentTrackId:\s*clip\.track\.id,/,
    'Expected MagicCutClip interactions to use canonical track keys instead of clip.track.id.',
  );
  assert.doesNotMatch(
    magicCutTrackSource,
    /onTrackSelect\(track\.id\)|data-track-id=\{track\.id\}|selectedClipIds\.has\(clip\.id\)|getResource\(clip\.resource\.id\)/,
    'Expected MagicCutTrack to use canonical keys instead of direct nullable ids.',
  );
});
