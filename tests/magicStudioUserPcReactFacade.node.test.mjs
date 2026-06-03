import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..');

function readSharedUserSource(relativePath) {
  return fs.readFileSync(
    path.resolve(
      workspaceRoot,
      '..',
      'sdkwork-appbase',
      'packages',
      'pc-react',
      'identity',
      'sdkwork-user-pc-react',
      'src',
      relativePath,
    ),
    'utf8',
  );
}

test('user pc react root facade exports the real user controller and page surface', () => {
  const source = readSharedUserSource('index.ts');

  assert.match(
    source,
    /user-controller\.ts/,
    'Expected @sdkwork/user-pc-react root facade to export user-controller.ts.',
  );
  assert.match(
    source,
    /user-service\.ts/,
    'Expected @sdkwork/user-pc-react root facade to export user-service.ts.',
  );
  assert.match(
    source,
    /pages\/UserCenterPage\.tsx/,
    'Expected @sdkwork/user-pc-react root facade to export pages/UserCenterPage.tsx.',
  );
  assert.doesNotMatch(
    source,
    /status:\s*"scaffold"/,
    'Expected @sdkwork/user-pc-react root facade to stop advertising scaffold-only status.',
  );
});
