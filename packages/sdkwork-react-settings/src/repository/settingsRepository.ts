
import { AppSettings } from '../entities'
import { platform } from '@sdkwork/react-core';
;
import { LEGACY_SETTINGS_STORAGE_KEYS, SETTINGS_STORAGE_KEY } from '../constants';

const SETTINGS_STORAGE_KEYS = [SETTINGS_STORAGE_KEY, ...LEGACY_SETTINGS_STORAGE_KEYS];

export const settingsRepository = {
  loadSettings: async (): Promise<AppSettings | null> => {
    for (const key of SETTINGS_STORAGE_KEYS) {
      const data = await platform.getStorage(key);
      if (data) {
        return JSON.parse(data);
      }
    }

    return null;
  },

  saveSettings: async (settings: AppSettings): Promise<void> => {
    await platform.setStorage(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    await Promise.all(
      LEGACY_SETTINGS_STORAGE_KEYS.map((legacyKey) => platform.removeStorage(legacyKey))
    );
  }
};
