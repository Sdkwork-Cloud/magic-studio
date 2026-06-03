import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..');

test('standalone routes use a pass-through none layout instead of the blank shell wrapper', () => {
  const appPath = path.resolve(workspaceRoot, 'src/app/App.tsx');
  const appSource = fs.readFileSync(appPath, 'utf8');

  assert.match(
    appSource,
    /const NoneLayout:[\s\S]*=> <>\{children\}<\/>;/,
    'Expected App.tsx to define a pass-through layout for standalone pages.',
  );
  assert.match(
    appSource,
    /blank:\s*BlankLayout,/,
    'Expected blank layout routes to keep using the explicit BlankLayout wrapper.',
  );
  assert.match(
    appSource,
    /none:\s*NoneLayout,/,
    'Expected layout:none to bypass the BlankLayout shell.',
  );
});
