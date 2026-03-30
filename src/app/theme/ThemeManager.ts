
import { ThemeMode, AppearanceConfig } from './types';
import { DEFAULT_SETTINGS } from '@sdkwork/react-settings';
import { settingsService } from '@sdkwork/react-settings';

class ThemeManager {
  private mediaQuery: MediaQueryList | null = null;
  private listeners: Set<(isDark: boolean) => void> = new Set();
  
  // Current state
  private _config: AppearanceConfig = DEFAULT_SETTINGS.appearance as AppearanceConfig;
  private _isDark: boolean = true;

  constructor() {
    if (typeof window !== 'undefined') {
      this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      this.mediaQuery.addEventListener('change', this.handleSystemChange);
    }
  }

  public async initialize() {
    try {
      // Load both appearance AND full settings to get editor fonts
      // In a real app we might pass the full settings object here
      const result = await settingsService.getSettings();
      if (result.success && result.data) {
         const fullSettings = result.data;
         this._config = fullSettings.appearance;
         // HACK: Store editor/terminal font for application (SSOT violation but practical for CSS vars)
         this.applyEditorFontVariables(fullSettings.editor);
         this.applyTerminalFontVariables(fullSettings.terminal);
      }
    } catch (e) {
      this._config = DEFAULT_SETTINGS.appearance as AppearanceConfig;
    }

    this.apply();
  }

  /**
   * Universal Sync Method
   * Applies the entire appearance configuration to the system.
   */
  public sync(config: AppearanceConfig) {
    this._config = config;
    this.apply();
    // Re-fetch full settings to update editor/terminal fonts if needed
    settingsService.getSettings().then(res => {
        if (res.success && res.data) {
            this.applyEditorFontVariables(res.data.editor);
            this.applyTerminalFontVariables(res.data.terminal);
        }
    });
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

  private applyEditorFontVariables(editorSettings: any) {
      if (!editorSettings) return;
      const root = document.documentElement;
      root.style.setProperty('--app-code-font-family', editorSettings.fontFamily);
      root.style.setProperty('--app-code-font-size', `${editorSettings.fontSize}px`);
  }

  private applyTerminalFontVariables(terminalSettings: any) {
      if (!terminalSettings) return;
      const root = document.documentElement;
      root.style.setProperty('--app-terminal-font-family', terminalSettings.fontFamily);
      root.style.setProperty('--app-terminal-font-size', `${terminalSettings.fontSize}px`);
      root.style.setProperty('--app-terminal-line-height', terminalSettings.lineHeight.toString());
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
    root.style.setProperty('--app-font-family', this._config.fontFamily);
    root.style.setProperty('--app-font-size', `${this._config.fontSize}px`);
    root.style.setProperty('--app-line-height', this._config.lineHeight.toString());
    
    // 4. Apply Layout Attribute
    root.setAttribute('data-sidebar-position', this._config.sidebarPosition);

    // 5. Notify Listeners (React, Canvas Engines)
    this.listeners.forEach(fn => fn(this._isDark));
  }
}

export const themeManager = new ThemeManager();
