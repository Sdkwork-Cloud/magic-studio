import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, it, vi } from 'vitest';

import {
  buildMissingDependencyRecoveryPlan,
  repairWorkspaceNodeModules,
  summarizeMissingResolutionStates,
  summarizeMissingDependencies,
} from '../repair-workspace-node-modules.mjs';

const writeJson = (targetPath: string, value: unknown) => {
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, JSON.stringify(value, null, 2), 'utf8');
};

const writeVirtualStorePackage = ({
  workspaceRoot,
  dirName,
  packageName,
  version,
  dependencies = {},
  optionalDependencies = {},
}: {
  workspaceRoot: string;
  dirName: string;
  packageName: string;
  version: string;
  dependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
}) => {
  writeJson(
    path.join(
      workspaceRoot,
      'node_modules',
      '.pnpm',
      dirName,
      'node_modules',
      ...packageName.split('/'),
      'package.json'
    ),
    {
      name: packageName,
      version,
      dependencies,
      optionalDependencies,
    }
  );
};

const withTempWorkspace = (callback: (workspaceRoot: string) => void) => {
  const workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'magic-studio-repair-'));

  try {
    callback(workspaceRoot);
  } finally {
    fs.rmSync(workspaceRoot, { recursive: true, force: true });
  }
};

describe('repair-workspace-node-modules', () => {
  it('separates current-platform actionable gaps from platform-optional missing binaries', () => {
    const summary = summarizeMissingDependencies(
      [
        {
          from: '.',
          dependency: 'jszip',
          range: '3.10.1',
          optional: false,
        },
        {
          from: 'vite',
          dependency: 'fsevents',
          range: '~2.3.3',
          optional: true,
        },
        {
          from: '@tailwindcss/oxide',
          dependency: '@tailwindcss/oxide-linux-x64-gnu',
          range: '4.2.2',
          optional: true,
        },
        {
          from: '@google/genai',
          dependency: 'protobufjs',
          range: '^7.5.4',
          optional: false,
        },
        {
          from: 'google-auth-library',
          dependency: 'protobufjs',
          range: '^7.5.4',
          optional: false,
        },
      ],
      {
        platform: 'win32',
        arch: 'x64',
      }
    );

    expect(summary).toMatchObject({
      totalCount: 5,
      actionableCount: 3,
      platformOptionalCount: 2,
      actionableUniqueCount: 2,
      platformOptionalUniqueCount: 2,
    });
    expect(summary.actionableDependencies).toEqual([
      {
        dependency: 'jszip',
        occurrenceCount: 1,
        from: ['.'],
        optional: false,
        ranges: ['3.10.1'],
        reason: 'required-package',
      },
      {
        dependency: 'protobufjs',
        occurrenceCount: 2,
        from: ['@google/genai', 'google-auth-library'],
        optional: false,
        ranges: ['^7.5.4'],
        reason: 'required-package',
      },
    ]);
    expect(summary.platformOptionalDependencies).toEqual([
      {
        dependency: '@tailwindcss/oxide-linux-x64-gnu',
        occurrenceCount: 1,
        from: ['@tailwindcss/oxide'],
        optional: true,
        ranges: ['4.2.2'],
        reason: 'non-current-platform-binary',
      },
      {
        dependency: 'fsevents',
        occurrenceCount: 1,
        from: ['vite'],
        optional: true,
        ranges: ['~2.3.3'],
        reason: 'non-current-platform-binary',
      },
    ]);
  });

  it('builds a tiered recovery plan that keeps root targets in the frontier and defers nested gaps', () => {
    const summary = summarizeMissingDependencies(
      [
        {
          from: '.',
          dependency: 'jszip',
          range: '3.10.1',
          optional: false,
          rootSources: ['jszip'],
        },
        {
          from: '.',
          dependency: 'typescript-eslint',
          range: '8.58.0',
          optional: false,
          rootSources: ['typescript-eslint'],
        },
        {
          from: '@google/genai',
          dependency: 'protobufjs',
          range: '^7.5.4',
          optional: false,
          rootSources: ['@google/genai'],
        },
        {
          from: 'google-auth-library',
          dependency: 'gcp-metadata',
          range: '^7.0.0',
          optional: false,
          rootSources: ['@google/genai'],
        },
        {
          from: 'gcp-metadata',
          dependency: 'google-logging-utils',
          range: '^0.0.2',
          optional: false,
          rootSources: ['@google/genai'],
        },
        {
          from: 'google-auth-library',
          dependency: 'jwa',
          range: '^2.0.0',
          optional: false,
          rootSources: ['@google/genai'],
        },
        {
          from: 'jwa',
          dependency: 'safe-buffer',
          range: '^5.0.1',
          optional: false,
          rootSources: ['@google/genai'],
        },
      ],
      {
        platform: 'win32',
        arch: 'x64',
      }
    );

    const recoveryPlan = buildMissingDependencyRecoveryPlan(summary, {
      rootImporter: {
        dependencies: {
          jszip: '3.10.1',
        },
        devDependencies: {
          'typescript-eslint': '8.58.0',
        },
      },
    });

    expect(recoveryPlan).toMatchObject({
      frontierUniqueCount: 5,
      deferredUniqueCount: 2,
      directRootDependencyCount: 1,
      directRootDevDependencyCount: 1,
      transitiveFrontierCount: 3,
      transitiveDeferredCount: 2,
      rootInstallTargets: ['jszip@3.10.1'],
      rootDevInstallTargets: ['typescript-eslint@8.58.0'],
      transitiveRootDependencyCandidates: ['@google/genai'],
      transitiveRootDevDependencyCandidates: [],
    });
    expect(recoveryPlan.directRootDependencies.map((entry) => entry.dependency)).toEqual(['jszip']);
    expect(recoveryPlan.directRootDevDependencies.map((entry) => entry.dependency)).toEqual([
      'typescript-eslint',
    ]);
    expect(
      recoveryPlan.transitiveFrontierDependencies.map((entry) => entry.dependency)
    ).toEqual(['gcp-metadata', 'jwa', 'protobufjs']);
    expect(recoveryPlan.deferredDependencies).toEqual([
      expect.objectContaining({
        dependency: 'google-logging-utils',
        parentMissingDependencies: ['gcp-metadata'],
        recoveryKind: 'transitive-deferred',
        candidateRootSources: ['@google/genai'],
      }),
      expect.objectContaining({
        dependency: 'safe-buffer',
        parentMissingDependencies: ['jwa'],
        recoveryKind: 'transitive-deferred',
        candidateRootSources: ['@google/genai'],
      }),
    ]);
    expect(recoveryPlan.recoveryTiers.map((tier) => tier.dependencies.map((entry) => entry.dependency)))
      .toEqual([
        ['jszip', 'typescript-eslint', 'gcp-metadata', 'jwa', 'protobufjs'],
        ['google-logging-utils', 'safe-buffer'],
      ]);
  });

  it('rebuilds direct workspace and transitive package links from the local virtual store', () => {
    withTempWorkspace((workspaceRoot) => {
      writeJson(path.join(workspaceRoot, 'package.json'), {
        name: 'magic-studio',
        version: '0.1.0',
      });
      fs.mkdirSync(path.join(workspaceRoot, 'node_modules', '.pnpm'), { recursive: true });
      fs.writeFileSync(
        path.join(workspaceRoot, 'pnpm-lock.yaml'),
        [
          'lockfileVersion: 9.0',
          '',
          'importers:',
          '  .:',
          '    dependencies:',
          "      '@scope/local':",
          '        specifier: workspace:*',
          '        version: link:packages/local',
          '      foo:',
          '        specifier: ^1.0.0',
          '        version: 1.0.0',
          '    devDependencies:',
          '      vitest:',
          '        specifier: ^4.1.2',
          '        version: 4.1.2',
          '',
        ].join('\n'),
        'utf8'
      );
      writeJson(
        path.join(workspaceRoot, 'node_modules', '.pnpm-workspace-state-v1.json'),
        {
          projects: {
            [path.join(workspaceRoot, 'packages', 'local')]: {
              name: '@scope/local',
              version: '1.0.0',
            },
          },
        }
      );
      writeJson(path.join(workspaceRoot, 'packages', 'local', 'package.json'), {
        name: '@scope/local',
        version: '1.0.0',
        dependencies: {
          baz: '^3.0.0',
        },
      });
      writeVirtualStorePackage({
        workspaceRoot,
        dirName: 'foo@1.0.0',
        packageName: 'foo',
        version: '1.0.0',
        dependencies: {
          bar: '^2.0.0',
        },
      });
      writeVirtualStorePackage({
        workspaceRoot,
        dirName: 'bar@2.1.0',
        packageName: 'bar',
        version: '2.1.0',
      });
      writeVirtualStorePackage({
        workspaceRoot,
        dirName: 'baz@3.0.1',
        packageName: 'baz',
        version: '3.0.1',
      });
      writeVirtualStorePackage({
        workspaceRoot,
        dirName: 'vitest@4.1.2',
        packageName: 'vitest',
        version: '4.1.2',
      });

      const result = repairWorkspaceNodeModules({ workspaceRoot });

      expect(result.missing).toEqual([]);
      expect(result.missingSummary).toMatchObject({
        totalCount: 0,
        actionableCount: 0,
        platformOptionalCount: 0,
        actionableUniqueCount: 0,
        platformOptionalUniqueCount: 0,
      });
      expect(result.recoveryPlan).toMatchObject({
        frontierUniqueCount: 0,
        deferredUniqueCount: 0,
        directRootDependencyCount: 0,
        directRootDevDependencyCount: 0,
        transitiveFrontierCount: 0,
        transitiveDeferredCount: 0,
        rootInstallTargets: [],
        rootDevInstallTargets: [],
        recoveryTiers: [],
      });
      expect(fs.readFileSync(path.join(workspaceRoot, 'node_modules', '.modules.yaml'), 'utf8')).toBe(
        'virtualStoreDir: node_modules/.pnpm\n'
      );
      expect(
        JSON.parse(
          fs.readFileSync(path.join(workspaceRoot, 'node_modules', 'foo', 'package.json'), 'utf8')
        )
      ).toMatchObject({
        name: 'foo',
        version: '1.0.0',
      });
      expect(
        JSON.parse(
          fs.readFileSync(path.join(workspaceRoot, 'node_modules', 'bar', 'package.json'), 'utf8')
        )
      ).toMatchObject({
        name: 'bar',
        version: '2.1.0',
      });
      expect(
        JSON.parse(
          fs.readFileSync(
            path.join(workspaceRoot, 'node_modules', '@scope', 'local', 'package.json'),
            'utf8'
          )
        )
      ).toMatchObject({
        name: '@scope/local',
        version: '1.0.0',
      });
      expect(
        JSON.parse(
          fs.readFileSync(path.join(workspaceRoot, 'node_modules', 'baz', 'package.json'), 'utf8')
        )
      ).toMatchObject({
        name: 'baz',
        version: '3.0.1',
      });
      expect(result.workspaceCreated).toBe(1);
      expect(result.regularCreated).toBe(2);
      expect(result.transitiveCreated).toBe(2);
    });
  });

  it('tracks top-level root sources for transitive missing dependencies during repair', () => {
    withTempWorkspace((workspaceRoot) => {
      writeJson(path.join(workspaceRoot, 'package.json'), {
        name: 'magic-studio',
        version: '0.1.0',
      });
      fs.mkdirSync(path.join(workspaceRoot, 'node_modules', '.pnpm'), { recursive: true });
      fs.writeFileSync(
        path.join(workspaceRoot, 'pnpm-lock.yaml'),
        [
          'lockfileVersion: 9.0',
          '',
          'importers:',
          '  .:',
          '    dependencies:',
          '      foo:',
          '        specifier: 1.0.0',
          '        version: 1.0.0',
          '',
        ].join('\n'),
        'utf8'
      );
      writeJson(
        path.join(workspaceRoot, 'node_modules', '.pnpm-workspace-state-v1.json'),
        { projects: {} }
      );
      writeVirtualStorePackage({
        workspaceRoot,
        dirName: 'foo@1.0.0',
        packageName: 'foo',
        version: '1.0.0',
        dependencies: {
          bar: '^2.0.0',
        },
      });
      writeVirtualStorePackage({
        workspaceRoot,
        dirName: 'bar@2.1.0',
        packageName: 'bar',
        version: '2.1.0',
        dependencies: {
          baz: '^3.0.0',
        },
      });

      const result = repairWorkspaceNodeModules({ workspaceRoot });

      expect(result.missing).toEqual([
        expect.objectContaining({
          from: 'bar',
          dependency: 'baz',
          rootSources: ['foo'],
        }),
      ]);
      expect(result.missingSummary.actionableDependencies).toEqual([
        expect.objectContaining({
          dependency: 'baz',
          rootSources: ['foo'],
        }),
      ]);
      expect(result.recoveryPlan.transitiveRootDependencyCandidates).toEqual(['foo']);
    });
  });

  it('prefers the highest matching version for transitive dependencies', () => {
    withTempWorkspace((workspaceRoot) => {
      writeJson(path.join(workspaceRoot, 'package.json'), {
        name: 'magic-studio',
        version: '0.1.0',
      });
      fs.mkdirSync(path.join(workspaceRoot, 'node_modules', '.pnpm'), { recursive: true });
      fs.writeFileSync(
        path.join(workspaceRoot, 'pnpm-lock.yaml'),
        [
          'lockfileVersion: 9.0',
          '',
          'importers:',
          '  .:',
          '    dependencies:',
          '      foo:',
          '        specifier: 1.0.0',
          '        version: 1.0.0',
          '',
        ].join('\n'),
        'utf8'
      );
      writeJson(
        path.join(workspaceRoot, 'node_modules', '.pnpm-workspace-state-v1.json'),
        { projects: {} }
      );
      writeVirtualStorePackage({
        workspaceRoot,
        dirName: 'foo@1.0.0',
        packageName: 'foo',
        version: '1.0.0',
        dependencies: {
          bar: '^1.0.0',
        },
      });
      writeVirtualStorePackage({
        workspaceRoot,
        dirName: 'bar@1.0.0',
        packageName: 'bar',
        version: '1.0.0',
      });
      writeVirtualStorePackage({
        workspaceRoot,
        dirName: 'bar@1.2.0',
        packageName: 'bar',
        version: '1.2.0',
      });
      writeVirtualStorePackage({
        workspaceRoot,
        dirName: 'bar@2.0.0',
        packageName: 'bar',
        version: '2.0.0',
      });

      repairWorkspaceNodeModules({ workspaceRoot });

      expect(
        JSON.parse(
          fs.readFileSync(path.join(workspaceRoot, 'node_modules', 'bar', 'package.json'), 'utf8')
        )
      ).toMatchObject({
        version: '1.2.0',
      });
    });
  });

  it('skips unreadable virtual store candidates and keeps repairing from readable ones', () => {
    withTempWorkspace((workspaceRoot) => {
      writeJson(path.join(workspaceRoot, 'package.json'), {
        name: 'magic-studio',
        version: '0.1.0',
      });
      fs.mkdirSync(path.join(workspaceRoot, 'node_modules', '.pnpm'), { recursive: true });
      fs.writeFileSync(
        path.join(workspaceRoot, 'pnpm-lock.yaml'),
        [
          'lockfileVersion: 9.0',
          '',
          'importers:',
          '  .:',
          '    dependencies:',
          '      foo:',
          '        specifier: 1.0.0',
          '        version: 1.0.0',
          '',
        ].join('\n'),
        'utf8'
      );
      writeJson(
        path.join(workspaceRoot, 'node_modules', '.pnpm-workspace-state-v1.json'),
        { projects: {} }
      );
      writeVirtualStorePackage({
        workspaceRoot,
        dirName: 'foo@1.0.0',
        packageName: 'foo',
        version: '1.0.0',
        dependencies: {
          bar: '^1.0.0',
        },
      });
      fs.mkdirSync(
        path.join(workspaceRoot, 'node_modules', '.pnpm', 'bar@1.0.0', 'node_modules', 'bar'),
        { recursive: true }
      );
      fs.writeFileSync(
        path.join(
          workspaceRoot,
          'node_modules',
          '.pnpm',
          'bar@1.0.0',
          'node_modules',
          'bar',
          'package.json'
        ),
        '{invalid-json',
        'utf8'
      );
      writeVirtualStorePackage({
        workspaceRoot,
        dirName: 'bar@1.1.0',
        packageName: 'bar',
        version: '1.1.0',
      });

      expect(() => repairWorkspaceNodeModules({ workspaceRoot })).not.toThrow();
      expect(
        JSON.parse(
          fs.readFileSync(path.join(workspaceRoot, 'node_modules', 'bar', 'package.json'), 'utf8')
        )
      ).toMatchObject({
        version: '1.1.0',
      });
    });
  });

  it('treats stable releases as satisfying prerelease minimum ranges during relink repair', () => {
    withTempWorkspace((workspaceRoot) => {
      writeJson(path.join(workspaceRoot, 'package.json'), {
        name: 'magic-studio',
        version: '0.1.0',
      });
      fs.mkdirSync(path.join(workspaceRoot, 'node_modules', '.pnpm'), { recursive: true });
      fs.writeFileSync(
        path.join(workspaceRoot, 'pnpm-lock.yaml'),
        [
          'lockfileVersion: 9.0',
          '',
          'importers:',
          '  .:',
          '    dependencies:',
          '      vitest:',
          '        specifier: 4.1.2',
          '        version: 4.1.2',
          '',
        ].join('\n'),
        'utf8'
      );
      writeJson(
        path.join(workspaceRoot, 'node_modules', '.pnpm-workspace-state-v1.json'),
        { projects: {} }
      );
      writeVirtualStorePackage({
        workspaceRoot,
        dirName: 'vitest@4.1.2',
        packageName: 'vitest',
        version: '4.1.2',
        dependencies: {
          'std-env': '^4.0.0-rc.1',
        },
      });
      writeVirtualStorePackage({
        workspaceRoot,
        dirName: 'std-env@4.0.0',
        packageName: 'std-env',
        version: '4.0.0',
      });

      const result = repairWorkspaceNodeModules({ workspaceRoot });

      expect(result.missingSummary).toMatchObject({
        actionableUniqueCount: 0,
      });
      expect(
        JSON.parse(
          fs.readFileSync(
            path.join(workspaceRoot, 'node_modules', 'std-env', 'package.json'),
            'utf8'
          )
        )
      ).toMatchObject({
        name: 'std-env',
        version: '4.0.0',
      });
    });
  });

  it('falls back to virtual store directory versions when candidate package.json reads fail', () => {
    withTempWorkspace((workspaceRoot) => {
      writeJson(path.join(workspaceRoot, 'package.json'), {
        name: 'magic-studio',
        version: '0.1.0',
      });
      fs.mkdirSync(path.join(workspaceRoot, 'node_modules', '.pnpm'), { recursive: true });
      fs.writeFileSync(
        path.join(workspaceRoot, 'pnpm-lock.yaml'),
        [
          'lockfileVersion: 9.0',
          '',
          'importers:',
          '  .:',
          '    dependencies:',
          '      foo:',
          '        specifier: 1.0.0',
          '        version: 1.0.0',
          '',
        ].join('\n'),
        'utf8'
      );
      writeJson(
        path.join(workspaceRoot, 'node_modules', '.pnpm-workspace-state-v1.json'),
        { projects: {} }
      );
      writeVirtualStorePackage({
        workspaceRoot,
        dirName: 'foo@1.0.0',
        packageName: 'foo',
        version: '1.0.0',
        dependencies: {
          bar: '^2.1.0',
        },
      });
      writeVirtualStorePackage({
        workspaceRoot,
        dirName: 'bar@2.1.0',
        packageName: 'bar',
        version: '2.1.0',
      });

      const targetPackageJsonPath = path.join(
        workspaceRoot,
        'node_modules',
        '.pnpm',
        'bar@2.1.0',
        'node_modules',
        'bar',
        'package.json'
      );
      const originalReadFileSync = fs.readFileSync.bind(fs);
      const readFileSyncSpy = vi.spyOn(fs, 'readFileSync').mockImplementation((targetPath, options) => {
        if (path.resolve(String(targetPath)) === path.resolve(targetPackageJsonPath)) {
          const error = new Error('operation not permitted') as NodeJS.ErrnoException;
          error.code = 'EPERM';
          throw error;
        }

        return originalReadFileSync(targetPath, options as never);
      });

      try {
        const result = repairWorkspaceNodeModules({ workspaceRoot });

        expect(result.missingSummary).toMatchObject({
          actionableUniqueCount: 0,
        });
        expect(
          JSON.parse(
            fs.readFileSync(path.join(workspaceRoot, 'node_modules', 'bar', 'package.json'), 'utf8')
          )
        ).toMatchObject({
          name: 'bar',
          version: '2.1.0',
        });
      } finally {
        readFileSyncSpy.mockRestore();
      }
    });
  });

  it('supports OR semver ranges when relinking transitive dependencies', () => {
    withTempWorkspace((workspaceRoot) => {
      writeJson(path.join(workspaceRoot, 'package.json'), {
        name: 'magic-studio',
        version: '0.1.0',
      });
      fs.mkdirSync(path.join(workspaceRoot, 'node_modules', '.pnpm'), { recursive: true });
      fs.writeFileSync(
        path.join(workspaceRoot, 'pnpm-lock.yaml'),
        [
          'lockfileVersion: 9.0',
          '',
          'importers:',
          '  .:',
          '    dependencies:',
          '      foo:',
          '        specifier: 1.0.0',
          '        version: 1.0.0',
          '',
        ].join('\n'),
        'utf8'
      );
      writeJson(
        path.join(workspaceRoot, 'node_modules', '.pnpm-workspace-state-v1.json'),
        { projects: {} }
      );
      writeVirtualStorePackage({
        workspaceRoot,
        dirName: 'foo@1.0.0',
        packageName: 'foo',
        version: '1.0.0',
        dependencies: {
          bar: '^3.25.0 || ^4.0.0',
        },
      });
      writeVirtualStorePackage({
        workspaceRoot,
        dirName: 'bar@4.3.6',
        packageName: 'bar',
        version: '4.3.6',
      });

      const result = repairWorkspaceNodeModules({ workspaceRoot });

      expect(result.missingSummary).toMatchObject({
        actionableUniqueCount: 0,
      });
      expect(
        JSON.parse(
          fs.readFileSync(path.join(workspaceRoot, 'node_modules', 'bar', 'package.json'), 'utf8')
        )
      ).toMatchObject({
        name: 'bar',
        version: '4.3.6',
      });
    });
  });

  it('separates manifest-missing virtual store candidates from packages absent in the store', () => {
    withTempWorkspace((workspaceRoot) => {
      writeJson(path.join(workspaceRoot, 'package.json'), {
        name: 'magic-studio',
        version: '0.1.0',
      });
      fs.mkdirSync(path.join(workspaceRoot, 'node_modules', '.pnpm'), { recursive: true });
      fs.writeFileSync(
        path.join(workspaceRoot, 'pnpm-lock.yaml'),
        [
          'lockfileVersion: 9.0',
          '',
          'importers:',
          '  .:',
          '    dependencies:',
          '      foo:',
          '        specifier: 1.0.0',
          '        version: 1.0.0',
          '      bar:',
          '        specifier: 2.0.0',
          '        version: 2.0.0',
          '',
        ].join('\n'),
        'utf8'
      );
      writeJson(
        path.join(workspaceRoot, 'node_modules', '.pnpm-workspace-state-v1.json'),
        { projects: {} }
      );
      fs.mkdirSync(
        path.join(workspaceRoot, 'node_modules', '.pnpm', 'foo@1.0.0', 'node_modules', 'foo'),
        { recursive: true }
      );
      fs.writeFileSync(
        path.join(workspaceRoot, 'node_modules', '.pnpm', 'foo@1.0.0', 'node_modules', 'foo', 'index.js'),
        'module.exports = {};\n',
        'utf8'
      );

      const result = repairWorkspaceNodeModules({ workspaceRoot });

      expect(result.missingSummary).toMatchObject({
        actionableUniqueCount: 2,
      });
      expect(result.missingResolutionSummary).toMatchObject({
        uniqueDependencyCount: 2,
        manifestMissingUniqueCount: 1,
        manifestUnreadableUniqueCount: 0,
        notFoundUniqueCount: 1,
      });
      expect(result.missingResolutionSummary.entries).toEqual([
        expect.objectContaining({
          dependency: 'bar',
          resolutionStates: ['not-found-in-virtual-store'],
          candidateDirectories: [],
          candidateVersions: [],
        }),
        expect.objectContaining({
          dependency: 'foo',
          resolutionStates: ['manifest-missing'],
          candidateDirectories: ['foo@1.0.0'],
          candidateVersions: ['1.0.0'],
        }),
      ]);

      expect(summarizeMissingResolutionStates(result.missing)).toMatchObject({
        manifestMissingUniqueCount: 1,
        notFoundUniqueCount: 1,
      });
    });
  });

  it('keeps platform-optional binary gaps out of actionable resolution state counts', () => {
    const summary = summarizeMissingResolutionStates(
      [
        {
          from: '.',
          dependency: 'jszip',
          range: '3.10.1',
          optional: false,
        },
        {
          from: '.',
          dependency: 'archiver',
          range: '7.0.1',
          optional: false,
          virtualStoreDiagnostics: [
            {
              state: 'manifest-missing',
              directory: 'archiver@7.0.1',
              version: '7.0.1',
            },
          ],
        },
        {
          from: 'vite',
          dependency: 'fsevents',
          range: '~2.3.3',
          optional: true,
        },
        {
          from: '@tailwindcss/oxide',
          dependency: '@tailwindcss/oxide-linux-x64-gnu',
          range: '4.2.2',
          optional: true,
        },
      ],
      {
        platform: 'win32',
        arch: 'x64',
      }
    );

    expect(summary).toMatchObject({
      uniqueDependencyCount: 2,
      platformOptionalUniqueCount: 2,
      manifestMissingUniqueCount: 1,
      manifestUnreadableUniqueCount: 0,
      notFoundUniqueCount: 1,
    });
    expect(summary.entries).toEqual([
      expect.objectContaining({
        dependency: 'archiver',
        resolutionStates: ['manifest-missing'],
      }),
      expect.objectContaining({
        dependency: 'jszip',
        resolutionStates: ['not-found-in-virtual-store'],
      }),
    ]);
    expect(summary.platformOptionalEntries).toEqual([
      expect.objectContaining({
        dependency: '@tailwindcss/oxide-linux-x64-gnu',
        resolutionStates: ['not-found-in-virtual-store'],
      }),
      expect.objectContaining({
        dependency: 'fsevents',
        resolutionStates: ['not-found-in-virtual-store'],
      }),
    ]);
  });
});
