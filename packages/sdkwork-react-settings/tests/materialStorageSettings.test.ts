import { describe, expect, it } from 'vitest';

import {
  DEFAULT_MAGICSTUDIO_ROOT_DIR,
  DEFAULT_SETTINGS,
  LEGACY_SETTINGS_STORAGE_KEYS,
  SETTINGS_STORAGE_KEY,
} from '../src/constants';

describe('material storage settings', () => {
  it('defaults to MagicStudio local-first desktop storage', () => {
    expect(DEFAULT_SETTINGS.materialStorage.mode).toBe('local-first-sync');
    expect(DEFAULT_SETTINGS.materialStorage.desktop.rootDir).toBe(DEFAULT_MAGICSTUDIO_ROOT_DIR);
    expect(DEFAULT_SETTINGS.materialStorage.desktop.rootDir).toContain('.sdkwork');
    expect(DEFAULT_SETTINGS.materialStorage.desktop.rootDir).toContain('magicstudio');
  });

  it('stores settings under the MagicStudio key and preserves legacy fallback keys', () => {
    expect(SETTINGS_STORAGE_KEY).toBe('magic_studio_settings_v2');
    expect(LEGACY_SETTINGS_STORAGE_KEYS).toContain('open_studio_settings_v1');
  });
});
