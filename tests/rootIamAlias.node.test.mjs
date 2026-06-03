import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..');
const tsconfigPath = path.resolve(workspaceRoot, 'tsconfig.json');
const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
const authPackageTsconfig = JSON.parse(
  fs.readFileSync(path.resolve(workspaceRoot, 'packages/sdkwork-magic-studio-auth/tsconfig.json'), 'utf8'),
);
const userPackageTsconfig = JSON.parse(
  fs.readFileSync(path.resolve(workspaceRoot, 'packages/sdkwork-magic-studio-user/tsconfig.json'), 'utf8'),
);
const authPackageJson = JSON.parse(
  fs.readFileSync(path.resolve(workspaceRoot, 'packages/sdkwork-magic-studio-auth/package.json'), 'utf8'),
);
const userPackageJson = JSON.parse(
  fs.readFileSync(path.resolve(workspaceRoot, 'packages/sdkwork-magic-studio-user/package.json'), 'utf8'),
);

test('root tsconfig keeps identity shims while packages consume appbase facades through manifests', () => {
  const authAlias = tsconfig.compilerOptions?.paths?.['@sdkwork/auth-pc-react'];
  const userAlias = tsconfig.compilerOptions?.paths?.['@sdkwork/user-pc-react'];

  assert.deepEqual(
    authAlias,
    ['src/shims/auth-pc-react.ts'],
    'Expected root tsconfig auth alias to stay on the lightweight shim boundary.',
  );
  assert.deepEqual(
    userAlias,
    ['src/shims/user-pc-react.ts'],
    'Expected root tsconfig user alias to stay on the lightweight shim boundary.',
  );
  assert.equal(
    authPackageTsconfig.compilerOptions?.paths,
    undefined,
    'Expected auth package tsconfig to avoid package-local path overrides and follow package-standard resolution.',
  );
  assert.equal(
    userPackageTsconfig.compilerOptions?.paths,
    undefined,
    'Expected user package tsconfig to avoid package-local path overrides and follow package-standard resolution.',
  );
  assert.equal(
    authPackageJson.dependencies?.['@sdkwork/auth-pc-react'],
    'workspace:*',
    'Expected auth package manifest to depend on the canonical shared auth package facade.',
  );
  assert.equal(
    userPackageJson.dependencies?.['@sdkwork/user-pc-react'],
    'workspace:*',
    'Expected user package manifest to depend on the canonical shared user package facade.',
  );
});

test('root identity shim files exist to isolate root compilation from sibling workspace React type drift', () => {
  assert.equal(
    fs.existsSync(path.resolve(workspaceRoot, 'src/shims/auth-pc-react.ts')),
    true,
    'Expected auth shim file to exist for root-only type isolation.',
  );
  assert.equal(
    fs.existsSync(path.resolve(workspaceRoot, 'src/shims/user-pc-react.ts')),
    true,
    'Expected user shim file to exist for root-only type isolation.',
  );
});
