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

test('profile page composes a host-owned user center instead of forwarding the shared appbase page', () => {
  const profilePageSource = readSource('packages/sdkwork-magic-studio-user/src/pages/ProfilePage.tsx');

  assert.doesNotMatch(
    profilePageSource,
    /SdkworkUserCenterPage/,
    'Expected Magic Studio profile page to stop forwarding the full shared appbase user center page.',
  );
  assert.match(
    profilePageSource,
    /useTranslation/,
    'Expected Magic Studio profile page to drive visible copy through the local i18n layer.',
  );
  assert.match(
    profilePageSource,
    /createSdkworkUserController|useSdkworkUserControllerState/,
    'Expected Magic Studio profile page to keep using the shared user controller boundary.',
  );
  assert.match(
    profilePageSource,
    /from '\.\.\/components\/user-sections'/,
    'Expected Magic Studio profile page to route section rendering through the localized user-section adapter module.',
  );
  assert.doesNotMatch(
    profilePageSource,
    /SettingsSection|Input|Label|Switch/,
    'Expected Magic Studio profile page shell to stop inlining section-level form controls.',
  );
});

test('bootstrap registers the local user i18n package so account-center copy follows runtime locale changes', () => {
  const bootstrapSource = readSource('src/app/bootstrap.ts');
  const userPackageSource = readSource('packages/sdkwork-magic-studio-user/src/index.ts');

  assert.match(
    bootstrapSource,
    /defaultI18nConfig as userI18nConfig/,
    'Expected bootstrap to import the local user i18n config.',
  );
  assert.match(
    bootstrapSource,
    /userI18nConfig/,
    'Expected bootstrap to register the local user i18n config.',
  );
  assert.match(
    userPackageSource,
    /defaultI18nConfig/,
    'Expected the local user package entrypoint to export its i18n config.',
  );
});
