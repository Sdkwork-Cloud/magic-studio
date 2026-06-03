import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..');

test('app entry does not eagerly import xterm css on startup-critical path', () => {
  const entrySource = fs.readFileSync(path.resolve(workspaceRoot, 'index.tsx'), 'utf8');

  assert.doesNotMatch(
    entrySource,
    /@xterm\/xterm\/css\/xterm\.css/,
    'Expected index.tsx to avoid global xterm css imports on the startup path.',
  );
});
