import type { PlatformRuntime } from './types';

type PlatformRuntimeWindow = {
  __sdkworkPlatformRuntime?: PlatformRuntime | null;
};

export const readWindowPlatformRuntime = (): PlatformRuntime | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  return (window as unknown as PlatformRuntimeWindow).__sdkworkPlatformRuntime ?? null;
};

export const writeWindowPlatformRuntime = (runtime: PlatformRuntime | null): void => {
  if (typeof window === 'undefined') {
    return;
  }

  const targetWindow = window as unknown as PlatformRuntimeWindow;
  if (runtime) {
    targetWindow.__sdkworkPlatformRuntime = runtime;
    return;
  }

  delete targetWindow.__sdkworkPlatformRuntime;
};
