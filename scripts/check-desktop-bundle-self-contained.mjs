import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const defaultDistRoot = path.join(projectRoot, 'dist');
const defaultPublicRoot = path.join(projectRoot, 'public');
const forbiddenRemoteMarkers = [
  'cdn.tailwindcss.com',
  'esm.sh/',
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'cdn.jsdelivr.net/npm/@xterm/xterm',
  'images.unsplash.com',
  'api.dicebear.com',
  'commondatastorage.googleapis.com',
  'soundhelix.com',
  'sample-videos.com',
  'placehold.co',
  'grainy-gradients.vercel.app',
  'api.qrserver.com',
  'transparenttextures.com',
  'www2.cs.uic.edu/~i101/SoundFiles',
];
const bundleTextExtensions = new Set(['.html', '.css', '.js']);
const rootStaticAssetPattern =
  /["'`](\/(?!assets\/)[^"'`\s)]+\.[a-z0-9]+(?:\?[^"'`\s)]*)?)["'`]/gi;

const collectFiles = (root, extensions) => {
  if (!existsSync(root)) {
    return [];
  }

  const files = [];
  const stack = [root];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) {
      continue;
    }

    for (const entry of readdirSync(current)) {
      const absolutePath = path.join(current, entry);
      const stats = statSync(absolutePath);

      if (stats.isDirectory()) {
        stack.push(absolutePath);
        continue;
      }

      if (extensions.has(path.extname(entry))) {
        files.push(absolutePath);
      }
    }
  }

  return files;
};

const resolveLineNumber = (content, matchIndex) => content.slice(0, matchIndex).split('\n').length;

const normalizeAssetReference = (reference) => reference.replace(/\?.*$/, '').replace(/^\//, '');

const collectTrackedPublicRoots = (publicRoot) => {
  const roots = new Set(['downloads', 'qr']);
  if (!existsSync(publicRoot)) {
    return roots;
  }

  for (const entry of readdirSync(publicRoot)) {
    roots.add(entry);
  }

  return roots;
};

export const inspectDesktopBundle = ({
  distRoot = defaultDistRoot,
  publicRoot = defaultPublicRoot,
} = {}) => {
  const violations = [];
  const indexHtmlPath = path.join(distRoot, 'index.html');
  const trackedPublicRoots = collectTrackedPublicRoots(publicRoot);

  if (!existsSync(indexHtmlPath)) {
    violations.push(`Missing build output: ${indexHtmlPath}`);
    return violations;
  }

  const indexHtml = readFileSync(indexHtmlPath, 'utf8');
  const bundleFiles = collectFiles(distRoot, bundleTextExtensions);

  for (const bundlePath of bundleFiles) {
    const content = readFileSync(bundlePath, 'utf8');
    const relativePath = path.relative(projectRoot, bundlePath);

    for (const marker of forbiddenRemoteMarkers) {
      const matchIndex = content.indexOf(marker);
      if (matchIndex >= 0) {
        violations.push(
          `${relativePath}:${resolveLineNumber(content, matchIndex)} -> Build output still depends on remote asset: ${marker}`,
        );
      }
    }

    rootStaticAssetPattern.lastIndex = 0;
    let assetMatch = rootStaticAssetPattern.exec(content);
    while (assetMatch) {
      const assetReference = assetMatch[1];
      const relativeAssetPath = normalizeAssetReference(assetReference);
      const rootSegment = relativeAssetPath.split('/')[0];
      if (!trackedPublicRoots.has(rootSegment) && !trackedPublicRoots.has(relativeAssetPath)) {
        assetMatch = rootStaticAssetPattern.exec(content);
        continue;
      }
      const distAssetPath = path.join(distRoot, relativeAssetPath);
      const publicAssetPath = path.join(publicRoot, relativeAssetPath);
      if (!existsSync(distAssetPath) && !existsSync(publicAssetPath)) {
        violations.push(
          `${relativePath}:${resolveLineNumber(content, assetMatch.index)} -> Missing bundled public asset: ${assetReference}`,
        );
      }
      assetMatch = rootStaticAssetPattern.exec(content);
    }
  }

  const cssMatches = [...indexHtml.matchAll(/href="([^"]*assets\/[^"]+\.css)"/g)];

  if (cssMatches.length === 0) {
    violations.push('Could not locate bundled CSS assets in dist/index.html');
    return violations;
  }

  const cssBundles = cssMatches.map((match) => {
    const cssRelativePath = match[1].replace(/^\//, '');
    const cssPath = path.join(distRoot, cssRelativePath);

    if (!existsSync(cssPath)) {
      violations.push(`Bundled CSS asset is missing: ${cssPath}`);
      return '';
    }

    return readFileSync(cssPath, 'utf8');
  });

  if (cssBundles.some((cssBundle) => cssBundle.includes('@tailwind'))) {
    violations.push('Bundled CSS still contains raw @tailwind directives');
  }

  if (!cssBundles.some((cssBundle) => cssBundle.includes('.flex{'))) {
    violations.push('Bundled CSS does not contain compiled Tailwind utility output');
  }

  if (!cssBundles.some((cssBundle) => cssBundle.includes('.xterm'))) {
    violations.push('Bundled CSS does not contain local xterm styles');
  }

  return violations;
};

const runCli = () => {
  const violations = inspectDesktopBundle();

  if (violations.length > 0) {
    for (const violation of violations) {
      console.error(`[bundle-check] ${violation}`);
    }
    process.exit(1);
  }

  console.log('[bundle-check] Desktop bundle is self-contained.');
};

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (invokedPath === __filename) {
  runCli();
}
