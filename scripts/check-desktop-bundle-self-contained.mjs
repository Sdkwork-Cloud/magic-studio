import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const distRoot = path.join(projectRoot, 'dist');
const indexHtmlPath = path.join(distRoot, 'index.html');

const fail = message => {
  console.error(`[bundle-check] ${message}`);
  process.exit(1);
};

if (!existsSync(indexHtmlPath)) {
  fail(`Missing build output: ${indexHtmlPath}`);
}

const indexHtml = readFileSync(indexHtmlPath, 'utf8');
const forbiddenRemoteMarkers = [
  'cdn.tailwindcss.com',
  'esm.sh/',
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'cdn.jsdelivr.net/npm/@xterm/xterm',
];

for (const marker of forbiddenRemoteMarkers) {
  if (indexHtml.includes(marker)) {
    fail(`Build output still depends on remote asset: ${marker}`);
  }
}

const cssMatches = [...indexHtml.matchAll(/href="([^"]*assets\/[^"]+\.css)"/g)];

if (cssMatches.length === 0) {
  fail('Could not locate bundled CSS assets in dist/index.html');
}

const cssBundles = cssMatches.map(match => {
  const cssRelativePath = match[1].replace(/^\//, '');
  const cssPath = path.join(distRoot, cssRelativePath);

  if (!existsSync(cssPath)) {
    fail(`Bundled CSS asset is missing: ${cssPath}`);
  }

  return readFileSync(cssPath, 'utf8');
});

if (cssBundles.some(cssBundle => cssBundle.includes('@tailwind'))) {
  fail('Bundled CSS still contains raw @tailwind directives');
}

if (!cssBundles.some(cssBundle => cssBundle.includes('.flex{'))) {
  fail('Bundled CSS does not contain compiled Tailwind utility output');
}

if (!cssBundles.some(cssBundle => cssBundle.includes('.xterm'))) {
  fail('Bundled CSS does not contain local xterm styles');
}

console.log('[bundle-check] Desktop bundle is self-contained.');
