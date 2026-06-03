import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { captureDesktopVisualSignature } from '../check-sdk-mode-parity.mjs';
import { compareDesktopStyleSignatures } from '../check-build-mode-style-parity.mjs';

const tempRoots: string[] = [];

const writeDistFixture = (files: Record<string, string>): string => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'magic-studio-build-mode-style-test-'));
  tempRoots.push(root);

  for (const [relativePath, content] of Object.entries(files)) {
    const absolutePath = path.join(root, relativePath);
    fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
    fs.writeFileSync(absolutePath, content, 'utf8');
  }

  return root;
};

afterEach(() => {
  while (tempRoots.length > 0) {
    const root = tempRoots.pop();
    if (root) {
      fs.rmSync(root, { recursive: true, force: true });
    }
  }
});

describe('check-build-mode-style-parity', () => {
  it('ignores JS bundle content differences while checking style parity', () => {
    const developmentDist = writeDistFixture({
      'index.html': `<!DOCTYPE html>
<html>
  <head>
    <link rel="stylesheet" href="/assets/index-AAAAAA.css" />
  </head>
  <body>
    <script type="module" src="/assets/index-BBBBBB.js"></script>
  </body>
</html>`,
      'assets/index-AAAAAA.css': 'body { color: white; }',
      'assets/index-BBBBBB.js': 'console.log("development");',
    });

    const productionDist = writeDistFixture({
      'index.html': `<!DOCTYPE html>
<html>
  <head>
    <link rel="stylesheet" href="/assets/index-CCCCCC.css" />
  </head>
  <body>
    <script type="module" src="/assets/index-DDDDDD.js"></script>
  </body>
</html>`,
      'assets/index-CCCCCC.css': 'body { color: white; }',
      'assets/index-DDDDDD.js': 'console.log("production");',
    });

    const violations = compareDesktopStyleSignatures({
      baselineLabel: 'development-build',
      baseline: captureDesktopVisualSignature({ distRoot: developmentDist }),
      candidateLabel: 'production-build',
      candidate: captureDesktopVisualSignature({ distRoot: productionDist }),
    });

    expect(violations).toEqual([]);
  });

  it('treats CSS drift as a style parity violation', () => {
    const developmentDist = writeDistFixture({
      'index.html': `<!DOCTYPE html>
<html>
  <head>
    <link rel="stylesheet" href="/assets/index-AAAAAA.css" />
  </head>
  <body>
    <script type="module" src="/assets/index-BBBBBB.js"></script>
  </body>
</html>`,
      'assets/index-AAAAAA.css': 'body { color: white; }',
      'assets/index-BBBBBB.js': 'console.log("development");',
    });

    const productionDist = writeDistFixture({
      'index.html': `<!DOCTYPE html>
<html>
  <head>
    <link rel="stylesheet" href="/assets/index-CCCCCC.css" />
  </head>
  <body>
    <script type="module" src="/assets/index-DDDDDD.js"></script>
  </body>
</html>`,
      'assets/index-CCCCCC.css': 'body { color: black; }',
      'assets/index-DDDDDD.js': 'console.log("production");',
    });

    const violations = compareDesktopStyleSignatures({
      baselineLabel: 'development-build',
      baseline: captureDesktopVisualSignature({ distRoot: developmentDist }),
      candidateLabel: 'production-build',
      candidate: captureDesktopVisualSignature({ distRoot: productionDist }),
    });

    expect(violations).toContain('production-build compiled CSS differs from development-build');
  });
});
