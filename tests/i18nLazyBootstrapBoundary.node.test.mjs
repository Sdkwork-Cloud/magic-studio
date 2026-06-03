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

test('i18n base resources are lazy loaded and warmed before the first app render', () => {
  const i18nServiceSource = readSource('packages/sdkwork-magic-studio-i18n/src/I18nService.ts');
  const bootstrapSource = readSource('src/app/bootstrap.ts');
  const indexSource = readSource('index.tsx');
  const resourceLoadersSource = readSource('packages/sdkwork-magic-studio-i18n/src/resourceLoaders.ts');

  assert.doesNotMatch(
    i18nServiceSource,
    /import\s+en\s+from\s+['"]\.\/resources\/en['"]/,
    'Expected I18nService.ts to stop statically importing the entire en resource tree.',
  );
  assert.doesNotMatch(
    i18nServiceSource,
    /import\s+zhCN\s+from\s+['"]\.\/resources\/zh-CN['"]/,
    'Expected I18nService.ts to stop statically importing the entire zh-CN resource tree.',
  );
  assert.match(
    i18nServiceSource,
    /from\s+['"]\.\/resourceLoaders(?:\.ts)?['"]/,
    'Expected I18nService.ts to delegate base locale loading to resourceLoaders.ts.',
  );
  assert.match(
    i18nServiceSource,
    /public\s+async\s+initialize\(/,
    'Expected initialize() to become async so startup can wait for locale resources before render.',
  );
  assert.match(
    i18nServiceSource,
    /public\s+async\s+setLocale\(/,
    'Expected setLocale() to become async so runtime locale changes can load resources before swapping locale.',
  );

  assert.match(
    resourceLoadersSource,
    /['"]en-US['"]\s*:\s*\(\)\s*=>\s*import\(['"]\.\/resources\/en['"]\)/,
    'Expected resourceLoaders.ts to lazy-load the en resource module.',
  );
  assert.match(
    resourceLoadersSource,
    /['"]zh-CN['"]\s*:\s*\(\)\s*=>\s*import\(['"]\.\/resources\/zh-CN['"]\)/,
    'Expected resourceLoaders.ts to lazy-load the zh-CN resource module.',
  );

  assert.match(
    bootstrapSource,
    /const\s+initializeI18n\s*=\s*async\s*\(\)\s*=>/,
    'Expected bootstrap.ts to make initializeI18n async so locale warmup can be awaited.',
  );
  assert.match(
    bootstrapSource,
    /await\s+i18nService\.initialize\(/,
    'Expected bootstrap.ts to await i18nService.initialize() before scheduling the rest of startup work.',
  );

  assert.match(
    indexSource,
    /import\s+\{\s*bootstrap\s*\}\s+from\s+['"]\.\/src\/app\/bootstrap['"]/,
    'Expected index.tsx to import bootstrap so the host can finish i18n warmup before mounting React.',
  );
  assert.match(
    indexSource,
    /await\s+bootstrap\(\)/,
    'Expected index.tsx to await bootstrap() before the first root render.',
  );
  assert.match(
    indexSource,
    /await\s+bootstrap\(\)[\s\S]*ReactDOM\.createRoot/,
    'Expected index.tsx to finish bootstrap before creating the root.',
  );
});
