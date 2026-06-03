import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { test } from 'node:test';

const repoRoot = process.cwd();
const serverPackageDir = path.join(repoRoot, 'packages', 'sdkwork-magic-studio-server');
const buildScriptUrl = pathToFileURL(
  path.join(repoRoot, 'scripts', 'run-magic-studio-server-build.mjs')
);

test('server build script resolves the repo root when invoked from the package cwd', async () => {
  const originalCwd = process.cwd();
  try {
    process.chdir(serverPackageDir);
    const module = await import(`${buildScriptUrl.href}?cwd-contract=${Date.now()}`);
    const plan = module.buildServerBuildPlan();

    assert.equal(plan.cwd, repoRoot);
    assert.deepEqual(plan.args.slice(0, 3), [
      'build',
      '--manifest-path',
      path.join(repoRoot, 'packages', 'sdkwork-magic-studio-server', 'src-host', 'Cargo.toml'),
    ]);
  } finally {
    process.chdir(originalCwd);
  }
});
