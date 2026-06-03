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

test('settings page passes widget keys directly instead of spreading them through common props', () => {
  const settingsPageSource = readSource('packages/sdkwork-magic-studio-settings/src/pages/SettingsPage.tsx');

  assert.doesNotMatch(
    settingsPageSource,
    /const commonProps = \{[\s\S]*?\bkey:\s*def\.key[\s\S]*?\n\s*\};/,
    'Expected commonProps to avoid the special React key prop because keys cannot be passed via spread props.',
  );
  assert.match(
    settingsPageSource,
    /<SettingToggle\s+key=\{def\.key\}[\s\S]*?\{\.{3}commonProps\}/,
    'Expected SettingToggle to receive key={def.key} directly in JSX.',
  );
  assert.match(
    settingsPageSource,
    /<SettingSelect\s+key=\{def\.key\}[\s\S]*?\{\.{3}commonProps\}/,
    'Expected SettingSelect to receive key={def.key} directly in JSX.',
  );
  assert.match(
    settingsPageSource,
    /<SettingInput\s+key=\{def\.key\}[\s\S]*?\{\.{3}commonProps\}/,
    'Expected SettingInput to receive key={def.key} directly in JSX.',
  );
  assert.match(
    settingsPageSource,
    /<SettingSlider\s+key=\{def\.key\}[\s\S]*?\{\.{3}commonProps\}/,
    'Expected SettingSlider to receive key={def.key} directly in JSX.',
  );
});
