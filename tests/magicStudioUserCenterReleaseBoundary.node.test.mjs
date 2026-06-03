import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..');
const legacyAppbasePackageFamily = ['pc-react', 'identity'].join('/');

function read(relativePath) {
  return fs.readFileSync(path.resolve(workspaceRoot, relativePath), 'utf8');
}

test('magic-studio user-center runtime bridges consume canonical package facades instead of sibling source paths', () => {
  const validationSource = read('packages/sdkwork-magic-studio-user/src/services/validation.ts');
  const standardSource = read('packages/sdkwork-magic-studio-user/src/services/userCenterStandard.ts');
  const runtimeSource = read('packages/sdkwork-magic-studio-user/src/services/userCenterRuntime.ts');
  const contractSource = read('packages/sdkwork-magic-studio-user/src/services/userCenterService.contract.ts');

  for (const source of [validationSource, standardSource, runtimeSource]) {
    assert.doesNotMatch(
      source,
      new RegExp(`sdkwork-appbase\\/packages\\/${legacyAppbasePackageFamily.replace('/', '\\\\/')}`),
      'Expected runtime user-center bridges to avoid local sibling source paths.',
    );
  }

  assert.match(
    validationSource,
    /@sdkwork\/user-center-validation-pc-react/u,
    'Expected validation bridge to depend on the canonical validation package facade.',
  );
  assert.match(
    standardSource,
    /@sdkwork\/user-center-core-pc-react/u,
    'Expected user-center standard bridge to depend on the canonical user-center core package facade.',
  );
  assert.match(
    standardSource,
    /@sdkwork\/user-center-validation-pc-react/u,
    'Expected user-center standard bridge to depend on the canonical validation package facade.',
  );
  assert.match(
    runtimeSource,
    /@sdkwork\/user-center-core-pc-react/u,
    'Expected user-center runtime bridge to depend on the canonical user-center core package facade.',
  );
  assert.match(
    contractSource,
    /@sdkwork\/magic-studio-server/u,
    'Expected user-center public contract to resolve user profile update types through the canonical Magic Studio server contract facade.',
  );
  assert.doesNotMatch(
    contractSource,
    /spring-ai-plus-app-api\/sdkwork-sdk-app\/sdkwork-app-sdk-typescript\/src/u,
    'Expected user-center public contract to stop importing App SDK source files directly.',
  );
});
