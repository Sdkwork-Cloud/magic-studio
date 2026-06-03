import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const workspaceRoot = process.cwd();
const packageSources = [
  path.join(workspaceRoot, 'packages', 'sdkwork-magic-studio-host-core', 'src'),
  path.join(workspaceRoot, 'packages', 'sdkwork-magic-studio-server', 'src'),
  path.join(workspaceRoot, 'packages', 'sdkwork-magic-studio-types', 'src'),
  path.join(workspaceRoot, 'packages', 'sdkwork-magic-studio-distribution', 'src'),
];

function walkTypeScriptFiles(rootPath) {
  const entries = fs.readdirSync(rootPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(rootPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkTypeScriptFiles(fullPath));
      continue;
    }
    if (entry.isFile() && fullPath.endsWith('.ts')) {
      files.push(fullPath);
    }
  }

  return files;
}

test('magic studio package sources only consume sibling packages through root facades', () => {
  const siblingInternalImportPattern =
    /from ['"]\.\.\/\.\.\/sdkwork-magic-studio-[^'"]+\/src\/(?!index\.ts)[^'"]+['"]/g;

  for (const sourceRoot of packageSources) {
    for (const filePath of walkTypeScriptFiles(sourceRoot)) {
      const source = fs.readFileSync(filePath, 'utf8');
      const matches = [...source.matchAll(siblingInternalImportPattern)];

      assert.equal(
        matches.length,
        0,
        `Expected ${path.relative(workspaceRoot, filePath)} to consume sibling sdkwork-magic-studio packages only through src/index.ts facades.`,
      );
    }
  }
});
