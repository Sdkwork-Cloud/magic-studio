import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const workspaceRoot = process.cwd();
const userServicesRoot = path.join(
  workspaceRoot,
  'packages',
  'sdkwork-magic-studio-user',
  'src',
  'services',
);

const coreOwnedServiceFiles = [
  'userCenterRuntime.ts',
  'userCenterStandard.ts',
];

test('magic-studio user-center services consume core user-center APIs from the core facade', () => {
  for (const fileName of coreOwnedServiceFiles) {
    const relativePath = `packages/sdkwork-magic-studio-user/src/services/${fileName}`;
    const source = fs.readFileSync(path.join(userServicesRoot, fileName), 'utf8');

    assert.match(
      source,
      /@sdkwork\/user-center-core-pc-react/u,
      `Expected ${relativePath} to import canonical user-center core APIs from @sdkwork/user-center-core-pc-react.`,
    );
    assert.doesNotMatch(
      source,
      /@sdkwork\/user-center-pc-react/u,
      `Expected ${relativePath} to avoid depending on @sdkwork/user-center-pc-react UI facade re-exports for core APIs.`,
    );
  }
});
