
import { AppSettings } from '../entities'
import { getPlatformRuntime } from '@sdkwork/magic-studio-core/platform';
import { LEGACY_SETTINGS_STORAGE_KEYS, SETTINGS_STORAGE_KEY } from '../constants';

const SETTINGS_STORAGE_KEYS = [SETTINGS_STORAGE_KEY, ...LEGACY_SETTINGS_STORAGE_KEYS];

export const settingsRepository = {
  loadSettings: async (): Promise<AppSettings | null> => {
    const runtime = getPlatformRuntime();
    for (const key of SETTINGS_STORAGE_KEYS) {
      const data = await runtime.storage.get(key);
      if (data) {
        return JSON.parse(data);
      }
    }

    return null;
  },

  saveSettings: async (settings: AppSettings): Promise<void> => {
    const runtime = getPlatformRuntime();
    await runtime.storage.set(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    await Promise.all(
      LEGACY_SETTINGS_STORAGE_KEYS.map((legacyKey) => runtime.storage.remove(legacyKey))
    );
  }
};
