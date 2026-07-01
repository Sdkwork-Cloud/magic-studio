
import { settingsRepository } from '../repository/settingsRepository';
import { DEFAULT_SETTINGS } from '../constants';
import { getPlatformRuntime } from '@sdkwork/magic-studio-core/platform';
import type { AppSettings, SidebarItemConfig, StorageConfig, StorageProviderType } from '../entities';
import { Result, type ServiceResult } from '@sdkwork/magic-studio-types/service';

let settingsCache: AppSettings | null = null;
let settingsLoadPromise: Promise<ServiceResult<AppSettings>> | null = null;

const STORAGE_PROVIDER_TYPES = new Set<StorageProviderType>([
  'aws',
  'aliyun',
  'tencent',
  'volcengine',
  'google',
  'azure',
  'cloudflare',
  'minio',
  'custom',
]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const readOptionalText = (value: unknown): string | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
};

const normalizeStorageProviderType = (value: unknown): StorageProviderType =>
  STORAGE_PROVIDER_TYPES.has(value as StorageProviderType)
    ? (value as StorageProviderType)
    : 'custom';

const normalizeStorageConfig = (key: string, value: unknown): StorageConfig | null => {
  if (!isRecord(value)) {
    return null;
  }

  const id = readOptionalText(value.id) || key;
  const name = readOptionalText(value.name) || id;

  return {
    id,
    name,
    provider: normalizeStorageProviderType(value.provider),
    enabled: value.enabled !== false,
    isDefault: value.isDefault === true,
    accessKeyId: readOptionalText(value.accessKeyId),
    secretAccessKey: readOptionalText(value.secretAccessKey),
    bucket: readOptionalText(value.bucket),
    region: readOptionalText(value.region),
    endpoint: readOptionalText(value.endpoint),
    forcePathStyle: value.forcePathStyle === true,
    pathPrefix: readOptionalText(value.pathPrefix),
    publicDomain: readOptionalText(value.publicDomain),
  };
};

const normalizeStorageSettings = (storage: unknown): Record<string, StorageConfig> => {
  if (!isRecord(storage)) {
    return {};
  }

  const normalizedEntries = Object.entries(storage)
    .map(([key, value]) => normalizeStorageConfig(key, value))
    .filter((config): config is StorageConfig => config !== null);

  return Object.fromEntries(normalizedEntries.map((config) => [config.id, config]));
};

const getPlatformDefaultShell = async (): Promise<string> => {
  const runtime = getPlatformRuntime();
  const os = await runtime.system.os();
  if (os === 'windows') return 'powershell';
  if (os === 'macos') return 'zsh';
  
  // Linux checks
  if (await runtime.system.commandExists('zsh')) return 'zsh';
  return 'bash';
};

const normalizeSidebarConfigOrder = (sidebarConfig?: SidebarItemConfig[]): SidebarItemConfig[] | undefined => {
  if (!sidebarConfig || sidebarConfig.length === 0) {
    return sidebarConfig;
  }

  const normalized = [...sidebarConfig];
  const assetsIndex = normalized.findIndex((item) => item.id === 'assets');
  const driveIndex = normalized.findIndex((item) => item.id === 'drive');

  if (assetsIndex < 0 || driveIndex < 0 || driveIndex === assetsIndex + 1) {
    return normalized;
  }

  const [driveItem] = normalized.splice(driveIndex, 1);
  const targetAssetsIndex = normalized.findIndex((item) => item.id === 'assets');
  if (targetAssetsIndex < 0) {
    normalized.push(driveItem);
    return normalized;
  }

  normalized.splice(targetAssetsIndex + 1, 0, driveItem);
  return normalized;
};

const mergeMaterialStorage = (saved: AppSettings | null) => ({
  ...DEFAULT_SETTINGS.materialStorage,
  ...saved?.materialStorage,
  desktop: {
    ...DEFAULT_SETTINGS.materialStorage.desktop,
    ...saved?.materialStorage?.desktop,
  },
  sync: {
    ...DEFAULT_SETTINGS.materialStorage.sync,
    ...saved?.materialStorage?.sync,
  },
  naming: {
    ...DEFAULT_SETTINGS.materialStorage.naming,
    ...saved?.materialStorage?.naming,
  },
});

const loadSettingsInternal = async (): Promise<ServiceResult<AppSettings>> => {
  try {
    const runtime = getPlatformRuntime();
    const saved = await settingsRepository.loadSettings();
    const platformDefaultShell = await getPlatformDefaultShell();

    // Resolve Shell: 'default' means auto-detect, otherwise use saved or fallback
    let shell = saved?.terminal?.defaultShell;
    
    if (!shell || shell === 'default') {
        shell = platformDefaultShell;
    } else {
        // Verify saved shell still exists (e.g. if user uninstalled fish)
        const exists = await runtime.system.commandExists(shell);
        if (!exists) shell = platformDefaultShell;
    }

    // Deep merge with platform-validated defaults
    const mergedAppearance = { ...DEFAULT_SETTINGS.appearance, ...saved?.appearance };
    const settings: AppSettings = {
      ...DEFAULT_SETTINGS,
      ...saved,
      general: { ...DEFAULT_SETTINGS.general, ...saved?.general },
      appearance: {
        ...mergedAppearance,
        sidebarConfig: normalizeSidebarConfigOrder(
          mergedAppearance.sidebarConfig || DEFAULT_SETTINGS.appearance.sidebarConfig
        )
      },
      editor: { ...DEFAULT_SETTINGS.editor, ...saved?.editor },
      terminal: { 
          ...DEFAULT_SETTINGS.terminal, 
          ...saved?.terminal, 
          defaultShell: shell 
      },
      ai: { ...DEFAULT_SETTINGS.ai, ...saved?.ai },
      storage: normalizeStorageSettings(saved?.storage),
      materialStorage: mergeMaterialStorage(saved),
    };
    
    return Result.success(settings);
  } catch (e: any) {
    console.error('Failed to load settings', e);
    // Fallback safe defaults on error, but return error metadata if needed
    return Result.success(DEFAULT_SETTINGS); 
  }
};

export const settingsService = {
  getSettings: async (options?: { force?: boolean }): Promise<ServiceResult<AppSettings>> => {
    const force = options?.force ?? false;
    if (!force && settingsCache) {
      return Result.success(settingsCache);
    }

    if (!force && settingsLoadPromise) {
      return settingsLoadPromise;
    }

    settingsLoadPromise = loadSettingsInternal()
      .then((result) => {
        if (result.success && result.data) {
          settingsCache = result.data;
        }
        return result;
      })
      .finally(() => {
        settingsLoadPromise = null;
      });

    return settingsLoadPromise;
  },

  updateSettings: async (settings: AppSettings): Promise<ServiceResult<void>> => {
    try {
        const normalizedSettings: AppSettings = {
          ...settings,
          appearance: {
            ...settings.appearance,
            sidebarConfig: normalizeSidebarConfigOrder(settings.appearance.sidebarConfig)
          },
          storage: normalizeStorageSettings(settings.storage),
          materialStorage: mergeMaterialStorage(settings)
        };
        await settingsRepository.saveSettings(normalizedSettings);
        settingsCache = normalizedSettings;
        return Result.success(undefined);
    } catch (e: any) {
        console.error('Failed to save settings', e);
        return Result.error(e.message);
    }
  }
};
