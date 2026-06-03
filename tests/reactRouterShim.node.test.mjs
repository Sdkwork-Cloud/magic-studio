import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const shimSource = fs.readFileSync(
  path.resolve(__dirname, '../src/shims/react-router-dom.tsx'),
  'utf8',
);

test('react-router shim memoizes derived location and navigate helpers for shared auth pages', () => {
  assert.match(
    shimSource,
    /const location = useMemo(?:<[^>]+>)?\(/,
    'Expected shim location to be memoized so useLocation() stays stable across renders.',
  );
  assert.match(
    shimSource,
    /const navigate = useCallback(?:<[^>]+>)?\(/,
    'Expected shim navigate callback to be memoized so auth-page effects do not loop on every render.',
  );
});

test('react-router shim exposes the router contracts required by shared auth and user-center facades', () => {
  assert.match(
    shimSource,
    /export function HashRouter/u,
    'Expected shim to expose HashRouter for shared auth page router fallbacks.',
  );
  assert.match(
    shimSource,
    /export function useInRouterContext/u,
    'Expected shim to expose useInRouterContext for shared auth page router detection.',
  );
  assert.match(
    shimSource,
    /initialIndex\?: number;/u,
    'Expected MemoryRouter shim props to support initialIndex for shared user-center memory routing.',
  );
});
