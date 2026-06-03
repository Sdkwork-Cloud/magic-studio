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

test('shared IAM pages expose host-scoped wrappers for auth and user presentation tuning', () => {
  const loginPageSource = readSource('packages/sdkwork-magic-studio-auth/src/pages/LoginPage.tsx');
  const callbackPageSource = readSource('packages/sdkwork-magic-studio-auth/src/pages/AuthOAuthCallbackPage.tsx');
  const profilePageSource = readSource('packages/sdkwork-magic-studio-user/src/pages/ProfilePage.tsx');
  const providerSource = readSource('packages/sdkwork-magic-studio-auth/src/theme/SdkworkIamThemeProvider.tsx');
  const authStylesheetSource = readSource('src/styles/auth.css');
  const userStylesheetSource = readSource('src/styles/user.css');

  assert.match(
    loginPageSource,
    /data-magic-iam-screen="auth"/,
    'Expected the login page wrapper to expose an auth host scope for Magic Studio presentation adjustments.',
  );
  assert.match(
    callbackPageSource,
    /data-magic-iam-screen="auth"/,
    'Expected the OAuth callback wrapper to expose the shared auth host scope.',
  );
  assert.match(
    profilePageSource,
    /data-magic-iam-screen="user"/,
    'Expected the profile wrapper to expose a dedicated shared user host scope.',
  );
  assert.match(
    providerSource,
    /magic-iam-theme/,
    'Expected the shared IAM theme bridge to stamp a stable class on the SDKWORK theme provider root.',
  );
  assert.match(
    authStylesheetSource,
    /magic-iam-screen/,
    'Expected the auth route stylesheet to include Magic Studio auth host-scoped presentation rules.',
  );
  assert.match(
    authStylesheetSource,
    /magic-iam-theme/,
    'Expected the auth route stylesheet to target the stable SDKWORK IAM theme wrapper.',
  );
  assert.match(
    userStylesheetSource,
    /magic-iam-screen/,
    'Expected the user route stylesheet to include Magic Studio user host-scoped presentation rules.',
  );
});
