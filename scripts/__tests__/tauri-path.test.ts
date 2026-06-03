import { describe, expect, it } from 'vitest';
import {
  resolveCargoBinDir,
  resolveCargoTargetDir,
  withCargoBinOnPath,
  withTauriBuildEnv,
} from '../tauri-path.mjs';

describe('tauri-path', () => {
  it('returns the default cargo bin when cargo exists and PATH is missing it', () => {
    const result = resolveCargoBinDir({
      homeDir: 'C:\\Users\\admin',
      platform: 'win32',
      envPath: 'C:\\Windows\\System32;C:\\Program Files\\Git\\cmd',
      existsSync: (target) => target === 'C:\\Users\\admin\\.cargo\\bin\\cargo.exe',
    });

    expect(result).toBe('C:\\Users\\admin\\.cargo\\bin');
  });

  it('returns null when cargo is already on PATH', () => {
    const result = resolveCargoBinDir({
      homeDir: 'C:\\Users\\admin',
      platform: 'win32',
      envPath: 'C:\\Users\\admin\\.cargo\\bin;C:\\Windows\\System32',
      existsSync: () => true,
    });

    expect(result).toBeNull();
  });

  it('prepends cargo bin onto PATH when needed', () => {
    const env = withCargoBinOnPath(
      { PATH: 'C:\\Windows\\System32' },
      {
        homeDir: 'C:\\Users\\admin',
        platform: 'win32',
        existsSync: (target) => target === 'C:\\Users\\admin\\.cargo\\bin\\cargo.exe',
      }
    );

    expect(env.PATH).toBe('C:\\Users\\admin\\.cargo\\bin;C:\\Windows\\System32');
  });

  it('prefers an explicit cargo target dir when one is configured', () => {
    const result = resolveCargoTargetDir({
      env: {
        CARGO_TARGET_DIR: 'D:\\custom-target',
        LOCALAPPDATA: 'C:\\Users\\admin\\AppData\\Local',
      },
      homeDir: 'C:\\Users\\admin',
      platform: 'win32',
    });

    expect(result).toBe('D:\\custom-target');
  });

  it('falls back to a local app data cargo target dir on windows', () => {
    const result = resolveCargoTargetDir({
      env: {
        LOCALAPPDATA: 'C:\\Users\\admin\\AppData\\Local',
      },
      homeDir: 'C:\\Users\\admin',
      platform: 'win32',
    });

    expect(result).toBe('C:\\Users\\admin\\AppData\\Local\\SDKWork\\MagicStudio\\cargo-target');
  });

  it('adds cargo target dir alongside cargo bin when preparing tauri build env', () => {
    const env = withTauriBuildEnv(
      {
        PATH: 'C:\\Windows\\System32',
        LOCALAPPDATA: 'C:\\Users\\admin\\AppData\\Local',
      },
      {
        homeDir: 'C:\\Users\\admin',
        platform: 'win32',
        existsSync: (target) => target === 'C:\\Users\\admin\\.cargo\\bin\\cargo.exe',
      }
    );

    expect(env.PATH).toBe('C:\\Users\\admin\\.cargo\\bin;C:\\Windows\\System32');
    expect(env.CARGO_TARGET_DIR).toBe(
      'C:\\Users\\admin\\AppData\\Local\\SDKWork\\MagicStudio\\cargo-target'
    );
  });

  it('falls back to a workspace-local cargo target dir when the default cache root is not writable', () => {
    const createdDirectories: Array<{ target: string; options: { recursive: true } }> = [];
    const env = withTauriBuildEnv(
      {
        PATH: 'C:\\Windows\\System32',
        LOCALAPPDATA: 'C:\\Users\\admin\\AppData\\Local',
      },
      {
        cwd: 'D:\\javasource\\spring-ai-plus\\spring-ai-plus-business\\apps\\magic-studio-v2',
        homeDir: 'C:\\Users\\admin',
        platform: 'win32',
        existsSync: (target) => target === 'C:\\Users\\admin\\.cargo\\bin\\cargo.exe',
        mkdirSync: (target, options) => {
          if (target === 'C:\\Users\\admin\\AppData\\Local\\SDKWork\\MagicStudio\\cargo-target') {
            const error = new Error(`EPERM: operation not permitted, mkdir '${target}'`) as NodeJS.ErrnoException;
            error.code = 'EPERM';
            throw error;
          }

          createdDirectories.push({ target, options: options as { recursive: true } });
        },
      }
    );

    expect(env.PATH).toBe('C:\\Users\\admin\\.cargo\\bin;C:\\Windows\\System32');
    expect(env.CARGO_TARGET_DIR).toBe(
      'D:\\javasource\\spring-ai-plus\\spring-ai-plus-business\\apps\\magic-studio-v2\\.cache\\tauri\\cargo-target'
    );
    expect(createdDirectories).toEqual([
      {
        target: 'D:\\javasource\\spring-ai-plus\\spring-ai-plus-business\\apps\\magic-studio-v2\\.cache\\tauri\\cargo-target',
        options: { recursive: true },
      },
      {
        target: 'D:\\javasource\\spring-ai-plus\\spring-ai-plus-business\\apps\\magic-studio-v2\\.cache\\tauri\\cargo-target\\.magic-studio-write-check',
        options: { recursive: true },
      },
    ]);
  });
});
