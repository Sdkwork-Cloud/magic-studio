import {
  resolveDefaultMagicStudioRoot,
  resolveMagicStudioRoot,
  type MagicStudioRootOverrides,
} from './magicStudioPaths';
import { pathUtils } from '@sdkwork/react-commons';

export const MAGICSTUDIO_SETTINGS_STORAGE_KEY = 'magic_studio_settings_v2';
export const LEGACY_MAGICSTUDIO_SETTINGS_STORAGE_KEYS = ['open_studio_settings_v1'] as const;

type StorageReader = (key: string) => Promise<string | null>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const resolveOptionalDesktopPath = (
  value: unknown,
  homeDir: string,
  rootDir: string
): string | undefined => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return undefined;
  }

  const trimmedValue = value.trim();
  const resolvedAbsolutePath = resolveMagicStudioRoot(trimmedValue, homeDir);

  if (
    trimmedValue === '~' ||
    trimmedValue.startsWith('~/') ||
    trimmedValue.startsWith('~\\') ||
    resolvedAbsolutePath !== pathUtils.normalize(trimmedValue)
  ) {
    return resolvedAbsolutePath;
  }

  if (
    trimmedValue.startsWith('/') ||
    trimmedValue.startsWith('\\\\') ||
    /^[a-zA-Z]:[\\/]/.test(trimmedValue)
  ) {
    return resolvedAbsolutePath;
  }

  return pathUtils.join(rootDir, trimmedValue);
};

const pickDesktopStorage = (
  settings: unknown
): Record<string, unknown> | undefined => {
  if (!isRecord(settings)) {
    return undefined;
  }

  const materialStorage = settings.materialStorage;
  if (!isRecord(materialStorage)) {
    return undefined;
  }

  const desktop = materialStorage.desktop;
  if (!isRecord(desktop)) {
    return undefined;
  }

  return desktop;
};

export const resolveMagicStudioStorageConfigFromSettings = (
  settings: unknown,
  homeDir: string
): MagicStudioRootOverrides => {
  const desktop = pickDesktopStorage(settings);
  const resolvedRootDir = resolveMagicStudioRoot(
    typeof desktop?.rootDir === 'string' ? desktop.rootDir : '',
    homeDir
  );

  return {
    rootDir: resolvedRootDir,
    workspacesRootDir: resolveOptionalDesktopPath(
      desktop?.workspacesRootDir,
      homeDir,
      resolvedRootDir
    ),
    cacheRootDir: resolveOptionalDesktopPath(
      desktop?.cacheRootDir,
      homeDir,
      resolvedRootDir
    ),
    exportsRootDir: resolveOptionalDesktopPath(
      desktop?.exportsRootDir,
      homeDir,
      resolvedRootDir
    ),
  };
};

export const loadMagicStudioStorageConfigFromStorage = async (
  getStorage: StorageReader,
  homeDir: string
): Promise<MagicStudioRootOverrides> => {
  const keys = [
    MAGICSTUDIO_SETTINGS_STORAGE_KEY,
    ...LEGACY_MAGICSTUDIO_SETTINGS_STORAGE_KEYS,
  ];

  for (const key of keys) {
    try {
      const raw = await getStorage(key);
      if (!raw) {
        continue;
      }

      return resolveMagicStudioStorageConfigFromSettings(
        JSON.parse(raw),
        homeDir
      );
    } catch {
      // Ignore malformed or inaccessible storage entries and try the next source.
    }
  }

  return {
    rootDir: resolveDefaultMagicStudioRoot(homeDir),
  };
};
