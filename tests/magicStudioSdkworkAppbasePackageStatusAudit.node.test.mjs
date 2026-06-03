import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..');
const appbasePackagesRoots = [
  path.resolve(workspaceRoot, '..', 'sdkwork-appbase', 'packages', 'pc-react'),
  path.resolve(workspaceRoot, '..', 'sdkwork-appbase', 'packages', 'mobile-react'),
];

function collectPackageDirs(rootDir) {
  const packageDirs = [];

  for (const domainEntry of fs.readdirSync(rootDir, { withFileTypes: true })) {
    if (!domainEntry.isDirectory()) {
      continue;
    }

    const domainPath = path.join(rootDir, domainEntry.name);
    for (const packageEntry of fs.readdirSync(domainPath, { withFileTypes: true })) {
      if (!packageEntry.isDirectory()) {
        continue;
      }

      packageDirs.push(path.join(domainPath, packageEntry.name));
    }
  }

  return packageDirs.sort();
}

test('sdkwork-appbase package metadata marks real public facades as ready', () => {
  const offenders = [];

  for (const rootDir of appbasePackagesRoots) {
    for (const packageDir of collectPackageDirs(rootDir)) {
      const packageJsonPath = path.join(packageDir, 'package.json');
      const indexPath = path.join(packageDir, 'src', 'index.ts');

      if (!fs.existsSync(packageJsonPath) || !fs.existsSync(indexPath)) {
        continue;
      }

      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const source = fs.readFileSync(indexPath, 'utf8');

      if (/status:\s*"scaffold"/.test(source)) {
        continue;
      }

      if (packageJson.sdkwork?.status !== 'ready') {
        offenders.push(`${path.relative(workspaceRoot, packageJsonPath)} -> ${packageJson.sdkwork?.status ?? 'missing'}`);
      }
    }
  }

  assert.deepEqual(
    offenders,
    [],
    `Expected sdkwork-appbase package metadata to mark real public facades as ready.\n${offenders.join('\n')}`,
  );
});
