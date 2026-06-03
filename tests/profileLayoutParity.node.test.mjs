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

test('profile route bypasses the legacy blank shell across route registries', () => {
  const registryCompositionSource = readSource('src/router/registry.tsx');
  const registrySpecsSource = readSource('src/router/registry/specs.ts');
  const packageRoutesSource = readSource('src/router/packageRoutes.tsx');
  const packageRouteLoaderSource = readSource('src/router/packageRouteLoader.tsx');

  assert.match(
    registryCompositionSource,
    /from '\.\/registry\/sections'|from "\.\/registry\/sections"/,
    'Expected registry.tsx to remain the canonical route composition root.',
  );

  assert.match(
    registrySpecsSource,
    /ROUTES\.PROFILE[\s\S]*layout:\s*'none'/,
    'Expected the canonical route specs to render the shared profile page without the BlankLayout shell.',
  );
  assert.doesNotMatch(
    registrySpecsSource,
    /ROUTES\.PROFILE[\s\S]*layout:\s*'blank'/,
    'Expected the canonical route specs to stop forcing the shared profile page through BlankLayout.',
  );

  assert.match(
    packageRoutesSource,
    /from '\.\/registry'|from "\.\/registry"/,
    'Expected the package route registry facade to delegate to the canonical registry.',
  );

  assert.match(
    packageRouteLoaderSource,
    /from '\.\/registry'|from "\.\/registry"/,
    'Expected the package route loader facade to delegate to the canonical registry.',
  );
});
