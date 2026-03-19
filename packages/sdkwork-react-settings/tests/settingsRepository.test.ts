import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockPlatform = {
  getStorage: vi.fn(),
  setStorage: vi.fn(),
  removeStorage: vi.fn(),
};

vi.mock('@sdkwork/react-core', () => ({
  platform: mockPlatform,
}));

describe('settingsRepository', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('falls back to legacy settings keys when the MagicStudio key is empty', async () => {
    mockPlatform.getStorage.mockImplementation(async (key: string) => {
      if (key === 'magic_studio_settings_v2') {
        return null;
      }

      if (key === 'open_studio_settings_v1') {
        return JSON.stringify({
          general: {
            language: 'zh-CN',
          },
        });
      }

      return null;
    });

    const { settingsRepository } = await import('../src/repository/settingsRepository');
    const settings = await settingsRepository.loadSettings();

    expect(mockPlatform.getStorage).toHaveBeenNthCalledWith(1, 'magic_studio_settings_v2');
    expect(mockPlatform.getStorage).toHaveBeenNthCalledWith(2, 'open_studio_settings_v1');
    expect(settings).toEqual({
      general: {
        language: 'zh-CN',
      },
    });
  });

  it('writes settings to the MagicStudio key and clears legacy keys', async () => {
    const { settingsRepository } = await import('../src/repository/settingsRepository');
    const settings = {
      general: {
        language: 'en',
      },
    } as any;

    await settingsRepository.saveSettings(settings);

    expect(mockPlatform.setStorage).toHaveBeenCalledWith(
      'magic_studio_settings_v2',
      JSON.stringify(settings)
    );
    expect(mockPlatform.removeStorage).toHaveBeenCalledWith('open_studio_settings_v1');
  });
});
