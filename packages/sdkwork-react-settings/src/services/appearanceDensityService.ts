import type { AppSettings, AppearanceDensityMode } from '../entities';

export type AppearanceSettings = AppSettings['appearance'];
export type AppearanceDensityPreset = Exclude<AppearanceDensityMode, 'auto' | 'custom'>;

export interface AppearanceDensityMetrics {
  fontSize: number;
  lineHeight: number;
}

export interface AppearanceDensityRuntimeContext {
  windowWidth?: number;
  devicePixelRatio?: number;
}

export const APPEARANCE_DENSITY_PRESETS: Record<
  AppearanceDensityPreset,
  AppearanceDensityMetrics
> = {
  compact: {
    fontSize: 12,
    lineHeight: 1.4,
  },
  standard: {
    fontSize: 13,
    lineHeight: 1.5,
  },
  comfortable: {
    fontSize: 14,
    lineHeight: 1.6,
  },
};

const PRESET_ENTRIES = Object.entries(APPEARANCE_DENSITY_PRESETS) as Array<
  [AppearanceDensityPreset, AppearanceDensityMetrics]
>;

const DEFAULT_RUNTIME_CONTEXT: Required<AppearanceDensityRuntimeContext> = {
  windowWidth: 1440,
  devicePixelRatio: 1,
};

export const isAppearanceDensityMode = (value: unknown): value is AppearanceDensityMode =>
  typeof value === 'string'
  && ['compact', 'standard', 'comfortable', 'auto', 'custom'].includes(value);

export const getAppearanceDensityRuntimeContext = (
  context: AppearanceDensityRuntimeContext = {},
): Required<AppearanceDensityRuntimeContext> => {
  const windowWidth =
    context.windowWidth
    ?? (typeof window !== 'undefined' ? window.innerWidth : DEFAULT_RUNTIME_CONTEXT.windowWidth);
  const devicePixelRatio =
    context.devicePixelRatio
    ?? (typeof window !== 'undefined' ? window.devicePixelRatio || 1 : DEFAULT_RUNTIME_CONTEXT.devicePixelRatio);

  return {
    windowWidth,
    devicePixelRatio,
  };
};

export const recommendAppearanceDensity = (
  context: AppearanceDensityRuntimeContext = {},
): AppearanceDensityPreset => {
  const runtime = getAppearanceDensityRuntimeContext(context);

  let recommended: AppearanceDensityPreset = 'standard';
  if (runtime.windowWidth <= 1280) {
    recommended = 'compact';
  } else if (runtime.windowWidth > 1720) {
    recommended = 'comfortable';
  }

  if (runtime.devicePixelRatio >= 1.25 && recommended === 'comfortable') {
    return 'standard';
  }

  return recommended;
};

const matchesMetrics = (
  appearance: Pick<AppearanceSettings, 'fontSize' | 'lineHeight'>,
  metrics: AppearanceDensityMetrics,
): boolean => appearance.fontSize === metrics.fontSize && appearance.lineHeight === metrics.lineHeight;

export const inferAppearanceDensityMode = (
  appearance: Pick<AppearanceSettings, 'fontSize' | 'lineHeight'> & {
    densityMode?: AppearanceDensityMode | null | undefined;
  },
): AppearanceDensityMode => {
  if (isAppearanceDensityMode(appearance.densityMode)) {
    return appearance.densityMode;
  }

  const matchedPreset = PRESET_ENTRIES.find(([, metrics]) => matchesMetrics(appearance, metrics));
  return matchedPreset?.[0] ?? 'custom';
};

export const applyAppearanceDensityMode = (
  appearance: AppearanceSettings,
  mode: AppearanceDensityMode,
  context: AppearanceDensityRuntimeContext = {},
): AppearanceSettings => {
  if (mode === 'custom') {
    return {
      ...appearance,
      densityMode: 'custom',
    };
  }

  const preset = mode === 'auto' ? recommendAppearanceDensity(context) : mode;
  const metrics = APPEARANCE_DENSITY_PRESETS[preset];

  return {
    ...appearance,
    fontSize: metrics.fontSize,
    lineHeight: metrics.lineHeight,
    densityMode: mode,
  };
};

export const applyManualAppearanceMetrics = (
  appearance: AppearanceSettings,
  patch: Partial<Pick<AppearanceSettings, 'fontSize' | 'lineHeight'>>,
): AppearanceSettings => ({
  ...appearance,
  ...patch,
  densityMode: 'custom',
});
