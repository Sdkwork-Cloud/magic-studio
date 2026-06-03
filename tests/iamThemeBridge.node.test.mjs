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

test('IAM wrappers use the shared theme bridge instead of system theme passthrough', () => {
  const loginPageSource = readSource('packages/sdkwork-magic-studio-auth/src/pages/LoginPage.tsx');
  const callbackPageSource = readSource('packages/sdkwork-magic-studio-auth/src/pages/AuthOAuthCallbackPage.tsx');
  const profilePageSource = readSource('packages/sdkwork-magic-studio-user/src/pages/ProfilePage.tsx');

  assert.match(
    loginPageSource,
    /SdkworkIamThemeProvider/,
    'Expected auth login page to use the shared IAM theme bridge.',
  );
  assert.match(
    callbackPageSource,
    /SdkworkIamThemeProvider/,
    'Expected auth OAuth callback page to use the shared IAM theme bridge.',
  );
  assert.match(
    profilePageSource,
    /SdkworkIamThemeProvider/,
    'Expected user profile page to use the shared IAM theme bridge.',
  );
  assert.doesNotMatch(
    loginPageSource,
    /defaultTheme="system"/,
    'Expected auth login page to stop using OS-theme passthrough.',
  );
  assert.doesNotMatch(
    callbackPageSource,
    /defaultTheme="system"/,
    'Expected auth callback page to stop using OS-theme passthrough.',
  );
  assert.doesNotMatch(
    profilePageSource,
    /defaultTheme="system"/,
    'Expected user profile page to stop using OS-theme passthrough.',
  );
});

test('IAM theme bridge follows the host dark class while preserving sdkwork-ui claw defaults', () => {
  const providerSource = readSource('packages/sdkwork-magic-studio-auth/src/theme/SdkworkIamThemeProvider.tsx');
  const stylesheetSource = readSource('src/index.css');

  assert.match(
    providerSource,
    /document\.documentElement\.classList\.contains\('dark'\)/,
    'Expected IAM theme bridge to mirror the host application dark class.',
  );
  assert.match(
    providerSource,
    /new MutationObserver\(syncColorMode\)/,
    'Expected IAM theme bridge to react to host theme changes.',
  );
  assert.match(
    providerSource,
    /defaultTheme=\{colorMode\}/,
    'Expected IAM theme bridge to drive the shared SDKWORK theme provider from the resolved host theme.',
  );
  assert.doesNotMatch(
    providerSource,
    /LIGHT_IAM_THEME_OVERRIDES|DARK_IAM_THEME_OVERRIDES/,
    'Expected IAM theme bridge to stop redefining claw theme tokens locally.',
  );
  assert.doesNotMatch(
    providerSource,
    /overrides=/,
    'Expected IAM theme bridge to rely on sdkwork-ui claw defaults instead of custom host overrides.',
  );
  assert.match(
    stylesheetSource,
    /@theme\s*\{[\s\S]*--color-primary-500: var\(--theme-primary-500\);/,
    'Expected the host stylesheet to expose the claw-aligned primary palette for auth and user presentation parity.',
  );
});
