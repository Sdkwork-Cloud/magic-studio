import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..');

test('auth identity host stylesheet tunes stable shared control surfaces', () => {
  const stylesheetPath = path.resolve(workspaceRoot, 'src/styles/auth.css');
  const stylesheetSource = fs.readFileSync(stylesheetPath, 'utf8');

  assert.doesNotMatch(
    stylesheetSource,
    /\[data-magic-iam-screen="auth"\]\s*\{\s*background:[\s\S]*gradient/i,
    'Expected the auth host wrapper to use solid surfaces instead of gradient backgrounds.',
  );
  assert.doesNotMatch(
    stylesheetSource,
    /\[data-magic-iam-screen="user"\]\s*\{\s*background:[\s\S]*gradient/i,
    'Expected the user host wrapper to use solid surfaces instead of gradient backgrounds.',
  );
  assert.doesNotMatch(
    stylesheetSource,
    /\[data-magic-iam-screen\][\s\S]*100vh/i,
    'Expected host IAM wrappers to avoid viewport-height locks.',
  );

  assert.match(
    stylesheetSource,
    /\[data-magic-iam-screen="auth"\] \[data-sdk-ui="button"\]/,
    'Expected Magic Studio to tune shared SDKWORK buttons inside the auth experience.',
  );
  assert.match(
    stylesheetSource,
    /\[data-magic-iam-screen="auth"\] \[data-sdk-ui="input"\]/,
    'Expected Magic Studio to tune shared SDKWORK inputs inside the auth experience.',
  );
  assert.match(
    stylesheetSource,
    /\[data-magic-iam-screen="auth"\] \[data-sdk-ui="status-notice"\]/,
    'Expected Magic Studio to tune shared status notices inside the auth experience.',
  );
  assert.match(
    stylesheetSource,
    /\[data-magic-iam-screen="auth"\] \.sdk-btn--outline/,
    'Expected Magic Studio to restyle the shared outline auth buttons used for OAuth and QR recovery actions.',
  );
});
