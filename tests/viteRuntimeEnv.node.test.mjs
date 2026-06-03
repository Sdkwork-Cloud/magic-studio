import assert from 'node:assert/strict';
import test from 'node:test';

import {
  resolveViteCacheDir,
  resolveViteConfigLoader,
  withViteRuntimeEnv,
} from '../scripts/vite-path.mjs';

test('resolveViteCacheDir respects explicit magic studio cache override', () => {
  const result = resolveViteCacheDir({
    env: {
      MAGIC_STUDIO_VITE_CACHE_DIR: 'C:\\custom\\vite-cache',
      LOCALAPPDATA: 'C:\\Users\\admin\\AppData\\Local',
    },
    homeDir: 'C:\\Users\\admin',
    platform: 'win32',
  });

  assert.equal(result, 'C:\\custom\\vite-cache');
});

test('resolveViteConfigLoader defaults to native on windows', () => {
  const result = resolveViteConfigLoader({
    env: {},
    platform: 'win32',
  });

  assert.equal(result, 'native');
});

test('withViteRuntimeEnv injects a writable cache dir', () => {
  const createdDirectories = [];
  const env = withViteRuntimeEnv(
    {
      PATH: 'C:\\Windows\\System32',
      LOCALAPPDATA: 'C:\\Users\\admin\\AppData\\Local',
    },
    {
      homeDir: 'C:\\Users\\admin',
      platform: 'win32',
      mkdirSync: (target, options) => {
        createdDirectories.push({ target, options });
      },
    },
  );

  assert.equal(
    env.MAGIC_STUDIO_VITE_CACHE_DIR,
    'C:\\Users\\admin\\AppData\\Local\\SDKWork\\MagicStudio\\vite-cache',
  );
  assert.deepEqual(createdDirectories, [
    {
      target: 'C:\\Users\\admin\\AppData\\Local\\SDKWork\\MagicStudio\\vite-cache',
      options: { recursive: true },
    },
    {
      target: 'C:\\Users\\admin\\AppData\\Local\\SDKWork\\MagicStudio\\vite-cache\\.magic-studio-write-check',
      options: { recursive: true },
    },
  ]);
});

test('withViteRuntimeEnv falls back to a workspace-local cache dir when the default cache root is not writable', () => {
  const createdDirectories = [];
  const workspaceRoot = 'D:\\javasource\\spring-ai-plus\\spring-ai-plus-business\\apps\\magic-studio-v2';
  const env = withViteRuntimeEnv(
    {
      PATH: 'C:\\Windows\\System32',
      LOCALAPPDATA: 'C:\\Users\\admin\\AppData\\Local',
    },
    {
      cwd: workspaceRoot,
      homeDir: 'C:\\Users\\admin',
      platform: 'win32',
      mkdirSync: (target, options) => {
        if (target === 'C:\\Users\\admin\\AppData\\Local\\SDKWork\\MagicStudio\\vite-cache') {
          const error = new Error(`EPERM: operation not permitted, mkdir '${target}'`);
          error.code = 'EPERM';
          throw error;
        }

        createdDirectories.push({ target, options });
      },
    },
  );

  assert.equal(
    env.MAGIC_STUDIO_VITE_CACHE_DIR,
    'D:\\javasource\\spring-ai-plus\\spring-ai-plus-business\\apps\\magic-studio-v2\\.cache\\vite-cache',
  );
  assert.deepEqual(createdDirectories, [
    {
      target: 'D:\\javasource\\spring-ai-plus\\spring-ai-plus-business\\apps\\magic-studio-v2\\.cache\\vite-cache',
      options: { recursive: true },
    },
    {
      target: 'D:\\javasource\\spring-ai-plus\\spring-ai-plus-business\\apps\\magic-studio-v2\\.cache\\vite-cache\\.magic-studio-write-check',
      options: { recursive: true },
    },
  ]);
});

test('withViteRuntimeEnv does not trust an existing default cache root unless nested writes also succeed', () => {
  const createdDirectories = [];
  const workspaceRoot = 'D:\\javasource\\spring-ai-plus\\spring-ai-plus-business\\apps\\magic-studio-v2';
  const env = withViteRuntimeEnv(
    {
      PATH: 'C:\\Windows\\System32',
      LOCALAPPDATA: 'C:\\Users\\admin\\AppData\\Local',
    },
    {
      cwd: workspaceRoot,
      homeDir: 'C:\\Users\\admin',
      platform: 'win32',
      mkdirSync: (target, options) => {
        if (target === 'C:\\Users\\admin\\AppData\\Local\\SDKWork\\MagicStudio\\vite-cache\\.magic-studio-write-check') {
          const error = new Error(`EPERM: operation not permitted, mkdir '${target}'`);
          error.code = 'EPERM';
          throw error;
        }

        createdDirectories.push({ target, options });
      },
    },
  );

  assert.equal(
    env.MAGIC_STUDIO_VITE_CACHE_DIR,
    'D:\\javasource\\spring-ai-plus\\spring-ai-plus-business\\apps\\magic-studio-v2\\.cache\\vite-cache',
  );
  assert.deepEqual(createdDirectories, [
    {
      target: 'C:\\Users\\admin\\AppData\\Local\\SDKWork\\MagicStudio\\vite-cache',
      options: { recursive: true },
    },
    {
      target: 'D:\\javasource\\spring-ai-plus\\spring-ai-plus-business\\apps\\magic-studio-v2\\.cache\\vite-cache',
      options: { recursive: true },
    },
    {
      target: 'D:\\javasource\\spring-ai-plus\\spring-ai-plus-business\\apps\\magic-studio-v2\\.cache\\vite-cache\\.magic-studio-write-check',
      options: { recursive: true },
    },
  ]);
});

test('withViteRuntimeEnv can prefer a workspace-local cache dir even when the system cache root is writable', () => {
  const createdDirectories = [];
  const workspaceRoot = 'D:\\javasource\\spring-ai-plus\\spring-ai-plus-business\\apps\\magic-studio-v2';
  const env = withViteRuntimeEnv(
    {
      PATH: 'C:\\Windows\\System32',
      LOCALAPPDATA: 'C:\\Users\\admin\\AppData\\Local',
    },
    {
      cwd: workspaceRoot,
      homeDir: 'C:\\Users\\admin',
      platform: 'win32',
      preferWorkspaceLocalCache: true,
      mkdirSync: (target, options) => {
        createdDirectories.push({ target, options });
      },
    },
  );

  assert.equal(
    env.MAGIC_STUDIO_VITE_CACHE_DIR,
    'D:\\javasource\\spring-ai-plus\\spring-ai-plus-business\\apps\\magic-studio-v2\\.cache\\vite-cache',
  );
  assert.deepEqual(createdDirectories, [
    {
      target: 'D:\\javasource\\spring-ai-plus\\spring-ai-plus-business\\apps\\magic-studio-v2\\.cache\\vite-cache',
      options: { recursive: true },
    },
    {
      target: 'D:\\javasource\\spring-ai-plus\\spring-ai-plus-business\\apps\\magic-studio-v2\\.cache\\vite-cache\\.magic-studio-write-check',
      options: { recursive: true },
    },
  ]);
});
