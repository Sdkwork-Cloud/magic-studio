import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..');
const appbaseMobileReactRoot = path.resolve(
  workspaceRoot,
  '..',
  'sdkwork-appbase',
  'packages',
  'mobile-react',
);

function walkIndexFiles(rootDir) {
  const files = [];
  const pending = [rootDir];

  while (pending.length > 0) {
    const current = pending.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const absolutePath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        pending.push(absolutePath);
        continue;
      }

      if (entry.isFile() && entry.name === 'index.ts') {
        files.push(absolutePath);
      }
    }
  }

  return files.sort();
}

test('sdkwork-appbase mobile-react packages with real source modules do not keep scaffold-only root facades', () => {
  const offenders = [];

  for (const indexPath of walkIndexFiles(appbaseMobileReactRoot)) {
    const source = fs.readFileSync(indexPath, 'utf8');
    const srcDir = path.dirname(indexPath);
    const siblingFiles = fs
      .readdirSync(srcDir, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name !== 'index.ts')
      .map((entry) => entry.name);

    if (siblingFiles.length === 0) {
      continue;
    }

    if (/status:\s*"scaffold"/.test(source)) {
      offenders.push(`${path.relative(workspaceRoot, indexPath)} -> ${siblingFiles.join(', ')}`);
    }
  }

  assert.deepEqual(
    offenders,
    [],
    `Expected sdkwork-appbase mobile-react root facades with real module siblings to stop advertising scaffold-only status.\n${offenders.join('\n')}`,
  );
});
