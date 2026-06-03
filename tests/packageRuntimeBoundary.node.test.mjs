import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..');

const packageJsonPath = path.resolve(workspaceRoot, 'package.json');
const gitignorePath = path.resolve(workspaceRoot, '.gitignore');
const zipScriptPath = path.resolve(workspaceRoot, 'scripts/zip-project.mjs');

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const gitignoreSource = fs.readFileSync(gitignorePath, 'utf8');

test('root package runtime is explicitly ESM and zip scripts point at a real module entry', () => {
  assert.equal(
    packageJson.type,
    'module',
    'Expected package.json to declare "type": "module" so Node stops reparsing vite.config.ts as ESM.',
  );

  assert.equal(
    fs.existsSync(zipScriptPath),
    true,
    'Expected scripts/zip-project.mjs to exist so package zip commands do not reference a missing file.',
  );
  assert.match(
    gitignoreSource,
    /!scripts\/zip-project\.mjs/,
    'Expected .gitignore to explicitly unignore scripts/zip-project.mjs so the repaired zip entrypoint stays tracked.',
  );

  for (const scriptName of ['zip', 'zip:code', 'zip:report', 'zip:tgz']) {
    const scriptCommand = String(packageJson.scripts?.[scriptName] ?? '');

    assert.match(
      scriptCommand,
      /scripts\/zip-project\.mjs/,
      `Expected package.json script "${scriptName}" to execute scripts/zip-project.mjs.`,
    );
  }
});
