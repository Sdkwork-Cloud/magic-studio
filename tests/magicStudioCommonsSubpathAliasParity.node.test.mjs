import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..');
const viteSource = fs.readFileSync(path.resolve(workspaceRoot, 'vite.config.ts'), 'utf8');
const tsconfig = JSON.parse(
  fs.readFileSync(path.resolve(workspaceRoot, 'tsconfig.json'), 'utf8'),
);

const REQUIRED_COMMONS_SUBPATHS = [
  '@sdkwork/magic-studio-commons/algorithms',
  '@sdkwork/magic-studio-commons/components',
  '@sdkwork/magic-studio-commons/constants',
  '@sdkwork/magic-studio-commons/services',
  '@sdkwork/magic-studio-commons/utils',
];

test('vite keeps magic-studio-commons subpath aliases aligned with tsconfig', () => {
  for (const subpath of REQUIRED_COMMONS_SUBPATHS) {
    assert.ok(
      tsconfig.compilerOptions?.paths?.[subpath],
      `Expected tsconfig.json to define ${subpath}.`,
    );
    assert.match(
      viteSource,
      new RegExp(`find:\\s*['"]${subpath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`, 'u'),
      `Expected vite.config.ts to expose alias ${subpath}.`,
    );
  }
});
