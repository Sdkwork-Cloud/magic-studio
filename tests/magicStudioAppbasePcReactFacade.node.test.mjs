import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..');

function readSharedAppbaseSource(relativePath) {
  return fs.readFileSync(
    path.resolve(
      workspaceRoot,
      '..',
      'sdkwork-appbase',
      'packages',
      'pc-react',
      'foundation',
      'sdkwork-appbase-pc-react',
      'src',
      relativePath,
    ),
    'utf8',
  );
}

test('appbase pc react root facade exports the real capability catalog surface', () => {
  const source = readSharedAppbaseSource('index.ts');

  assert.match(
    source,
    /catalog\.ts/,
    'Expected @sdkwork/appbase-pc-react root facade to export catalog.ts.',
  );
  assert.match(
    source,
    /domain\.ts/,
    'Expected @sdkwork/appbase-pc-react root facade to export domain.ts.',
  );
  assert.doesNotMatch(
    source,
    /status:\s*"scaffold"/,
    'Expected @sdkwork/appbase-pc-react root facade to stop advertising scaffold-only status.',
  );
});
