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

test('vite and tsconfig expose focused chat/vip subpath aliases for pages, store, and pricing modal boundaries', () => {
  const viteConfigSource = readSource('vite.config.ts');
  const tsconfigSource = readSource('tsconfig.json');

  const expectedSubpaths = [
    '@sdkwork/magic-studio-chat/pages',
    '@sdkwork/magic-studio-chat/store',
    '@sdkwork/magic-studio-chat/embedded-pane',
    '@sdkwork/magic-studio-chat/i18n',
    '@sdkwork/magic-studio-vip/pages',
    '@sdkwork/magic-studio-vip/store',
    '@sdkwork/magic-studio-vip/pricing-modal',
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
