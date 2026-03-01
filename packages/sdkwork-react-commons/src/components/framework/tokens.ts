import type { CSSProperties } from 'react';

export interface FrameworkColorTokens {
  surface: string;
  surfaceMuted: string;
  surfaceElevated: string;
  border: string;
  borderStrong: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  primary: string;
  primaryHover: string;
  danger: string;
  dangerHover: string;
}

export interface FrameworkSpacingTokens {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
}

export interface FrameworkRadiusTokens {
  sm: number;
  md: number;
  lg: number;
}

export interface FrameworkMotionTokens {
  fast: string;
  normal: string;
  slow: string;
}

export interface FrameworkTheme {
  colors: FrameworkColorTokens;
  spacing: FrameworkSpacingTokens;
  radius: FrameworkRadiusTokens;
  motion: FrameworkMotionTokens;
}

export const DEFAULT_FRAMEWORK_THEME: FrameworkTheme = {
  colors: {
    surface: '#0b0b0d',
    surfaceMuted: '#121216',
    surfaceElevated: '#18181d',
    border: '#2a2a33',
    borderStrong: '#3a3a45',
    textPrimary: '#f5f5f6',
    textSecondary: '#d5d5db',
    textMuted: '#8a8a97',
    primary: '#3b82f6',
    primaryHover: '#2563eb',
    danger: '#dc2626',
    dangerHover: '#b91c1c'
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24
  },
  radius: {
    sm: 6,
    md: 10,
    lg: 14
  },
  motion: {
    fast: '120ms',
    normal: '180ms',
    slow: '260ms'
  }
};

export const buildFrameworkCssVariables = (
  theme: FrameworkTheme = DEFAULT_FRAMEWORK_THEME
): Record<string, string> => {
  return {
    '--sdk-surface': theme.colors.surface,
    '--sdk-surface-muted': theme.colors.surfaceMuted,
    '--sdk-surface-elevated': theme.colors.surfaceElevated,
    '--sdk-border': theme.colors.border,
    '--sdk-border-strong': theme.colors.borderStrong,
    '--sdk-text-primary': theme.colors.textPrimary,
    '--sdk-text-secondary': theme.colors.textSecondary,
    '--sdk-text-muted': theme.colors.textMuted,
    '--sdk-primary': theme.colors.primary,
    '--sdk-primary-hover': theme.colors.primaryHover,
    '--sdk-danger': theme.colors.danger,
    '--sdk-danger-hover': theme.colors.dangerHover,
    '--sdk-space-xs': `${theme.spacing.xs}px`,
    '--sdk-space-sm': `${theme.spacing.sm}px`,
    '--sdk-space-md': `${theme.spacing.md}px`,
    '--sdk-space-lg': `${theme.spacing.lg}px`,
    '--sdk-space-xl': `${theme.spacing.xl}px`,
    '--sdk-radius-sm': `${theme.radius.sm}px`,
    '--sdk-radius-md': `${theme.radius.md}px`,
    '--sdk-radius-lg': `${theme.radius.lg}px`,
    '--sdk-motion-fast': theme.motion.fast,
    '--sdk-motion-normal': theme.motion.normal,
    '--sdk-motion-slow': theme.motion.slow
  };
};

export const buildFrameworkStyle = (
  theme: FrameworkTheme = DEFAULT_FRAMEWORK_THEME
): CSSProperties => {
  const vars = buildFrameworkCssVariables(theme);
  const style: CSSProperties = {};
  Object.entries(vars).forEach(([key, value]) => {
    (style as Record<string, string>)[key] = value;
  });
  return style;
};

