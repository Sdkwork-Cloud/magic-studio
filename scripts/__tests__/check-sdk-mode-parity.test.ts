import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import {
  captureDesktopVisualSignature,
  compareDesktopVisualSignatures,
} from '../check-sdk-mode-parity.mjs';

const tempRoots: string[] = [];

const writeDistFixture = (files: Record<string, string>): string => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'magic-studio-sdk-parity-test-'));
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

describe('check-sdk-mode-parity', () => {
  it('captures compiled JS bundles alongside CSS bundles', () => {
    const distRoot = writeDistFixture({
      'index.html': `<!DOCTYPE html>
<html>
  <head>
    <link rel="stylesheet" href="/assets/index-AAAAAA.css" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/assets/index-BBBBBB.js"></script>
  </body>
</html>`,
      'assets/index-AAAAAA.css': 'body { color: white; }',
      'assets/index-BBBBBB.js': 'console.log("hello");',
    });

    const signature = captureDesktopVisualSignature({ distRoot });

    expect(signature.cssBundles).toHaveLength(1);
    expect(signature.jsBundles).toHaveLength(1);
    expect(signature.jsBundles[0]).toMatchObject({
      reference: 'assets/index-<hash>.js',
    });
  });

  it('treats JS bundle differences as visual/runtime parity violations', () => {
    const baselineDist = writeDistFixture({
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
      'assets/index-BBBBBB.js': 'console.log("baseline");',
    });

    const candidateDist = writeDistFixture({
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
      'assets/index-DDDDDD.js': 'console.log("candidate");',
    });

    const violations = compareDesktopVisualSignatures({
      baselineLabel: 'source',
      baseline: captureDesktopVisualSignature({ distRoot: baselineDist }),
      candidateLabel: 'git',
      candidate: captureDesktopVisualSignature({ distRoot: candidateDist }),
    });

    expect(violations).toContain('git compiled JS differs from source');
  });

  it('ignores JS bundle differences that only come from hashed chunk references', () => {
    const baselineDist = writeDistFixture({
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
      'assets/index-BBBBBB.js': 'const loader=()=>Promise.all([import("./feature-image-D5H89B0i.js"),import("./shared-app-sdk-Bg0i4Acy.js")]);export{loader};',
    });

    const candidateDist = writeDistFixture({
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
      'assets/index-DDDDDD.js': 'const loader=()=>Promise.all([import("./feature-image-Buu_nAnQ.js"),import("./shared-app-sdk-Co48vp1y.js")]);export{loader};',
    });

    const violations = compareDesktopVisualSignatures({
      baselineLabel: 'source',
      baseline: captureDesktopVisualSignature({ distRoot: baselineDist }),
      candidateLabel: 'git',
      candidate: captureDesktopVisualSignature({ distRoot: candidateDist }),
    });

    expect(violations).not.toContain('git compiled JS differs from source');
  });
});
