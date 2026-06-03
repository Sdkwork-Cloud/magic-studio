import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageRoot = path.resolve(__dirname, '..');

function readSource(relativePath) {
  return fs.readFileSync(path.resolve(packageRoot, relativePath), 'utf8');
}

test('login page resolves the next login method through a helper and only updates state when the value changes', () => {
  const authConfigSource = readSource('src/components/auth/authConfig.ts');
  const loginPageSource = readSource('src/pages/LoginPage.tsx');

  assert.match(
    authConfigSource,
    /export function resolveNextAuthLoginMethod/,
    'Expected auth config to expose a reusable login-method resolution helper.',
  );
  assert.match(
    loginPageSource,
    /const nextLoginMethod = resolveNextAuthLoginMethod\(/,
    'Expected the login page to resolve the next login method through the shared helper.',
  );
  assert.match(
    loginPageSource,
    /if \(nextLoginMethod !== loginMethod\) \{\s*setLoginMethod\(nextLoginMethod\);\s*\}/,
    'Expected the login page effect to guard state updates so it does not loop on stable values.',
  );
});
