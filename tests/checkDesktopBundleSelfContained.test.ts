import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { inspectDesktopBundle } from '../scripts/check-desktop-bundle-self-contained.mjs';

const writeBundleFixture = (
  fixtureName: string,
  {
    indexHtml,
    jsBundle = 'console.log("bundle");',
    cssBundle = '.flex{display:flex}.xterm{font-family:monospace}',
    publicFiles = [],
  }: {
    indexHtml?: string;
    jsBundle?: string;
    cssBundle?: string;
    publicFiles?: string[];
  },
) => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), `magic-studio-${fixtureName}-`));
  const distRoot = path.join(tempRoot, 'dist');
  const publicRoot = path.join(tempRoot, 'public');
  const assetsRoot = path.join(distRoot, 'assets');

  mkdirSync(assetsRoot, { recursive: true });
  mkdirSync(publicRoot, { recursive: true });

  writeFileSync(
    path.join(distRoot, 'index.html'),
    indexHtml ??
      '<!doctype html><html><head><link rel="stylesheet" href="/assets/app.css"></head><body><script type="module" src="/assets/app.js"></script></body></html>',
    'utf8',
  );
  writeFileSync(path.join(assetsRoot, 'app.js'), jsBundle, 'utf8');
  writeFileSync(path.join(assetsRoot, 'app.css'), cssBundle, 'utf8');

  for (const relativePath of publicFiles) {
    const targetPath = path.join(publicRoot, relativePath);
    mkdirSync(path.dirname(targetPath), { recursive: true });
    writeFileSync(targetPath, 'fixture', 'utf8');
  }

  return {
    tempRoot,
    distRoot,
    publicRoot,
    cleanup: () => rmSync(tempRoot, { recursive: true, force: true }),
  };
};

describe('check-desktop-bundle-self-contained', () => {
  it('reports remote asset markers found inside js bundles', () => {
    const fixture = writeBundleFixture('remote-assets', {
      jsBundle: 'const poster = "https://images.unsplash.com/photo-demo";',
    });

    try {
      const violations = inspectDesktopBundle({
        distRoot: fixture.distRoot,
        publicRoot: fixture.publicRoot,
      });

      expect(
        violations.some((violation) =>
          violation.includes('Build output still depends on remote asset: images.unsplash.com'),
        ),
      ).toBe(true);
    } finally {
      fixture.cleanup();
    }
  });

  it('reports missing root-level public assets referenced from the bundle', () => {
    const fixture = writeBundleFixture('missing-public-assets', {
      jsBundle: 'const artifact = "/downloads/MagicStudio-Windows-x64.exe";',
    });

    try {
      const violations = inspectDesktopBundle({
        distRoot: fixture.distRoot,
        publicRoot: fixture.publicRoot,
      });

      expect(
        violations.some((violation) =>
          violation.includes('/downloads/MagicStudio-Windows-x64.exe'),
        ),
      ).toBe(true);
    } finally {
      fixture.cleanup();
    }
  });

  it('passes when bundles only reference packaged local assets', () => {
    const fixture = writeBundleFixture('self-contained', {
      jsBundle: 'const video = "/demo-media/magic-studio-preview.mp4";',
      publicFiles: ['demo-media/magic-studio-preview.mp4'],
    });

    try {
      const violations = inspectDesktopBundle({
        distRoot: fixture.distRoot,
        publicRoot: fixture.publicRoot,
      });

      expect(violations).toEqual([]);
    } finally {
      fixture.cleanup();
    }
  });

  it('ignores unrelated absolute file paths that are not public web assets', () => {
    const fixture = writeBundleFixture('ignores-non-public-paths', {
      jsBundle:
        'const tempPath = "/home/web_user/hello.txt"; const vendorLoader = "/loader.js";',
    });

    try {
      const violations = inspectDesktopBundle({
        distRoot: fixture.distRoot,
        publicRoot: fixture.publicRoot,
      });

      expect(violations).toEqual([]);
    } finally {
      fixture.cleanup();
    }
  });
});
