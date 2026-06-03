import assert from 'node:assert/strict';
import test from 'node:test';

import viteConfigExport from '../vite.config.ts';

const resolveViteConfig = () => {
  if (typeof viteConfigExport === 'function') {
    return viteConfigExport({
      command: 'build',
      mode: 'development',
    });
  }

  return viteConfigExport;
};

const getAliases = () => {
  const config = resolveViteConfig();
  const aliases = config.resolve?.alias;

  assert.ok(Array.isArray(aliases), 'Expected Vite resolve.alias to be an array.');

  return aliases;
};

test('react package aliases only match bare imports so subpath exports keep working', () => {
  const aliases = getAliases();

  assert.equal(
    aliases.some(entry => entry.find === 'react'),
    false,
    'String alias for react rewrites subpath imports such as react/jsx-runtime.',
  );
  assert.equal(
    aliases.some(entry => entry.find === 'react-dom'),
    false,
    'String alias for react-dom rewrites subpath imports such as react-dom/client.',
  );
  assert.ok(
    aliases.some(entry => entry.find instanceof RegExp && entry.find.source === '^react$'),
    'Expected react to use an exact bare-package RegExp alias.',
  );
  assert.ok(
    aliases.some(entry => entry.find instanceof RegExp && entry.find.source === '^react-dom$'),
    'Expected react-dom to use an exact bare-package RegExp alias.',
  );
});
