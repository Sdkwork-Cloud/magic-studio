
import { ThemeMode, AppearanceConfig } from './types';
import { DEFAULT_SETTINGS } from '@sdkwork/react-settings';
import { settingsService } from '@sdkwork/react-settings';

interface EditorFontSettings {
  fontFamily?: string;
  fontSize?: number;
}

interface TerminalFontSettings {
  fontFamily?: string;
  fontSize?: number;
  lineHeight?: number;
}

interface AppearanceSnapshot {
  appearance: AppearanceConfig;
  editor?: EditorFontSettings;
  terminal?: TerminalFontSettings;
}

export const APPEARANCE_SNAPSHOT_STORAGE_KEY = 'magic_studio_appearance_snapshot_v1';
export const TAURI_APPEARANCE_SNAPSHOT_WINDOW_KEY = '__MAGIC_STUDIO_TAURI_APPEARANCE_SNAPSHOT__';

type ThemeSnapshotWindow = Window & {
  [TAURI_APPEARANCE_SNAPSHOT_WINDOW_KEY]?: AppearanceSnapshot;
};

const readAppearanceSnapshot = (): AppearanceSnapshot | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const injectedSnapshot = (window as ThemeSnapshotWindow)[TAURI_APPEARANCE_SNAPSHOT_WINDOW_KEY];
  if (injectedSnapshot?.appearance) {
    return injectedSnapshot;
  }

  if (!window.localStorage) {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(APPEARANCE_SNAPSHOT_STORAGE_KEY);
    if (!rawValue) {
      return null;
    }

    const parsed = JSON.parse(rawValue) as AppearanceSnapshot | null;
    if (!parsed || typeof parsed !== 'object' || !parsed.appearance) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
};

const persistAppearanceSnapshot = (snapshot: AppearanceSnapshot): void => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }

  try {
    window.localStorage.setItem(APPEARANCE_SNAPSHOT_STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // Ignore quota/storage access failures and keep runtime styling intact.
  }
};

class ThemeManager {
  private mediaQuery: MediaQueryList | null = null;
  private listeners: Set<(isDark: boolean) => void> = new Set();
  
  // Current state
  private _config: AppearanceConfig = DEFAULT_SETTINGS.appearance as AppearanceConfig;
  private _isDark: boolean = true;
  private _editorSettings?: EditorFontSettings;
  private _terminalSettings?: TerminalFontSettings;
  private _isPrimed = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      this.mediaQuery.addEventListener('change', this.handleSystemChange);
    }
  }

  public prime() {
    if (this._isPrimed) {
      this.apply();
      return;
    }

    const snapshot = readAppearanceSnapshot();
    if (snapshot?.appearance) {
      this._config = {
        ...this._config,
        ...snapshot.appearance,
      };
      this._editorSettings = snapshot.editor;
      this._terminalSettings = snapshot.terminal;
      this.applyEditorFontVariables(snapshot.editor);
      this.applyTerminalFontVariables(snapshot.terminal);
    }

    this._isPrimed = true;
    this.apply();
  }

  public async initialize() {
    this.prime();

    try {
      // Load both appearance AND full settings to get editor fonts
      // In a real app we might pass the full settings object here
      const result = await settingsService.getSettings();
      if (result.success && result.data) {
         const fullSettings = result.data;
         this._config = fullSettings.appearance;
         this._editorSettings = fullSettings.editor;
         this._terminalSettings = fullSettings.terminal;
         // HACK: Store editor/terminal font for application (SSOT violation but practical for CSS vars)
         this.applyEditorFontVariables(fullSettings.editor);
         this.applyTerminalFontVariables(fullSettings.terminal);
      }
    } catch {
      // Keep the primed/default configuration already applied so startup never flashes back.
    }

    this.apply();
  }

  /**
   * Universal Sync Method
   * Applies the entire appearance configuration to the system.
   */
  public sync(
    config: AppearanceConfig,
    assets?: {
      editor?: EditorFontSettings;
      terminal?: TerminalFontSettings;
    }
  ) {
    this._config = config;
    if (assets?.editor) {
      this._editorSettings = assets.editor;
      this.applyEditorFontVariables(assets.editor);
    }
    if (assets?.terminal) {
      this._terminalSettings = assets.terminal;
      this.applyTerminalFontVariables(assets.terminal);
    }
    this.apply();
    if (!assets?.editor || !assets?.terminal) {
      settingsService.getSettings().then(res => {
          if (res.success && res.data) {
              this._editorSettings = res.data.editor;
              this._terminalSettings = res.data.terminal;
              this.applyEditorFontVariables(res.data.editor);
              this.applyTerminalFontVariables(res.data.terminal);
              this.apply();
          }
      });
    }
  }

  public setMode(mode: ThemeMode) {
    this._config.theme = mode;
    this.apply();
  }

  public get isDark(): boolean {
    return this._isDark;
  }

  public get mode(): ThemeMode {
    return this._config.theme;
  }

  public get config(): AppearanceConfig {
    return this._config;
  }

  public subscribe(listener: (isDark: boolean) => void) {
    this.listeners.add(listener);
    listener(this._isDark);
    return () => this.listeners.delete(listener);
  }

  private handleSystemChange = (_e: MediaQueryListEvent) => {
    if (this._config.theme === 'system') {
      this.apply();
    }
  };

  private applyEditorFontVariables(editorSettings?: EditorFontSettings) {
      if (!editorSettings) return;
      const root = document.documentElement;
      if (editorSettings.fontFamily) {
        root.style.setProperty('--app-code-font-family', editorSettings.fontFamily);
      }
      if (typeof editorSettings.fontSize === 'number') {
        root.style.setProperty('--app-code-font-size', `${editorSettings.fontSize}px`);
      }
  }

  private applyTerminalFontVariables(terminalSettings?: TerminalFontSettings) {
      if (!terminalSettings) return;
      const root = document.documentElement;
      if (terminalSettings.fontFamily) {
        root.style.setProperty('--app-terminal-font-family', terminalSettings.fontFamily);
      }
      if (typeof terminalSettings.fontSize === 'number') {
        root.style.setProperty('--app-terminal-font-size', `${terminalSettings.fontSize}px`);
      }
      if (typeof terminalSettings.lineHeight === 'number') {
        root.style.setProperty('--app-terminal-line-height', terminalSettings.lineHeight.toString());
      }
  }

  private snapshot() {
    persistAppearanceSnapshot({
      appearance: this._config,
      editor: this._editorSettings,
      terminal: this._terminalSettings,
    });
  }

  private apply() {
    const root = document.documentElement;

    // 1. Calculate Dark Mode
    if (this._config.theme === 'system') {
      this._isDark = this.mediaQuery ? this.mediaQuery.matches : true;
    } else {
      this._isDark = this._config.theme === 'dark';
    }

    // 2. Apply Theme Class (Tailwind)
    if (this._isDark) {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }

    // 3. Apply Typography Standards (CSS Variables)
    // This adheres to the Open/Closed principle: styles are driven by variables.
    root.setAttribute('data-theme', this._config.themeColor);
    root.setAttribute('data-density', this._config.densityMode);
    root.style.setProperty('--app-font-family', this._config.fontFamily);
    root.style.setProperty('--app-font-size', `${this._config.fontSize}px`);
    root.style.setProperty('--app-line-height', this._config.lineHeight.toString());
    
    // 4. Apply Layout Attribute
    root.setAttribute('data-sidebar-position', this._config.sidebarPosition);

    this.snapshot();

    // 5. Notify Listeners (React, Canvas Engines)
    this.listeners.forEach(fn => fn(this._isDark));
  }
}

export const themeManager = new ThemeManager();
