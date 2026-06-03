import {
  resolveMagicStudioStorageConfigFromSettings,
  type MagicStudioRootOverrides,
} from '@sdkwork/magic-studio-core/storage';
import { settingsBusinessService } from '@sdkwork/magic-studio-settings/services';

export interface ResolvedMagicStudioStorageConfig extends MagicStudioRootOverrides {
  rootDir: string;
}

export const loadResolvedMagicStudioStorageConfig = async (
  homeDir: string
): Promise<ResolvedMagicStudioStorageConfig> => {
  try {
    const result = await settingsBusinessService.getSettings();
    return resolveMagicStudioStorageConfigFromSettings(
      result.success ? result.data : undefined,
      homeDir
    );
  } catch {
    return resolveMagicStudioStorageConfigFromSettings(undefined, homeDir);
  }
};
