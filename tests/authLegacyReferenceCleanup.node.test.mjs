import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..');

const read = (relativePath) => fs.readFileSync(path.resolve(workspaceRoot, relativePath), 'utf8');

test('auth migration leaves no test or script references to deleted local auth implementation files', () => {
  const runtimeI18nTestSource = read('packages/sdkwork-magic-studio-i18n/tests/runtimeUiInternationalization.test.ts');
  const authBoundaryScriptSource = read('scripts/sdkwork-core-env-auth-boundary.test.mjs');
  const authCompatibilityTestSource = read('packages/sdkwork-magic-studio-auth/tests/authCompatibility.test.tsx');

  assert.doesNotMatch(
    runtimeI18nTestSource,
    /packages\/sdkwork-magic-studio-auth\/src\/components\/BindInviteCode\.tsx|packages\/sdkwork-magic-studio-auth\/src\/components\/InviteCodeInput\.tsx/,
    'Expected runtime i18n tests to stop targeting removed local auth components after the shared auth migration.',
  );
  assert.doesNotMatch(
    authBoundaryScriptSource,
    /packages\/sdkwork-magic-studio-auth\/src\/services\/authSessionService\.ts|packages\/sdkwork-magic-studio-auth\/src\/services\/useAppSdkClient\.ts/,
    'Expected auth boundary checks to target current shared-auth bridge files instead of removed local service shims.',
  );
  assert.doesNotMatch(
    authCompatibilityTestSource,
    /LoginForm: \(\) => React\.createElement\('div', null, 'LoginForm'\)|RegisterForm: \(\) => React\.createElement\('div', null, 'RegisterForm'\)|ForgotPasswordForm: \(\) => React\.createElement\('div', null, 'ForgotPasswordForm'\)|QrCodeLogin: \(\) => React\.createElement\('div', null, 'QrCodeLogin'\)/,
    'Expected auth compatibility tests to assert the shared auth page directly instead of mocking removed local auth form components.',
  );
});
