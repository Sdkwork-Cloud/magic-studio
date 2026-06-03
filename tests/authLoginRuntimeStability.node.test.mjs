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

test('login page avoids duplicate auth bootstrap and defers qr startup until after first paint', () => {
  const source = readSource('packages/sdkwork-magic-studio-auth/src/pages/LoginPage.tsx');

  assert.doesNotMatch(
    source,
    /controller\.bootstrap\(/,
    'Expected AuthStoreProvider to own controller bootstrap so the login page does not trigger it again.',
  );
  assert.match(
    source,
    /requestAnimationFrame|setTimeout/,
    'Expected the login page to defer QR startup work until after the first paint.',
  );
  assert.match(
    source,
    /!qrPanelReady/,
    'Expected the QR initialization effect to wait for a ready flag before generating QR content.',
  );
});

test('auth runtime device classification is centralized and does not hardcode desktop into browser-hosted flows', () => {
  const loginPageSource = readSource('packages/sdkwork-magic-studio-auth/src/pages/LoginPage.tsx');
  const callbackPageSource = readSource('packages/sdkwork-magic-studio-auth/src/pages/AuthOAuthCallbackPage.tsx');
  const authStoreSource = readSource('packages/sdkwork-magic-studio-auth/src/store/authStore.tsx');
  const appAuthServiceSource = readSource('packages/sdkwork-magic-studio-auth/src/services/appAuthService.ts');
  const authDeviceTypeSource = readSource('packages/sdkwork-magic-studio-auth/src/runtime/authDeviceType.ts');

  assert.match(
    authDeviceTypeSource,
    /resolveAuthDeviceTypeForRuntimeKind/,
    'Expected auth device-family mapping to live behind a dedicated helper.',
  );
  assert.match(
    authDeviceTypeSource,
    /isBrowserHostedRuntimeKind/,
    'Expected auth device-family mapping to classify browser-hosted runtimes through the shared helper.',
  );
  assert.match(
    authDeviceTypeSource,
    /isBrowserHostedRuntimeKind\(kind\)/,
    'Expected auth device-family mapping to treat standalone server delivery through the shared browser-hosted classifier.',
  );
  assert.match(
    appAuthServiceSource,
    /@sdkwork\/magic-studio-commons\/utils\/serviceAdapter/,
    'Expected app auth service to import the service-adapter helper through the focused commons subpath.',
  );
  assert.doesNotMatch(
    appAuthServiceSource,
    /from '@sdkwork\/magic-studio-commons';/,
    'Expected app auth service to stop depending on the broad magic-studio-commons root entry for service-layer plumbing.',
  );

  for (const [relativePath, source] of [
    ['packages/sdkwork-magic-studio-auth/src/pages/LoginPage.tsx', loginPageSource],
    ['packages/sdkwork-magic-studio-auth/src/pages/AuthOAuthCallbackPage.tsx', callbackPageSource],
    ['packages/sdkwork-magic-studio-auth/src/store/authStore.tsx', authStoreSource],
    ['packages/sdkwork-magic-studio-auth/src/services/appAuthService.ts', appAuthServiceSource],
  ]) {
    assert.match(
      source,
      /resolveAuthDeviceType/,
      `Expected ${relativePath} to consume the centralized auth device-family helper.`,
    );
    assert.doesNotMatch(
      source,
      /deviceType:\s*'desktop'/,
      `Expected ${relativePath} to stop hardcoding desktop auth device types.`,
    );
  }
});

test('login page exposes a dedicated centered auth shell hook for host layout parity', () => {
  const pageSource = readSource('packages/sdkwork-magic-studio-auth/src/pages/LoginPage.tsx');
  const stylesheetSource = readSource('src/styles/auth.css');

  assert.match(
    pageSource,
    /magic-auth-shell/,
    'Expected the login page to stamp a dedicated auth shell class for host centering rules.',
  );
  assert.match(
    pageSource,
    /data-sdk-auth-card/,
    'Expected the login card wrapper to expose a stable host hook for width and centering parity.',
  );
  assert.match(
    stylesheetSource,
    /\[data-magic-iam-screen="auth"\]\s+\.magic-auth-shell/,
    'Expected the IAM route stylesheet to center the host auth shell.',
  );
  assert.match(
    stylesheetSource,
    /justify-content:\s*center;/,
    'Expected the auth shell host styles to explicitly center the layout.',
  );
}
);
