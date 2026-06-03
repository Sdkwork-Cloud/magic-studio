import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..');

function readSource(relativePath) {
  return fs.readFileSync(path.resolve(workspaceRoot, relativePath), 'utf8');
}

test('RouterProvider short-circuits same-location navigations', () => {
  const source = readSource('packages/sdkwork-magic-studio-core/src/router/RouterProvider.tsx');

  assert.match(
    source,
    /if\s*\(\s*path\s*===\s*currentPath\s*&&\s*normalizedQuery\s*===\s*currentQuery\s*\)\s*\{\s*return;\s*\}/,
    'Expected RouterProvider.navigate to no-op when the target path and query already match the current location.',
  );
});

test('react-router Navigate shim avoids re-navigating to the current location', () => {
  const source = readSource('src/shims/react-router-dom.tsx');

  assert.match(
    source,
    /const location = useLocation\(\);/,
    'Expected Navigate shim to read the current location before redirecting.',
  );
  assert.match(
    source,
    /if\s*\(\s*target\.pathname\s*===\s*location\.pathname\s*&&\s*target\.search\s*===\s*normalizeSearch\(location\.search\)\s*\)\s*\{\s*return;\s*\}/,
    'Expected Navigate shim to skip redundant redirects to the current location.',
  );
});

