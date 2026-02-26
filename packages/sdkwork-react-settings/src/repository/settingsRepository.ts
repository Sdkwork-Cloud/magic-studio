
import { AppSettings } from '../entities/settings.entity'
import { platform } from '@sdkwork/react-core';
;
import { SETTINGS_STORAGE_KEY } from '../constants';

export const settingsRepository = {
  loadSettings: async (): Promise<AppSettings | null> => {
    const data = await platform.getStorage(SETTINGS_STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  },

  saveSettings: async (settings: AppSettings): Promise<void> => {
    await platform.setStorage(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  }
};
