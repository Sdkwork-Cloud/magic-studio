import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..');

const exists = (relativePath) => fs.existsSync(path.resolve(workspaceRoot, relativePath));
const rootScriptTestTsFiles = fs
  .readdirSync(path.resolve(workspaceRoot, 'scripts'), { withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith('.test.ts'))
  .map((entry) => entry.name);

test('node-executed boundary scripts live in warning-free .mjs files', () => {
  assert.equal(
    exists('scripts/sdkwork-core-env-auth-boundary.test.mjs'),
    true,
    'Expected the auth boundary script to be a directly executable .mjs file.',
  );
  assert.equal(
    exists('scripts/sdkwork-core-runtime-boundary.test.mjs'),
    true,
    'Expected the runtime boundary script to be a directly executable .mjs file.',
  );
  assert.equal(
    exists('scripts/sdkwork-core-env-auth-boundary.test.ts'),
    false,
    'Expected the old .ts auth boundary script entrypoint to be removed to avoid Node module-type warnings.',
  );
  assert.equal(
    exists('scripts/sdkwork-core-runtime-boundary.test.ts'),
    false,
    'Expected the old .ts runtime boundary script entrypoint to be removed to avoid Node module-type warnings.',
  );
  assert.deepEqual(
    rootScriptTestTsFiles,
    [],
    'Expected no root-level scripts/*.test.ts files, because Node-executed script tests must use warning-free .mjs entrypoints.',
  );
});
