import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const readSource = (relativePath: string): string =>
  readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');

describe('startup shell wiring', () => {
  it('keeps the boot splash outside the React root so startup never drops to a blank frame', () => {
    const source = readSource('index.html');

    expect(source.indexOf('id="boot-splash"')).toBeGreaterThan(-1);
    expect(source.indexOf('id="root"')).toBeGreaterThan(-1);
    expect(source.indexOf('id="boot-splash"')).toBeLessThan(source.indexOf('id="root"'));
  });

  it('hydrates the splash theme from persisted appearance data before the app entry executes', () => {
    const source = readSource('index.html');

    expect(source).toContain('magic_studio_appearance_snapshot_v1');
    expect(source).toContain('data-theme');
    expect(source).toContain('prefers-color-scheme: dark');
  });

  it('derives the boot splash accent from the selected theme color before first paint', () => {
    const source = readSource('index.html');

    expect(source).toContain('--boot-accent-500');
    expect(source).toContain('themePalettes');
    expect(source).toContain('appearance.themeColor');
  });

  it('localizes the boot splash copy from persisted language hints before the app mounts', () => {
    const source = readSource('index.html');

    expect(source).toContain('__MAGIC_STUDIO_BOOT_PRESENTATION__');
    expect(source).toContain('normalizeLanguage');
    expect(source).toContain('data-boot-field="subtitle"');
  });

  it('primes the theme manager before mounting React', () => {
    const source = readSource('index.tsx');

    expect(source).toContain('themeManager.prime()');
    expect(source.indexOf('themeManager.prime()')).toBeLessThan(
      source.indexOf('ReactDOM.createRoot'),
    );
  });
});
