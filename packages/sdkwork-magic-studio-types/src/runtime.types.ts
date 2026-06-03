export const SDKWORK_RUNTIME_KINDS = ['web', 'desktop', 'server'] as const;

export type SdkworkRuntimeKind = (typeof SDKWORK_RUNTIME_KINDS)[number];
export type BrowserHostedRuntimeKind = Extract<SdkworkRuntimeKind, 'web' | 'server'>;
export type DesktopShellRuntimeKind = Extract<SdkworkRuntimeKind, 'desktop'>;
export type WindowPlatformRuntimeKind = SdkworkRuntimeKind | string;

export const PUBLIC_APP_PLATFORMS = [
  'web',
  'desktop',
  'server',
  'electron',
  'mobile',
] as const;

export type PublicAppPlatform = (typeof PUBLIC_APP_PLATFORMS)[number];

export const isSdkworkRuntimeKind = (value: string): value is SdkworkRuntimeKind =>
  (SDKWORK_RUNTIME_KINDS as readonly string[]).includes(value);

export const isBrowserHostedRuntimeKind = (
  kind: string,
): kind is BrowserHostedRuntimeKind => kind === 'web' || kind === 'server';

export const isDesktopShellRuntimeKind = (
  kind: string,
): kind is DesktopShellRuntimeKind => kind === 'desktop';

export const isPublicAppPlatform = (value: string): value is PublicAppPlatform =>
  (PUBLIC_APP_PLATFORMS as readonly string[]).includes(value);

export const normalizePublicAppPlatformValue = (
  value?: string,
): PublicAppPlatform | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  return normalized && isPublicAppPlatform(normalized) ? normalized : null;
};
