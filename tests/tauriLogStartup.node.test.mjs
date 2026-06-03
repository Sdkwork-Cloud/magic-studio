import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..');

const mainSource = fs.readFileSync(
  path.resolve(workspaceRoot, 'src-tauri/src/main.rs'),
  'utf8',
);

test('tauri startup does not hard-fail on log plugin initialization', () => {
  assert.doesNotMatch(
    mainSource,
    /\.plugin\(tauri_plugin_log::Builder::default\(\)\.build\(\)\)/,
    'Expected main.rs to stop registering the log plugin as a mandatory builder-stage plugin.',
  );
  assert.match(
    mainSource,
    /init_optional_log_plugin|initialize_optional_log_plugin|run_non_fatal.*log/i,
    'Expected main.rs to contain an explicit non-fatal log plugin initialization path.',
  );
  assert.match(
    mainSource,
    /app\.plugin\(plugin\)|app\.handle\(\)\.plugin\(tauri_plugin_log::Builder::default\(\)\.build\(\)\)|tauri_plugin_log::Builder::default\(\)\.build\(\)/,
    'Expected log plugin initialization to remain present, just no longer startup-fatal.',
  );
  assert.match(
    mainSource,
    /Optional startup step `log` unavailable|optional.*log.*unavailable|non-fatal.*log/i,
    'Expected the log plugin startup log to communicate that this failure is optional and non-fatal.',
  );
});
