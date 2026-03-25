import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const legacyBrandWords = ['Open', 'Studio'];
const legacySpacedBrand = legacyBrandWords.join(' ');
const legacyCompactBrand = legacyBrandWords.join('');
const legacyKebabBrand = ['open', 'studio'].join('-');
const legacyBrandPattern = new RegExp(
  `\\b${legacySpacedBrand}\\b|\\b${legacyCompactBrand}\\b|${legacyKebabBrand}\\b`
);
const updateEndpoint = 'https://api.sdkwork.com/app/v3/api/app/update/latest?app=magic-studio';

const resolveFromRoot = (...segments: string[]): string => path.join(rootDir, ...segments);

const readFromRoot = (...segments: string[]): string =>
  fs.readFileSync(resolveFromRoot(...segments), 'utf8');

describe('Magic Studio branding', () => {
  it('uses Magic Studio desktop metadata and the SDKWork update endpoint', () => {
    const tauriConfig = JSON.parse(readFromRoot('src-tauri', 'tauri.conf.json'));
    const tauriProdConfig = JSON.parse(readFromRoot('src-tauri', 'tauri.prod.conf.json'));
    const cargoToml = readFromRoot('src-tauri', 'Cargo.toml');
    const ptyModule = readFromRoot('src-tauri', 'src', 'pty', 'mod.rs');

    expect(tauriConfig.productName).toBe('Magic Studio');
    expect(tauriConfig.identifier).toBe('com.sdkwork.magicstudio.desktop');
    expect(tauriConfig.plugins.updater.endpoints).toEqual([updateEndpoint]);

    expect(tauriProdConfig.plugins.updater.endpoints).toEqual([updateEndpoint]);

    expect(cargoToml).toContain('name = "magic-studio"');
    expect(cargoToml).not.toMatch(legacyBrandPattern);

    expect(ptyModule).toContain('TERM_PROGRAM", "MagicStudio"');
    expect(ptyModule).not.toMatch(legacyBrandPattern);
  });

  it('removes legacy branded compatibility artifacts from active code', () => {
    const chatStorage = readFromRoot(
      'packages',
      'sdkwork-react-chat',
      'src',
      'services',
      'chatSessionStorage.ts'
    );
    const storageIndex = readFromRoot(
      'packages',
      'sdkwork-react-core',
      'src',
      'storage',
      'index.ts'
    );
    const ideConfigTest = readFromRoot(
      'packages',
      'sdkwork-react-ide-config',
      'tests',
      'ideConfigMagicStudioPaths.test.ts'
    );
    const migrationService = readFromRoot(
      'src-tauri',
      'src',
      'framework',
      'services',
      'migration.rs'
    );

    expect(chatStorage).not.toContain(['open', 'studio', 'chat', 'sessions', 'v2'].join('_'));
    expect(storageIndex).not.toContain('magicStudioMigration');
    expect(ideConfigTest).not.toContain(['.', 'open', 'studio'].join(''));
    expect(migrationService).not.toContain([legacyKebabBrand, 'migration'].join('-'));

    expect(
      fs.existsSync(
        resolveFromRoot(
          'packages',
          'sdkwork-react-core',
          'src',
          'storage',
          'magicStudioMigration.ts'
        )
      )
    ).toBe(false);

    expect(
      fs.existsSync(
        resolveFromRoot(
          'packages',
          'sdkwork-react-core',
          'src',
          'storage',
          '__tests__',
          'magicStudioMigration.test.ts'
        )
      )
    ).toBe(false);
  });

  it('contains no legacy branded naming in active documentation', () => {
    const docsToCheck = [
      readFromRoot('QWEN.md'),
      readFromRoot('docs', 'plans', '2026-03-18-magicstudio-storage.md'),
      readFromRoot('docs', 'plans', '2026-03-18-magicstudio-storage-design.md'),
    ];

    for (const content of docsToCheck) {
      expect(content).not.toMatch(legacyBrandPattern);
    }
  });
});
