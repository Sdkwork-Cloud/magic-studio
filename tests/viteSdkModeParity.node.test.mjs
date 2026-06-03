import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..');
const viteConfigSource = fs.readFileSync(
  path.resolve(workspaceRoot, 'vite.config.ts'),
  'utf8',
);

test('vite config uses the canonical source/git/npm sdk modes', () => {
  assert.match(
    viteConfigSource,
    /MAGIC_STUDIO_SDK_MODE \?\? 'source'/u,
    'Expected vite config to default MAGIC_STUDIO_SDK_MODE to source.',
  );
  assert.match(
    viteConfigSource,
    /sdkMode === 'source'/u,
    'Expected vite config to recognize the canonical source sdk mode.',
  );
  assert.doesNotMatch(
    viteConfigSource,
    /sdkMode === 'external'/u,
    'Expected vite config to stop using the retired external sdk mode label.',
  );
  assert.match(
    viteConfigSource,
    /app:\s*GIT_APP_SDK_ENTRY/u,
    'Expected git sdk mode to resolve the Git-backed app SDK entry.',
  );
  assert.match(
    viteConfigSource,
    /core:\s*GIT_CORE_PC_REACT_ENTRY/u,
    'Expected git sdk mode to resolve the Git-backed core runtime entry.',
  );
  assert.match(
    viteConfigSource,
    /ui:\s*GIT_UI_PC_REACT_ENTRY/u,
    'Expected git sdk mode to resolve the Git-backed UI workspace entry.',
  );
  assert.match(
    viteConfigSource,
    /appbase:\s*GIT_APPBASE_PC_REACT_ENTRY/u,
    'Expected git sdk mode to resolve the Git-backed appbase workspace entry.',
  );
  assert.match(
    viteConfigSource,
    /userCenter:\s*GIT_USER_CENTER_PC_REACT_ENTRY/u,
    'Expected git sdk mode to resolve the Git-backed user-center facade entry.',
  );
});
