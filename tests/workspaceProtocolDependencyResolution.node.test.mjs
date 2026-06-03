import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..');

function readWorkspacePackageEntries() {
  const workspaceYaml = fs.readFileSync(
    path.resolve(workspaceRoot, 'pnpm-workspace.yaml'),
    'utf8',
  );
  const lines = workspaceYaml.split(/\r?\n/);
  const entries = [];
  let inPackages = false;

  for (const line of lines) {
    if (/^packages:\s*$/.test(line)) {
      inPackages = true;
      continue;
    }

    if (!inPackages) {
      continue;
    }

    if (/^\S/.test(line)) {
      break;
    }

    const entryMatch = line.match(/^  -\s+(.+)\s*$/);
    if (entryMatch) {
      entries.push(entryMatch[1].replace(/^['"]|['"]$/g, ''));
    }
  }

  return entries;
}

function collectWorkspacePackageJsonPaths() {
  const entries = readWorkspacePackageEntries();
  const includedPaths = new Set();
  const excludedPaths = new Set();

  for (const entry of entries) {
    if (entry.startsWith('!')) {
      excludedPaths.add(path.resolve(workspaceRoot, entry.slice(1)));
      continue;
    }

    if (!entry.includes('*')) {
      const packageJsonPath = path.resolve(workspaceRoot, entry, 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        includedPaths.add(packageJsonPath);
      }
      continue;
    }

    const starIndex = entry.indexOf('*');
    const prefix = entry.slice(0, starIndex);
    const baseDir = path.resolve(workspaceRoot, prefix);
    if (!fs.existsSync(baseDir)) {
      continue;
    }

    for (const dirent of fs.readdirSync(baseDir, { withFileTypes: true })) {
      if (!dirent.isDirectory()) {
        continue;
      }

      const packageJsonPath = path.join(baseDir, dirent.name, 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        includedPaths.add(packageJsonPath);
      }
    }
  }

  return [...includedPaths].filter((packageJsonPath) => {
    const packageDir = path.dirname(packageJsonPath);
    return !excludedPaths.has(packageDir);
  });
}

function readPackageJson(packageJsonPath) {
  return JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
}

function collectWorkspacePackageMap() {
  const packageMap = new Map();

  for (const packageJsonPath of collectWorkspacePackageJsonPaths()) {
    const packageJson = readPackageJson(packageJsonPath);
    if (typeof packageJson.name === 'string' && packageJson.name.length > 0) {
      packageMap.set(packageJson.name, packageJsonPath);
    }
  }

  return packageMap;
}

test('root pnpm workspace includes every workspace protocol dependency required by included packages', () => {
  const workspacePackages = collectWorkspacePackageMap();
  const offenders = [];

  for (const [packageName, packageJsonPath] of workspacePackages.entries()) {
    const packageJson = readPackageJson(packageJsonPath);

    for (const dependencyField of ['dependencies', 'devDependencies', 'optionalDependencies']) {
      for (const [dependencyName, specifier] of Object.entries(packageJson[dependencyField] ?? {})) {
        if (typeof specifier !== 'string' || !specifier.startsWith('workspace:')) {
          continue;
        }

        if (!workspacePackages.has(dependencyName)) {
          offenders.push(
            `${packageName} requires ${dependencyName}@${specifier}, but the root pnpm workspace does not include that package.`,
          );
        }
      }
    }
  }

  assert.deepEqual(
    offenders,
    [],
    `Expected every workspace protocol dependency to resolve inside the root pnpm workspace.\n${offenders.join('\n')}`,
  );
});
