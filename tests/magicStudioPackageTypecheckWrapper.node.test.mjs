import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  deriveTypecheckRootDirOverride,
  resolveWorkspaceTypeScriptCliPath,
} from '../scripts/run-package-typecheck.mjs';

function withTempWorkspace(callback) {
  const workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'magic-studio-typecheck-'));

  try {
    callback(workspaceRoot);
  } finally {
    fs.rmSync(workspaceRoot, { recursive: true, force: true });
  }
}

function writeText(targetPath, source) {
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, source, 'utf8');
}

function writeJson(targetPath, value) {
  writeText(targetPath, JSON.stringify(value, null, 2));
}

function writeWorkspaceTypeScriptPackage(workspaceRoot) {
  writeJson(path.join(workspaceRoot, 'package.json'), {
    name: 'magic-studio-test',
    version: '0.0.0',
  });
  writeText(
    path.join(workspaceRoot, 'node_modules', '.modules.yaml'),
    'virtualStoreDir: node_modules/.pnpm\n',
  );
  writeJson(path.join(workspaceRoot, 'node_modules', 'typescript', 'package.json'), {
    name: 'typescript',
    version: '6.0.2',
    bin: {
      tsc: './bin/tsc',
    },
  });
  writeText(
    path.join(workspaceRoot, 'node_modules', 'typescript', 'bin', 'tsc'),
    '#!/usr/bin/env node\n',
  );
}

test('run-package-typecheck resolves the workspace-local TypeScript CLI without repairing linked dependencies', () => {
  withTempWorkspace((workspaceRoot) => {
    writeWorkspaceTypeScriptPackage(workspaceRoot);
    let repairCalls = 0;

    const tscPath = resolveWorkspaceTypeScriptCliPath({
      workspaceRoot,
      repairWorkspaceNodeModulesImpl: () => {
        repairCalls += 1;
        return {
          missingSummary: {
            actionableDependencies: [],
          },
        };
      },
    });

    assert.equal(
      tscPath,
      path.join(workspaceRoot, 'node_modules', 'typescript', 'bin', 'tsc'),
    );
    assert.equal(repairCalls, 0);
  });
});

test('run-package-typecheck repairs workspace links before resolving the TypeScript CLI', () => {
  withTempWorkspace((workspaceRoot) => {
    writeJson(path.join(workspaceRoot, 'package.json'), {
      name: 'magic-studio-test',
      version: '0.0.0',
    });
    writeText(
      path.join(workspaceRoot, 'node_modules', '.modules.yaml'),
      'virtualStoreDir: node_modules/.pnpm\n',
    );
    let repairCalls = 0;

    const tscPath = resolveWorkspaceTypeScriptCliPath({
      workspaceRoot,
      repairWorkspaceNodeModulesImpl: ({ workspaceRoot: repairWorkspaceRoot }) => {
        repairCalls += 1;
        writeWorkspaceTypeScriptPackage(repairWorkspaceRoot);
        return {
          missingSummary: {
            actionableDependencies: [],
          },
        };
      },
    });

    assert.equal(
      tscPath,
      path.join(workspaceRoot, 'node_modules', 'typescript', 'bin', 'tsc'),
    );
    assert.equal(repairCalls, 1);
  });
});

test('run-package-typecheck surfaces install guidance when repair cannot recover the TypeScript CLI', () => {
  withTempWorkspace((workspaceRoot) => {
    writeJson(path.join(workspaceRoot, 'package.json'), {
      name: 'magic-studio-test',
      version: '0.0.0',
    });
    writeText(
      path.join(workspaceRoot, 'node_modules', '.modules.yaml'),
      'virtualStoreDir: node_modules/.pnpm\n',
    );

    assert.throws(
      () =>
        resolveWorkspaceTypeScriptCliPath({
          workspaceRoot,
          repairWorkspaceNodeModulesImpl: () => ({
            missingSummary: {
              actionableDependencies: [
                {
                  dependency: 'typescript',
                },
                {
                  dependency: 'vitest',
                },
              ],
            },
          }),
        }),
      (error) => {
        assert.match(error.message, /Missing workspace-local TypeScript compiler/);
        assert.match(error.message, /Repair could not relink dependencies/);
        assert.match(error.message, /typescript, vitest/);
        assert.match(error.message, /pnpm install --frozen-lockfile/);
        return true;
      },
    );
  });
});

test('run-package-typecheck widens rootDir when workspace aliases escape the package scope', () => {
  withTempWorkspace((tempRoot) => {
    const monorepoRoot = path.join(tempRoot, 'spring-ai-plus-business');
    const workspaceRoot = path.join(monorepoRoot, 'apps', 'magic-studio-v2');
    const configuredRootDir = path.join(workspaceRoot, 'packages');

    const rootDirOverride = deriveTypecheckRootDirOverride({
      configuredRootDir,
      configDirectoryPath: path.join(
        workspaceRoot,
        'packages',
        'sdkwork-magic-studio-generation-history',
      ),
      pathsBasePath: workspaceRoot,
      pathMappings: {
        '@sdkwork/magic-studio-core': [
          'packages/sdkwork-magic-studio-core/src/index.ts',
        ],
        '@sdkwork/ui-pc-react': [
          '../sdkwork-ui/sdkwork-ui-pc-react/src/index.ts',
        ],
        '@sdkwork/app-sdk': [
          '../../spring-ai-plus-app-api/sdkwork-sdk-app/sdkwork-app-sdk-typescript/src/index.ts',
        ],
        '@sdkwork/sdk-common': [
          '../../sdk/sdkwork-sdk-commons/sdkwork-sdk-common-typescript/src/index.ts',
        ],
      },
      includedFiles: [
        path.join(
          workspaceRoot,
          'packages',
          'sdkwork-magic-studio-generation-history',
          'src',
          'index.ts',
        ),
      ],
    });

    assert.equal(rootDirOverride, monorepoRoot);
  });
});

test('run-package-typecheck keeps the configured rootDir when aliases stay inside it', () => {
  withTempWorkspace((tempRoot) => {
    const workspaceRoot = path.join(tempRoot, 'spring-ai-plus-business', 'apps', 'magic-studio-v2');
    const configuredRootDir = path.join(workspaceRoot, 'packages');

    const rootDirOverride = deriveTypecheckRootDirOverride({
      configuredRootDir,
      configDirectoryPath: path.join(workspaceRoot, 'packages', 'sdkwork-magic-studio-character'),
      pathsBasePath: workspaceRoot,
      pathMappings: {
        '@sdkwork/magic-studio-core': [
          'packages/sdkwork-magic-studio-core/src/index.ts',
        ],
        '@sdkwork/magic-studio-types': [
          'packages/sdkwork-magic-studio-types/src/index.ts',
        ],
      },
      includedFiles: [
        path.join(
          workspaceRoot,
          'packages',
          'sdkwork-magic-studio-character',
          'src',
          'index.ts',
        ),
      ],
    });

    assert.equal(rootDirOverride, null);
  });
});
