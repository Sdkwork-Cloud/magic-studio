import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..');

function readSharedAuthSource(relativePath) {
  return fs.readFileSync(
    path.resolve(
      workspaceRoot,
      '..',
      'sdkwork-appbase',
      'packages',
      'pc-react',
      'identity',
      'sdkwork-auth-pc-react',
      'src',
      relativePath,
    ),
    'utf8',
  );
}

test('auth pc react root facade exports the real auth controller and service surface', () => {
  const source = readSharedAuthSource('index.ts');

  assert.match(
    source,
    /auth-controller\.ts/,
    'Expected @sdkwork/auth-pc-react root facade to export auth-controller.ts.',
  );
  assert.match(
    source,
    /auth-service\.ts/,
    'Expected @sdkwork/auth-pc-react root facade to export auth-service.ts.',
  );
  assert.doesNotMatch(
    source,
    /status:\s*"scaffold"/,
    'Expected @sdkwork/auth-pc-react root facade to stop advertising scaffold-only status.',
  );
});
