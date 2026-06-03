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

function readSource(relativePath) {
  return fs.readFileSync(path.resolve(workspaceRoot, relativePath), 'utf8');
}

test('IAM route css is isolated from the global entry stylesheet', () => {
  const indexCss = readSource('src/index.css');
  const authCss = readSource('src/styles/auth.css');
  const userCss = readSource('src/styles/user.css');
  const loginPage = readSource('src/pages/LoginPage.tsx');
  const callbackPage = readSource('src/pages/AuthOAuthCallbackPage.tsx');
  const profilePage = readSource('src/pages/ProfilePage.tsx');

  assert.doesNotMatch(
    indexCss,
    legacyAppbaseSourcePattern('sdkwork-auth-pc-react'),
    'Expected src/index.css to stop scanning the auth route source tree.',
  );
  assert.doesNotMatch(
    indexCss,
    legacyAppbaseSourcePattern('sdkwork-user-pc-react'),
    'Expected src/index.css to stop scanning the user route source tree.',
  );
  assert.doesNotMatch(
    indexCss,
    /\[data-magic-iam-screen=/,
    'Expected src/index.css to stop owning host-scoped identity presentation rules.',
  );
  assert.match(
    indexCss,
    /@import "tailwindcss";/,
    'Expected src/index.css to remain the shared owner of the global Tailwind theme and base layers.',
  );

  assert.match(
    authCss,
    /@layer theme, base, components, utilities;/,
    'Expected src/styles/auth.css to declare explicit Tailwind layers for lazy auth routes.',
  );
  assert.match(
    authCss,
    /@import "tailwindcss\/theme\.css" layer\(theme\) source\(none\);/,
    'Expected src/styles/auth.css to import Tailwind theme tokens while disabling implicit global root scanning.',
  );
  assert.match(
    authCss,
    /@import "tailwindcss\/utilities\.css" layer\(utilities\) source\(none\);/,
    'Expected src/styles/auth.css to import Tailwind utilities while disabling implicit global root scanning.',
  );
  assert.match(
    authCss,
    /@source "\.\.\/\.\.\/packages\/sdkwork-magic-studio-auth\/src\/pages";/,
    'Expected src/styles/auth.css to scan the local auth page source tree used at runtime.',
  );
  assert.match(
    authCss,
    /@source "\.\.\/\.\.\/packages\/sdkwork-magic-studio-auth\/src\/components";/,
    'Expected src/styles/auth.css to scan the local auth component source tree used at runtime.',
  );
  assert.doesNotMatch(
    authCss,
    legacyAppbaseSourcePattern('sdkwork-user-pc-react'),
    'Expected src/styles/auth.css to stop scanning the shared user source tree.',
  );
  assert.match(
    authCss,
    /\[data-magic-iam-screen="auth"\]/,
    'Expected src/styles/auth.css to own auth host presentation rules.',
  );
  assert.match(
    authCss,
    /magic-auth-shell/,
    'Expected src/styles/auth.css to retain the centered auth shell layout rules.',
  );
  assert.doesNotMatch(
    authCss,
    /\[data-magic-iam-screen="user"\]/,
    'Expected src/styles/auth.css to avoid user host presentation rules.',
  );

  assert.match(
    userCss,
    /@layer theme, base, components, utilities;/,
    'Expected src/styles/user.css to declare explicit Tailwind layers for lazy user routes.',
  );
  assert.match(
    userCss,
    /@import "tailwindcss\/theme\.css" layer\(theme\) source\(none\);/,
    'Expected src/styles/user.css to import Tailwind theme tokens while disabling implicit global root scanning.',
  );
  assert.match(
    userCss,
    /@import "tailwindcss\/utilities\.css" layer\(utilities\) source\(none\);/,
    'Expected src/styles/user.css to import Tailwind utilities while disabling implicit global root scanning.',
  );
  assert.match(
    userCss,
    /@source "\.\.\/\.\.\/packages\/sdkwork-magic-studio-user\/src\/pages";/,
    'Expected src/styles/user.css to scan the local user page source tree used at runtime.',
  );
  assert.match(
    userCss,
    /@source "\.\.\/\.\.\/packages\/sdkwork-magic-studio-user\/src\/components";/,
    'Expected src/styles/user.css to scan the local user component source tree used at runtime.',
  );
  assert.doesNotMatch(
    userCss,
    legacyAppbaseSourcePattern('sdkwork-auth-pc-react'),
    'Expected src/styles/user.css to stop scanning the shared auth source tree.',
  );
  assert.match(
    userCss,
    /\[data-magic-iam-screen="user"\]/,
    'Expected src/styles/user.css to own user host presentation rules.',
  );
  assert.doesNotMatch(
    userCss,
    /magic-auth-shell/,
    'Expected src/styles/user.css to avoid auth-specific shell rules.',
  );

  assert.match(
    loginPage,
    /import ['"]\.\.\/styles\/auth\.css['"];?/,
    'Expected LoginPage to load the lazy auth route stylesheet.',
  );
  assert.match(
    callbackPage,
    /import ['"]\.\.\/styles\/auth\.css['"];?/,
    'Expected AuthOAuthCallbackPage to load the lazy auth route stylesheet.',
  );
  assert.match(
    profilePage,
    /import ['"]\.\.\/styles\/user\.css['"];?/,
    'Expected ProfilePage to load the lazy user route stylesheet.',
  );
});
