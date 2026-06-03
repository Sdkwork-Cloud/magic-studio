import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..');
const appbaseWorkspaceRoot = path.resolve(workspaceRoot, '.sdk-git-sources', 'sdkwork-appbase');
const tsconfigBasePath = path.resolve(appbaseWorkspaceRoot, 'tsconfig.base.json');

function collectWorkspacePackages(relativeRoot) {
  const packageRoot = path.resolve(appbaseWorkspaceRoot, relativeRoot);
  const packageNames = [];
  if (!fs.existsSync(packageRoot)) {
    return packageNames;
  }

  for (const domainEntry of fs.readdirSync(packageRoot, { withFileTypes: true })) {
    if (!domainEntry.isDirectory()) {
      continue;
    }

    const domainPath = path.join(packageRoot, domainEntry.name);
    for (const packageEntry of fs.readdirSync(domainPath, { withFileTypes: true })) {
      if (!packageEntry.isDirectory()) {
        continue;
      }

      const packagePath = path.join(domainPath, packageEntry.name);
      const packageJsonPath = path.join(packagePath, 'package.json');
      const indexPath = path.join(packagePath, 'src', 'index.ts');

      if (!fs.existsSync(packageJsonPath) || !fs.existsSync(indexPath)) {
        continue;
      }

      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      if (typeof packageJson.name !== 'string' || !packageJson.name.startsWith('@sdkwork/')) {
        continue;
      }

      packageNames.push({
        expectedPath: [path.relative(appbaseWorkspaceRoot, indexPath).replaceAll('\\', '/')],
        name: packageJson.name,
      });
    }
  }

  return packageNames.sort((left, right) => left.name.localeCompare(right.name));
}

test('sdkwork-appbase tsconfig base maps every internal workspace package name to its source entrypoint', () => {
  const tsconfigBase = JSON.parse(fs.readFileSync(tsconfigBasePath, 'utf8'));
  const configuredPaths = tsconfigBase.compilerOptions?.paths ?? {};
  const packages = [
    ...collectWorkspacePackages('packages/pc-react'),
    ...collectWorkspacePackages('packages/mobile-react'),
  ];

  const missing = packages
    .filter(({ expectedPath, name }) => JSON.stringify(configuredPaths[name] ?? null) !== JSON.stringify(expectedPath))
    .map(({ expectedPath, name }) => `${name} -> ${expectedPath[0]}`);

  assert.deepEqual(
    missing,
    [],
    `Expected sdkwork-appbase tsconfig.base.json to map every internal package name to its src/index.ts entrypoint.\n${missing.join('\n')}`,
  );
});
