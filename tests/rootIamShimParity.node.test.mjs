import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..');

function readSource(relativePath) {
  return fs.readFileSync(path.resolve(workspaceRoot, relativePath), 'utf8');
}

function extractReExportTarget(source) {
  const match = source.match(/export \* from ['"](.+)['"]/);
  assert.ok(match, 'Expected shim to re-export a sibling package entry.');
  return match[1];
}

test('root auth/user shims forward the real sibling package exports', () => {
  const authShim = readSource('src/shims/auth-pc-react.ts');
  const userShim = readSource('src/shims/user-pc-react.ts');
  const authShimPath = path.resolve(workspaceRoot, 'src', 'shims', 'auth-pc-react.ts');
  const userShimPath = path.resolve(workspaceRoot, 'src', 'shims', 'user-pc-react.ts');
  const authTarget = extractReExportTarget(authShim);
  const userTarget = extractReExportTarget(userShim);

  assert.match(
    authShim,
    /\.\.\/\.\.\/\.\.\/sdkwork-appbase\/packages\/pc-react\/iam\/sdkwork-auth-pc-react\/src\/index\.ts/,
    'Expected auth shim to re-export the real sibling auth package surface.',
  );
  assert.match(
    userShim,
    /\.\.\/\.\.\/\.\.\/sdkwork-appbase\/packages\/pc-react\/iam\/sdkwork-user-pc-react\/src\/index\.ts/,
    'Expected user shim to re-export the real sibling user package surface.',
  );
  assert.equal(
    path.basename(path.resolve(path.dirname(authShimPath), authTarget)),
    'index.ts',
    'Expected auth shim to point at the sibling root index.ts entry.',
  );
  assert.equal(
    path.basename(path.resolve(path.dirname(userShimPath), userTarget)),
    'index.ts',
    'Expected user shim to point at the sibling root index.ts entry.',
  );
  assert.ok(
    fs.existsSync(path.resolve(path.dirname(authShimPath), authTarget)),
    'Expected auth shim target to exist on disk.',
  );
  assert.ok(
    fs.existsSync(path.resolve(path.dirname(userShimPath), userTarget)),
    'Expected user shim target to exist on disk.',
  );
  assert.doesNotMatch(
    authShim,
    /interface SdkworkAuth/,
    'Expected auth shim to stop freezing a handwritten local stub surface.',
  );
  assert.doesNotMatch(
    userShim,
    /interface SdkworkUser/,
    'Expected user shim to stop freezing a handwritten local stub surface.',
  );
});
