import path from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  detectWorkspaceNodeModulesIssue,
  resolveWorkspacePath,
} from '../ensure-workspace-node-modules.mjs';

describe('ensure-workspace-node-modules', () => {
  it('recommends local relink before reinstall when modules metadata is missing', () => {
    const workspaceRoot = 'D:\\repo\\magic-studio-v2';
    const issue = detectWorkspaceNodeModulesIssue({
      workspaceRoot,
      modulesYaml: null,
    });

    expect(issue).toMatchObject({
      code: 'MISSING_MODULES_METADATA',
    });
    expect(issue?.message).toContain('pnpm run repair:deps');
    expect(issue?.message).toContain('pnpm install --frozen-lockfile');
  });

  it('accepts a workspace-local virtual store directory', () => {
    const workspaceRoot = 'D:\\repo\\magic-studio-v2';
    const issue = detectWorkspaceNodeModulesIssue({
      workspaceRoot,
      modulesYaml: JSON.stringify({
        virtualStoreDir: `${workspaceRoot}\\node_modules\\.pnpm`,
      }),
    });

    expect(issue).toBeNull();
  });

  it('rejects a virtual store directory that points to a sibling workspace', () => {
    const workspaceRoot = 'D:\\repo\\magic-studio-v2';
    const issue = detectWorkspaceNodeModulesIssue({
      workspaceRoot,
      modulesYaml: JSON.stringify({
        virtualStoreDir:
          'D:\\repo\\magic-studio-v2-type-contract-cleanup\\node_modules\\.pnpm',
      }),
    });

    expect(issue).toMatchObject({
      code: 'EXTERNAL_VIRTUAL_STORE',
      actualPath: 'D:\\repo\\magic-studio-v2-type-contract-cleanup\\node_modules\\.pnpm',
    });
    expect(issue?.message).toContain('pnpm run repair:deps');
    expect(issue?.message).toContain('pnpm install --frozen-lockfile');
  });

  it('resolves relative workspace paths against the current workspace root', () => {
    expect(resolveWorkspacePath('D:\\repo\\magic-studio-v2', 'node_modules\\.pnpm')).toBe(
      path.resolve('D:\\repo\\magic-studio-v2', 'node_modules\\.pnpm')
    );
  });
});
