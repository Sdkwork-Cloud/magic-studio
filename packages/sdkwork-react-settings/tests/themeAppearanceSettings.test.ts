import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockLoadSettings = vi.fn();
const mockSaveSettings = vi.fn();
const mockPlatform = {
  getOsType: vi.fn(),
  checkCommandExists: vi.fn(),
};

vi.mock('../src/repository/settingsRepository', () => ({
  settingsRepository: {
    loadSettings: mockLoadSettings,
    saveSettings: mockSaveSettings,
  },
}));

vi.mock('@sdkwork/react-core', () => ({
  platform: mockPlatform,
}));

describe('theme appearance settings', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mockPlatform.getOsType.mockResolvedValue('windows');
    mockPlatform.checkCommandExists.mockResolvedValue(true);
  });

  it('injects the aligned default theme color when legacy settings omit it', async () => {
    mockLoadSettings.mockResolvedValue({
      appearance: {
        theme: 'dark',
        fontFamily: 'Inter',
        fontSize: 13,
        lineHeight: 1.5,
        sidebarPosition: 'left',
      },
      terminal: {
        defaultShell: 'default',
      },
    });

    const { settingsService } = await import('../src/services/settingsService');
    const result = await settingsService.getSettings({ force: true });

    expect(result.success).toBe(true);
    expect(result.data?.appearance.themeColor).toBe('lobster');
    expect(result.data?.appearance.densityMode).toBe('standard');
  });

  it('preserves the selected theme color when persisting settings', async () => {
    const { DEFAULT_SETTINGS } = await import('../src/constants');
    const { settingsService } = await import('../src/services/settingsService');

    await settingsService.updateSettings({
      ...DEFAULT_SETTINGS,
      appearance: {
        ...DEFAULT_SETTINGS.appearance,
        themeColor: 'zinc',
        densityMode: 'custom',
        fontSize: 15,
      },
    });

    expect(mockSaveSettings).toHaveBeenCalledTimes(1);
    expect(mockSaveSettings.mock.calls[0][0].appearance.themeColor).toBe('zinc');
    expect(mockSaveSettings.mock.calls[0][0].appearance.densityMode).toBe('custom');
  });
});
