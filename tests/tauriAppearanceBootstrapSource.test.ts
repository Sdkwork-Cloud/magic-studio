import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const readSource = (relativePath: string): string =>
  readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');

describe('tauri appearance bootstrap wiring', () => {
  it('injects the persisted appearance snapshot into the desktop webview before the page boots', () => {
    const mainSource = readSource('src-tauri/src/main.rs');
    const helperSource = readSource('src-tauri/src/framework/appearance_bootstrap.rs');

    expect(mainSource).toContain('append_invoke_initialization_script');
    expect(helperSource).toContain('__MAGIC_STUDIO_TAURI_APPEARANCE_SNAPSHOT__');
    expect(helperSource).toContain('settings.json');
  });

  it('allows the HTML shell to prefer the tauri-injected snapshot over browser storage', () => {
    const source = readSource('index.html');

    expect(source).toContain('__MAGIC_STUDIO_TAURI_APPEARANCE_SNAPSHOT__');
  });

  it('keeps startup language hints in the injected desktop snapshot for first-paint copy', () => {
    const helperSource = readSource('src-tauri/src/framework/appearance_bootstrap.rs');

    expect(helperSource).toContain('"language"');
    expect(helperSource).toContain('.get("general")');
  });
});
