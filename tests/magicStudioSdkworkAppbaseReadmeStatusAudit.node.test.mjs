import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..');
const appbaseWorkspaceRoot = path.resolve(workspaceRoot, '.sdk-git-sources', 'sdkwork-appbase');
const appbasePackagesRoots = [
  path.resolve(appbaseWorkspaceRoot, 'packages', 'pc-react'),
  path.resolve(appbaseWorkspaceRoot, 'packages', 'mobile-react'),
].filter((rootDir) => fs.existsSync(rootDir));

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

test('sdkwork-appbase package readmes expose the same status as package metadata', () => {
  const offenders = [];

  for (const rootDir of appbasePackagesRoots) {
    for (const packageDir of collectPackageDirs(rootDir)) {
      const packageJsonPath = path.join(packageDir, 'package.json');
      const readmePath = path.join(packageDir, 'README.md');

      if (!fs.existsSync(packageJsonPath) || !fs.existsSync(readmePath)) {
        continue;
      }

      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const expectedStatus = packageJson.sdkwork?.status;

      if (typeof expectedStatus !== 'string') {
        continue;
      }

      const readmeSource = fs.readFileSync(readmePath, 'utf8');
      const statusMatch = readmeSource.match(/- Status:\s*`([^`]+)`/);
      const actualStatus = statusMatch?.[1] ?? 'missing';

      if (actualStatus !== expectedStatus) {
        offenders.push(
          `${path.relative(workspaceRoot, readmePath)} -> README=${actualStatus}, package.json=${expectedStatus}`,
        );
      }
    }
  }

  assert.deepEqual(
    offenders,
    [],
    `Expected sdkwork-appbase package readmes to expose the same status as package metadata.\n${offenders.join('\n')}`,
  );
});
