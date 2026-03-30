import React from 'react';
import { Wand2 } from 'lucide-react';
import { useTranslation } from '@sdkwork/react-i18n';
import { DEFAULT_SETTINGS } from '../constants';
import { useSettingsStore } from '../store/settingsStore';
import { SettingsSection, SettingSelect, SettingSlider } from './SettingsWidgets';
import {
  APPEARANCE_DENSITY_PRESETS,
  applyAppearanceDensityMode,
  applyManualAppearanceMetrics,
  recommendAppearanceDensity,
} from '../services/appearanceDensityService';
import { ThemeMode } from '../entities';
import type { AppearanceDensityMode } from '../entities';

const AppearanceSettings: React.FC = () => {
  const { settings, updateSettings } = useSettingsStore();
  const { t } = useTranslation();
  const { appearance } = settings;
  const suggestedDensity = recommendAppearanceDensity();
  const suggestedMetrics = APPEARANCE_DENSITY_PRESETS[suggestedDensity];

  const pushAppearance = (nextAppearance: typeof appearance) => {
    void updateSettings({
      ...settings,
      appearance: nextAppearance,
    });
  };

  const handleDensityChange = (nextMode: string) => {
    pushAppearance(
      applyAppearanceDensityMode(appearance, nextMode as AppearanceDensityMode),
    );
  };

  const handleCustomFontSizeChange = (fontSize: number) => {
    pushAppearance(
      applyManualAppearanceMetrics(appearance, {
        fontSize,
      }),
    );
  };

  const handleCustomLineHeightChange = (lineHeight: number) => {
    pushAppearance(
      applyManualAppearanceMetrics(appearance, {
        lineHeight,
      }),
    );
  };

  const densityLabel = (() => {
    if (appearance.densityMode === 'custom') {
      return t('settings.appearance.densityMode.options.custom', 'Custom');
    }
    if (appearance.densityMode === 'auto') {
      return `${t('settings.appearance.densityMode.options.auto', 'Auto')} · ${t(
        `settings.appearance.densityMode.options.${suggestedDensity}`,
        suggestedDensity[0].toUpperCase() + suggestedDensity.slice(1),
      )}`;
    }
    return t(
      `settings.appearance.densityMode.options.${appearance.densityMode}`,
      appearance.densityMode[0].toUpperCase() + appearance.densityMode.slice(1),
    );
  })();

  return (
    <div className="space-y-10">
      <SettingsSection title={t('settings.sections.window')}>
        <SettingSelect
          label={t('settings.appearance.theme.label')}
          description={t('settings.appearance.theme.desc')}
          value={appearance.theme}
          options={[
            { label: t('settings.appearance.theme.options.dark'), value: ThemeMode.DARK },
            { label: t('settings.appearance.theme.options.light'), value: ThemeMode.LIGHT },
            { label: t('settings.appearance.theme.options.system'), value: ThemeMode.SYSTEM },
          ]}
          isModified={appearance.theme !== DEFAULT_SETTINGS.appearance.theme}
          onReset={() =>
            pushAppearance({
              ...appearance,
              theme: DEFAULT_SETTINGS.appearance.theme,
            })
          }
          onChange={(value) =>
            pushAppearance({
              ...appearance,
              theme: value as ThemeMode,
            })
          }
        />

        <SettingSelect
          label={t('Theme Color')}
          description={t(
            'Choose the shared shell accent used across the application.',
          )}
          value={appearance.themeColor}
          options={[
            { label: t('Lobster Red'), value: 'lobster' },
            { label: t('Tech Blue'), value: 'tech-blue' },
            { label: t('Green Tech'), value: 'green-tech' },
            { label: t('Zinc'), value: 'zinc' },
            { label: t('Violet'), value: 'violet' },
            { label: t('Rose'), value: 'rose' },
          ]}
          isModified={appearance.themeColor !== DEFAULT_SETTINGS.appearance.themeColor}
          onReset={() =>
            pushAppearance({
              ...appearance,
              themeColor: DEFAULT_SETTINGS.appearance.themeColor,
            })
          }
          onChange={(value) =>
            pushAppearance({
              ...appearance,
              themeColor: value as typeof appearance.themeColor,
            })
          }
        />

        <SettingSelect
          label={t('settings.appearance.sidebarPosition.label')}
          description={t('settings.appearance.sidebarPosition.desc')}
          value={appearance.sidebarPosition}
          options={[
            { label: t('settings.appearance.sidebarPosition.options.left'), value: 'left' },
            { label: t('settings.appearance.sidebarPosition.options.right'), value: 'right' },
          ]}
          isModified={appearance.sidebarPosition !== DEFAULT_SETTINGS.appearance.sidebarPosition}
          onReset={() =>
            pushAppearance({
              ...appearance,
              sidebarPosition: DEFAULT_SETTINGS.appearance.sidebarPosition,
            })
          }
          onChange={(value) =>
            pushAppearance({
              ...appearance,
              sidebarPosition: value as typeof appearance.sidebarPosition,
            })
          }
        />
      </SettingsSection>

      <SettingsSection title={t('settings.sections.typography')}>
        <div className="app-floating-panel rounded-[1.5rem] border border-primary-500/15 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--theme-primary-500)_10%,var(--bg-panel-strong))_0%,var(--bg-panel-strong)_55%,color-mix(in_srgb,var(--bg-panel-subtle)_78%,transparent)_100%)] p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-primary-500">
                <Wand2 size={14} />
                {t('settings.appearance.densityMode.label', 'Interface Density')}
              </div>
              <div className="text-sm font-semibold text-[var(--text-primary)]">{densityLabel}</div>
              <p className="max-w-2xl text-xs leading-relaxed text-[var(--text-muted)]">
                {t(
                  'settings.appearance.densityMode.desc',
                  'Keep the shell stable with product-level density presets. Auto recommends a preset from window width and display scale, but only when you ask for it.',
                )}
              </p>
              <div className="text-[11px] text-[var(--text-muted)]">
                {t(
                  'settings.appearance.densityMode.recommendation',
                  'Suggested for this window:',
                )}{' '}
                <span className="font-semibold text-[var(--text-secondary)]">
                  {t(
                    `settings.appearance.densityMode.options.${suggestedDensity}`,
                    suggestedDensity[0].toUpperCase() + suggestedDensity.slice(1),
                  )}
                </span>{' '}
                <span className="text-[var(--text-muted)]">
                  ({suggestedMetrics.fontSize}px / {suggestedMetrics.lineHeight})
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleDensityChange('auto')}
              className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl border border-primary-500/25 bg-[color-mix(in_srgb,var(--theme-primary-500)_10%,var(--bg-panel-strong))] px-4 text-xs font-semibold text-primary-500 transition-colors hover:border-primary-500/40 hover:bg-[color-mix(in_srgb,var(--theme-primary-500)_16%,var(--bg-panel-strong))]"
            >
              {t('settings.appearance.densityMode.actions.rerecommend', 'Re-recommend')}
            </button>
          </div>
        </div>

        <SettingSelect
          label={t('settings.appearance.densityMode.label', 'Interface Density')}
          description={t(
            'settings.appearance.densityMode.selectDesc',
            'Presets keep font size and line height aligned. Manual changes switch the shell to Custom.',
          )}
          value={appearance.densityMode}
          options={[
            { label: t('settings.appearance.densityMode.options.compact', 'Compact'), value: 'compact' },
            { label: t('settings.appearance.densityMode.options.standard', 'Standard'), value: 'standard' },
            { label: t('settings.appearance.densityMode.options.comfortable', 'Comfortable'), value: 'comfortable' },
            { label: t('settings.appearance.densityMode.options.auto', 'Auto'), value: 'auto' },
            { label: t('settings.appearance.densityMode.options.custom', 'Custom'), value: 'custom' },
          ]}
          isModified={appearance.densityMode !== DEFAULT_SETTINGS.appearance.densityMode}
          onReset={() =>
            pushAppearance(
              applyAppearanceDensityMode(
                appearance,
                DEFAULT_SETTINGS.appearance.densityMode,
              ),
            )
          }
          onChange={(value) =>
            handleDensityChange(value === 'custom' ? 'standard' : value)
          }
        />

        <SettingSelect
          label={t('settings.appearance.fontFamily.label')}
          description={t('settings.appearance.fontFamily.desc')}
          value={appearance.fontFamily}
          options={[
            {
              label: t('Modern (Inter)'),
              value:
                "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif",
            },
            {
              label: t('System Default'),
              value:
                "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif",
            },
            {
              label: t('macOS (San Francisco)'),
              value: "-apple-system, BlinkMacSystemFont, 'PingFang SC', sans-serif",
            },
            {
              label: t('Windows (Segoe UI)'),
              value: "'Segoe UI', 'Microsoft YaHei', sans-serif",
            },
          ]}
          isModified={appearance.fontFamily !== DEFAULT_SETTINGS.appearance.fontFamily}
          onReset={() =>
            pushAppearance({
              ...appearance,
              fontFamily: DEFAULT_SETTINGS.appearance.fontFamily,
            })
          }
          onChange={(value) =>
            pushAppearance({
              ...appearance,
              fontFamily: value,
            })
          }
        />

        <SettingSlider
          label={t('settings.appearance.fontSize.label')}
          description={t(
            'settings.appearance.fontSize.desc',
            'Advanced override for shell typography. Manual edits switch the density state to Custom.',
          )}
          value={appearance.fontSize}
          min={11}
          max={18}
          unit="px"
          isModified={appearance.fontSize !== DEFAULT_SETTINGS.appearance.fontSize}
          onReset={() =>
            pushAppearance(
              applyAppearanceDensityMode(
                appearance,
                DEFAULT_SETTINGS.appearance.densityMode,
              ),
            )
          }
          onChange={handleCustomFontSizeChange}
        />

        <SettingSlider
          label={t('settings.appearance.lineHeight.label')}
          description={t(
            'settings.appearance.lineHeight.desc',
            'Advanced override for shell reading rhythm. Manual edits switch the density state to Custom.',
          )}
          value={appearance.lineHeight}
          min={1.2}
          max={2}
          step={0.1}
          isModified={appearance.lineHeight !== DEFAULT_SETTINGS.appearance.lineHeight}
          onReset={() =>
            pushAppearance(
              applyAppearanceDensityMode(
                appearance,
                DEFAULT_SETTINGS.appearance.densityMode,
              ),
            )
          }
          onChange={handleCustomLineHeightChange}
        />
      </SettingsSection>
    </div>
  );
};

export default AppearanceSettings;
