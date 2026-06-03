import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..');
const rootPackageJson = JSON.parse(
  fs.readFileSync(path.resolve(workspaceRoot, 'package.json'), 'utf8'),
);

function readWorkspaceCatalogKeys() {
  const workspaceYaml = fs.readFileSync(
    path.resolve(workspaceRoot, 'pnpm-workspace.yaml'),
    'utf8',
  );
  const lines = workspaceYaml.split(/\r?\n/);
  const catalogKeys = new Set();
  let inCatalog = false;

  for (const line of lines) {
    if (/^catalog:\s*$/.test(line)) {
      inCatalog = true;
      continue;
    }

    if (!inCatalog) {
      continue;
    }

    if (/^\S/.test(line)) {
      break;
    }

    const entryMatch = line.match(/^ {2}(.+?):\s+/);
    if (entryMatch) {
      catalogKeys.add(entryMatch[1].replace(/^['"]|['"]$/g, ''));
    }
  }

  return catalogKeys;
}

test('root workspace catalog provides qrcode for the sibling auth workspace QR login dependency', () => {
  const authPackageJsonPath = path.resolve(
    workspaceRoot,
    '../sdkwork-appbase/packages/pc-react/iam/sdkwork-auth-pc-react/package.json',
  );
  assert.equal(
    fs.existsSync(authPackageJsonPath),
    true,
    'Expected the sibling @sdkwork/auth-pc-react workspace package to exist.',
  );

  const authPackageJson = JSON.parse(fs.readFileSync(authPackageJsonPath, 'utf8'));
  assert.equal(
    authPackageJson.dependencies?.qrcode,
    'catalog:',
    'Expected the sibling @sdkwork/auth-pc-react package to request qrcode from the shared workspace catalog.',
  );

  const qrShimSource = fs.readFileSync(
    path.resolve(workspaceRoot, 'src/shims/qrcode.ts'),
    'utf8',
  );
  assert.match(
    qrShimSource,
    /qrcode\/lib\/browser\.js/,
    'Expected the local QR shim to load qrcode from the canonical root package installation.',
  );
  assert.doesNotMatch(
    qrShimSource,
    /sdkwork-appbase\/node_modules\/qrcode\/lib\/browser\.js/,
    'Expected the QR shim to stop loading qrcode from the sibling workspace installation.',
  );
  assert.equal(
    rootPackageJson.dependencies?.qrcode,
    'catalog:',
    'Expected the root app manifest to depend on qrcode so release builds keep a top-level browser entrypoint.',
  );

  assert.equal(
    readWorkspaceCatalogKeys().has('qrcode'),
    true,
    'Expected the root pnpm workspace catalog to define qrcode for QR login dependencies.',
  );

  const authViteConfigSource = fs.readFileSync(
    path.resolve(workspaceRoot, 'packages/sdkwork-magic-studio-auth/vite.config.ts'),
    'utf8',
  );
  assert.match(
    authViteConfigSource,
    /find:\s*\/\^qrcode\\\/lib\\\/browser\\\.js\$\/,/,
    'Expected the auth package Vite config to preserve the qrcode browser subpath.',
  );
  assert.match(
    authViteConfigSource,
    /find:\s*\/\^qrcode\$\/,/,
    'Expected the auth package Vite config to alias only the bare qrcode import.',
  );
  assert.doesNotMatch(
    authViteConfigSource,
    /find:\s*['"]qrcode['"]/,
    'Expected the auth package Vite config to avoid broad qrcode aliases that swallow subpaths.',
  );
  for (const requiredAlias of [
    '@sdkwork/app-sdk',
    '@sdkwork/sdk-common',
    '@sdkwork/core-pc-react/app',
    '@sdkwork/core-pc-react',
  ]) {
    assert.match(
      authViteConfigSource,
      new RegExp(`find:\\s*['"]${requiredAlias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`),
      `Expected the auth package Vite config to resolve ${requiredAlias} for source-mode IAM builds.`,
    );
  }
});
