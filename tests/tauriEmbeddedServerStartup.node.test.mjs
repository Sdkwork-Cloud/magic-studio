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

test('embedded Tauri server registers the Tokio listener inside the async runtime task', () => {
  const source = readSource('src-tauri/src/embedded_server.rs');
  const spawnIndex = source.indexOf('tauri::async_runtime::spawn(async move {');
  const fromStdIndex = source.indexOf('TcpListener::from_std(listener)');

  assert.notEqual(
    spawnIndex,
    -1,
    'Expected the embedded server bootstrap to spawn the canonical server on Tauri async runtime.',
  );
  assert.notEqual(
    fromStdIndex,
    -1,
    'Expected the embedded server bootstrap to register the standard listener with Tokio.',
  );
  assert.ok(
    fromStdIndex > spawnIndex,
    'Expected Tokio listener registration to happen inside the spawned async runtime task so setup() does not require an active reactor.',
  );
  assert.match(
    source,
    /tauri::async_runtime::spawn\(async move \{[\s\S]*TcpListener::from_std\(listener\)[\s\S]*serve_app\(listener,\s*state\)\.await/,
    'Expected the spawned async runtime task to own Tokio listener registration and server execution.',
  );
});
