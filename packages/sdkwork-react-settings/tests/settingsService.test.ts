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

describe('settingsService', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mockPlatform.getOsType.mockResolvedValue('windows');
    mockPlatform.checkCommandExists.mockResolvedValue(true);
  });

  it('deep merges partial material storage settings with MagicStudio defaults', async () => {
    mockLoadSettings.mockResolvedValue({
      terminal: {
        defaultShell: 'default',
      },
      materialStorage: {
        desktop: {
          rootDir: 'D:/Media/MagicStudio',
        },
        sync: {
          enabled: true,
        },
      },
    });

    const { settingsService } = await import('../src/services/settingsService');
    const result = await settingsService.getSettings({ force: true });

    expect(result.success).toBe(true);
    expect(result.data?.terminal.defaultShell).toBe('powershell');
    expect(result.data?.materialStorage.mode).toBe('local-first-sync');
    expect(result.data?.materialStorage.desktop.rootDir).toBe('D:/Media/MagicStudio');
    expect(result.data?.materialStorage.sync.enabled).toBe(true);
    expect(result.data?.materialStorage.sync.autoUploadOnImport).toBe(false);
    expect(result.data?.materialStorage.naming.keepOriginalFilenameInMetadata).toBe(true);
  });

  it('does not eagerly probe shell executables when a concrete shell is already saved', async () => {
    mockLoadSettings.mockResolvedValue({
      terminal: {
        defaultShell: 'pwsh',
      },
    });

    const { settingsService } = await import('../src/services/settingsService');
    const result = await settingsService.getSettings({ force: true });

    expect(result.success).toBe(true);
    expect(result.data?.terminal.defaultShell).toBe('pwsh');
    expect(mockPlatform.getOsType).not.toHaveBeenCalled();
    expect(mockPlatform.checkCommandExists).not.toHaveBeenCalled();
  });
});
