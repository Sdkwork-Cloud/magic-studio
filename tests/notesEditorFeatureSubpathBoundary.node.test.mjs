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

test('vite, tsconfig, and package exports expose focused notes/editor subpaths', () => {
  const viteConfigSource = readSource('vite.config.ts');
  const tsconfigSource = readSource('tsconfig.json');
  const notesPackageSource = readSource('packages/sdkwork-magic-studio-notes/package.json');
  const editorPackageSource = readSource('packages/sdkwork-magic-studio-editor/package.json');

  const expectedViteAndTsconfigSubpaths = [
    '@sdkwork/magic-studio-notes/pages',
    '@sdkwork/magic-studio-editor/file-picker',
  ];

  for (const subpath of expectedViteAndTsconfigSubpaths) {
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

  assert.match(
    notesPackageSource,
    /"\.\/pages"\s*:\s*\{/,
    'Expected @sdkwork/magic-studio-notes package exports to expose ./pages.',
  );
  assert.match(
    editorPackageSource,
    /"\.\/file-picker"\s*:\s*\{/,
    'Expected @sdkwork/magic-studio-editor package exports to expose ./file-picker.',
  );
});
