import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..');

test('thumbnail worker uses capability-oriented fallback messaging', () => {
  const source = fs.readFileSync(
    path.join(workspaceRoot, 'src', 'workers', 'thumbnail.worker.ts'),
    'utf8',
  );

  assert.doesNotMatch(
    source,
    /ffmpeg\.wasm/i,
    'Expected thumbnail worker fallback messaging to avoid backend-specific ffmpeg.wasm wording.',
  );
  assert.match(
    source,
    /browser video decode support|native media runtime|worker-safe video decode/i,
    'Expected thumbnail worker fallback messaging to describe required capability rather than a concrete backend tool.',
  );
});
