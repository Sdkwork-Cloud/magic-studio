import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..');
const legacyAppbasePackageFamily = ['pc-react', 'identity'].join('/');

function legacyAppbaseSourcePattern(packageName) {
  return new RegExp(
    `@source "\\.\\.\\/\\.\\.\\/sdkwork-appbase\\/packages\\/${legacyAppbasePackageFamily.replace('/', '\\\\/')}\\/${packageName}\\/src";`,
  );
}

test('global, auth, and user route stylesheets split shared ui and identity scan roots', () => {
  const globalStylesheetPath = path.resolve(workspaceRoot, 'src/index.css');
  const authStylesheetPath = path.resolve(workspaceRoot, 'src/styles/auth.css');
  const userStylesheetPath = path.resolve(workspaceRoot, 'src/styles/user.css');
  const globalStylesheetSource = fs.readFileSync(globalStylesheetPath, 'utf8');
  const authStylesheetSource = fs.readFileSync(authStylesheetPath, 'utf8');
  const userStylesheetSource = fs.readFileSync(userStylesheetPath, 'utf8');

  assert.match(
    globalStylesheetSource,
    /@source "\.\.\/\.\.\/sdkwork-ui\/sdkwork-ui-pc-react\/src";/,
    'Expected Magic Studio to scan the shared SDKWORK UI source tree for Tailwind classes.',
  );
  assert.doesNotMatch(
    globalStylesheetSource,
    legacyAppbaseSourcePattern('sdkwork-auth-pc-react'),
    'Expected src/index.css to stop scanning the shared auth source tree.',
  );
  assert.doesNotMatch(
    globalStylesheetSource,
    legacyAppbaseSourcePattern('sdkwork-user-pc-react'),
    'Expected src/index.css to stop scanning the shared user source tree.',
  );
  assert.match(
    authStylesheetSource,
    /@source "\.\.\/\.\.\/packages\/sdkwork-magic-studio-auth\/src\/pages";/,
    'Expected src/styles/auth.css to scan the local auth page source tree.',
  );
  assert.match(
    authStylesheetSource,
    /@source "\.\.\/\.\.\/packages\/sdkwork-magic-studio-auth\/src\/components";/,
    'Expected src/styles/auth.css to scan the local auth component source tree.',
  );
  assert.doesNotMatch(
    authStylesheetSource,
    legacyAppbaseSourcePattern('sdkwork-user-pc-react'),
    'Expected src/styles/auth.css to stop scanning the shared user source tree.',
  );
  assert.match(
    userStylesheetSource,
    /@source "\.\.\/\.\.\/packages\/sdkwork-magic-studio-user\/src\/pages";/,
    'Expected src/styles/user.css to scan the local user page source tree.',
  );
  assert.match(
    userStylesheetSource,
    /@source "\.\.\/\.\.\/packages\/sdkwork-magic-studio-user\/src\/components";/,
    'Expected src/styles/user.css to scan the local user component source tree.',
  );
  assert.doesNotMatch(
    userStylesheetSource,
    legacyAppbaseSourcePattern('sdkwork-auth-pc-react'),
    'Expected src/styles/user.css to stop scanning the shared auth source tree.',
  );
});
