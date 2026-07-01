import type { SdkworkAuthOAuthDeviceType } from '@sdkwork/auth-pc-react';
import {
  getPlatformRuntime,
  isBrowserHostedRuntimeKind,
  isDesktopShellRuntimeKind,
  type PlatformRuntimeKind,
} from '@sdkwork/magic-studio-core/platform';

export type AuthDeviceType = Extract<SdkworkAuthOAuthDeviceType, 'desktop' | 'web'>;

function isAuthDeviceType(value: SdkworkAuthOAuthDeviceType | null | undefined): value is AuthDeviceType {
  return value === 'desktop' || value === 'web';
}

export function resolveAuthDeviceTypeForRuntimeKind(
  kind: PlatformRuntimeKind,
): AuthDeviceType {
  if (isDesktopShellRuntimeKind(kind)) {
    return 'desktop';
  }

  if (isBrowserHostedRuntimeKind(kind)) {
    return 'web';
  }

  return 'web';
}

export function resolveAuthDeviceType(): AuthDeviceType {
  try {
    return resolveAuthDeviceTypeForRuntimeKind(getPlatformRuntime().system.kind());
  } catch {
    return 'web';
  }
}

export function normalizeAuthDeviceType(
  deviceType: SdkworkAuthOAuthDeviceType | null | undefined,
): AuthDeviceType {
  return isAuthDeviceType(deviceType) ? deviceType : resolveAuthDeviceType();
}
