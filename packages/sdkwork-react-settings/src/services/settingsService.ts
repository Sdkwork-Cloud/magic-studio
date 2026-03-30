
import { settingsRepository } from '../repository/settingsRepository';
;
import { DEFAULT_SETTINGS } from '../constants';
import { platform } from '@sdkwork/react-core';
import { AppSettings, SidebarItemConfig, ThemeColor } from '../entities';
import { ServiceResult, Result } from '@sdkwork/react-commons';
import { inferAppearanceDensityMode } from './appearanceDensityService';

let settingsCache: AppSettings | null = null;
let settingsLoadPromise: Promise<ServiceResult<AppSettings>> | null = null;

const guessRuntimeOs = (): 'windows' | 'macos' | 'linux' | null => {
  if (typeof navigator === 'undefined') {
    return null;
  }

  const userAgent = `${navigator.userAgent || ''} ${navigator.platform || ''}`.toLowerCase();
  if (userAgent.includes('win')) return 'windows';
  if (userAgent.includes('mac')) return 'macos';
  if (userAgent.includes('linux')) return 'linux';
  return null;
};

const getPlatformDefaultShell = async (): Promise<string> => {
  const guessedOs = guessRuntimeOs();
  const os = guessedOs || await platform.getOsType();
  if (os === 'windows') return 'powershell';
  if (os === 'macos') return 'zsh';
  
  // Linux checks
  if (await platform.checkCommandExists('zsh')) return 'zsh';
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

const VALID_THEME_COLORS: ThemeColor[] = [
  'lobster',
  'tech-blue',
  'green-tech',
  'zinc',
  'violet',
  'rose',
];

const normalizeThemeColor = (themeColor: unknown): ThemeColor =>
  VALID_THEME_COLORS.includes(themeColor as ThemeColor)
    ? (themeColor as ThemeColor)
    : DEFAULT_SETTINGS.appearance.themeColor;

const toErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

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
    const saved = await settingsRepository.loadSettings();
    let shell = saved?.terminal?.defaultShell;
    
    if (!shell || shell === 'default') {
        shell = await getPlatformDefaultShell();
    }

    // Deep merge with platform-validated defaults
    const mergedAppearance = { ...DEFAULT_SETTINGS.appearance, ...saved?.appearance };
    const normalizedAppearance = {
      ...mergedAppearance,
      densityMode: inferAppearanceDensityMode({
        ...mergedAppearance,
        densityMode: saved?.appearance?.densityMode,
      }),
    };

    const settings: AppSettings = {
      ...DEFAULT_SETTINGS,
      ...saved,
      general: { ...DEFAULT_SETTINGS.general, ...saved?.general },
      appearance: {
        ...normalizedAppearance,
        themeColor: normalizeThemeColor(normalizedAppearance.themeColor),
        sidebarConfig: normalizeSidebarConfigOrder(
          normalizedAppearance.sidebarConfig || DEFAULT_SETTINGS.appearance.sidebarConfig
        )
      },
      editor: { ...DEFAULT_SETTINGS.editor, ...saved?.editor },
      terminal: { 
          ...DEFAULT_SETTINGS.terminal, 
          ...saved?.terminal, 
          defaultShell: shell 
      },
      ai: { ...DEFAULT_SETTINGS.ai, ...saved?.ai },
      materialStorage: mergeMaterialStorage(saved),
    };
    
    return Result.success(settings);
  } catch (error: unknown) {
    console.error('Failed to load settings', error);
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
          densityMode: inferAppearanceDensityMode(settings.appearance),
          themeColor: normalizeThemeColor(settings.appearance.themeColor),
          sidebarConfig: normalizeSidebarConfigOrder(settings.appearance.sidebarConfig)
          },
          materialStorage: mergeMaterialStorage(settings)
        };
        await settingsRepository.saveSettings(normalizedSettings);
        settingsCache = normalizedSettings;
        return Result.success(undefined);
    } catch (error: unknown) {
        console.error('Failed to save settings', error);
        return Result.error(toErrorMessage(error));
    }
  }
};
