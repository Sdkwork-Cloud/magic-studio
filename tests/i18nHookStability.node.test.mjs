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

test('useTranslation memoizes translation callbacks so effect dependencies stay stable', () => {
  const source = readSource('packages/sdkwork-magic-studio-i18n/src/I18nService.ts');

  assert.match(
    source,
    /const\s+t\s*=\s*useCallback\(/,
    'Expected useTranslation to memoize the translation function so consumers can safely depend on it in effects.',
  );
  assert.match(
    source,
    /const\s+setLocale\s*=\s*useCallback\(/,
    'Expected useTranslation to memoize setLocale so consumers do not receive a fresh setter every render.',
  );
  assert.doesNotMatch(
    source,
    /return\s*\{\s*t:\s*\(/,
    'Expected useTranslation to return the memoized translation callback instead of recreating it inline on every render.',
  );
  assert.doesNotMatch(
    source,
    /return\s*\{[\s\S]*setLocale:\s*\(/,
    'Expected useTranslation to return the memoized locale setter instead of recreating it inline on every render.',
  );
});
