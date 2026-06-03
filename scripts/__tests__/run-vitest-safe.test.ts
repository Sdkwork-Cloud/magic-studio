import path from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  buildSafeVitestArgs,
  DEFAULT_VITEST_CONFIG_PATH,
  resolveVitestEntrypoint,
} from '../run-vitest-safe.mjs';

describe('run-vitest-safe', () => {
  it('prepends the sandbox-safe Vitest flags before forwarded test targets', () => {
    expect(buildSafeVitestArgs(['tests/testRunnerBoundary.test.ts'])).toEqual([
      'run',
      '--configLoader',
      'native',
      '--pool',
      'threads',
      '--maxWorkers',
      '1',
      '--exclude',
      '.worktrees/**',
      'tests/testRunnerBoundary.test.ts',
    ]);
  });

  it('drops a leading pnpm argument separator before forwarding file filters', () => {
    expect(buildSafeVitestArgs(['--', 'tests/testRunnerBoundary.test.ts'])).toEqual([
      'run',
      '--configLoader',
      'native',
      '--pool',
      'threads',
      '--maxWorkers',
      '1',
      '--exclude',
      '.worktrees/**',
      'tests/testRunnerBoundary.test.ts',
    ]);
  });

  it('resolves the Vitest CLI entrypoint from the current workspace node_modules', () => {
    expect(resolveVitestEntrypoint('D:\\repo\\magic-studio-v2')).toBe(
      path.join('D:\\repo\\magic-studio-v2', 'node_modules', 'vitest', 'vitest.mjs')
    );
  });

  it('uses the root vite config as the default safe config entrypoint', () => {
    expect(DEFAULT_VITEST_CONFIG_PATH).toBeNull();
  });
});
