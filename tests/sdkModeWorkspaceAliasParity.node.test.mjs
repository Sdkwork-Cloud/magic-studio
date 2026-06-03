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

const MODE_SPECIFIC_ALIASES = new Set([
  '@sdkwork/app-sdk',
  '@sdkwork/app-sdk/api/*',
  '@sdkwork/app-sdk/http/*',
  '@sdkwork/app-sdk/types/*',
  '@sdkwork/sdk-common',
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
]);

const GIT_SDK_EXPECTED_ALIASES = {
  '@sdkwork/app-sdk': [
    '.sdk-git-sources/spring-ai-plus2/spring-ai-plus-business/spring-ai-plus-app-api/sdkwork-sdk-app/sdkwork-app-sdk-typescript/src/index.ts',
  ],
  '@sdkwork/app-sdk/api/*': [
    '.sdk-git-sources/spring-ai-plus2/spring-ai-plus-business/spring-ai-plus-app-api/sdkwork-sdk-app/sdkwork-app-sdk-typescript/src/api/*',
  ],
  '@sdkwork/app-sdk/http/*': [
    '.sdk-git-sources/spring-ai-plus2/spring-ai-plus-business/spring-ai-plus-app-api/sdkwork-sdk-app/sdkwork-app-sdk-typescript/src/http/*',
  ],
  '@sdkwork/app-sdk/types/*': [
    '.sdk-git-sources/spring-ai-plus2/spring-ai-plus-business/spring-ai-plus-app-api/sdkwork-sdk-app/sdkwork-app-sdk-typescript/src/types/*',
  ],
  '@sdkwork/sdk-common': [
    '.sdk-git-sources/sdkwork-sdk-commons/sdkwork-sdk-common-typescript/src/index.ts',
  ],
  '@sdkwork/core-pc-react': [
    '.sdk-git-sources/spring-ai-plus2/spring-ai-plus-business/apps/sdkwork-core/sdkwork-core-pc-react/src/index.ts',
  ],
  '@sdkwork/core-pc-react/app': [
    '.sdk-git-sources/spring-ai-plus2/spring-ai-plus-business/apps/sdkwork-core/sdkwork-core-pc-react/src/app/index.ts',
  ],
  '@sdkwork/core-pc-react/env': [
    '.sdk-git-sources/spring-ai-plus2/spring-ai-plus-business/apps/sdkwork-core/sdkwork-core-pc-react/src/env/index.ts',
  ],
  '@sdkwork/core-pc-react/hooks': [
    '.sdk-git-sources/spring-ai-plus2/spring-ai-plus-business/apps/sdkwork-core/sdkwork-core-pc-react/src/hooks/index.ts',
  ],
  '@sdkwork/core-pc-react/preferences': [
    '.sdk-git-sources/spring-ai-plus2/spring-ai-plus-business/apps/sdkwork-core/sdkwork-core-pc-react/src/preferences/index.ts',
  ],
  '@sdkwork/core-pc-react/runtime': [
    '.sdk-git-sources/spring-ai-plus2/spring-ai-plus-business/apps/sdkwork-core/sdkwork-core-pc-react/src/runtime/index.ts',
  ],
  '@sdkwork/auth-pc-react': [
    '.sdk-git-sources/sdkwork-appbase/packages/pc-react/iam/sdkwork-auth-pc-react/src/index.ts',
  ],
  '@sdkwork/user-pc-react': [
    '.sdk-git-sources/sdkwork-appbase/packages/pc-react/iam/sdkwork-user-pc-react/src/index.ts',
  ],
  '@sdkwork/appbase-pc-react': [
    '.sdk-git-sources/sdkwork-appbase/packages/pc-react/foundation/sdkwork-appbase-pc-react/src/index.ts',
  ],
  '@sdkwork/search-pc-react': [
    '.sdk-git-sources/sdkwork-appbase/packages/pc-react/foundation/sdkwork-search-pc-react/src/index.ts',
  ],
  '@sdkwork/ui-pc-react': [
    '.sdk-git-sources/sdkwork-ui/sdkwork-ui-pc-react/src/index.ts',
  ],
  '@sdkwork/ui-pc-react/theme': [
    '.sdk-git-sources/sdkwork-ui/sdkwork-ui-pc-react/src/theme/index.ts',
  ],
  '@sdkwork/ui-pc-react/components/ui/actions': [
    '.sdk-git-sources/sdkwork-ui/sdkwork-ui-pc-react/src/components/ui/actions/index.ts',
  ],
  '@sdkwork/ui-pc-react/components/ui/data-entry': [
    '.sdk-git-sources/sdkwork-ui/sdkwork-ui-pc-react/src/components/ui/data-entry/index.ts',
  ],
  '@sdkwork/ui-pc-react/components/ui/feedback': [
    '.sdk-git-sources/sdkwork-ui/sdkwork-ui-pc-react/src/components/ui/feedback/index.ts',
  ],
  '@sdkwork/ui-pc-react/components/ui/form': [
    '.sdk-git-sources/sdkwork-ui/sdkwork-ui-pc-react/src/components/ui/form/index.ts',
  ],
  '@sdkwork/ui-pc-react/components/patterns/settings': [
    'src/shims/sdkwork-ui-settings.tsx',
  ],
  '@sdkwork/ui-pc-react/components/patterns/workspace': [
    '.sdk-git-sources/sdkwork-ui/sdkwork-ui-pc-react/src/components/patterns/workspace/index.ts',
  ],
  '@sdkwork/user-center-core-pc-react': [
    '.sdk-git-sources/sdkwork-appbase/packages/pc-react/iam/sdkwork-user-center-core-pc-react/src/index.ts',
  ],
  '@sdkwork/user-center-pc-react': [
    '.sdk-git-sources/sdkwork-appbase/packages/pc-react/iam/sdkwork-user-center-pc-react/src/index.ts',
  ],
  '@sdkwork/user-center-validation-pc-react': [
    '.sdk-git-sources/sdkwork-appbase/packages/pc-react/iam/sdkwork-user-center-validation-pc-react/src/index.ts',
  ],
};

const NPM_SDK_EXPECTED_ALIASES = {
  '@sdkwork/app-sdk': ['node_modules/@sdkwork/app-sdk/dist/index.d.ts'],
  '@sdkwork/app-sdk/api/*': ['node_modules/@sdkwork/app-sdk/dist/api/*'],
  '@sdkwork/app-sdk/http/*': ['node_modules/@sdkwork/app-sdk/dist/http/*'],
  '@sdkwork/app-sdk/types/*': ['node_modules/@sdkwork/app-sdk/dist/types/*'],
  '@sdkwork/sdk-common': ['node_modules/@sdkwork/sdk-common/dist/index.d.ts'],
};

test('git and npm sdk tsconfigs keep workspace aliases aligned with the root tsconfig except for mode-specific sdk entries', () => {
  const rootTsconfig = readJson('tsconfig.json');
  const gitSdkTsconfig = readJson('tsconfig.git-sdk.json');
  const npmSdkTsconfig = readJson('tsconfig.npm-sdk.json');

  const rootPaths = rootTsconfig.compilerOptions?.paths ?? {};
  const comparableAliases = Object.keys(rootPaths).filter(
    (alias) => alias.startsWith('@sdkwork/') && !MODE_SPECIFIC_ALIASES.has(alias),
  );

  for (const alias of comparableAliases) {
    const rootValue = rootPaths[alias];
    assert.deepEqual(
      gitSdkTsconfig.compilerOptions?.paths?.[alias],
      rootValue,
      `Expected tsconfig.git-sdk.json to keep ${alias} aligned with the root workspace tsconfig.`,
    );
    assert.deepEqual(
      npmSdkTsconfig.compilerOptions?.paths?.[alias],
      rootValue,
      `Expected tsconfig.npm-sdk.json to keep ${alias} aligned with the root workspace tsconfig.`,
    );
  }
});

test('git sdk tsconfig resolves both SDKs from materialized git checkouts', () => {
  const gitSdkTsconfig = readJson('tsconfig.git-sdk.json');
  const gitPaths = gitSdkTsconfig.compilerOptions?.paths ?? {};

  for (const [alias, expectedValue] of Object.entries(GIT_SDK_EXPECTED_ALIASES)) {
    assert.deepEqual(
      gitPaths[alias],
      expectedValue,
      `Expected tsconfig.git-sdk.json to expose ${alias} from the git SDK checkouts.`,
    );
  }
});

test('npm sdk tsconfig exposes the full vendored app sdk subpath surface', () => {
  const npmSdkTsconfig = readJson('tsconfig.npm-sdk.json');
  const npmPaths = npmSdkTsconfig.compilerOptions?.paths ?? {};

  for (const [alias, expectedValue] of Object.entries(NPM_SDK_EXPECTED_ALIASES)) {
    assert.deepEqual(
      npmPaths[alias],
      expectedValue,
      `Expected tsconfig.npm-sdk.json to expose ${alias} from the vendored npm sdk package.`,
    );
  }
});

