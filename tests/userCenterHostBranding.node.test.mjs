import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..');

const readSource = (relativePath) =>
  fs.readFileSync(path.resolve(workspaceRoot, relativePath), 'utf8');

test('magic studio user wrapper owns host-specific account center branding instead of shared default copy', () => {
  const profilePageSource = readSource('packages/sdkwork-magic-studio-user/src/pages/ProfilePage.tsx');

  assert.match(
    profilePageSource,
    /title=/,
    'Expected the Magic Studio user wrapper to provide a host-specific account center title.',
  );
  assert.match(
    profilePageSource,
    /description=/,
    'Expected the Magic Studio user wrapper to provide a host-specific account center description.',
  );
  assert.doesNotMatch(
    profilePageSource,
    /Claw-quality|Claw-inspired|Claw Studio/i,
    'Expected the Magic Studio user wrapper to stop inheriting Claw-branded account center copy.',
  );
  assert.match(
    profilePageSource,
    /Magic Studio/i,
    'Expected the Magic Studio user wrapper branding to explicitly reference Magic Studio.',
  );
});
