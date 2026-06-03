import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..');

const read = (relativePath) => fs.readFileSync(path.resolve(workspaceRoot, relativePath), 'utf8');

test('magiccut engine renderer and export layers avoid direct nullable EntityId access patterns', () => {
  const audioEngineSource = read('packages/sdkwork-magic-studio-magiccut/src/engine/AudioEngine.ts');
  const timelineRendererSource = read('packages/sdkwork-magic-studio-magiccut/src/engine/renderer/TimelineRenderer.ts');
  const clipRenderStrategiesSource = read('packages/sdkwork-magic-studio-magiccut/src/engine/renderer/ClipRenderStrategies.ts');
  const trackRendererSource = read('packages/sdkwork-magic-studio-magiccut/src/engine/renderer/TrackRenderer.ts');
  const renderSortUtilsSource = read('packages/sdkwork-magic-studio-magiccut/src/engine/utils/RenderSortUtils.ts');
  const webglEngineSource = read('packages/sdkwork-magic-studio-magiccut/src/engine/WebGLEngine.ts');
  const offlineRendererSource = read('packages/sdkwork-magic-studio-magiccut/src/services/export/OfflineRenderer.ts');
  const videoExportServiceSource = read('packages/sdkwork-magic-studio-magiccut/src/services/export/videoExportService.ts');
  const timelineOperationServiceSource = read('packages/sdkwork-magic-studio-magiccut/src/services/TimelineOperationService.ts');
  const magicCutStoreSource = read('packages/sdkwork-magic-studio-magiccut/src/store/magicCutStore.tsx');

  assert.doesNotMatch(
    audioEngineSource,
    /tracks\[trackRef\.id\]|clips\[clipRef\.id\]|audibleTrackIds\.has\(track\.id\)|activeClipIds\.add\(clip\.id\)|tracks\[clip\.track\.id\]|resources\[clip\.resource\.id\]|this\.scheduledSources\.(?:has|get|set|delete)\(clip\.id\)|clipId:\s*clip\.id|loadResource\(resources\[c\.resource\.id\]\)/,
    'Expected AudioEngine to resolve canonical track, clip, and resource keys instead of using nullable ids directly.',
  );
  assert.doesNotMatch(
    timelineRendererSource,
    /trackIndices\.(?:has|get|set)\(track\.id\)|lastTrackVersion\.(?:get|set)\(track\.id\)|track\.clips\.forEach\(\(ref:\s*\{\s*id:\s*string\s*\}\)|clips\[ref\.id\]|id:\s*clip\.id,|clips\[overrideClip\.id\]|hiddenClipIds\.has\(clip\.id\)|consumedClipIds\.has\(clip\.id\)|resources\[clip\.resource\.id\]|layers\[ref\.id\]|consumedClipId:\s*nextClip\.id/,
    'Expected TimelineRenderer to resolve canonical keys for track caches, clip lookup, resource lookup, and transition bookkeeping.',
  );
  assert.doesNotMatch(
    clipRenderStrategiesSource,
    /getVideoElement\(clip\.id,\s*url\)|textureCache\.getInfo\(clip\.id\)|lastUploadTime\.get\(clip\.id\)|textureCache\.set\(clip\.id|textureCache\.get\(resource\.id\)|getImageElement\(resource\.id,\s*url\)|hashCache\.get\(clip\.id\)|textureCache\.get\(clip\.id\)|hashCache\.set\(clip\.id/,
    'Expected ClipRenderStrategies to use canonical cache keys instead of nullable clip.id/resource.id values.',
  );
  assert.doesNotMatch(
    trackRendererSource,
    /layersMap\[ref\.id\]/,
    'Expected TrackRenderer to resolve layer refs through canonical keys instead of ref.id.',
  );
  assert.doesNotMatch(
    renderSortUtilsSource,
    /trackMap\[ref\.id\]/,
    'Expected RenderSortUtils to resolve track refs through canonical keys instead of ref.id.',
  );
  assert.doesNotMatch(
    webglEngineSource,
    /tracks\[tr\.id\]|clips\[cr\.id\]|incomingTransitionLeadIns\.get\(clip\.id\)|activeClipIds\.add\(clip\.id\)|resources\[clip\.resource\.id\]|getVideoElement\(clip\.id,\s*url\)|syncVideoTime\(video,\s*resourceTime,\s*shouldPlay,\s*clip\.id,\s*speed\)/,
    'Expected WebGLEngine to resolve canonical keys for state lookups and video synchronization.',
  );
  assert.doesNotMatch(
    offlineRendererSource,
    /state\.tracks\[trackRef\.id\]|state\.clips\[clipRef\.id\]/,
    'Expected OfflineRenderer to resolve track and clip refs through canonical keys instead of direct ids.',
  );
  assert.doesNotMatch(
    videoExportServiceSource,
    /state\.tracks\[trackRef\.id\]|state\.clips\[clipRef\.id\]/,
    'Expected videoExportService to resolve track and clip refs through canonical keys instead of direct ids.',
  );
  assert.doesNotMatch(
    timelineOperationServiceSource,
    /linkedClipId:\s*newAudioClip\.id/,
    'Expected TimelineOperationService to link detached audio via canonical clip keys instead of newAudioClip.id.',
  );
  assert.doesNotMatch(
    magicCutStoreSource,
    /switchProject\(res\.data\.content\[0\]\.id\)/,
    'Expected magicCutStore to switch projects via canonical entity keys instead of nullable ids.',
  );
});
