import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..');

const runTauriCommandSource = fs.readFileSync(
  path.resolve(workspaceRoot, 'scripts/run-tauri-command.mjs'),
  'utf8',
);

test('run-tauri-command wires tauri processes through the full tauri build env', () => {
  assert.match(
    runTauriCommandSource,
    /import\s*\{\s*withTauriBuildEnv\s*\}\s*from\s*['"]\.\/tauri-path\.mjs['"]/,
    'Expected run-tauri-command.mjs to import withTauriBuildEnv from tauri-path.mjs.',
  );
  assert.match(
    runTauriCommandSource,
    /const env = withTauriBuildEnv\(\s*\{[\s\S]*MAGIC_STUDIO_SDK_MODE:\s*sdkMode[\s\S]*\},\s*\{\s*cwd:\s*process\.cwd\(\),\s*preferWorkspaceLocalTargetDir:\s*process\.platform\s*===\s*['"]win32['"],?\s*\}\s*\)/,
    'Expected run-tauri-command.mjs to build the child process environment with withTauriBuildEnv.',
  );
  assert.doesNotMatch(
    runTauriCommandSource,
    /const env = withCargoBinOnPath\(process\.env\)/,
    'Expected run-tauri-command.mjs to stop using the PATH-only cargo env helper for tauri startup.',
  );
});
