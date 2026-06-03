import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';

const workspaceRoot = process.cwd();

test('portal-video package build externalizes Magic Studio workspace packages', () => {
  const viteConfigSource = fs.readFileSync(
    path.join(workspaceRoot, 'packages/sdkwork-magic-studio-portal-video/vite.config.ts'),
    'utf8',
  );

  assert.match(
    viteConfigSource,
    /external:\s*\[[\s\S]*\/\^@sdkwork\\\/magic-studio-/,
    'Expected portal-video library builds to externalize Magic Studio workspace packages instead of bundling identity and SDK internals.',
  );
});
