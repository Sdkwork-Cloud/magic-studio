
import { settingsRepository } from '../repository/settingsRepository';
import { AppSettings } from '../entities/settings.entity';
import { DEFAULT_SETTINGS } from '../constants';
import { platform } from '../../../platform';
import { ServiceResult, Result } from '../../../types/core';

const getPlatformDefaultShell = async (): Promise<string> => {
  const os = await platform.getOsType();
  if (os === 'windows') return 'powershell';
  if (os === 'macos') return 'zsh';
  
  // Linux checks
  if (await platform.checkCommandExists('zsh')) return 'zsh';
  return 'bash';
};

export const settingsService = {
  getSettings: async (): Promise<ServiceResult<AppSettings>> => {
    try {
      const saved = await settingsRepository.loadSettings();
      const platformDefaultShell = await getPlatformDefaultShell();

      // Resolve Shell: 'default' means auto-detect, otherwise use saved or fallback
      let shell = saved?.terminal?.defaultShell;
      
      if (!shell || shell === 'default') {
          shell = platformDefaultShell;
      } else {
          // Verify saved shell still exists (e.g. if user uninstalled fish)
          const exists = await platform.checkCommandExists(shell);
          if (!exists) shell = platformDefaultShell;
      }

      // Deep merge with platform-validated defaults
      const settings: AppSettings = {
        ...DEFAULT_SETTINGS,
        ...saved,
        general: { ...DEFAULT_SETTINGS.general, ...saved?.general },
        appearance: { ...DEFAULT_SETTINGS.appearance, ...saved?.appearance },
        editor: { ...DEFAULT_SETTINGS.editor, ...saved?.editor },
        terminal: { 
            ...DEFAULT_SETTINGS.terminal, 
            ...saved?.terminal, 
            defaultShell: shell 
        },
        ai: { ...DEFAULT_SETTINGS.ai, ...saved?.ai }
      };
      
      return Result.success(settings);
    } catch (e: any) {
      console.error('Failed to load settings', e);
      // Fallback safe defaults on error, but return error metadata if needed
      return Result.success(DEFAULT_SETTINGS); 
    }
  },

  updateSettings: async (settings: AppSettings): Promise<ServiceResult<void>> => {
    try {
        await settingsRepository.saveSettings(settings);
        return Result.success(undefined);
    } catch (e: any) {
        console.error('Failed to save settings', e);
        return Result.error(e.message);
    }
  }
};
