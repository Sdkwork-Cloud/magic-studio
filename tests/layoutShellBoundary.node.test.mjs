import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..');

const readSource = (relativePath) =>
  fs.readFileSync(path.resolve(workspaceRoot, relativePath), 'utf8');

test('app shell keeps route-specific layouts behind lazy boundaries and avoids pulling lucide-react through registry fallback UI', () => {
  const appSource = readSource('src/app/App.tsx');
  const registrySource = readSource('src/router/registry.tsx');

  const layoutExpectations = [
    {
      importPath: '../layouts/MainLayout/MainLayout',
      lazyName: 'MainLayout',
    },
    {
      importPath: '../layouts/GenerationLayout/GenerationLayout',
      lazyName: 'GenerationLayout',
    },
    {
      importPath: '../layouts/CreationLayout/CreationLayout',
      lazyName: 'CreationLayout',
    },
    {
      importPath: '../layouts/VibeLayout/VibeLayout',
      lazyName: 'VibeLayout',
    },
    {
      importPath: '../layouts/NotesLayout/NotesLayout',
      lazyName: 'NotesLayout',
    },
  ];

  for (const { importPath, lazyName } of layoutExpectations) {
    assert.doesNotMatch(
      appSource,
      new RegExp(
        `import\\s+\\{\\s*${lazyName}\\s*\\}\\s+from\\s+['"]${importPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`,
      ),
      `Expected App.tsx to stop statically importing ${lazyName}.`,
    );
    assert.match(
      appSource,
      new RegExp(
        `const\\s+${lazyName}\\s*=\\s*lazy\\(\\(\\)\\s*=>\\s*import\\(['"]${importPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]\\)`,
      ),
      `Expected App.tsx to lazy-load ${lazyName}.`,
    );
  }

  assert.doesNotMatch(
    registrySource,
    /from\s+['"]lucide-react['"]/,
    'Expected registry.tsx to stop statically importing lucide-react so vendor-ui can detach from the entry path.',
  );
  assert.doesNotMatch(
    registrySource,
    /Loader2/,
    'Expected registry.tsx to stop using Loader2 in the loading fallback.',
  );
  assert.match(
    appSource,
    /animate-spin/,
    'Expected App.tsx to keep a CSS-only spinner fallback after removing lucide-react from the route registry.',
  );
});
