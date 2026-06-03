import assert from 'node:assert/strict';
import test from 'node:test';

import {
  resolveCargoTargetDir,
  withTauriBuildEnv,
} from '../scripts/tauri-path.mjs';

test('resolveCargoTargetDir respects explicit cargo target override', () => {
  const result = resolveCargoTargetDir({
    env: {
      CARGO_TARGET_DIR: 'D:\\custom-target',
      LOCALAPPDATA: 'C:\\Users\\admin\\AppData\\Local',
    },
    homeDir: 'C:\\Users\\admin',
    platform: 'win32',
  });

  assert.equal(result, 'D:\\custom-target');
});

test('resolveCargoTargetDir falls back to local app data on windows', () => {
  const result = resolveCargoTargetDir({
    env: {
      LOCALAPPDATA: 'C:\\Users\\admin\\AppData\\Local',
    },
    homeDir: 'C:\\Users\\admin',
    platform: 'win32',
  });

  assert.equal(
    result,
    'C:\\Users\\admin\\AppData\\Local\\SDKWork\\MagicStudio\\cargo-target',
  );
});

test('withTauriBuildEnv injects cargo target dir alongside cargo bin path', () => {
  const createdDirectories = [];
  const env = withTauriBuildEnv(
    {
      PATH: 'C:\\Windows\\System32',
      LOCALAPPDATA: 'C:\\Users\\admin\\AppData\\Local',
    },
    {
      homeDir: 'C:\\Users\\admin',
      platform: 'win32',
      existsSync: (target) => target === 'C:\\Users\\admin\\.cargo\\bin\\cargo.exe',
      mkdirSync: (target, options) => {
        createdDirectories.push({ target, options });
      },
    },
  );

  assert.equal(env.PATH, 'C:\\Users\\admin\\.cargo\\bin;C:\\Windows\\System32');
  assert.equal(
    env.CARGO_TARGET_DIR,
    'C:\\Users\\admin\\AppData\\Local\\SDKWork\\MagicStudio\\cargo-target',
  );
  assert.deepEqual(createdDirectories, [
    {
      target: 'C:\\Users\\admin\\AppData\\Local\\SDKWork\\MagicStudio\\cargo-target',
      options: { recursive: true },
    },
    {
      target: 'C:\\Users\\admin\\AppData\\Local\\SDKWork\\MagicStudio\\cargo-target\\.magic-studio-write-check',
      options: { recursive: true },
    },
  ]);
});

test('withTauriBuildEnv falls back to a workspace-local cargo target dir when the default cache root is not writable', () => {
  const createdDirectories = [];
  const workspaceRoot = 'D:\\javasource\\spring-ai-plus\\spring-ai-plus-business\\apps\\magic-studio-v2';
  const env = withTauriBuildEnv(
    {
      PATH: 'C:\\Windows\\System32',
      LOCALAPPDATA: 'C:\\Users\\admin\\AppData\\Local',
    },
    {
      cwd: workspaceRoot,
      homeDir: 'C:\\Users\\admin',
      platform: 'win32',
      existsSync: (target) => target === 'C:\\Users\\admin\\.cargo\\bin\\cargo.exe',
      mkdirSync: (target, options) => {
        if (target === 'C:\\Users\\admin\\AppData\\Local\\SDKWork\\MagicStudio\\cargo-target') {
          const error = new Error(`EPERM: operation not permitted, mkdir '${target}'`);
          error.code = 'EPERM';
          throw error;
        }

        createdDirectories.push({ target, options });
      },
    },
  );

  assert.equal(env.PATH, 'C:\\Users\\admin\\.cargo\\bin;C:\\Windows\\System32');
  assert.equal(
    env.CARGO_TARGET_DIR,
    'D:\\javasource\\spring-ai-plus\\spring-ai-plus-business\\apps\\magic-studio-v2\\.cache\\tauri\\cargo-target',
  );
  assert.deepEqual(createdDirectories, [
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

test('withTauriBuildEnv does not trust an existing default cargo target root unless nested writes also succeed', () => {
  const createdDirectories = [];
  const workspaceRoot = 'D:\\javasource\\spring-ai-plus\\spring-ai-plus-business\\apps\\magic-studio-v2';
  const env = withTauriBuildEnv(
    {
      PATH: 'C:\\Windows\\System32',
      LOCALAPPDATA: 'C:\\Users\\admin\\AppData\\Local',
    },
    {
      cwd: workspaceRoot,
      homeDir: 'C:\\Users\\admin',
      platform: 'win32',
      existsSync: (target) => target === 'C:\\Users\\admin\\.cargo\\bin\\cargo.exe',
      mkdirSync: (target, options) => {
        if (target === 'C:\\Users\\admin\\AppData\\Local\\SDKWork\\MagicStudio\\cargo-target\\.magic-studio-write-check') {
          const error = new Error(`EPERM: operation not permitted, mkdir '${target}'`);
          error.code = 'EPERM';
          throw error;
        }

        createdDirectories.push({ target, options });
      },
    },
  );

  assert.equal(env.PATH, 'C:\\Users\\admin\\.cargo\\bin;C:\\Windows\\System32');
  assert.equal(
    env.CARGO_TARGET_DIR,
    'D:\\javasource\\spring-ai-plus\\spring-ai-plus-business\\apps\\magic-studio-v2\\.cache\\tauri\\cargo-target',
  );
  assert.deepEqual(createdDirectories, [
    {
      target: 'C:\\Users\\admin\\AppData\\Local\\SDKWork\\MagicStudio\\cargo-target',
      options: { recursive: true },
    },
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

test('withTauriBuildEnv can prefer a workspace-local cargo target dir even when the system cache root is writable', () => {
  const createdDirectories = [];
  const workspaceRoot = 'D:\\javasource\\spring-ai-plus\\spring-ai-plus-business\\apps\\magic-studio-v2';
  const env = withTauriBuildEnv(
    {
      PATH: 'C:\\Windows\\System32',
      LOCALAPPDATA: 'C:\\Users\\admin\\AppData\\Local',
    },
    {
      cwd: workspaceRoot,
      homeDir: 'C:\\Users\\admin',
      platform: 'win32',
      preferWorkspaceLocalTargetDir: true,
      existsSync: (target) => target === 'C:\\Users\\admin\\.cargo\\bin\\cargo.exe',
      mkdirSync: (target, options) => {
        createdDirectories.push({ target, options });
      },
    },
  );

  assert.equal(env.PATH, 'C:\\Users\\admin\\.cargo\\bin;C:\\Windows\\System32');
  assert.equal(
    env.CARGO_TARGET_DIR,
    'D:\\javasource\\spring-ai-plus\\spring-ai-plus-business\\apps\\magic-studio-v2\\.cache\\tauri\\cargo-target',
  );
  assert.deepEqual(createdDirectories, [
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
