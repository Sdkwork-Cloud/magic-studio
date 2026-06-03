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

test('image public entry files expose ImageLeftGeneratorPanel through the lazy wrapper', () => {
  const rootEntrySource = readSource('packages/sdkwork-magic-studio-image/src/index.ts');
  const panelsEntrySource = readSource('packages/sdkwork-magic-studio-image/src/panels/index.ts');

  for (const [relativePath, source] of [
    ['packages/sdkwork-magic-studio-image/src/index.ts', rootEntrySource],
    ['packages/sdkwork-magic-studio-image/src/panels/index.ts', panelsEntrySource],
  ]) {
    assert.doesNotMatch(
      source,
      /components\/ImageLeftGeneratorPanel'|components\/ImageLeftGeneratorPanel"|components\\ImageLeftGeneratorPanel'|components\\ImageLeftGeneratorPanel"/,
      `Expected ${relativePath} to stop re-exporting ImageLeftGeneratorPanel directly from the concrete panel module.`,
    );
    assert.match(
      source,
      /LazyImageLeftGeneratorPanel/,
      `Expected ${relativePath} to expose ImageLeftGeneratorPanel through LazyImageLeftGeneratorPanel.`,
    );
  }
});
