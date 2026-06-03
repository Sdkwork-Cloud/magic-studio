import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { inspectDesktopBundle } from '../check-desktop-bundle-self-contained.mjs';

const tempDirs: string[] = [];

const createTempDir = (prefix: string): string => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  tempDirs.push(tempDir);
  return tempDir;
};

describe('inspectDesktopBundle', () => {
  afterEach(() => {
    for (const tempDir of tempDirs.splice(0, tempDirs.length)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('passes when desktop dist assets are self-contained', () => {
    const distRoot = createTempDir('magic-studio-dist-');
    const assetsDir = path.join(distRoot, 'assets');
    fs.mkdirSync(assetsDir, { recursive: true });

    fs.writeFileSync(
      path.join(distRoot, 'index.html'),
      [
        '<!doctype html>',
        '<html>',
        '<head>',
        '<link rel="stylesheet" href="/assets/index-abc123.css">',
        '</head>',
        '<body>',
        '<script type="module" src="/assets/index-abc123.js"></script>',
        '</body>',
        '</html>',
      ].join(''),
      'utf8'
    );
    fs.writeFileSync(
      path.join(assetsDir, 'index-abc123.css'),
      '.flex{display:flex}.xterm{font-family:monospace}',
      'utf8'
    );

    expect(inspectDesktopBundle({ distRoot })).toEqual([]);
  });
});
