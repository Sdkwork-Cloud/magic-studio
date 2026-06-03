import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { buildNodeTestArgs, buildNodeTestPlan } from '../run-node-tests.mjs';

describe('run-node-tests', () => {
  it('builds a targeted node-side test plan from forwarded file arguments', () => {
    const workspaceRoot = path.join('D:\\repo', 'magic-studio-v2');

    const plan = buildNodeTestPlan(
      [
        '--',
        'tests/magicStudioServerSharedDtoBoundary.node.test.mjs',
        'scripts/server-user-center-entrypoint-contract.test.mjs',
      ],
      { workspaceRoot }
    );

    expect(plan).toEqual([
      {
        mode: 'node:test',
        relativePath: path.join('tests', 'magicStudioServerSharedDtoBoundary.node.test.mjs'),
      },
      {
        mode: 'node-script',
        relativePath: path.join('scripts', 'server-user-center-entrypoint-contract.test.mjs'),
      },
    ]);
    expect(buildNodeTestArgs(plan[0])).toEqual([
      '--test',
      '--experimental-test-isolation=none',
      path.join('tests', 'magicStudioServerSharedDtoBoundary.node.test.mjs'),
    ]);
    expect(buildNodeTestArgs(plan[1])).toEqual([
      path.join('scripts', 'server-user-center-entrypoint-contract.test.mjs'),
    ]);
  });

  it('rejects forwarded files that are not node-side tests', () => {
    expect(() =>
      buildNodeTestPlan(['tests/testRunnerBoundary.test.ts'], {
        workspaceRoot: path.join('D:\\repo', 'magic-studio-v2'),
      })
    ).toThrow(/Expected node-side test target/);
  });
});
