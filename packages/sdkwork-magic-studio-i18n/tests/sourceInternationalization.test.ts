import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = path.resolve(fileURLToPath(new URL('../../..', import.meta.url)));
const HAN_REGEX = /[\p{Script=Han}]/u;

const ALLOWED_SOURCE_PATH_SEGMENTS = [
  `${path.sep}src${path.sep}locales${path.sep}`,
  `${path.sep}src${path.sep}i18n${path.sep}locales${path.sep}`,
];

const ALLOWED_SOURCE_FILES = new Set([
  path.join('packages', 'sdkwork-magic-studio-assets', 'src', 'services', 'creationCapabilityService.ts'),
]);

const EXCLUDED_PATH_SEGMENTS = [
  `.sdk-git-sources${path.sep}`,
  `.worktrees${path.sep}`,
  `bak${path.sep}`,
  `${path.sep}node_modules${path.sep}`,
  `${path.sep}dist${path.sep}`,
  `${path.sep}coverage${path.sep}`,
  `${path.sep}.git${path.sep}`,
  `${path.sep}__tests__${path.sep}`,
  `${path.sep}tests${path.sep}`,
];

const SOURCE_ROOT_DIRECTORIES = [
  'packages',
  'scripts',
  'src',
];

const SOURCE_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
]);

const shouldCheckFile = (relativePath: string): boolean => {
  const normalized = relativePath.split('/').join(path.sep);

  if (EXCLUDED_PATH_SEGMENTS.some((segment) => normalized.includes(segment))) {
    return false;
  }

  if (/\.(test|spec)\.[cm]?[jt]sx?$/u.test(normalized)) {
    return false;
  }

  if (ALLOWED_SOURCE_PATH_SEGMENTS.some((segment) => normalized.includes(segment))) {
    return false;
  }

  if (ALLOWED_SOURCE_FILES.has(normalized)) {
    return false;
  }

  return SOURCE_EXTENSIONS.has(path.extname(normalized));
};

const collectSourceFiles = (directory: string): string[] => {
  if (!fs.existsSync(directory)) {
    return [];
  }

  const relativeDirectory = path.relative(repoRoot, directory);
  if (relativeDirectory && !shouldCheckFile(`${relativeDirectory}/index.ts`)) {
    return [];
  }

  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = path.join(directory, entry.name);
    const relativePath = path.relative(repoRoot, absolutePath).split(path.sep).join('/');

    if (entry.isDirectory()) {
      return collectSourceFiles(absolutePath);
    }

    if (!entry.isFile() || !shouldCheckFile(relativePath)) {
      return [];
    }

    return [relativePath];
  });
};

describe('repository source internationalization audit', () => {
  it('keeps Han characters out of source files outside locale resources', () => {
    const trackedFiles = SOURCE_ROOT_DIRECTORIES.flatMap((directory) =>
      collectSourceFiles(path.join(repoRoot, directory)),
    );

    const violations = trackedFiles.filter((relativePath) => {
      const absolutePath = path.join(repoRoot, relativePath);
      if (!fs.existsSync(absolutePath)) {
        return false;
      }
      const content = fs.readFileSync(absolutePath, 'utf8');
      return HAN_REGEX.test(content);
    });

    expect(violations, `Found non-localized Han text in:\n${violations.join('\n')}`).toEqual([]);
  });
});
