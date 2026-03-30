
export type ThemeMode = 'dark' | 'light' | 'system';
export type SidebarPosition = 'left' | 'right';
export type ThemeColor = 'lobster' | 'tech-blue' | 'green-tech' | 'zinc' | 'violet' | 'rose';
export type AppearanceDensityMode = 'compact' | 'standard' | 'comfortable' | 'auto' | 'custom';

export interface AppearanceConfig {
  theme: ThemeMode;
  themeColor: ThemeColor;
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  densityMode: AppearanceDensityMode;
  sidebarPosition: SidebarPosition;
}

export interface ThemeState {
  mode: ThemeMode;
  isDark: boolean;
  config: AppearanceConfig;
  setMode: (mode: ThemeMode) => void;
  sync: (
    config: AppearanceConfig,
    assets?: {
      editor?: {
        fontFamily?: string;
        fontSize?: number;
      };
      terminal?: {
        fontFamily?: string;
        fontSize?: number;
        lineHeight?: number;
      };
    }
  ) => void;
}
