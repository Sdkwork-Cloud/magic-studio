import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { compile } from 'tailwindcss';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..');

test('shared auth Tailwind sources compile into usable standalone auth classes', async () => {
  const stylesheetPath = path.resolve(workspaceRoot, 'src/styles/auth.css');
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
    'Expected auth.css to disable Tailwind automatic root scanning so only explicit auth route sources are considered.',
  );

  assert.deepEqual(
    compiled.sources,
    [
      {
        base: path.resolve(workspaceRoot, 'src/styles'),
        pattern: '../../packages/sdkwork-magic-studio-auth/src/pages',
        negated: false,
      },
      {
        base: path.resolve(workspaceRoot, 'src/styles'),
        pattern: '../../packages/sdkwork-magic-studio-auth/src/components',
        negated: false,
      },
    ],
    'Expected Tailwind to register only the local auth pages and components rendered by the lazy auth routes.',
  );

  const sampleCss = compiled.build([
    'rounded-[32px]',
    'md:min-h-[720px]',
    'tracking-[0.22em]',
    'max-w-[320px]',
  ]);

  assert.equal(
    sampleCss.includes('.rounded-\\[32px\\]'),
    true,
    'Expected Tailwind to emit the local auth rounded container class.',
  );
  assert.equal(
    sampleCss.includes('.md\\:min-h-\\[720px\\]'),
    true,
    'Expected Tailwind to emit the local auth desktop shell minimum-height class.',
  );
  assert.equal(
    sampleCss.includes('.tracking-\\[0\\.22em\\]'),
    true,
    'Expected Tailwind to emit the local auth badge tracking class.',
  );
  assert.equal(
    sampleCss.includes('.max-w-\\[320px\\]'),
    true,
    'Expected Tailwind to emit the local auth highlighted-copy max-width class.',
  );
});
