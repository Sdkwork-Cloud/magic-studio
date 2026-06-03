import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..');

function readSharedUserCenterSource(relativePath) {
  return fs.readFileSync(
    path.resolve(
      workspaceRoot,
      '..',
      'sdkwork-appbase',
      'packages',
      'pc-react',
      'identity',
      'sdkwork-user-center-pc-react',
      'src',
      relativePath,
    ),
    'utf8',
  );
}

test('user-center pc react facade re-exports the canonical core user-center surface', () => {
  const source = readSharedUserCenterSource('index.ts');

  assert.match(
    source,
    /sdkwork-user-center-core-pc-react/,
    'Expected @sdkwork/user-center-pc-react to re-export the canonical core user-center package.',
  );
  assert.match(
    source,
    /export \* from "\.\.\/\.\.\/sdkwork-user-center-core-pc-react\/src\/index\.ts";/,
    'Expected @sdkwork/user-center-pc-react to expose the full core user-center surface through a single canonical re-export.',
  );
});
