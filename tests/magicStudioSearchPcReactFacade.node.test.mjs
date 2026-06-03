import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..');

function readSharedSearchSource(relativePath) {
  return fs.readFileSync(
    path.resolve(
      workspaceRoot,
      '..',
      'sdkwork-appbase',
      'packages',
      'pc-react',
      'foundation',
      'sdkwork-search-pc-react',
      'src',
      relativePath,
    ),
    'utf8',
  );
}

test('search pc react root facade exports the real search catalog surface', () => {
  const source = readSharedSearchSource('index.ts');

  assert.match(
    source,
    /search\.ts/,
    'Expected @sdkwork/search-pc-react root facade to export search.ts.',
  );
  assert.doesNotMatch(
    source,
    /status:\s*"scaffold"/,
    'Expected @sdkwork/search-pc-react root facade to stop advertising scaffold-only status.',
  );
});
