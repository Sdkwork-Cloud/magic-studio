import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..');

test('canvas export/converter avoid direct nullable id usage for return values and record keys', () => {
  const exportServicePath = path.resolve(
    workspaceRoot,
    'packages/sdkwork-magic-studio-canvas/src/services/canvasExportService.ts',
  );
  const converterPath = path.resolve(
    workspaceRoot,
    'packages/sdkwork-magic-studio-canvas/src/services/canvasToCutConverter.ts',
  );

  const exportSource = fs.readFileSync(exportServicePath, 'utf8');
  const converterSource = fs.readFileSync(converterPath, 'utf8');

  assert.doesNotMatch(
    exportSource,
    /return project\.id;/,
    'Expected canvas export to return a stable non-null project key instead of the nullable project.id field.',
  );
  assert.doesNotMatch(
    converterSource,
    /normalizedTracks\[t\.id\]\s*=\s*t;/,
    'Expected normalized tracks to be keyed by a stable entity key instead of track.id.',
  );
  assert.doesNotMatch(
    converterSource,
    /normalizedClips\[c\.id\]\s*=\s*c;/,
    'Expected normalized clips to be keyed by a stable entity key instead of clip.id.',
  );
  assert.doesNotMatch(
    converterSource,
    /resources\[clip\.resource\.id\]/,
    'Expected clip resource lookups to use canonical entity keys instead of clip.resource.id.',
  );
  assert.doesNotMatch(
    converterSource,
    /trackUuidById\.set\(track\.id,\s*trackUuid\);/,
    'Expected track UUID lookup tables to avoid nullable track.id as the only key.',
  );
  assert.doesNotMatch(
    converterSource,
    /input\.resources\[cutClip\.resource\.id\]/,
    'Expected project graph resource lookups to avoid nullable cutClip.resource.id.',
  );
  assert.doesNotMatch(
    converterSource,
    /clips\[clipUuid\s*\|\|\s*cutClip\.id\]/,
    'Expected project graph clips to be stored under a canonical clip key instead of clipUuid || cutClip.id.',
  );
});
