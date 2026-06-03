import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..');

const readSource = (relativePath) =>
  fs.readFileSync(path.resolve(workspaceRoot, relativePath), 'utf8');

test('vite and tsconfig expose focused magiccut subpath aliases for shell-safe page/store boundaries', () => {
  const viteConfigSource = readSource('vite.config.ts');
  const tsconfigSource = readSource('tsconfig.json');

  const expectedSubpaths = [
    '@sdkwork/magic-studio-magiccut/pages',
    '@sdkwork/magic-studio-magiccut/store',
  ];

  for (const subpath of expectedSubpaths) {
    const pattern = new RegExp(subpath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

    assert.match(
      viteConfigSource,
      pattern,
      `Expected vite.config.ts to expose alias ${subpath}.`,
    );
    assert.match(
      tsconfigSource,
      pattern,
      `Expected tsconfig.json to expose path mapping ${subpath}.`,
    );
  }
});
