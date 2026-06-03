import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..');

const desktopPlatformSource = fs.readFileSync(
  path.resolve(workspaceRoot, 'packages/sdkwork-magic-studio-core/src/platform/desktop.ts'),
  'utf8',
);

test('desktop platform http requests tolerate a missing tauri http plugin', () => {
  assert.doesNotMatch(
    desktopPlatformSource,
    /@tauri-apps\/plugin-http|tauriFetch/,
    'Expected desktop platform to stop depending on the Tauri HTTP plugin.',
  );
  assert.match(
    desktopPlatformSource,
    /httpRequest:\s*async\s*\(url:\s*string,\s*options\?:\s*RequestInit\)\s*=>\s*fetch\(url,\s*options\)/,
    'Expected desktop httpRequest to use the browser fetch implementation directly.',
  );
});

test('desktop platform disables embedded browser support until the shell exposes a real implementation', () => {
  assert.match(
    desktopPlatformSource,
    /isProfessionalBrowserSupported:\s*\(\)\s*=>\s*false/,
    'Expected desktop platform to report embedded browser support as disabled.',
  );
});
