import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const workspaceRoot = process.cwd();
const rootPackageJsonPath = path.join(workspaceRoot, 'package.json');
const npmrcPath = path.join(workspaceRoot, '.npmrc');
const packageManifestPaths = [
  path.join(workspaceRoot, 'packages', 'sdkwork-magic-studio-server', 'package.json'),
  path.join(workspaceRoot, 'packages', 'sdkwork-magic-studio-host-core', 'package.json'),
  path.join(workspaceRoot, 'packages', 'sdkwork-magic-studio-types', 'package.json'),
  path.join(workspaceRoot, 'packages', 'sdkwork-magic-studio-distribution', 'package.json'),
];
const workspacePackagesDirectory = path.join(workspaceRoot, 'packages');
const typecheckScriptPath = path.join(
  workspaceRoot,
  'scripts',
  'run-package-typecheck.mjs',
);
const pnpmRunnerScriptPath = path.join(
  workspaceRoot,
  'scripts',
  'run-pnpm-cli.mjs',
);
const workspaceCliRunnerScriptPath = path.join(
  workspaceRoot,
  'scripts',
  'run-workspace-node-cli.mjs',
);
const magicStudioPackageScriptsRunnerPath = path.join(
  workspaceRoot,
  'scripts',
  'run-magic-studio-package-scripts.mjs',
);
const appBuildScriptPath = path.join(workspaceRoot, 'scripts', 'run-app-build.mjs');
const viteDevScriptPath = path.join(workspaceRoot, 'scripts', 'run-vite-dev.mjs');
const packageViteBuildScriptPath = path.join(
  workspaceRoot,
  'scripts',
  'run-package-vite-build.mjs',
);
const packageVitestScriptPath = path.join(
  workspaceRoot,
  'scripts',
  'run-package-vitest.mjs',
);
const packageVitestWatchScriptPath = path.join(
  workspaceRoot,
  'scripts',
  'run-package-vitest-watch.mjs',
);
const tauriRunnerScriptPath = path.join(workspaceRoot, 'scripts', 'run-tauri-command.mjs');
const barePnpmCommandPattern = /(?:^|[&|;()\s])pnpm(?:\s|$)/;
const bareViteBuildPattern = /(?:^|[&|;()\s])vite\s+build(?:\s|$)/;
const bareVitestCommandPattern = /(?:^|[&|;()\s])vitest(?:\s|$)/;
const directVitestEntrypointPattern = /node\s+\.\.\/\.\.\/node_modules\/vitest\/vitest\.mjs/;

test('magic studio foundation packages use a canonical repo typecheck wrapper', () => {
  const rootPackageJson = JSON.parse(fs.readFileSync(rootPackageJsonPath, 'utf8'));
  const npmrcSource = fs.existsSync(npmrcPath)
    ? fs.readFileSync(npmrcPath, 'utf8')
    : '';
  const wrapperSource = fs.existsSync(typecheckScriptPath)
    ? fs.readFileSync(typecheckScriptPath, 'utf8')
    : '';
  const pnpmRunnerSource = fs.existsSync(pnpmRunnerScriptPath)
    ? fs.readFileSync(pnpmRunnerScriptPath, 'utf8')
    : '';
  const workspaceCliRunnerSource = fs.existsSync(workspaceCliRunnerScriptPath)
    ? fs.readFileSync(workspaceCliRunnerScriptPath, 'utf8')
    : '';
  const magicStudioPackageScriptsRunnerSource = fs.existsSync(magicStudioPackageScriptsRunnerPath)
    ? fs.readFileSync(magicStudioPackageScriptsRunnerPath, 'utf8')
    : '';
  const appBuildScriptSource = fs.existsSync(appBuildScriptPath)
    ? fs.readFileSync(appBuildScriptPath, 'utf8')
    : '';
  const viteDevScriptSource = fs.existsSync(viteDevScriptPath)
    ? fs.readFileSync(viteDevScriptPath, 'utf8')
    : '';
  const tauriRunnerScriptSource = fs.existsSync(tauriRunnerScriptPath)
    ? fs.readFileSync(tauriRunnerScriptPath, 'utf8')
    : '';

  assert.equal(
    fs.existsSync(typecheckScriptPath),
    true,
    'Expected a canonical run-package-typecheck.mjs script to exist.',
  );
  assert.match(
    wrapperSource,
    /ensure-workspace-node-modules\.mjs/,
    'Expected the canonical package typecheck wrapper to verify workspace dependency links before invoking TypeScript.',
  );
  assert.match(
    wrapperSource,
    /repair-workspace-node-modules\.mjs/,
    'Expected the canonical package typecheck wrapper to attempt a canonical workspace relink before failing on missing dependencies.',
  );
  assert.match(
    wrapperSource,
    /typescript\/bin\/tsc/,
    'Expected the canonical package typecheck wrapper to resolve and invoke the workspace-local TypeScript CLI directly.',
  );
  assert.equal(
    fs.existsSync(pnpmRunnerScriptPath),
    true,
    'Expected a canonical run-pnpm-cli.mjs script to exist for root workspace script delegation.',
  );
  assert.equal(
    fs.existsSync(workspaceCliRunnerScriptPath),
    true,
    'Expected a canonical run-workspace-node-cli.mjs script to exist for workspace-local Node CLI execution.',
  );
  assert.equal(
    fs.existsSync(magicStudioPackageScriptsRunnerPath),
    true,
    'Expected a canonical run-magic-studio-package-scripts.mjs script to exist for app-owned package task orchestration.',
  );
  assert.match(
    pnpmRunnerSource,
    /npm_execpath|pnpm\.cjs/,
    'Expected the canonical pnpm runner to resolve pnpm through the active lifecycle environment or current Node runtime.',
  );
  assert.match(
    workspaceCliRunnerSource,
    /package\.json|bin/,
    'Expected the workspace CLI runner to resolve package bin entries from workspace-local package metadata.',
  );
  assert.match(
    magicStudioPackageScriptsRunnerSource,
    /sdkwork-magic-studio-|run-pnpm-cli\.mjs|package\.json/,
    'Expected the Magic Studio package scripts runner to enumerate app-owned packages and delegate package scripts through the canonical pnpm runner.',
  );
  assert.match(
    npmrcSource,
    /(?:^|\r?\n)shell-emulator=true(?:\r?\n|$)/,
    'Expected workspace .npmrc to enable pnpm shell-emulator so package scripts can resolve the current Node runtime consistently.',
  );
  assert.doesNotMatch(
    wrapperSource,
    /['"]exec['"],\s*['"]tsc['"]/,
    'Expected the canonical package typecheck wrapper to avoid shelling out through pnpm exec tsc.',
  );
  assert.doesNotMatch(
    wrapperSource,
    /pnpm(?:\.cmd)?[\s\S]{0,120}exec[\s\S]{0,120}tsc|pnpmExecutable|pnpmCliPath/,
    'Expected the canonical package typecheck wrapper to avoid depending on pnpm command resolution for TypeScript execution.',
  );
  for (const [scriptLabel, scriptSource] of [
    ['scripts/run-app-build.mjs', appBuildScriptSource],
    ['scripts/run-vite-dev.mjs', viteDevScriptSource],
    ['scripts/run-tauri-command.mjs', tauriRunnerScriptSource],
  ]) {
    assert.match(
      scriptSource,
      /run-workspace-node-cli\.mjs/,
      `Expected ${scriptLabel} to delegate workspace-local Node CLIs through the canonical workspace runner.`,
    );
    assert.doesNotMatch(
      scriptSource,
      /\bpnpm exec\b/,
      `Expected ${scriptLabel} to avoid pnpm exec shell resolution.`,
    );
  }

  assert.doesNotMatch(
    rootPackageJson.scripts?.['check:server'] ?? '',
    barePnpmCommandPattern,
    'Expected root check:server to avoid bare pnpm shell resolution.',
  );
  assert.match(
    rootPackageJson.scripts?.['check:server'] ?? '',
    /run-pnpm-cli\.mjs --dir packages\/sdkwork-magic-studio-server run typecheck/,
    'Expected root check:server to delegate TypeScript validation through the canonical pnpm runner.',
  );
  for (const [scriptName, scriptValue] of Object.entries(rootPackageJson.scripts ?? {})) {
    assert.doesNotMatch(
      scriptValue,
      barePnpmCommandPattern,
      `Expected root package.json#scripts.${scriptName} to avoid bare pnpm shell resolution.`,
    );
  }
  assert.match(
    rootPackageJson.scripts?.typecheck ?? '',
    /run-magic-studio-package-scripts\.mjs typecheck/,
    'Expected root typecheck to orchestrate app-owned package typechecks without running external workspace lifecycle scripts through Turbo.',
  );
  assert.match(
    rootPackageJson.scripts?.['build:packages'] ?? '',
    /run-magic-studio-package-scripts\.mjs build/,
    'Expected root build:packages to orchestrate app-owned package builds without running external workspace lifecycle scripts through Turbo.',
  );
  assert.doesNotMatch(
    rootPackageJson.scripts?.typecheck ?? '',
    /turbo run typecheck/,
    'Expected root typecheck to avoid Turbo dependency traversal into external workspace packages.',
  );
  assert.doesNotMatch(
    rootPackageJson.scripts?.['build:packages'] ?? '',
    /turbo run build/,
    'Expected root build:packages to avoid Turbo dependency traversal into external workspace packages.',
  );

  const expectedScriptNamesByManifest = new Map([
    [packageManifestPaths[0], ['typecheck']],
    [packageManifestPaths[1], ['build', 'typecheck']],
    [packageManifestPaths[2], ['build', 'typecheck']],
    [packageManifestPaths[3], ['build', 'typecheck']],
  ]);

  for (const manifestPath of packageManifestPaths) {
    const packageJson = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const relativeManifestPath = path.relative(workspaceRoot, manifestPath).replace(/\\/g, '/');

    for (const scriptName of expectedScriptNamesByManifest.get(manifestPath) ?? []) {
      const scriptValue = packageJson.scripts?.[scriptName] ?? '';
      assert.match(
        scriptValue,
        /run-package-typecheck\.mjs/,
        `Expected ${relativeManifestPath}#scripts.${scriptName} to use the canonical package typecheck wrapper.`,
      );
      assert.doesNotMatch(
        scriptValue,
        /\btsc --noEmit\b/,
        `Expected ${relativeManifestPath}#scripts.${scriptName} to avoid assuming a package-local tsc binary.`,
      );
    }
  }
});

test('magic studio workspace manifests keep source-entry package APIs canonical', () => {
  const packageDirectoryEntries = fs.readdirSync(workspacePackagesDirectory, { withFileTypes: true });

  for (const entry of packageDirectoryEntries) {
    if (!entry.isDirectory() || !entry.name.startsWith('sdkwork-magic-studio-')) {
      continue;
    }

    const manifestPath = path.join(workspacePackagesDirectory, entry.name, 'package.json');
    if (!fs.existsSync(manifestPath)) {
      continue;
    }

    const packageJson = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const relativeManifestPath = path.relative(workspaceRoot, manifestPath).replace(/\\/g, '/');
    const rootExport = packageJson.exports?.['.'];
    const rootImportTarget =
      typeof rootExport === 'string' ? rootExport : rootExport?.import;
    const rootTypesTarget =
      typeof rootExport === 'object' && rootExport !== null ? rootExport.types : undefined;
    const sourceRootEntry =
      packageJson.main?.startsWith('./src/')
      || packageJson.module?.startsWith('./src/')
      || packageJson.types?.startsWith('./src/')
      || rootImportTarget?.startsWith('./src/')
      || rootTypesTarget?.startsWith('./src/');

    if (packageJson.private === true) {
      assert.match(
        packageJson.main ?? '',
        /^\.\/src\/index\.(ts|tsx)$/,
        `Expected ${relativeManifestPath}#main to use a canonical source entrypoint.`,
      );
      assert.match(
        packageJson.module ?? '',
        /^\.\/src\/index\.(ts|tsx)$/,
        `Expected ${relativeManifestPath}#module to use a canonical source entrypoint.`,
      );
      assert.match(
        packageJson.types ?? '',
        /^\.\/src\/index\.(ts|tsx)$/,
        `Expected ${relativeManifestPath}#types to use a canonical source entrypoint.`,
      );
      assert.match(
        rootImportTarget ?? '',
        /^\.\/src\/index\.(ts|tsx)$/,
        `Expected ${relativeManifestPath}#exports["."].import to use a canonical source entrypoint.`,
      );
      assert.match(
        rootTypesTarget ?? '',
        /^\.\/src\/index\.(ts|tsx)$/,
        `Expected ${relativeManifestPath}#exports["."].types to use a canonical source entrypoint.`,
      );

      for (const [exportKey, exportValue] of Object.entries(packageJson.exports ?? {})) {
        if (typeof exportValue === 'string') {
          assert.doesNotMatch(
            exportValue,
            /^\.\/dist\//,
            `Expected ${relativeManifestPath}#exports.${exportKey} to avoid dist-based source drift.`,
          );
          continue;
        }

        if (!exportValue || typeof exportValue !== 'object') {
          continue;
        }

        for (const [targetKey, targetValue] of Object.entries(exportValue)) {
          if (typeof targetValue !== 'string') {
            continue;
          }

          assert.doesNotMatch(
            targetValue,
            /^\.\/dist\//,
            `Expected ${relativeManifestPath}#exports.${exportKey}.${targetKey} to avoid dist-based source drift.`,
          );
        }
      }
    }

    if (sourceRootEntry) {
      assert.ok(
        Array.isArray(packageJson.files) && packageJson.files.includes('src'),
        `Expected ${relativeManifestPath}#files to include src once the package API resolves through source entries.`,
      );
    }
  }
});

test('magic studio package vite builds use the canonical safe runner', () => {
  const packageViteBuildScriptSource = fs.existsSync(packageViteBuildScriptPath)
    ? fs.readFileSync(packageViteBuildScriptPath, 'utf8')
    : '';

  assert.equal(
    fs.existsSync(packageViteBuildScriptPath),
    true,
    'Expected a canonical run-package-vite-build.mjs script to exist for package Vite build delegation.',
  );
  assert.match(
    packageViteBuildScriptSource,
    /run-workspace-node-cli\.mjs/,
    'Expected the package Vite build runner to delegate Vite through the canonical workspace Node CLI runner.',
  );
  assert.match(
    packageViteBuildScriptSource,
    /withViteRuntimeEnv/,
    'Expected the package Vite build runner to provide the canonical Vite runtime cache environment.',
  );
  assert.match(
    packageViteBuildScriptSource,
    /resolveViteConfigLoader/,
    'Expected the package Vite build runner to select the safe Vite config loader for the current platform.',
  );
  assert.match(
    packageViteBuildScriptSource,
    /packageName:\s*['"]vite['"]/,
    'Expected the package Vite build runner to invoke the workspace-local Vite package.',
  );
  assert.match(
    packageViteBuildScriptSource,
    /binName:\s*['"]vite['"]/,
    'Expected the package Vite build runner to invoke the Vite bin explicitly.',
  );
  assert.match(
    packageViteBuildScriptSource,
    /--configLoader/,
    'Expected the package Vite build runner to forward Vite --configLoader.',
  );

  const packageDirectoryEntries = fs.readdirSync(workspacePackagesDirectory, { withFileTypes: true });

  for (const entry of packageDirectoryEntries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const manifestPath = path.join(workspacePackagesDirectory, entry.name, 'package.json');
    if (!fs.existsSync(manifestPath)) {
      continue;
    }

    const packageJson = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const relativeManifestPath = path.relative(workspaceRoot, manifestPath).replace(/\\/g, '/');

    assert.equal(
      packageJson.devDependencies?.['vite-plugin-dts'],
      undefined,
      `Expected ${relativeManifestPath} to avoid vite-plugin-dts once package declaration diagnostics are owned by run-package-typecheck.mjs.`,
    );

    for (const [scriptName, scriptValue] of Object.entries(packageJson.scripts ?? {})) {
      const configReferences = scriptValue.matchAll(/--config\s+([^\s]+)/g);
      for (const configReference of configReferences) {
        const configPath = configReference[1];
        assert.equal(
          fs.existsSync(path.resolve(path.dirname(manifestPath), configPath)),
          true,
          `Expected ${relativeManifestPath}#scripts.${scriptName} to reference an existing Vite config file: ${configPath}.`,
        );
      }

      assert.doesNotMatch(
        scriptValue,
        bareViteBuildPattern,
        `Expected ${relativeManifestPath}#scripts.${scriptName} to use node ../../scripts/run-package-vite-build.mjs instead of a bare vite build command.`,
      );
    }

    if (packageJson.scripts?.dev?.includes('run-package-vite-build.mjs')) {
      assert.match(
        packageJson.scripts.dev,
        /run-package-vite-build\.mjs --watch/,
        `Expected ${relativeManifestPath}#scripts.dev to pass --watch through the canonical package Vite build runner.`,
      );
    }

    if (packageJson.scripts?.build?.includes('run-package-vite-build.mjs')) {
      assert.match(
        packageJson.scripts.build,
        /run-package-typecheck\.mjs tsconfig\.json && node \.\.\/\.\.\/scripts\/run-package-vite-build\.mjs/,
        `Expected ${relativeManifestPath}#scripts.build to typecheck before using the canonical package Vite build runner.`,
      );
    }
  }
});

test('magic studio package vite configs are native-loader ESM safe', () => {
  const packageDirectoryEntries = fs.readdirSync(workspacePackagesDirectory, { withFileTypes: true });
  const viteConfigPaths = [];

  for (const entry of packageDirectoryEntries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const packageDirectoryPath = path.join(workspacePackagesDirectory, entry.name);
    for (const packageEntry of fs.readdirSync(packageDirectoryPath, { withFileTypes: true })) {
      if (!packageEntry.isFile()) {
        continue;
      }

      if (/^vite.*\.config\.ts$/.test(packageEntry.name)) {
        viteConfigPaths.push(path.join(packageDirectoryPath, packageEntry.name));
      }
    }
  }

  assert.ok(
    viteConfigPaths.length > 0,
    'Expected package Vite config files to be present for native-loader validation.',
  );

  for (const configPath of viteConfigPaths) {
    const source = fs.readFileSync(configPath, 'utf8');
    const relativeConfigPath = path.relative(workspaceRoot, configPath).replace(/\\/g, '/');

    assert.doesNotMatch(
      source,
      /\b__dirname\b/,
      `Expected ${relativeConfigPath} to derive paths from import.meta.url instead of CommonJS __dirname so Vite --configLoader native can load it.`,
    );
    assert.doesNotMatch(
      source,
      /vite-plugin-dts|\bdts\(/,
      `Expected ${relativeConfigPath} to keep declaration diagnostics in the canonical package typecheck wrapper instead of vite-plugin-dts, which can report TS errors while Vite still exits successfully.`,
    );
    assert.doesNotMatch(
      source,
      /\bminify\s*:\s*['"]esbuild['"]|\btransformWithEsbuild\b/,
      `Expected ${relativeConfigPath} to avoid Vite's deprecated esbuild transform path; package builds must use the default/Oxc pipeline or explicitly disable minification.`,
    );
    assert.match(
      source,
      /external:\s*\[[\s\S]*\/\^@sdkwork\\\/\//,
      `Expected ${relativeConfigPath} to externalize @sdkwork scoped imports so package library builds do not bundle generated SDKs, user-center SDKs, or sibling Magic Studio packages.`,
    );
  }
});

test('magic studio package vitest scripts use the canonical safe package runner', () => {
  const packageVitestScriptSource = fs.existsSync(packageVitestScriptPath)
    ? fs.readFileSync(packageVitestScriptPath, 'utf8')
    : '';
  const packageVitestWatchScriptSource = fs.existsSync(packageVitestWatchScriptPath)
    ? fs.readFileSync(packageVitestWatchScriptPath, 'utf8')
    : '';

  assert.equal(
    fs.existsSync(packageVitestScriptPath),
    true,
    'Expected a canonical run-package-vitest.mjs script to exist for package Vitest delegation.',
  );
  assert.equal(
    fs.existsSync(packageVitestWatchScriptPath),
    true,
    'Expected a canonical run-package-vitest-watch.mjs script to exist for package Vitest watch delegation.',
  );
  assert.match(
    packageVitestScriptSource,
    /run-vitest-safe\.mjs|resolveVitestEntrypoint/,
    'Expected the package Vitest runner to reuse the canonical safe Vitest entrypoint and runtime arguments.',
  );
  assert.match(
    packageVitestScriptSource,
    /process\.cwd\(\)|packageRelativePath|sdkwork-magic-studio-/,
    'Expected the package Vitest runner to scope default test discovery to the current package directory.',
  );
  assert.match(
    packageVitestWatchScriptSource,
    /resolveVitestEntrypoint/,
    'Expected the package Vitest watch runner to invoke the workspace-local Vitest entrypoint explicitly.',
  );
  assert.match(
    packageVitestWatchScriptSource,
    /--configLoader|native/,
    'Expected the package Vitest watch runner to keep native config loading aligned with safe test runs.',
  );

  const packageDirectoryEntries = fs.readdirSync(workspacePackagesDirectory, { withFileTypes: true });

  for (const entry of packageDirectoryEntries) {
    if (!entry.isDirectory() || !entry.name.startsWith('sdkwork-magic-studio-')) {
      continue;
    }

    const manifestPath = path.join(workspacePackagesDirectory, entry.name, 'package.json');
    if (!fs.existsSync(manifestPath)) {
      continue;
    }

    const packageJson = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const relativeManifestPath = path.relative(workspaceRoot, manifestPath).replace(/\\/g, '/');

    for (const [scriptName, scriptValue] of Object.entries(packageJson.scripts ?? {})) {
      assert.doesNotMatch(
        scriptValue,
        bareVitestCommandPattern,
        `Expected ${relativeManifestPath}#scripts.${scriptName} to avoid bare Vitest shell resolution.`,
      );
      assert.doesNotMatch(
        scriptValue,
        directVitestEntrypointPattern,
        `Expected ${relativeManifestPath}#scripts.${scriptName} to use the canonical package Vitest runner instead of a direct node_modules Vitest entrypoint.`,
      );
    }

    if (Object.prototype.hasOwnProperty.call(packageJson.scripts ?? {}, 'test')) {
      assert.match(
        packageJson.scripts.test,
        /^node \.\.\/\.\.\/scripts\/run-package-vitest\.mjs(?:\s|$)/,
        `Expected ${relativeManifestPath}#scripts.test to use node ../../scripts/run-package-vitest.mjs.`,
      );
    }
    if (Object.prototype.hasOwnProperty.call(packageJson.scripts ?? {}, 'test:watch')) {
      assert.match(
        packageJson.scripts['test:watch'],
        /^node \.\.\/\.\.\/scripts\/run-package-vitest-watch\.mjs(?:\s|$)/,
        `Expected ${relativeManifestPath}#scripts.test:watch to use node ../../scripts/run-package-vitest-watch.mjs.`,
      );
    }
  }
});
