import {
  isBrowserHostedRuntimeKind as isCanonicalBrowserHostedRuntimeKind,
  isDesktopShellRuntimeKind as isCanonicalDesktopShellRuntimeKind,
  type WindowPlatformRuntimeKind,
} from '@sdkwork/magic-studio-types/runtime';

type RuntimeWindow = Window & {
  __sdkworkPlatformRuntime?: unknown;
};

export type { WindowPlatformRuntimeKind } from '@sdkwork/magic-studio-types/runtime';

interface WindowPlatformRuntimeBridge {
  system?: {
    kind?: () => WindowPlatformRuntimeKind;
  };
}

export const readWindowPlatformRuntime = <T extends object>(): T | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const runtime = (window as RuntimeWindow).__sdkworkPlatformRuntime;
  if (!runtime || typeof runtime !== 'object') {
    return null;
  }

  return runtime as T;
};

export const readWindowPlatformRuntimeKind = (): WindowPlatformRuntimeKind => {
  const runtime = readWindowPlatformRuntime<WindowPlatformRuntimeBridge>();
  return runtime?.system?.kind?.() ?? 'web';
};

export const isBrowserHostedWindowPlatformRuntimeKind = (
  kind: WindowPlatformRuntimeKind,
): kind is 'web' | 'server' => isCanonicalBrowserHostedRuntimeKind(kind);

export const isBrowserHostedWindowPlatformRuntime = (): boolean =>
  isBrowserHostedWindowPlatformRuntimeKind(readWindowPlatformRuntimeKind());

export const isDesktopWindowPlatformRuntimeKind = (
  kind: WindowPlatformRuntimeKind,
): kind is 'desktop' => isCanonicalDesktopShellRuntimeKind(kind);

export const isDesktopWindowPlatformRuntime = (): boolean =>
  isDesktopWindowPlatformRuntimeKind(readWindowPlatformRuntimeKind());
