import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..');

const mainSource = fs.readFileSync(path.resolve(workspaceRoot, 'src-tauri/src/main.rs'), 'utf8');
const cargoToml = fs.readFileSync(path.resolve(workspaceRoot, 'src-tauri/Cargo.toml'), 'utf8');

test('tauri startup does not register broad shell, fs, or http plugins', () => {
  assert.doesNotMatch(
    mainSource,
    /tauri_plugin_http|tauri_plugin_fs|tauri_plugin_shell/,
    'Expected main.rs to stop registering broad http, fs, or shell plugins.',
  );
  assert.match(
    cargoToml,
    /\[dependencies\]/,
    'Expected Cargo.toml to remain readable for dependency assertions.',
  );
  assert.doesNotMatch(
    cargoToml,
    /tauri-plugin-http|tauri-plugin-fs|tauri-plugin-shell/,
    'Expected Cargo.toml to stop depending on broad http, fs, or shell plugins.',
  );
});
