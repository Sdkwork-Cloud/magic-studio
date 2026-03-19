import { buildMagicStudioUserLayout } from '../../../sdkwork-react-core/src/storage/magicStudioPaths';
import { loadMagicStudioStorageConfigFromStorage } from '../../../sdkwork-react-core/src/storage/magicStudioSettings';

export const DEFAULT_LOCAL_CHAT_USER_ID = 'local-user';

export const resolveMagicStudioChatDirectory = async (
  homeDir: string,
  getStorage: (key: string) => Promise<string | null>,
  userId = DEFAULT_LOCAL_CHAT_USER_ID
): Promise<string> => {
  const storageConfig = await loadMagicStudioStorageConfigFromStorage(
    getStorage,
    homeDir
  );
  const userLayout = buildMagicStudioUserLayout({
    rootDir: storageConfig.rootDir,
    workspacesRootDir: storageConfig.workspacesRootDir,
    userId,
  });

  return userLayout.chatsDir;
};
