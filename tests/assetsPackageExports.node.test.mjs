import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..');

const packageJsonPath = path.resolve(
  workspaceRoot,
  'packages/sdkwork-magic-studio-assets/package.json',
);

const PACKAGE_EXPORT_EXPECTATIONS = [
  {
    subpath: './creation-chat',
    importPath: './src/creation-chat/index.ts',
    typesPath: './src/creation-chat/index.ts',
  },
  {
    subpath: './choose-asset',
    importPath: './src/choose-asset/index.ts',
    typesPath: './src/choose-asset/index.ts',
  },
  {
    subpath: './generation',
    importPath: './src/generation/index.ts',
    typesPath: './src/generation/index.ts',
  },
  {
    subpath: './asset-center',
    importPath: './src/asset-center/index.ts',
    typesPath: './src/asset-center/index.ts',
  },
];

test('@sdkwork/magic-studio-assets package exports cover the focused feature subpaths used across the workspace', () => {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const exportsMap = packageJson.exports || {};

  for (const { subpath, importPath, typesPath } of PACKAGE_EXPORT_EXPECTATIONS) {
    assert.ok(
      exportsMap[subpath],
      `Expected packages/sdkwork-magic-studio-assets/package.json to export ${subpath}.`,
    );
    assert.equal(
      exportsMap[subpath].import,
      importPath,
      `Expected ${subpath} to resolve import to ${importPath}.`,
    );
    assert.equal(
      exportsMap[subpath].types,
      typesPath,
      `Expected ${subpath} to resolve types to ${typesPath}.`,
    );
  }
});
