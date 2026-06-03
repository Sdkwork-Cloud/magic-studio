import assert from 'node:assert/strict';
import test from 'node:test';

import { extractMagicStudioCliEnvArgs } from '../scripts/magic-studio-cli-env.mjs';

test('extractMagicStudioCliEnvArgs lifts sdk/app mode flags into environment variables', () => {
  const result = extractMagicStudioCliEnvArgs(
    ['--sdk-mode=git', '--app-mode=production', 'build', '--no-bundle'],
    { BASE: '1' },
  );

  assert.deepEqual(result.args, ['build', '--no-bundle']);
  assert.equal(result.env.BASE, '1');
  assert.equal(result.env.MAGIC_STUDIO_SDK_MODE, 'git');
  assert.equal(result.env.MAGIC_STUDIO_VITE_MODE, 'production');
});

test('extractMagicStudioCliEnvArgs leaves unrelated arguments untouched', () => {
  const result = extractMagicStudioCliEnvArgs(['dev', '--host', '0.0.0.0'], {});

  assert.deepEqual(result.args, ['dev', '--host', '0.0.0.0']);
  assert.equal(result.env.MAGIC_STUDIO_SDK_MODE, undefined);
  assert.equal(result.env.MAGIC_STUDIO_VITE_MODE, undefined);
});
