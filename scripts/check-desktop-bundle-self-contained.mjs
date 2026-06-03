import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const defaultDistRoot = path.join(projectRoot, 'dist');

const fail = message => {
  console.error(`[bundle-check] ${message}`);
  process.exit(1);
};

export const inspectDesktopBundle = ({ distRoot = defaultDistRoot } = {}) => {
  const violations = [];
  const indexHtmlPath = path.join(distRoot, 'index.html');

  if (!existsSync(indexHtmlPath)) {
    return [`Missing build output: ${indexHtmlPath}`];
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
      violations.push(`Build output still depends on remote asset: ${marker}`);
    }
  }

  const cssMatches = [...indexHtml.matchAll(/href="([^"]*assets\/[^"]+\.css)"/g)];

  if (cssMatches.length === 0) {
    violations.push('Could not locate bundled CSS assets in dist/index.html');
    return violations;
  }

  const cssBundles = cssMatches.flatMap(match => {
    const cssRelativePath = match[1].replace(/^\//, '');
    const cssPath = path.join(distRoot, cssRelativePath);

    if (!existsSync(cssPath)) {
      violations.push(`Bundled CSS asset is missing: ${cssPath}`);
      return [];
    }

    return [readFileSync(cssPath, 'utf8')];
  });

  if (cssBundles.some(cssBundle => cssBundle.includes('@tailwind'))) {
    violations.push('Bundled CSS still contains raw @tailwind directives');
  }

  if (!cssBundles.some(cssBundle => cssBundle.includes('.flex{'))) {
    violations.push('Bundled CSS does not contain compiled Tailwind utility output');
  }

  if (!cssBundles.some(cssBundle => cssBundle.includes('.xterm'))) {
    violations.push('Bundled CSS does not contain local xterm styles');
  }

  return violations;
};

const runCli = () => {
  const violations = inspectDesktopBundle();

  if (violations.length > 0) {
    fail(violations[0]);
  }

  console.log('[bundle-check] Desktop bundle is self-contained.');
};

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (invokedPath === __filename) {
  runCli();
}
