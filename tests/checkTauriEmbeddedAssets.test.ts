import {
  mkdtempSync,
  mkdirSync,
  rmSync,
  statSync,
  utimesSync,
  writeFileSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { inspectTauriEmbeddedAssets } from '../scripts/check-tauri-embedded-assets.mjs';

const createFixture = (fixtureName: string) => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), `magic-studio-${fixtureName}-`));
  const distRoot = path.join(tempRoot, 'dist');
  const tauriBuildRoot = path.join(tempRoot, 'src-tauri', 'target', 'release', 'build');

  mkdirSync(path.join(distRoot, 'assets'), { recursive: true });
  mkdirSync(path.join(distRoot, 'demo-media'), { recursive: true });
  mkdirSync(tauriBuildRoot, { recursive: true });

  writeFileSync(path.join(distRoot, 'index.html'), '<!doctype html><html></html>', 'utf8');
  writeFileSync(path.join(distRoot, 'grid-pattern.svg'), '<svg />', 'utf8');
  writeFileSync(path.join(distRoot, 'demo-media', 'magic-studio-preview.mp4'), 'video', 'utf8');
  writeFileSync(path.join(distRoot, 'demo-media', 'magic-studio-preview.wav'), 'audio', 'utf8');
  writeFileSync(path.join(distRoot, 'assets', 'app.js'), 'console.log("app");', 'utf8');
  writeFileSync(path.join(distRoot, 'assets', 'vendor.js'), 'console.log("vendor");', 'utf8');
  writeFileSync(path.join(distRoot, 'assets', 'app.css'), '.app{}', 'utf8');
  writeFileSync(path.join(distRoot, 'assets', 'vendor.css'), '.vendor{}', 'utf8');

  return {
    distRoot,
    tauriBuildRoot,
    cleanup: () => rmSync(tempRoot, { recursive: true, force: true }),
  };
};

const createCodegenAssetsDir = ({
  tauriBuildRoot,
  packageName = 'magic-studio',
  hash,
  files,
  mtimeOffsetMs = 0,
}: {
  tauriBuildRoot: string;
  packageName?: string;
  hash: string;
  files: string[];
  mtimeOffsetMs?: number;
}) => {
  const codegenRoot = path.join(tauriBuildRoot, `${packageName}-${hash}`, 'out', 'tauri-codegen-assets');
  mkdirSync(codegenRoot, { recursive: true });

  for (const filename of files) {
    writeFileSync(path.join(codegenRoot, filename), `fixture:${filename}`, 'utf8');
  }

  const now = new Date(statSync(codegenRoot).mtimeMs + mtimeOffsetMs);
  utimesSync(codegenRoot, now, now);

  return codegenRoot;
};

describe('check-tauri-embedded-assets', () => {
  it('reports when the tauri codegen assets directory is missing', () => {
    const fixture = createFixture('missing-codegen-assets');

    try {
      const violations = inspectTauriEmbeddedAssets({
        distRoot: fixture.distRoot,
        tauriBuildRoot: fixture.tauriBuildRoot,
        packageName: 'magic-studio',
      });

      expect(
        violations.some((violation) => violation.includes('Could not find Tauri embedded assets')),
      ).toBe(true);
    } finally {
      fixture.cleanup();
    }
  });

  it('reports missing embedded resource types required by the dist bundle', () => {
    const fixture = createFixture('missing-media');

    createCodegenAssetsDir({
      tauriBuildRoot: fixture.tauriBuildRoot,
      hash: '123',
      files: ['app.js', 'vendor.js', 'app.css', 'vendor.css', 'index.html', 'grid.svg'],
    });

    try {
      const violations = inspectTauriEmbeddedAssets({
        distRoot: fixture.distRoot,
        tauriBuildRoot: fixture.tauriBuildRoot,
        packageName: 'magic-studio',
      });

      expect(violations.some((violation) => violation.includes('.mp4'))).toBe(true);
      expect(violations.some((violation) => violation.includes('.wav'))).toBe(true);
    } finally {
      fixture.cleanup();
    }
  });

  it('checks the latest matching magic-studio build output and ignores stale unrelated builds', () => {
    const fixture = createFixture('latest-matching-build');

    createCodegenAssetsDir({
      tauriBuildRoot: fixture.tauriBuildRoot,
      packageName: 'open-studio',
      hash: 'legacy',
      files: ['legacy.js'],
      mtimeOffsetMs: 10_000,
    });

    createCodegenAssetsDir({
      tauriBuildRoot: fixture.tauriBuildRoot,
      packageName: 'magic-studio',
      hash: 'old',
      files: ['app.js'],
      mtimeOffsetMs: -10_000,
    });

    createCodegenAssetsDir({
      tauriBuildRoot: fixture.tauriBuildRoot,
      packageName: 'magic-studio',
      hash: 'new',
      files: [
        'app.js',
        'vendor.js',
        'feature.js',
        'app.css',
        'vendor.css',
        'index.html',
        'grid.svg',
        'preview.mp4',
        'preview.wav',
      ],
      mtimeOffsetMs: 20_000,
    });

    try {
      const violations = inspectTauriEmbeddedAssets({
        distRoot: fixture.distRoot,
        tauriBuildRoot: fixture.tauriBuildRoot,
        packageName: 'magic-studio',
      });

      expect(violations).toEqual([]);
    } finally {
      fixture.cleanup();
    }
  });
});
