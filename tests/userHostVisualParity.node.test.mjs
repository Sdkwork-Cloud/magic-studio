import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..');

test('user identity host stylesheet tunes stable shared settings-center surfaces', () => {
  const stylesheetPath = path.resolve(workspaceRoot, 'src/styles/user.css');
  const stylesheetSource = fs.readFileSync(stylesheetPath, 'utf8');

  assert.match(
    stylesheetSource,
    /\[data-magic-iam-screen="user"\] \[data-sdk-pattern="workspace-panel"\]/,
    'Expected Magic Studio to tune the shared workspace panel surface for the user center.',
  );
  assert.match(
    stylesheetSource,
    /\[data-magic-iam-screen="user"\] \[data-sdk-ui="settings-section"\]/,
    'Expected Magic Studio to tune shared settings sections inside the user center.',
  );
  assert.match(
    stylesheetSource,
    /\[data-magic-iam-screen="user"\] \[data-sdk-ui="status-notice"\]/,
    'Expected Magic Studio to tune shared status notices inside the user center.',
  );
  assert.match(
    stylesheetSource,
    /\[data-magic-iam-screen="user"\] \[data-sdk-pattern="settings-nav-item"\]\[data-state="active"\]/,
    'Expected Magic Studio to restyle the active shared settings navigation item.',
  );
});
