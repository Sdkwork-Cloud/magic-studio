import type {
  MagicStudioHostMode,
} from '@sdkwork/magic-studio-host-types';

import {
  createMagicStudioHostConnection,
  MAGIC_STUDIO_DEFAULT_LOCAL_API_BASE_URL,
  MAGIC_STUDIO_DEFAULT_LOCAL_API_HOST,
  MAGIC_STUDIO_DEFAULT_LOCAL_API_PORT,
  type MagicStudioHostConnection,
} from './descriptor.ts';

export interface MagicStudioHostDiscoveryInput {
  runtimeMode?: MagicStudioHostMode;
  explicitBaseUrl?: string;
  explicitHost?: string;
  explicitPort?: number;
  preferSameOrigin?: boolean;
  locationOrigin?: string;
}

function normalizeOrigin(value?: string): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim().replace(/\/+$/, '');
  return trimmed || null;
}

export function resolveMagicStudioLocalApiBaseUrl(
  input: MagicStudioHostDiscoveryInput = {},
): string {
  const explicitBaseUrl = normalizeOrigin(input.explicitBaseUrl);
  if (explicitBaseUrl) {
    return explicitBaseUrl;
  }

  if (input.runtimeMode === 'server' && input.preferSameOrigin) {
    const sameOrigin = normalizeOrigin(input.locationOrigin);
    if (sameOrigin) {
      return sameOrigin;
    }
  }

  return MAGIC_STUDIO_DEFAULT_LOCAL_API_BASE_URL;
}

export function resolveMagicStudioHostConnection(
  input: MagicStudioHostDiscoveryInput = {},
): MagicStudioHostConnection {
  const kind = input.runtimeMode ?? 'server';
  const apiBaseUrl = resolveMagicStudioLocalApiBaseUrl(input);

  if (apiBaseUrl !== MAGIC_STUDIO_DEFAULT_LOCAL_API_BASE_URL) {
    return createMagicStudioHostConnection(kind, {
      apiBaseUrl,
      host: input.explicitHost?.trim() || MAGIC_STUDIO_DEFAULT_LOCAL_API_HOST,
      port: input.explicitPort ?? MAGIC_STUDIO_DEFAULT_LOCAL_API_PORT,
    });
  }

  return createMagicStudioHostConnection(kind, {
    host: input.explicitHost?.trim() || MAGIC_STUDIO_DEFAULT_LOCAL_API_HOST,
    port: input.explicitPort ?? MAGIC_STUDIO_DEFAULT_LOCAL_API_PORT,
    apiBaseUrl,
  });
}
