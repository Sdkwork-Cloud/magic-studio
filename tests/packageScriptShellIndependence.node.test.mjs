import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..');

const packageJson = JSON.parse(
  fs.readFileSync(path.resolve(workspaceRoot, 'package.json'), 'utf8'),
);

const EXPECTED_SCRIPT_PATTERNS = {
  dev: /node scripts\/run-vite-dev\.mjs --app-mode=development$/,
  'dev:test': /node scripts\/run-vite-dev\.mjs --app-mode=test$/,
  'dev:staging': /node scripts\/run-vite-dev\.mjs --app-mode=staging$/,
  'dev:prod': /node scripts\/run-vite-dev\.mjs --app-mode=production$/,
  'dev:git-sdk': /node scripts\/run-vite-dev\.mjs --sdk-mode=git --app-mode=development$/,
  'dev:git-sdk:test': /node scripts\/run-vite-dev\.mjs --sdk-mode=git --app-mode=test$/,
  'dev:git-sdk:staging': /node scripts\/run-vite-dev\.mjs --sdk-mode=git --app-mode=staging$/,
  'dev:git-sdk:prod': /node scripts\/run-vite-dev\.mjs --sdk-mode=git --app-mode=production$/,
  build: /node scripts\/run-app-build\.mjs --app-mode=production$/,
  'build:dev': /node scripts\/run-app-build\.mjs --app-mode=development$/,
  'build:test': /node scripts\/run-app-build\.mjs --app-mode=test$/,
  'build:staging': /node scripts\/run-app-build\.mjs --app-mode=staging$/,
  'build:prod': /node scripts\/run-app-build\.mjs --app-mode=production$/,
  'build:git-sdk': /node scripts\/run-app-build\.mjs --sdk-mode=git --app-mode=production$/,
  'build:git-sdk:dev': /node scripts\/run-app-build\.mjs --sdk-mode=git --app-mode=development$/,
  'build:git-sdk:test': /node scripts\/run-app-build\.mjs --sdk-mode=git --app-mode=test$/,
  'build:git-sdk:staging': /node scripts\/run-app-build\.mjs --sdk-mode=git --app-mode=staging$/,
  'tauri:build': /node scripts\/run-tauri-command\.mjs --sdk-mode=git build --no-bundle --config src-tauri\/tauri\.prod\.conf\.json$/,
  'tauri:bundle': /node scripts\/run-tauri-command\.mjs --sdk-mode=git build --config src-tauri\/tauri\.prod\.conf\.json$/,
};

test('shell-sensitive package scripts use node-based CLI flags instead of cross-env', () => {
  for (const [scriptName, expectedPattern] of Object.entries(EXPECTED_SCRIPT_PATTERNS)) {
    const script = packageJson.scripts?.[scriptName];
    assert.equal(typeof script, 'string', `Expected package.json to define ${scriptName}.`);
    assert.doesNotMatch(
      script,
      /\bcross-env\b/,
      `Expected package.json script ${scriptName} to stay shell-independent.`,
    );
    assert.match(
      script,
      expectedPattern,
      `Expected package.json script ${scriptName} to use node-based mode flags.`,
    );
  }
});
