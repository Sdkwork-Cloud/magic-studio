import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..');

test('root npm config disables peer auto-install for sibling workspace packages', () => {
  const npmrc = fs.readFileSync(path.resolve(workspaceRoot, '.npmrc'), 'utf8');

  assert.match(
    npmrc,
    /^auto-install-peers=false$/m,
    'Expected the root .npmrc to disable peer auto-install so pnpm does not fetch sibling workspace peers from the npm registry.',
  );
});

test('sdkwork-ui sibling package avoids bare vite launchers in install-time scripts', () => {
  const siblingUiPackageJson = JSON.parse(
    fs.readFileSync(
      path.resolve(workspaceRoot, '../sdkwork-ui/sdkwork-ui-pc-react/package.json'),
      'utf8',
    ),
  );

  assert.equal(
    typeof siblingUiPackageJson.scripts?.build,
    'string',
    'Expected the sibling sdkwork-ui package to define a build script.',
  );
  assert.equal(
    typeof siblingUiPackageJson.scripts?.prepare,
    'string',
    'Expected the sibling sdkwork-ui package to define a prepare script.',
  );
  assert.doesNotMatch(
    siblingUiPackageJson.scripts.build,
    /^vite\b/,
    'Expected the sibling sdkwork-ui build script to avoid relying on the bare vite launcher on Windows.',
  );
  assert.doesNotMatch(
    siblingUiPackageJson.scripts.prepare,
    /^vite\b/,
    'Expected the sibling sdkwork-ui prepare script to avoid relying on the bare vite launcher on Windows.',
  );
});
