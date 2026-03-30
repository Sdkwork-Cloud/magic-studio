import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const projectRoot = path.resolve(__dirname, '..');
const sourceRoots = [
  path.join(projectRoot, 'src'),
  path.join(projectRoot, 'packages'),
];
const publicRoot = path.join(projectRoot, 'public');
const sourceExtensions = new Set(['.ts', '.tsx', '.js', '.jsx']);
const ignoredDirectoryNames = new Set([
  '.git',
  '.turbo',
  '.worktrees',
  'bak',
  'dist',
  'node_modules',
  'target',
]);

const forbiddenRemoteAssetMarkers = [
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
] as const;

const requiredPublicAssetPatterns = [
  /['"`](\/downloads\/[^'"`\s)]+)['"`]/g,
  /['"`](\/qr\/[^'"`\s)]+)['"`]/g,
] as const;

const collectSourceFiles = (root: string): string[] => {
  if (!existsSync(root)) {
    return [];
  }

  const stack = [root];
  const files: string[] = [];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) {
      continue;
    }

    for (const entry of readdirSync(current)) {
      const absolutePath = path.join(current, entry);
      const stats = statSync(absolutePath);

      if (stats.isDirectory()) {
        if (!ignoredDirectoryNames.has(entry)) {
          stack.push(absolutePath);
        }
        continue;
      }

      if (sourceExtensions.has(path.extname(entry))) {
        files.push(absolutePath);
      }
    }
  }

  return files;
};

const collectAllSourceFiles = (): string[] => sourceRoots.flatMap(collectSourceFiles);

const resolveLineNumber = (content: string, matchIndex: number): number =>
  content.slice(0, matchIndex).split('\n').length;

describe('offline bundle resources', () => {
  it('does not embed forbidden remote demo assets in source modules', () => {
    const violations: string[] = [];

    for (const filePath of collectAllSourceFiles()) {
      const source = readFileSync(filePath, 'utf8');

      for (const marker of forbiddenRemoteAssetMarkers) {
        const matchIndex = source.indexOf(marker);
        if (matchIndex >= 0) {
          violations.push(
            `${path.relative(projectRoot, filePath)}:${resolveLineNumber(source, matchIndex)} -> ${marker}`,
          );
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it('only references packaged root-level public assets that actually exist', () => {
    const missingAssets: string[] = [];

    for (const filePath of collectAllSourceFiles()) {
      const source = readFileSync(filePath, 'utf8');

      for (const pattern of requiredPublicAssetPatterns) {
        pattern.lastIndex = 0;
        let match: RegExpExecArray | null = pattern.exec(source);

        while (match) {
          const referencedPath = match[1];
          const absolutePublicPath = path.join(publicRoot, referencedPath.replace(/^\//, ''));
          if (!existsSync(absolutePublicPath)) {
            missingAssets.push(
              `${path.relative(projectRoot, filePath)}:${resolveLineNumber(source, match.index)} -> ${referencedPath}`,
            );
          }
          match = pattern.exec(source);
        }
      }
    }

    expect(missingAssets).toEqual([]);
  });
});
