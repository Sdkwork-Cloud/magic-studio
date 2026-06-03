import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const workspaceRoot = process.cwd();
const packagesRoot = path.join(workspaceRoot, 'packages');
const rootPackageJson = JSON.parse(
  fs.readFileSync(path.join(workspaceRoot, 'package.json'), 'utf8'),
);

const staticImportRegex =
  /^\s*import(?:\s+type)?[^;]*?\bfrom\s+['"](@sdkwork\/[A-Za-z0-9-]+)(?:\/[^'"]+)?['"];?/gm;
const exportFromRegex =
  /^\s*export(?:\s+type)?[^;]*?\bfrom\s+['"](@sdkwork\/[A-Za-z0-9-]+)(?:\/[^'"]+)?['"];?/gm;
const dynamicImportRegex =
  /\bimport\(\s*['"](@sdkwork\/[A-Za-z0-9-]+)(?:\/[^'"]+)?['"]\s*\)/g;

const builtInWorkspacePackages = fs
  .readdirSync(packagesRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => path.join(packagesRoot, entry.name, 'package.json'))
  .filter((packageJsonPath) => fs.existsSync(packageJsonPath))
  .map((packageJsonPath) => JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')).name)
  .filter((name) => typeof name === 'string' && name.startsWith('@sdkwork/'));

const rootWorkspaceDependencies = Object.entries(rootPackageJson.dependencies ?? {})
  .filter(([name, version]) => name.startsWith('@sdkwork/') && version === 'workspace:*')
  .map(([name]) => name);

const externalLocalWorkspacePackages = [
  '@sdkwork/auth-pc-react',
  '@sdkwork/ui-pc-react',
  '@sdkwork/user-center-core-pc-react',
  '@sdkwork/user-center-pc-react',
  '@sdkwork/user-center-validation-pc-react',
  '@sdkwork/user-pc-react',
];

const auditedWorkspacePackages = new Set([
  ...builtInWorkspacePackages,
  ...rootWorkspaceDependencies,
  ...externalLocalWorkspacePackages,
]);

const workspacePackageManifestEntries = fs
  .readdirSync(packagesRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => {
    const packageJsonPath = path.join(packagesRoot, entry.name, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      return null;
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    return {
      packageJson,
      packageJsonPath,
      packageName: packageJson.name,
      relativePath: path.relative(workspaceRoot, packageJsonPath),
    };
  })
  .filter(
    (entry) =>
      entry
      && typeof entry.packageName === 'string'
      && entry.packageName.startsWith('@sdkwork/'),
  );

const workspacePackageManifestByName = new Map(
  workspacePackageManifestEntries.map((entry) => [entry.packageName, entry]),
);

const reactCoreToolkitServerSources = [
  'packages/sdkwork-magic-studio-core/src/platform/toolkit/types.ts',
  'packages/sdkwork-magic-studio-core/src/platform/toolkit/policyClient.ts',
  'packages/sdkwork-magic-studio-core/src/platform/toolkit/migrationClient.ts',
  'packages/sdkwork-magic-studio-core/src/platform/toolkit/magicStudioServerRuntime.ts',
  'packages/sdkwork-magic-studio-core/src/platform/toolkit/jobClient.ts',
];

const collectSourceFiles = (sourceRoot) => {
  const files = [];

  const walk = (currentDir) => {
    for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (!['node_modules', 'dist'].includes(entry.name)) {
          walk(path.join(currentDir, entry.name));
        }
        continue;
      }

      if (/\.(ts|tsx|js|jsx|mts|cts)$/.test(entry.name)) {
        files.push(path.join(currentDir, entry.name));
      }
    }
  };

  walk(sourceRoot);
  return files;
};

const collectImportedWorkspacePackages = (source) => {
  const imported = new Set();

  for (const regex of [staticImportRegex, exportFromRegex, dynamicImportRegex]) {
    let match;
    while ((match = regex.exec(source))) {
      const specifier = match[1];
      if (auditedWorkspacePackages.has(specifier)) {
        imported.add(specifier);
      }
    }
    regex.lastIndex = 0;
  }

  return imported;
};

test('workspace package manifests declare every audited workspace package imported from src', () => {
  const offenders = [];

  for (const packageDirEntry of fs.readdirSync(packagesRoot, { withFileTypes: true })) {
    if (!packageDirEntry.isDirectory()) {
      continue;
    }

    const packageDir = path.join(packagesRoot, packageDirEntry.name);
    const packageJsonPath = path.join(packageDir, 'package.json');
    const sourceRoot = path.join(packageDir, 'src');
    if (!fs.existsSync(packageJsonPath) || !fs.existsSync(sourceRoot)) {
      continue;
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const packageName = packageJson.name;
    const declaredDependencies = new Set([
      ...Object.keys(packageJson.dependencies ?? {}),
      ...Object.keys(packageJson.peerDependencies ?? {}),
      ...Object.keys(packageJson.devDependencies ?? {}),
    ]);

    const importedWorkspacePackages = new Set();
    for (const sourcePath of collectSourceFiles(sourceRoot)) {
      const source = fs.readFileSync(sourcePath, 'utf8');
      for (const importedPackage of collectImportedWorkspacePackages(source)) {
        if (importedPackage !== packageName) {
          importedWorkspacePackages.add(importedPackage);
        }
      }
    }

    for (const importedPackage of [...importedWorkspacePackages].sort()) {
      if (!declaredDependencies.has(importedPackage)) {
        offenders.push(
          `${packageName} is missing ${importedPackage} in package.json dependencies for src imports.`,
        );
      }
    }
  }

  assert.deepEqual(
    offenders,
    [],
    `Expected workspace package manifests to declare imported workspace dependencies.\n${offenders.join('\n')}`,
  );
});

test('workspace package manifest dependency graph stays acyclic for package task scheduling', () => {
  const dependencyGraph = new Map();

  for (const entry of workspacePackageManifestEntries) {
    const dependencyNames = new Set();

    for (const dependencyField of ['dependencies', 'devDependencies', 'optionalDependencies']) {
      for (const dependencyName of Object.keys(entry.packageJson[dependencyField] ?? {})) {
        if (workspacePackageManifestByName.has(dependencyName)) {
          dependencyNames.add(dependencyName);
        }
      }
    }

    dependencyGraph.set(entry.packageName, [...dependencyNames].sort());
  }

  const visiting = new Set();
  const visited = new Set();
  const stack = [];
  const cycles = new Set();

  const visit = (packageName) => {
    if (visited.has(packageName)) {
      return;
    }

    if (visiting.has(packageName)) {
      const cycleStartIndex = stack.indexOf(packageName);
      const cycle = [...stack.slice(cycleStartIndex), packageName];
      cycles.add(cycle.join(' -> '));
      return;
    }

    visiting.add(packageName);
    stack.push(packageName);

    for (const dependencyName of dependencyGraph.get(packageName) ?? []) {
      visit(dependencyName);
    }

    stack.pop();
    visiting.delete(packageName);
    visited.add(packageName);
  };

  for (const packageName of [...dependencyGraph.keys()].sort()) {
    visit(packageName);
  }

  assert.deepEqual(
    [...cycles].sort(),
    [],
    `Expected workspace package manifests to avoid dependency cycles that break turbo package task scheduling.\n${[...cycles].sort().join('\n')}`,
  );
});

test('app root manifest declares audited workspace packages imported from src', () => {
  const declaredDependencies = new Set([
    ...Object.keys(rootPackageJson.dependencies ?? {}),
    ...Object.keys(rootPackageJson.peerDependencies ?? {}),
    ...Object.keys(rootPackageJson.devDependencies ?? {}),
  ]);

  const appSourceRoot = path.join(workspaceRoot, 'src');
  const offenders = [];
  const importedWorkspacePackages = new Set();

  for (const sourcePath of collectSourceFiles(appSourceRoot)) {
    const source = fs.readFileSync(sourcePath, 'utf8');
    for (const importedPackage of collectImportedWorkspacePackages(source)) {
      importedWorkspacePackages.add(importedPackage);
    }
  }

  for (const importedPackage of [...importedWorkspacePackages].sort()) {
    if (!declaredDependencies.has(importedPackage)) {
      offenders.push(
        `magic-studio root package.json is missing ${importedPackage} for src imports.`,
      );
    }
  }

  assert.deepEqual(
    offenders,
    [],
    `Expected app root manifest to declare imported audited workspace dependencies.\n${offenders.join('\n')}`,
  );
});

test('magic-studio-core toolkit consumes the magic studio server through the package facade instead of sibling source paths', () => {
  for (const relativePath of reactCoreToolkitServerSources) {
    const source = fs.readFileSync(path.join(workspaceRoot, relativePath), 'utf8');

    assert.match(
      source,
      /@sdkwork\/magic-studio-server/,
      `Expected ${relativePath} to import the canonical server package facade.`,
    );
    assert.doesNotMatch(
      source,
      /sdkwork-magic-studio-server\/src\/index\.ts/,
      `Expected ${relativePath} to avoid importing sibling server source files directly.`,
    );
  }
});

test('magic-studio-core depends on the magic studio server facade and avoids direct host-core coupling', () => {
  const reactCorePackageJson = JSON.parse(
    fs.readFileSync(
      path.join(workspaceRoot, 'packages', 'sdkwork-magic-studio-core', 'package.json'),
      'utf8',
    ),
  );
  const declaredDependencies = new Set([
    ...Object.keys(reactCorePackageJson.dependencies ?? {}),
    ...Object.keys(reactCorePackageJson.peerDependencies ?? {}),
    ...Object.keys(reactCorePackageJson.devDependencies ?? {}),
  ]);

  assert.ok(
    declaredDependencies.has('@sdkwork/magic-studio-server'),
    'Expected magic-studio-core to depend on the canonical magic studio server facade.',
  );
  assert.equal(
    declaredDependencies.has('@sdkwork/magic-studio-host-core'),
    false,
    'Expected magic-studio-core to avoid depending directly on @sdkwork/magic-studio-host-core.',
  );

  for (const relativePath of reactCoreToolkitServerSources) {
    const source = fs.readFileSync(path.join(workspaceRoot, relativePath), 'utf8');

    assert.doesNotMatch(
      source,
      /@sdkwork\/magic-studio-host-core|@sdkwork\/magic-studio-types/,
      `Expected ${relativePath} to stay behind the @sdkwork/magic-studio-server facade instead of importing lower-level foundation packages directly.`,
    );
  }
});
