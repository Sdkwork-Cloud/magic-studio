import { execSync } from 'node:child_process';
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

const EXCLUDED_PATH_SEGMENTS = [
  `bak${path.sep}`,
  `${path.sep}node_modules${path.sep}`,
  `${path.sep}dist${path.sep}`,
  `${path.sep}.git${path.sep}`,
  `${path.sep}tests${path.sep}`,
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

  if (ALLOWED_SOURCE_PATH_SEGMENTS.some((segment) => normalized.includes(segment))) {
    return false;
  }

  return SOURCE_EXTENSIONS.has(path.extname(normalized));
};

describe('repository source internationalization audit', () => {
  it('keeps Han characters out of source files outside locale resources', () => {
    const trackedFiles = execSync('git ls-files', {
      cwd: repoRoot,
      encoding: 'utf8',
    })
      .split(/\r?\n/)
      .map((file) => file.trim())
      .filter(Boolean)
      .filter(shouldCheckFile);

    const violations = trackedFiles.filter((relativePath) => {
      const absolutePath = path.join(repoRoot, relativePath);
      const content = fs.readFileSync(absolutePath, 'utf8');
      return HAN_REGEX.test(content);
    });

    expect(violations, `Found non-localized Han text in:\n${violations.join('\n')}`).toEqual([]);
  });
});
