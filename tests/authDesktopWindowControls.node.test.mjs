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

test('desktop login page exposes window controls in a dedicated auth frame without breaking centered auth layout', () => {
  const loginPageSource = readSource('packages/sdkwork-magic-studio-auth/src/pages/LoginPage.tsx');

  assert.match(
    loginPageSource,
    /import\s*\{[^}]*WindowControls[^}]*\}\s*from\s*['"]@sdkwork\/magic-studio-commons['"]/,
    'Expected the login page to reuse the shared desktop WindowControls component.',
  );
  assert.match(
    loginPageSource,
    /isDesktop\s*\?/,
    'Expected the login page to gate desktop-specific frame chrome by platform.',
  );
  assert.match(
    loginPageSource,
    /data-magic-auth-desktop-frame/,
    'Expected the login page to expose a dedicated desktop auth frame wrapper.',
  );
  assert.match(
    loginPageSource,
    /getDesktopShellDragRegionProps/,
    'Expected the desktop auth frame to centralize drag-region wiring through the shared helper.',
  );
  assert.match(
    loginPageSource,
    /<WindowControls\s*\/>/,
    'Expected the desktop auth frame to render shared window controls.',
  );
  assert.doesNotMatch(
    loginPageSource,
    /data-tauri-drag-region/,
    'Expected the login page to avoid handwritten desktop shell drag-region attributes.',
  );
  assert.doesNotMatch(
    loginPageSource,
    /data-sdk-auth-card[\s\S]*<WindowControls\s*\/>/,
    'Expected window controls to live outside the auth card so the centered auth composition stays stable.',
  );
});
