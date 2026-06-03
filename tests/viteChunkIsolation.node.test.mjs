import assert from 'node:assert/strict';
import test from 'node:test';

import viteConfigExport from '../vite.config.ts';
import { resolveManualChunk } from '../scripts/vite-manual-chunks.mjs';

const resolveViteConfig = () => {
  if (typeof viteConfigExport === 'function') {
    return viteConfigExport({
      command: 'build',
      mode: 'development',
    });
  }

  return viteConfigExport;
};

test('vite build output uses rolldown codeSplitting groups to keep shared/runtime boundaries from being swallowed by feature chunks', () => {
  const config = resolveViteConfig();
  const output = config.build?.rolldownOptions?.output;

  assert.ok(output, 'Expected build.rolldownOptions.output to be configured.');
  assert.equal(
    output.strictExecutionOrder,
    true,
    'Expected build.rolldownOptions.output.strictExecutionOrder to be true when disabling recursive dependency capture for code splitting groups.',
  );

  assert.ok(output.codeSplitting, 'Expected output.codeSplitting to be configured.');
  assert.equal(
    output.codeSplitting.includeDependenciesRecursively,
    false,
    'Expected output.codeSplitting.includeDependenciesRecursively to be false so shared workspace/runtime modules are emitted as independent chunks instead of being pulled into feature chunks.',
  );

  const groups = output.codeSplitting.groups;

  assert.ok(Array.isArray(groups) && groups.length > 0, 'Expected output.codeSplitting.groups to be configured.');
  assert.equal(typeof groups[0].name, 'function', 'Expected the first code splitting group to use dynamic chunk naming.');
  assert.equal(
    groups[0].name('/repo/packages/sdkwork-magic-studio-core/src/router/index.ts'),
    resolveManualChunk('/repo/packages/sdkwork-magic-studio-core/src/router/index.ts'),
    'Expected rolldown code splitting group naming to reuse the shared manual chunk classifier for magic-studio-core modules.',
  );
  assert.equal(
    groups[0].name('/repo/packages/sdkwork-magic-studio-assets/src/pages/AssetsPage.tsx'),
    resolveManualChunk('/repo/packages/sdkwork-magic-studio-assets/src/pages/AssetsPage.tsx'),
    'Expected rolldown code splitting group naming to reuse the shared manual chunk classifier for asset-center modules.',
  );
  assert.equal(
    groups[0].name('/repo/node_modules/react/index.js'),
    resolveManualChunk('/repo/node_modules/react/index.js'),
    'Expected rolldown code splitting group naming to reuse the shared manual chunk classifier for React vendor modules.',
  );
  assert.equal(
    groups[0].name('/repo/node_modules/@monaco-editor/react/dist/index.mjs'),
    resolveManualChunk('/repo/node_modules/@monaco-editor/react/dist/index.mjs'),
    'Expected rolldown code splitting group naming to reuse the shared manual chunk classifier for editor vendor modules.',
  );
});
