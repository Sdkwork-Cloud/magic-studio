import {
  DEFAULT_LOCAL_MAGIC_STUDIO_USER_ID,
  resolveRuntimeMagicStudioUserLayout,
  type RuntimeMagicStudioStorageRuntime,
} from '@sdkwork/magic-studio-core/storage';

export const resolveRuntimeMagicStudioChatDirectory = async (
  runtime: RuntimeMagicStudioStorageRuntime,
  userId: string = DEFAULT_LOCAL_MAGIC_STUDIO_USER_ID,
): Promise<string> => {
  const userLayout = await resolveRuntimeMagicStudioUserLayout(runtime, userId);
  return userLayout.chatsDir;
};
