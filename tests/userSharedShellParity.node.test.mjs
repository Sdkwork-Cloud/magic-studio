import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..');

const read = (relativePath) => fs.readFileSync(path.resolve(workspaceRoot, relativePath), 'utf8');

test('profile page keeps the shared user-center shell structure while localizing host copy', () => {
  const source = read('packages/sdkwork-magic-studio-user/src/pages/ProfilePage.tsx');

  assert.match(source, /max-w-7xl/, 'Expected the host user page to keep the shared max-width shell.');
  assert.match(source, /xl:grid-cols-\[minmax\(0,1fr\)_22rem\]/, 'Expected the host user page to keep the shared hero and aside grid split.');
  assert.match(source, /shadow-\[0_28px_80px_rgba\(24,24,27,0\.10\)\]/, 'Expected the host user page to keep the shared account-center panel shadow.');
  assert.match(source, /buildPageHighlights/, 'Expected the host user page to build localized shared-shell highlights.');
  assert.match(source, /Magic Studio/, 'Expected the host user page source to carry Magic Studio branding.');
});
