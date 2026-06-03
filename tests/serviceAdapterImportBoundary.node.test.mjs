import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..');
const packagesRoot = path.join(workspaceRoot, 'packages');

function collectFiles(directoryPath, predicate) {
  const entries = fs.readdirSync(directoryPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(directoryPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectFiles(fullPath, predicate));
      continue;
    }

    if (entry.isFile() && predicate(fullPath, entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
}

const serviceAdapterImportFromRootPattern =
  /import\s*\{[\s\S]*\bcreateServiceAdapterController\b[\s\S]*\}\s*from ['"]@sdkwork\/magic-studio-commons['"]/;

test('service adapter controller is exposed through a focused magic-studio-commons subpath', () => {
  const commonsPackageJson = JSON.parse(
    fs.readFileSync(
      path.join(packagesRoot, 'sdkwork-magic-studio-commons', 'package.json'),
      'utf8',
    ),
  );

  assert.equal(
    commonsPackageJson.exports['./utils/serviceAdapter']?.import,
    './src/utils/serviceAdapter.ts',
    'Expected magic-studio-commons to expose the focused serviceAdapter helper subpath.',
  );
});

test('package-local tsconfig path mappings preserve the focused serviceAdapter subpath when they override magic-studio-commons resolution', () => {
  const tsconfigFiles = collectFiles(
    packagesRoot,
    (_filePath, fileName) => fileName === 'tsconfig.json' || fileName === 'tsconfig.contract.json',
  );
  const offenders = [];

  for (const filePath of tsconfigFiles) {
    const source = fs.readFileSync(filePath, 'utf8');
    const overridesReactCommonsResolution =
      source.includes('"@sdkwork/magic-studio-commons"')
      || source.includes('"@sdkwork/magic-studio-*"');

    if (!overridesReactCommonsResolution) {
      continue;
    }

    if (!source.includes('"@sdkwork/magic-studio-commons/utils/serviceAdapter"')) {
      offenders.push(path.relative(workspaceRoot, filePath));
    }
  }

  assert.deepEqual(
    offenders,
    [],
    `Expected package-local tsconfig path mappings to preserve the focused serviceAdapter subpath. Offenders: ${offenders.join(', ')}`,
  );
});

test('service and domain adapters do not import createServiceAdapterController from the broad magic-studio-commons root entry', () => {
  const sourceFiles = collectFiles(packagesRoot, (_filePath, fileName) => /\.(ts|tsx)$/.test(fileName));
  const offenders = [];

  for (const filePath of sourceFiles) {
    if (
      filePath.includes(`${path.sep}sdkwork-magic-studio-commons${path.sep}`)
      || filePath.includes(`${path.sep}sdkwork-magic-studio-i18n${path.sep}`)
    ) {
      continue;
    }

    const source = fs.readFileSync(filePath, 'utf8');
    if (serviceAdapterImportFromRootPattern.test(source)) {
      offenders.push(path.relative(workspaceRoot, filePath));
    }
  }

  assert.deepEqual(
    offenders,
    [],
    `Expected createServiceAdapterController imports to use the focused commons subpath. Offenders: ${offenders.join(', ')}`,
  );
});
