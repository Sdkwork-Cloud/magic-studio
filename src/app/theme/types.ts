
export type ThemeMode = 'dark' | 'light' | 'system';
export type SidebarPosition = 'left' | 'right';

export interface AppearanceConfig {
  theme: ThemeMode;
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  sidebarPosition: SidebarPosition;
}

export interface ThemeState {
  mode: ThemeMode;
  isDark: boolean;
  config: AppearanceConfig;
  setMode: (mode: ThemeMode) => void;
  sync: (config: AppearanceConfig) => void;
}
