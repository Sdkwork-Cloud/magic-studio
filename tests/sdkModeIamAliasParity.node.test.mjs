import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..');

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.resolve(workspaceRoot, relativePath), 'utf8'));
}

const REQUIRED_ALIASES = [
  '@sdkwork/core-pc-react',
  '@sdkwork/core-pc-react/app',
  '@sdkwork/core-pc-react/env',
  '@sdkwork/core-pc-react/hooks',
  '@sdkwork/core-pc-react/preferences',
  '@sdkwork/core-pc-react/runtime',
  '@sdkwork/auth-pc-react',
  '@sdkwork/user-pc-react',
  '@sdkwork/appbase-pc-react',
  '@sdkwork/search-pc-react',
  '@sdkwork/ui-pc-react',
  '@sdkwork/ui-pc-react/theme',
  '@sdkwork/ui-pc-react/components/ui/actions',
  '@sdkwork/ui-pc-react/components/ui/data-entry',
  '@sdkwork/ui-pc-react/components/ui/feedback',
  '@sdkwork/ui-pc-react/components/ui/form',
  '@sdkwork/ui-pc-react/components/patterns/settings',
  '@sdkwork/ui-pc-react/components/patterns/workspace',
  '@sdkwork/user-center-core-pc-react',
  '@sdkwork/user-center-pc-react',
  '@sdkwork/user-center-validation-pc-react',
  'react-router-dom',
  'qrcode',
  'qrcode/lib/browser.js',
];
const GIT_MODE_LOCAL_SHIMS = {
  '@sdkwork/ui-pc-react/components/patterns/settings': ['src/shims/sdkwork-ui-settings.tsx'],
};

test('source and npm sdk tsconfigs keep host IAM aliases in parity for local workspace development modes', () => {
  const rootTsconfig = readJson('tsconfig.json');
  const npmSdkTsconfig = readJson('tsconfig.npm-sdk.json');

  for (const alias of REQUIRED_ALIASES) {
    const rootValue = rootTsconfig.compilerOptions?.paths?.[alias];
    assert.ok(rootValue, `Expected root tsconfig to define ${alias}.`);
    assert.deepEqual(
      npmSdkTsconfig.compilerOptions?.paths?.[alias],
      rootValue,
      `Expected tsconfig.npm-sdk.json to keep ${alias} aligned with the root workspace tsconfig.`,
    );
  }
});

test('git sdk tsconfig resolves external IAM, UI, and core facades from Git-backed checkouts instead of local sibling workspaces', () => {
  const gitSdkTsconfig = readJson('tsconfig.git-sdk.json');
  const gitPaths = gitSdkTsconfig.compilerOptions?.paths ?? {};

  for (const alias of REQUIRED_ALIASES.filter((entry) => entry.startsWith('@sdkwork/'))) {
    const values = gitPaths[alias];
    assert.ok(values, `Expected tsconfig.git-sdk.json to define ${alias}.`);

    const localShimAlias = GIT_MODE_LOCAL_SHIMS[alias];
    if (localShimAlias) {
      assert.deepEqual(
        values,
        localShimAlias,
        `Expected tsconfig.git-sdk.json to keep ${alias} on the local compatibility shim.`,
      );
      continue;
    }

    assert.equal(
      values.some((value) => value.includes('.sdk-git-sources')),
      true,
      `Expected tsconfig.git-sdk.json to resolve ${alias} from .sdk-git-sources.`,
    );
    assert.equal(
      values.some((value) => value.includes('../sdkwork-')),
      false,
      `Expected tsconfig.git-sdk.json to stop resolving ${alias} from local sibling workspaces in git mode.`,
    );
  }

  assert.deepEqual(
    gitPaths['qrcode'],
    ['src/shims/qrcode.ts'],
    'Expected git sdk mode to keep the qrcode browser shim stable.',
  );
  assert.deepEqual(
    gitPaths['qrcode/lib/browser.js'],
    ['src/shims/qrcode-browser.d.ts'],
    'Expected git sdk mode to keep the qrcode browser subpath typed by the local declaration shim.',
  );
  assert.deepEqual(
    gitPaths['react-router-dom'],
    ['src/shims/react-router-dom.tsx'],
    'Expected git sdk mode to keep the react-router-dom shim stable.',
  );
});
