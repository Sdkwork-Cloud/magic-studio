import { describe, expect, it } from 'vitest';

import {
  DEFAULT_LOCAL_MAGIC_STUDIO_USER_ID,
  loadMagicStudioStorageConfigFromRuntime,
  resolveRuntimeMagicStudioDefaultUserLayout,
  resolveRuntimeMagicStudioRootLayout,
  resolveRuntimeMagicStudioUserLayout,
  type RuntimeMagicStudioStorageRuntime,
} from '../runtimeMagicStudioStorage';

const createRuntime = (
  settingsValue: string | null,
): RuntimeMagicStudioStorageRuntime => ({
  system: {
    kind: () => 'server',
    os: async () => 'unknown',
    deviceId: async () => 'test-device',
    metadata: async () => ({ name: 'Magic Studio Test', version: '0.0.0' }),
    path: async (name) => {
      if (name === 'home') {
        return '/Users/demo';
      }
      return '/Users/demo';
    },
    theme: async () => 'light',
    isOnline: async () => true,
    commandExists: async () => false,
  },
  storage: {
    get: async () => settingsValue,
    set: async () => {},
    remove: async () => {},
    clear: async () => {},
    getJson: async <T>(_key: string, fallbackValue: T) => fallbackValue,
    setJson: async <T>(_key: string, _value: T) => {},
  },
});

describe('runtimeMagicStudioStorage', () => {
  it('falls back to the runtime home directory when no storage override exists', async () => {
    const runtime = createRuntime(null);

    await expect(loadMagicStudioStorageConfigFromRuntime(runtime)).resolves.toEqual({
      rootDir: '/Users/demo/.sdkwork/magicstudio',
    });

    await expect(resolveRuntimeMagicStudioRootLayout(runtime)).resolves.toMatchObject({
      rootDir: '/Users/demo/.sdkwork/magicstudio',
      systemLibraryRoot: '/Users/demo/.sdkwork/magicstudio/system/library',
    });
  });

  it('resolves canonical user layout from persisted storage overrides', async () => {
    const runtime = createRuntime(
      JSON.stringify({
        materialStorage: {
          desktop: {
            rootDir: '/Volumes/StudioRoot',
            workspacesRootDir: '/Volumes/StudioWorkspaces',
          },
        },
      }),
    );

    await expect(resolveRuntimeMagicStudioUserLayout(runtime, 'user-42')).resolves.toMatchObject({
      userRoot: '/Volumes/StudioRoot/users/user-42',
      chatsDir: '/Volumes/StudioRoot/users/user-42/chats',
      workspacesRoot: '/Volumes/StudioWorkspaces',
    });
  });

  it('exposes a canonical default local user layout for local-only runtime storage features', async () => {
    const runtime = createRuntime(null);

    expect(DEFAULT_LOCAL_MAGIC_STUDIO_USER_ID).toBe('local-user');

    await expect(resolveRuntimeMagicStudioDefaultUserLayout(runtime)).resolves.toMatchObject({
      userRoot: '/Users/demo/.sdkwork/magicstudio/users/local-user',
      templatesDir: '/Users/demo/.sdkwork/magicstudio/users/local-user/templates',
      chatsDir: '/Users/demo/.sdkwork/magicstudio/users/local-user/chats',
    });
  });
});
