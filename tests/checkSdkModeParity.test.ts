import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  captureDesktopVisualSignature,
  compareDesktopVisualSignatures,
} from '../scripts/check-sdk-mode-parity.mjs';

const createDistFixture = (
  fixtureName: string,
  {
    indexHtml,
    cssFiles,
    rootFiles,
  }: {
    indexHtml: string;
    cssFiles: Record<string, string>;
    rootFiles: Record<string, string>;
  },
) => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), `magic-studio-parity-${fixtureName}-`));
  const distRoot = path.join(tempRoot, 'dist');

  mkdirSync(path.join(distRoot, 'assets'), { recursive: true });
  mkdirSync(path.join(distRoot, 'demo-media'), { recursive: true });

  writeFileSync(path.join(distRoot, 'index.html'), indexHtml, 'utf8');
  writeFileSync(path.join(distRoot, 'assets', 'entry-abc123.js'), 'console.log("entry");', 'utf8');
  writeFileSync(path.join(distRoot, 'assets', 'route-def456.js'), 'console.log("route");', 'utf8');

  for (const [relativePath, content] of Object.entries(cssFiles)) {
    writeFileSync(path.join(distRoot, relativePath), content, 'utf8');
  }

  for (const [relativePath, content] of Object.entries(rootFiles)) {
    const targetPath = path.join(distRoot, relativePath);
    mkdirSync(path.dirname(targetPath), { recursive: true });
    writeFileSync(targetPath, content, 'utf8');
  }

  return {
    distRoot,
    cleanup: () => rmSync(tempRoot, { recursive: true, force: true }),
  };
};

describe('check-sdk-mode-parity', () => {
  it('treats builds with the same normalized shell and visual assets as equivalent', () => {
    const external = createDistFixture('external-match', {
      indexHtml:
        '<!doctype html><html><head><link rel="stylesheet" href="/assets/index-aaa111.css"><link rel="stylesheet" href="/assets/vendor-terminal-bbb222.css"></head><body><script type="module" src="/assets/index-ccc333.js"></script></body></html>',
      cssFiles: {
        'assets/index-aaa111.css': ':root{--theme-primary-500:#3b82f6}',
        'assets/vendor-terminal-bbb222.css': '.xterm{font-family:monospace}',
      },
      rootFiles: {
        'grid-pattern.svg': '<svg><rect /></svg>',
        'demo-media/magic-studio-preview.mp4': 'video',
        'demo-media/magic-studio-preview.wav': 'audio',
      },
    });

    const git = createDistFixture('git-match', {
      indexHtml:
        '<!doctype html><html><head><link rel="stylesheet" href="/assets/index-zzz999.css"><link rel="stylesheet" href="/assets/vendor-terminal-yyy888.css"></head><body><script type="module" src="/assets/index-xxx777.js"></script></body></html>',
      cssFiles: {
        'assets/index-zzz999.css': ':root{--theme-primary-500:#3b82f6}',
        'assets/vendor-terminal-yyy888.css': '.xterm{font-family:monospace}',
      },
      rootFiles: {
        'grid-pattern.svg': '<svg><rect /></svg>',
        'demo-media/magic-studio-preview.mp4': 'video',
        'demo-media/magic-studio-preview.wav': 'audio',
      },
    });

    try {
      const externalSignature = captureDesktopVisualSignature({ distRoot: external.distRoot });
      const gitSignature = captureDesktopVisualSignature({ distRoot: git.distRoot });
      const violations = compareDesktopVisualSignatures({
        baselineLabel: 'external',
        baseline: externalSignature,
        candidateLabel: 'git',
        candidate: gitSignature,
      });

      expect(violations).toEqual([]);
    } finally {
      external.cleanup();
      git.cleanup();
    }
  });

  it('reports when the compiled CSS differs between sdk modes', () => {
    const external = createDistFixture('external-css', {
      indexHtml:
        '<!doctype html><html><head><link rel="stylesheet" href="/assets/index-aaa111.css"><link rel="stylesheet" href="/assets/vendor-terminal-bbb222.css"></head><body><script type="module" src="/assets/index-ccc333.js"></script></body></html>',
      cssFiles: {
        'assets/index-aaa111.css': ':root{--theme-primary-500:#3b82f6}',
        'assets/vendor-terminal-bbb222.css': '.xterm{font-family:monospace}',
      },
      rootFiles: {
        'grid-pattern.svg': '<svg><rect /></svg>',
        'demo-media/magic-studio-preview.mp4': 'video',
        'demo-media/magic-studio-preview.wav': 'audio',
      },
    });

    const git = createDistFixture('git-css', {
      indexHtml:
        '<!doctype html><html><head><link rel="stylesheet" href="/assets/index-zzz999.css"><link rel="stylesheet" href="/assets/vendor-terminal-yyy888.css"></head><body><script type="module" src="/assets/index-xxx777.js"></script></body></html>',
      cssFiles: {
        'assets/index-zzz999.css': ':root{--theme-primary-500:#ef4444}',
        'assets/vendor-terminal-yyy888.css': '.xterm{font-family:monospace}',
      },
      rootFiles: {
        'grid-pattern.svg': '<svg><rect /></svg>',
        'demo-media/magic-studio-preview.mp4': 'video',
        'demo-media/magic-studio-preview.wav': 'audio',
      },
    });

    try {
      const violations = compareDesktopVisualSignatures({
        baselineLabel: 'external',
        baseline: captureDesktopVisualSignature({ distRoot: external.distRoot }),
        candidateLabel: 'git',
        candidate: captureDesktopVisualSignature({ distRoot: git.distRoot }),
      });

      expect(violations.some((violation) => violation.includes('compiled CSS'))).toBe(true);
    } finally {
      external.cleanup();
      git.cleanup();
    }
  });

  it('reports when the entry shell differs after hash normalization', () => {
    const external = createDistFixture('external-shell', {
      indexHtml:
        '<!doctype html><html><head><link rel="stylesheet" href="/assets/index-aaa111.css"></head><body><script type="module" src="/assets/index-ccc333.js"></script></body></html>',
      cssFiles: {
        'assets/index-aaa111.css': ':root{--theme-primary-500:#3b82f6}',
      },
      rootFiles: {
        'grid-pattern.svg': '<svg><rect /></svg>',
        'demo-media/magic-studio-preview.mp4': 'video',
        'demo-media/magic-studio-preview.wav': 'audio',
      },
    });

    const git = createDistFixture('git-shell', {
      indexHtml:
        '<!doctype html><html><head><link rel="stylesheet" href="/assets/index-zzz999.css"></head><body><script type="module" src="/assets/alternate-entry-xxx777.js"></script></body></html>',
      cssFiles: {
        'assets/index-zzz999.css': ':root{--theme-primary-500:#3b82f6}',
      },
      rootFiles: {
        'grid-pattern.svg': '<svg><rect /></svg>',
        'demo-media/magic-studio-preview.mp4': 'video',
        'demo-media/magic-studio-preview.wav': 'audio',
      },
    });

    try {
      const violations = compareDesktopVisualSignatures({
        baselineLabel: 'external',
        baseline: captureDesktopVisualSignature({ distRoot: external.distRoot }),
        candidateLabel: 'git',
        candidate: captureDesktopVisualSignature({ distRoot: git.distRoot }),
      });

      expect(violations.some((violation) => violation.includes('entry shell'))).toBe(true);
    } finally {
      external.cleanup();
      git.cleanup();
    }
  });
});
