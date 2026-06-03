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

test('drive runtime file preview modal uses focused magic-studio-assets asset-service subpath', () => {
  const relativePath = 'packages/sdkwork-magic-studio-drive/src/components/FilePreviewModal.tsx';
  const source = readSource(relativePath);

  assert.doesNotMatch(
    source,
    /from '@sdkwork\/magic-studio-assets'|from "@sdkwork\/magic-studio-assets"/,
    `Expected ${relativePath} to stop importing runtime capabilities from the broad magic-studio-assets root entry.`,
  );

  assert.match(
    source,
    /@sdkwork\/magic-studio-assets\/asset-service/,
    `Expected ${relativePath} to import asset runtime helpers from @sdkwork/magic-studio-assets/asset-service.`,
  );
});
