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

test('login page composes a host-owned auth experience instead of forwarding the shared appbase page', () => {
  const loginPageSource = readSource('packages/sdkwork-magic-studio-auth/src/pages/LoginPage.tsx');

  assert.doesNotMatch(
    loginPageSource,
    /SdkworkAuthPage/,
    'Expected Magic Studio login page to stop forwarding the full shared appbase auth page.',
  );
  assert.match(
    loginPageSource,
    /useTranslation/,
    'Expected Magic Studio login page to drive visible copy through the local i18n layer.',
  );
  assert.match(
    loginPageSource,
    /auth\.welcomeBack|auth\.createAccount|auth\.resetPassword/,
    'Expected Magic Studio login page to render localized auth titles and descriptions.',
  );
  assert.match(
    loginPageSource,
    /useSdkworkAuthControllerState|useAuthController/,
    'Expected Magic Studio login page to keep using the shared IAM controller boundary.',
  );
});

test('oauth callback page is host-owned and localized instead of forwarding the shared appbase callback page', () => {
  const callbackPageSource = readSource('packages/sdkwork-magic-studio-auth/src/pages/AuthOAuthCallbackPage.tsx');

  assert.doesNotMatch(
    callbackPageSource,
    /SdkworkAuthOAuthCallbackPage/,
    'Expected Magic Studio OAuth callback page to stop forwarding the full shared appbase callback page.',
  );
  assert.match(
    callbackPageSource,
    /useTranslation/,
    'Expected Magic Studio OAuth callback page to drive visible copy through the local i18n layer.',
  );
  assert.match(
    callbackPageSource,
    /auth\.oauth\.processingTitle|auth\.oauth\.failedTitle/,
    'Expected Magic Studio OAuth callback page to render localized OAuth status copy.',
  );
  assert.match(
    callbackPageSource,
    /useSdkworkAuthControllerState|useAuthController/,
    'Expected Magic Studio OAuth callback page to keep using the shared IAM controller boundary.',
  );
});
