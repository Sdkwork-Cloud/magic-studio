import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { compile } from 'tailwindcss';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..');

test('shared user Tailwind sources compile into usable standalone account-center classes', async () => {
  const stylesheetPath = path.resolve(workspaceRoot, 'src/styles/user.css');
  const compileInput = await fs.readFile(stylesheetPath, 'utf8');

  const compiled = await compile(compileInput, {
    base: path.dirname(stylesheetPath),
    from: stylesheetPath,
    loadStylesheet: async (id, base) => {
      const resolvedPath = id === 'tailwindcss'
        ? path.resolve(workspaceRoot, 'node_modules/tailwindcss/index.css')
        : id.startsWith('tailwindcss/')
          ? path.resolve(workspaceRoot, 'node_modules', id)
        : path.resolve(base, id);

      return {
        path: resolvedPath,
        base: path.dirname(resolvedPath),
        content: await fs.readFile(resolvedPath, 'utf8'),
      };
    },
  });

  assert.equal(
    compiled.root,
    'none',
    'Expected user.css to disable Tailwind automatic root scanning so only explicit user route sources are considered.',
  );

  assert.deepEqual(
    compiled.sources,
    [
      {
        base: path.resolve(workspaceRoot, 'src/styles'),
        pattern: '../../packages/sdkwork-magic-studio-user/src/pages',
        negated: false,
      },
      {
        base: path.resolve(workspaceRoot, 'src/styles'),
        pattern: '../../packages/sdkwork-magic-studio-user/src/components',
        negated: false,
      },
    ],
    'Expected Tailwind to register only the local user pages and components rendered by the lazy user routes.',
  );

  const sampleCss = compiled.build([
    'bg-[#0f172a]',
    'border-white/10',
    'bg-white/[0.06]',
    'xl:grid-cols-[minmax(0,1fr)_22rem]',
  ]);

  assert.equal(
    sampleCss.includes('.bg-\\[\\#0f172a\\]'),
    true,
    'Expected Tailwind to emit the local user hero surface background class.',
  );
  assert.equal(
    sampleCss.includes('.border-white\\/10'),
    true,
    'Expected Tailwind to emit the local user accent panel border class.',
  );
  assert.equal(
    sampleCss.includes('.bg-white\\/\\[0\\.06\\]'),
    true,
    'Expected Tailwind to emit the local user highlight card background class.',
  );
  assert.equal(
    sampleCss.includes('.xl\\:grid-cols-\\[minmax\\(0\\,1fr\\)_22rem\\]'),
    true,
    'Expected Tailwind to emit the local user responsive hero grid class.',
  );
});
