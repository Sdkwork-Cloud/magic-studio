import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const workspaceRoot = path.resolve(__dirname, '..');
const packageJson = JSON.parse(fs.readFileSync(path.join(workspaceRoot, 'package.json'), 'utf8'));
const viteConfigSource = fs.readFileSync(path.join(workspaceRoot, 'vite.config.ts'), 'utf8');
const nodeRunnerPath = path.join(workspaceRoot, 'scripts', 'run-node-tests.mjs');
const safeVitestRunnerPath = path.join(workspaceRoot, 'scripts', 'run-vitest-safe.mjs');

describe('test runner boundary', () => {
  it('keeps node:test files out of vitest collection', () => {
    expect(viteConfigSource).toContain('**/*.node.test.mjs');
    expect(viteConfigSource).toContain('scripts/*.test.mjs');
  });

  it('runs vitest and node:test through separate root scripts', () => {
    expect(packageJson.scripts['test:vitest']).toBeTruthy();
    expect(packageJson.scripts['test:vitest:safe']).toBeTruthy();
    expect(packageJson.scripts['test:node']).toBeTruthy();
    expect(packageJson.scripts['test:safe']).toBeTruthy();
    expect(packageJson.scripts['repair:deps']).toBeTruthy();
    expect(String(packageJson.scripts.test)).toContain('test:vitest');
    expect(String(packageJson.scripts.test)).toContain('test:node');
    expect(String(packageJson.scripts['test:safe'])).toContain('test:vitest:safe');
    expect(String(packageJson.scripts['test:safe'])).toContain('test:node');
    expect(String(packageJson.scripts['test:vitest:safe'])).toContain(
      'scripts/run-vitest-safe.mjs'
    );
    expect(String(packageJson.scripts['repair:deps'])).toContain(
      'repair-workspace-node-modules.mjs'
    );
    expect(String(packageJson.scripts['test:node'])).toContain('scripts/run-node-tests.mjs');
  });

  it('runs server contract checks through sandbox-safe root runners', () => {
    const checkServerScript = String(packageJson.scripts['check:server']);

    expect(checkServerScript).toContain('scripts/run-node-tests.mjs');
    expect(checkServerScript).not.toContain('node --test');
    expect(checkServerScript).toContain('scripts/run-vitest-safe.mjs');
    expect(checkServerScript).not.toContain('node ./node_modules/vitest/vitest.mjs');
  });

  it('ships a dedicated cross-platform node:test runner script', () => {
    expect(fs.existsSync(nodeRunnerPath)).toBe(true);
  });

  it('ships a dedicated cross-platform safe vitest runner script', () => {
    expect(fs.existsSync(safeVitestRunnerPath)).toBe(true);
  });
});
