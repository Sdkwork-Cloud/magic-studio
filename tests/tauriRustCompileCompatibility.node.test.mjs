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

test('compression service uses an explicit zip 8 file options type', () => {
  const source = readSource('packages/sdkwork-magic-studio-server/src-host/src/services/compression.rs');

  assert.match(
    source,
    /SimpleFileOptions|FileOptions<'static,\s*\(\)>/,
    'Expected compression service to specify the zip file options extension type explicitly for zip 8.',
  );
  assert.doesNotMatch(
    source,
    /let options = FileOptions::default\(\)/,
    'Expected compression service to avoid the generic FileOptions::default() inference trap.',
  );
});

test('migration service stores sqlite timestamps through signed integer conversion', () => {
  const source = readSource('packages/sdkwork-magic-studio-server/src-host/src/services/migration.rs');

  assert.match(
    source,
    /i64::try_from\(Self::now_millis\(\)\)|let applied_at_ms_db:\s*i64|sqlite_millis_from_u64\(applied_at_ms\)/,
    'Expected migration writes to convert applied_at_ms into a SQLite-compatible signed integer.',
  );
  assert.match(
    source,
    /let applied_at_ms:\s*i64 = row\.get\(3\)\?;|u64::try_from\(row\.get::<_,\s*i64>\(3\)\?\)|sqlite_millis_to_u64\(applied_at_ms\)/,
    'Expected migration reads to load SQLite timestamps as i64 before converting to u64.',
  );
  assert.doesNotMatch(
    source,
    /applied_at_ms:\s*row\.get\(3\)\?/,
    'Expected migration row decoding to avoid requesting u64 directly from rusqlite.',
  );
});
