import type { PlatformRuntime } from '../platform/runtime/types.ts';
import {
  buildMagicStudioRootLayout,
  buildMagicStudioUserLayout,
  type MagicStudioRootLayout,
  type MagicStudioRootOverrides,
  type MagicStudioUserLayout,
} from './magicStudioPaths.ts';
import { loadMagicStudioStorageConfigFromStorage } from './magicStudioSettings.ts';

export type RuntimeMagicStudioStorageRuntime = Pick<PlatformRuntime, 'system' | 'storage'>;

export const DEFAULT_LOCAL_MAGIC_STUDIO_USER_ID = 'local-user';

const readRuntimeHomeDir = async (
  runtime: RuntimeMagicStudioStorageRuntime,
): Promise<string> => runtime.system.path('home');

export const loadMagicStudioStorageConfigFromRuntime = async (
  runtime: RuntimeMagicStudioStorageRuntime,
): Promise<MagicStudioRootOverrides> => {
  const homeDir = await readRuntimeHomeDir(runtime);
  return loadMagicStudioStorageConfigFromStorage(
    (key) => runtime.storage.get(key),
    homeDir,
  );
};

export const resolveRuntimeMagicStudioRootLayout = async (
  runtime: RuntimeMagicStudioStorageRuntime,
): Promise<MagicStudioRootLayout> =>
  buildMagicStudioRootLayout(await loadMagicStudioStorageConfigFromRuntime(runtime));

export const resolveRuntimeMagicStudioUserLayout = async (
  runtime: RuntimeMagicStudioStorageRuntime,
  userId: string,
): Promise<MagicStudioUserLayout> => {
  const storageConfig = await loadMagicStudioStorageConfigFromRuntime(runtime);
  return buildMagicStudioUserLayout({
    rootDir: storageConfig.rootDir,
    workspacesRootDir: storageConfig.workspacesRootDir,
    userId,
  });
};

export const resolveRuntimeMagicStudioDefaultUserLayout = async (
  runtime: RuntimeMagicStudioStorageRuntime,
): Promise<MagicStudioUserLayout> =>
  resolveRuntimeMagicStudioUserLayout(runtime, DEFAULT_LOCAL_MAGIC_STUDIO_USER_ID);
