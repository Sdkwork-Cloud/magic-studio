import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const repoRoot = path.resolve(__dirname, '..', '..');

const readText = (relativePath: string): string =>
  fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');

const readJson = <T>(relativePath: string): T =>
  JSON.parse(readText(relativePath)) as T;

describe('desktop runtime parity', () => {
  it('keeps the same desktop app identity in dev and release', () => {
    const tauriConfig = readJson<{
      productName?: string;
      identifier?: string;
    }>('src-tauri/tauri.conf.json');
    const tauriProdConfig = readJson<{
      productName?: string;
      identifier?: string;
    }>('src-tauri/tauri.prod.conf.json');

    expect(tauriConfig.productName).toBe('Magic Studio');
    expect(tauriConfig.identifier).toBe('com.sdkwork.magicstudio.desktop');

    expect(tauriProdConfig.productName).toBeUndefined();
    expect(tauriProdConfig.identifier).toBeUndefined();
  });

  it('bootstraps the shared desktop localStorage bridge before React mounts', () => {
    const indexSource = readText('index.tsx');
    const bridgeCallIndex = indexSource.indexOf('await initializeDesktopLocalStorageBridge()');
    const createRootIndex = indexSource.indexOf('ReactDOM.createRoot');

    expect(bridgeCallIndex).toBeGreaterThanOrEqual(0);
    expect(createRootIndex).toBeGreaterThan(bridgeCallIndex);
  });

  it('marks the current project dev server and uses a shared desktop store file', () => {
    const indexHtml = readText('index.html');
    const desktopPlatformSource = readText('packages/sdkwork-magic-studio-core/src/platform/desktop.ts');

    expect(indexHtml).toContain('name="magic-studio-app-id"');
    expect(indexHtml).toContain('content="magic-studio-v2"');
    expect(desktopPlatformSource).toContain("Store.load('settings.json')");
  });
});
