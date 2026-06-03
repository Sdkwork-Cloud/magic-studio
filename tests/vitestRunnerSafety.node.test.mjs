import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const workspaceRoot = process.cwd();
const packageJsonPath = path.join(workspaceRoot, 'package.json');
const safeVitestRunnerPath = path.join(workspaceRoot, 'scripts', 'run-vitest-safe.mjs');

test('default vitest script uses the sandbox-safe runner', () => {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

  assert.equal(
    fs.existsSync(safeVitestRunnerPath),
    true,
    'Expected the dedicated safe Vitest runner script to exist.',
  );
  assert.match(
    String(packageJson.scripts?.['test:vitest']),
    /scripts\/run-vitest-safe\.mjs/,
    'Expected the default test:vitest script to route through the safe Vitest runner so config loading does not depend on bundle mode.',
  );
});
