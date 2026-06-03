import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { inspectTauriEmbeddedAssets } from '../check-tauri-embedded-assets.mjs';

const tempRoots: string[] = [];

function createTempRoot() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'magic-studio-tauri-assets-'));
  tempRoots.push(root);
  return root;
}

function writeFile(targetPath: string, content = 'x') {
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, content);
}

function seedDist(distRoot: string) {
  writeFile(path.join(distRoot, 'index.html'), '<!doctype html>');
  writeFile(path.join(distRoot, 'assets', 'index.js'), 'console.log("ok");');
  writeFile(path.join(distRoot, 'assets', 'index.css'), 'body{}');
}

function seedEmbeddedAssets(tauriAssetsDir: string) {
  writeFile(path.join(tauriAssetsDir, 'index.html'), '<!doctype html>');
  writeFile(path.join(tauriAssetsDir, 'assets', 'index.js'), 'console.log("ok");');
  writeFile(path.join(tauriAssetsDir, 'assets', 'index.css'), 'body{}');
}

afterEach(() => {
  while (tempRoots.length > 0) {
    const root = tempRoots.pop();
    if (!root) {
      continue;
    }

    fs.rmSync(root, { recursive: true, force: true });
  }
});

describe('inspectTauriEmbeddedAssets', () => {
  it('accepts embedded assets generated under the shared cargo target directory', () => {
    const projectDir = createTempRoot();
    const distRoot = path.join(projectDir, 'dist');
    const localAppData = path.join(projectDir, 'local-app-data');

    seedDist(distRoot);
    seedEmbeddedAssets(
      path.join(
        localAppData,
        'SDKWork',
        'MagicStudio',
        'cargo-target',
        'release',
        'build',
        'magic-studio-shared',
        'out',
        'tauri-codegen-assets'
      )
    );

    const violations = inspectTauriEmbeddedAssets({
      distRoot,
      projectDir,
      packageName: 'magic-studio',
      env: {
        LOCALAPPDATA: localAppData,
      },
      homeDir: path.join(projectDir, 'home'),
      platform: 'win32',
    });

    expect(violations).toEqual([]);
  });

  it('accepts embedded assets generated under the workspace fallback cargo target directory', () => {
    const projectDir = createTempRoot();
    const distRoot = path.join(projectDir, 'dist');

    seedDist(distRoot);
    seedEmbeddedAssets(
      path.join(
        projectDir,
        '.cache',
        'tauri',
        'cargo-target',
        'release',
        'build',
        'magic-studio-workspace',
        'out',
        'tauri-codegen-assets'
      )
    );

    const violations = inspectTauriEmbeddedAssets({
      distRoot,
      projectDir,
      packageName: 'magic-studio',
      env: {
        LOCALAPPDATA: path.join(projectDir, 'local-app-data'),
      },
      homeDir: path.join(projectDir, 'home'),
      platform: 'win32',
    });

    expect(violations).toEqual([]);
  });
});
