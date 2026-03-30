import { ThemeMode } from '@sdkwork/react-commons'
import type { AppearanceDensityMode } from '../entities';

export type SettingType = 'select' | 'toggle' | 'input' | 'slider';

export interface SettingOption {
  labelKey?: string; // i18n key for label (e.g. 'settings.appearance.theme.options.dark')
  label?: string; // Fallback raw string
  value: string | number | boolean;
}

export type Validator<T> = (value: T) => string | null;

export interface SettingDefinition<T = any> {
  key: string; 
  labelKey: string;
  descriptionKey?: string;
  
  type: SettingType;
  category: 'general' | 'appearance' | 'editor' | 'ai' | 'browser';
  sectionKey: string; 
  tags?: string[];
  
  // Type-specific props
  options?: SettingOption[];
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  placeholder?: string;
  inputType?: 'text' | 'password' | 'number';
  
  // Logic
  validator?: (value: T) => string | null;
}

const DENSITY_MODE_OPTIONS: Array<{ label: string; value: AppearanceDensityMode }> = [
  { label: 'Compact', value: 'compact' },
  { label: 'Standard', value: 'standard' },
  { label: 'Comfortable', value: 'comfortable' },
  { label: 'Auto', value: 'auto' },
  { label: 'Custom', value: 'custom' },
];

// --- Validators ---
const isRange = (min: number, max: number): Validator<number> => (val) => (val >= min && val <= max) ? null : `Value must be between ${min} and ${max}`;

// --- Font Stacks ---
const FONT_UI_MODERN = "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif";
const FONT_UI_SYSTEM = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif";
const FONT_MONO_JETBRAINS = "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Menlo, Monaco, Consolas, 'Courier New', monospace";
const FONT_MONO_FIRA = "'Fira Code', 'Cascadia Code', 'JetBrains Mono', Menlo, Monaco, Consolas, 'Courier New', monospace";
const FONT_MONO_SYSTEM = "Menlo, Monaco, Consolas, 'Courier New', monospace";

export const SETTING_DEFINITIONS: SettingDefinition[] = [
  // --- GENERAL ---
  {
    key: 'general.appMode',
    labelKey: 'App Mode',
    descriptionKey: 'Choose your primary workspace environment.',
    type: 'select',
    category: 'general',
    sectionKey: 'settings.sections.application',
    options: [
      { label: 'Content Creator', value: 'creator' },
      { label: 'App Developer', value: 'developer' }
    ]
  },
  {
    key: 'general.language',
    labelKey: 'settings.general.language.label',
    descriptionKey: 'settings.general.language.desc',
    type: 'select',
    category: 'general',
    sectionKey: 'settings.sections.application',
    tags: ['locale', 'i18n'],
    options: [
      { labelKey: 'settings.general.language.options.system', value: 'system' },
      { labelKey: 'settings.general.language.options.enUS', value: 'en' },
      { labelKey: 'settings.general.language.options.zhCN', value: 'zh-CN' },
      // { label: 'Japanese', value: 'ja' },
    ]
  },
  {
    key: 'general.checkUpdates',
    labelKey: 'settings.general.checkUpdates.label',
    descriptionKey: 'settings.general.checkUpdates.desc',
    type: 'toggle',
    category: 'general',
    sectionKey: 'settings.sections.application',
    tags: ['version', 'upgrade']
  },
  {
    key: 'general.telemetry',
    labelKey: 'settings.general.telemetry.label',
    descriptionKey: 'settings.general.telemetry.desc',
    type: 'toggle',
    category: 'general',
    sectionKey: 'settings.sections.privacy',
    tags: ['tracking', 'analytics', 'data']
  },
  {
    key: 'general.developerMode',
    labelKey: 'settings.general.developerMode.label',
    descriptionKey: 'settings.general.developerMode.desc',
    type: 'toggle',
    category: 'general',
    sectionKey: 'settings.sections.application',
    tags: ['debug', 'inspect', 'source']
  },

  // --- APPEARANCE ---
  {
    key: 'appearance.theme',
    labelKey: 'settings.appearance.theme.label',
    descriptionKey: 'settings.appearance.theme.desc',
    type: 'select',
    category: 'appearance',
    sectionKey: 'settings.sections.window',
    tags: ['dark mode', 'light mode', 'skin'],
    options: [
      { labelKey: 'settings.appearance.theme.options.dark', value: ThemeMode.DARK },
      { labelKey: 'settings.appearance.theme.options.light', value: ThemeMode.LIGHT },
      { labelKey: 'settings.appearance.theme.options.system', value: ThemeMode.SYSTEM },
    ]
  },
  {
    key: 'appearance.themeColor',
    labelKey: 'Theme Color',
    descriptionKey: 'Choose the shared shell accent used across the application.',
    type: 'select',
    category: 'appearance',
    sectionKey: 'settings.sections.window',
    tags: ['accent', 'primary', 'shell'],
    options: [
      { label: 'Lobster Red', value: 'lobster' },
      { label: 'Tech Blue', value: 'tech-blue' },
      { label: 'Green Tech', value: 'green-tech' },
      { label: 'Zinc', value: 'zinc' },
      { label: 'Violet', value: 'violet' },
      { label: 'Rose', value: 'rose' },
    ]
  },
  {
    key: 'appearance.sidebarPosition',
    labelKey: 'settings.appearance.sidebarPosition.label',
    descriptionKey: 'settings.appearance.sidebarPosition.desc',
    type: 'select',
    category: 'appearance',
    sectionKey: 'settings.sections.window',
    options: [
      { labelKey: 'settings.appearance.sidebarPosition.options.left', value: 'left' },
      { labelKey: 'settings.appearance.sidebarPosition.options.right', value: 'right' },
    ]
  },
  {
    key: 'appearance.densityMode',
    labelKey: 'Interface Density',
    descriptionKey: 'Stable shell density presets with one-shot Auto recommendation.',
    type: 'select',
    category: 'appearance',
    sectionKey: 'settings.sections.typography',
    tags: ['density', 'compact', 'comfortable', 'auto'],
    options: DENSITY_MODE_OPTIONS,
  },
  {
    key: 'appearance.fontFamily',
    labelKey: 'settings.appearance.fontFamily.label',
    descriptionKey: 'settings.appearance.fontFamily.desc',
    type: 'select',
    category: 'appearance',
    sectionKey: 'settings.sections.typography',
    options: [
        { label: 'Modern (Inter)', value: FONT_UI_MODERN },
        { label: 'System Default', value: FONT_UI_SYSTEM },
        { label: 'macOS (San Francisco)', value: "-apple-system, BlinkMacSystemFont, 'PingFang SC', sans-serif" },
        { label: 'Windows (Segoe UI)', value: "'Segoe UI', 'Microsoft YaHei', sans-serif" },
    ]
  },
  {
    key: 'appearance.fontSize',
    labelKey: 'settings.appearance.fontSize.label',
    descriptionKey: 'settings.appearance.fontSize.desc',
    type: 'slider',
    category: 'appearance',
    sectionKey: 'settings.sections.typography',
    min: 11, max: 18, unit: 'px',
    validator: isRange(11, 18)
  },
  {
    key: 'appearance.lineHeight',
    labelKey: 'settings.appearance.lineHeight.label',
    descriptionKey: 'settings.appearance.lineHeight.desc',
    type: 'slider',
    category: 'appearance',
    sectionKey: 'settings.sections.typography',
    min: 1.2, max: 2.0, step: 0.1,
    validator: isRange(1.2, 2.0)
  },

  // --- EDITOR ---
  {
    key: 'editor.fontFamily',
    labelKey: 'settings.editor.fontFamily.label',
    descriptionKey: 'settings.editor.fontFamily.desc',
    type: 'select',
    category: 'editor',
    sectionKey: 'settings.sections.typography',
    tags: ['code', 'text', 'font'],
    options: [
        { label: 'JetBrains Mono', value: FONT_MONO_JETBRAINS },
        { label: 'Fira Code', value: FONT_MONO_FIRA },
        { label: 'System Monospace', value: FONT_MONO_SYSTEM },
    ]
  },
  {
    key: 'editor.fontSize',
    labelKey: 'settings.editor.fontSize.label',
    descriptionKey: 'settings.editor.fontSize.desc',
    type: 'slider',
    category: 'editor',
    sectionKey: 'settings.sections.typography',
    min: 10, max: 32, unit: 'px',
    validator: isRange(10, 72)
  },
  {
    key: 'editor.lineHeight',
    labelKey: 'settings.editor.lineHeight.label',
    descriptionKey: 'settings.editor.lineHeight.desc',
    type: 'slider',
    category: 'editor',
    sectionKey: 'settings.sections.typography',
    min: 1.0, max: 2.5, step: 0.1,
    validator: isRange(1.0, 3.0)
  },
  {
    key: 'editor.fontLigatures',
    labelKey: 'settings.editor.fontLigatures.label',
    descriptionKey: 'settings.editor.fontLigatures.desc',
    type: 'toggle',
    category: 'editor',
    sectionKey: 'settings.sections.typography',
    tags: ['arrows', 'symbols']
  },
  {
    key: 'editor.minimap',
    labelKey: 'settings.editor.minimap.label',
    descriptionKey: 'settings.editor.minimap.desc',
    type: 'toggle',
    category: 'editor',
    sectionKey: 'settings.sections.visual',
    tags: ['preview', 'scroll']
  },
  {
    key: 'editor.showLineNumbers',
    labelKey: 'settings.editor.showLineNumbers.label',
    descriptionKey: 'settings.editor.showLineNumbers.desc',
    type: 'toggle',
    category: 'editor',
    sectionKey: 'settings.sections.visual'
  },
  {
    key: 'editor.wordWrap',
    labelKey: 'settings.editor.wordWrap.label',
    descriptionKey: 'settings.editor.wordWrap.desc',
    type: 'select',
    category: 'editor',
    sectionKey: 'settings.sections.formatting',
    options: [
      { labelKey: 'settings.editor.wordWrap.options.off', value: 'off' },
      { labelKey: 'settings.editor.wordWrap.options.on', value: 'on' },
      { labelKey: 'settings.editor.wordWrap.options.wordWrapColumn', value: 'wordWrapColumn' },
    ]
  },
  {
    key: 'editor.tabSize',
    labelKey: 'settings.editor.tabSize.label',
    descriptionKey: 'settings.editor.tabSize.desc',
    type: 'slider',
    category: 'editor',
    sectionKey: 'settings.sections.formatting',
    min: 2, max: 8,
    validator: isRange(2, 8)
  },
  {
    key: 'editor.formatOnSave',
    labelKey: 'settings.editor.formatOnSave.label',
    descriptionKey: 'settings.editor.formatOnSave.desc',
    type: 'toggle',
    category: 'editor',
    sectionKey: 'settings.sections.formatting',
    tags: ['prettier', 'lint']
  },

  // --- BROWSER ---
  {
    key: 'browser.downloadPath',
    labelKey: 'settings.browser.downloadPath.label',
    descriptionKey: 'settings.browser.downloadPath.desc',
    type: 'input',
    category: 'general',
    sectionKey: 'settings.sections.application',
    placeholder: '/Downloads'
  },
  {
    key: 'browser.autoImportToAssets',
    labelKey: 'settings.browser.autoImport.label',
    descriptionKey: 'settings.browser.autoImport.desc',
    type: 'toggle',
    category: 'general',
    sectionKey: 'settings.sections.application'
  },

  // --- AI (Basic) ---
  {
    key: 'ai.contextLimit',
    labelKey: 'settings.ai.contextLimit.label',
    descriptionKey: 'settings.ai.contextLimit.desc',
    type: 'slider',
    category: 'ai',
    sectionKey: 'settings.sections.parameters',
    min: 1024, max: 128000, step: 1024,
    validator: isRange(100, 200000)
  },
  {
    key: 'ai.temperature',
    labelKey: 'settings.ai.temperature.label',
    descriptionKey: 'settings.ai.temperature.desc',
    type: 'slider',
    category: 'ai',
    sectionKey: 'settings.sections.parameters',
    min: 0, max: 1, step: 0.1,
    validator: isRange(0, 2)
  }
];
