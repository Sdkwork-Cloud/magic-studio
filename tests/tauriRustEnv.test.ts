import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveRustBinDir } from '../scripts/tauri-cli-env.mjs';

describe('tauri rust environment resolution', () => {
  it('falls back to the user cargo bin directory when cargo is missing from PATH', () => {
    const userProfile = String.raw`C:\Users\admin`;
    const rustBinDir = path.win32.join(userProfile, '.cargo', 'bin');

    const result = resolveRustBinDir({
      env: {
        USERPROFILE: userProfile,
        PATH: String.raw`C:\Windows\System32`,
      },
      hasCargoOnPath: false,
      existsSync: (targetPath) => targetPath === path.win32.join(rustBinDir, 'cargo.exe'),
      platform: 'win32',
    });

    expect(result).toBe(rustBinDir);
  });

  it('returns null when cargo is already available on PATH', () => {
    const result = resolveRustBinDir({
      env: {
        USERPROFILE: String.raw`C:\Users\admin`,
        PATH: String.raw`C:\Users\admin\.cargo\bin;C:\Windows\System32`,
      },
      hasCargoOnPath: true,
      existsSync: () => true,
      platform: 'win32',
    });

    expect(result).toBeNull();
  });
});
