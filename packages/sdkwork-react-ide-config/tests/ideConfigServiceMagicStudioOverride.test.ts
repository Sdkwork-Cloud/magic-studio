import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockGetOsType = vi.fn(async () => 'macos');
const mockGetPath = vi.fn(async (name: string) => {
  if (name === 'home') {
    return '/Users/demo';
  }
  if (name === 'appData') {
    return '/Users/demo/Library/Application Support';
  }
  return '/Users/demo';
});
const mockGetStorage = vi.fn(async () => null);
const mockLoadMagicStudioStorageConfigFromStorage = vi.fn(async () => ({
  rootDir: '/Volumes/StudioRoot',
}));

vi.mock('@sdkwork/react-core', () => ({
  platform: {
    getOsType: mockGetOsType,
    getPath: mockGetPath,
    getStorage: mockGetStorage,
  },
  loadMagicStudioStorageConfigFromStorage:
    mockLoadMagicStudioStorageConfigFromStorage,
}));

describe('ideConfigService MagicStudio override resolution', () => {
  beforeEach(() => {
    mockGetOsType.mockClear();
    mockGetPath.mockClear();
    mockGetStorage.mockClear();
    mockLoadMagicStudioStorageConfigFromStorage.mockClear();
    mockGetOsType.mockResolvedValue('macos');
    mockLoadMagicStudioStorageConfigFromStorage.mockResolvedValue({
      rootDir: '/Volumes/StudioRoot',
    });
  });

  it('resolves managed integration paths from the configured MagicStudio root', async () => {
    const { ideConfigService } = await import('../src/services/ideConfigService');

    const installPath = await ideConfigService.getInstallPath('skill-manager');
    const configPath = await ideConfigService.getConfigPath(
      'plugin-manager',
      'global'
    );

    expect(installPath).toBe('/Volumes/StudioRoot/system/integrations/skills');
    expect(configPath).toBe(
      '/Volumes/StudioRoot/system/integrations/plugins/registry.json'
    );
    expect(mockLoadMagicStudioStorageConfigFromStorage).toHaveBeenCalledWith(
      expect.any(Function),
      '/Users/demo'
    );
  });

  it('falls back to the default MagicStudio root when no override is stored', async () => {
    mockLoadMagicStudioStorageConfigFromStorage.mockResolvedValue({
      rootDir: '/Users/demo/.sdkwork/magicstudio',
    });

    const { ideConfigService } = await import('../src/services/ideConfigService');

    const configPath = await ideConfigService.getConfigPath(
      'mcp-manager',
      'global'
    );

    expect(configPath).toBe(
      '/Users/demo/.sdkwork/magicstudio/system/integrations/mcp/settings.json'
    );
  });
});
