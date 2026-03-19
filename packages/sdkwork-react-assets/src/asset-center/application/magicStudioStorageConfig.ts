import { settingsBusinessService } from '../../../../sdkwork-react-settings/src/services/settingsBusinessService';
import {
  type MagicStudioRootOverrides,
} from '../../../../sdkwork-react-core/src/storage/magicStudioPaths';
import { resolveMagicStudioStorageConfigFromSettings } from '../../../../sdkwork-react-core/src/storage/magicStudioSettings';

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
