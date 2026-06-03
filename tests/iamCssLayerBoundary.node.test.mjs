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

test('lazy auth and user stylesheets avoid duplicating full Tailwind preflight imports', () => {
  const indexCss = readSource('src/index.css');
  const authCss = readSource('src/styles/auth.css');
  const userCss = readSource('src/styles/user.css');

  assert.match(
    indexCss,
    /@import "tailwindcss";/,
    'Expected src/index.css to remain the global owner of shared Tailwind theme, base, and utility tokens.',
  );

  for (const [label, source] of [
    ['auth', authCss],
    ['user', userCss],
  ]) {
    assert.match(
      source,
      /@layer theme, base, components, utilities;/,
      `Expected ${label}.css to declare explicit Tailwind layers for route-scoped imports.`,
    );
    assert.match(
      source,
      /@import "tailwindcss\/theme\.css" layer\(theme\) source\(none\);/,
      `Expected ${label}.css to disable implicit Tailwind root scanning for theme imports.`,
    );
    assert.match(
      source,
      /@import "tailwindcss\/utilities\.css" layer\(utilities\) source\(none\);/,
      `Expected ${label}.css to disable implicit Tailwind root scanning for utilities imports.`,
    );
    assert.doesNotMatch(
      source,
      /@import "tailwindcss";/,
      `Expected ${label}.css to stop importing the full Tailwind bundle.`,
    );
  }
});
