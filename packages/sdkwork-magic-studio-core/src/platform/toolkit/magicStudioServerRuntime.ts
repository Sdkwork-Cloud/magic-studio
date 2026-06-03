import {
  createMagicStudioServerClient,
  resolveMagicStudioServerHostDescriptor,
  type MagicStudioHostDescriptor,
  type MagicStudioServerClient,
} from '@sdkwork/magic-studio-server';
import {
  isBrowserHostedRuntimeKind,
  isDesktopShellRuntimeKind,
} from '../runtime/kinds.ts';
import type { PlatformRuntime } from '../runtime/types.ts';
import { readWindowPlatformRuntime } from '../runtime/windowGlobal.ts';

function readLocationOrigin(): string | undefined {
  if (typeof window === 'undefined') {
    return undefined;
  }

  return window.location?.origin;
}

function toRequestUrl(input: RequestInfo | URL): string {
  if (typeof input === 'string') {
    return input;
  }

  if (input instanceof URL) {
    return input.toString();
  }

  return input.url;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function readDefaultPlatformRuntime(feature: string): PlatformRuntime {
  const runtime = readWindowPlatformRuntime();
  if (runtime) {
    return runtime;
  }

  throw new Error(`[${feature}] platform runtime is not initialized`);
}

export function isMagicStudioServerRuntimeSupported(
  runtime: PlatformRuntime,
): boolean {
  const kind = runtime.system.kind();
  return isDesktopShellRuntimeKind(kind) || isBrowserHostedRuntimeKind(kind);
}

export function resolveRuntimeMagicStudioServerHostDescriptor(
  runtime: PlatformRuntime,
): MagicStudioHostDescriptor {
  const kind = runtime.system.kind();
  return resolveMagicStudioServerHostDescriptor({
    runtimeMode: isDesktopShellRuntimeKind(kind) ? 'desktop' : 'server',
    preferSameOrigin: isBrowserHostedRuntimeKind(kind),
    locationOrigin: readLocationOrigin(),
  });
}

export async function waitForMagicStudioServerReady(
  runtime: PlatformRuntime,
  options: {
    attempts?: number;
    intervalMs?: number;
  } = {},
): Promise<void> {
  const host = resolveRuntimeMagicStudioServerHostDescriptor(runtime);
  const healthUrl = `${host.apiBaseUrl}${host.healthPath}`;
  const attempts = Math.max(1, options.attempts ?? 40);
  const intervalMs = Math.max(50, options.intervalMs ?? 250);
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await runtime.network.request(healthUrl, { method: 'GET' });
      if (response.ok) {
        return;
      }
      lastError = new Error(
        `[MagicStudioServer] health check returned HTTP ${response.status} for ${healthUrl}`,
      );
    } catch (error) {
      lastError = error;
    }

    if (attempt < attempts) {
      await delay(intervalMs);
    }
  }

  const reason =
    lastError instanceof Error ? lastError.message : String(lastError ?? 'unknown error');
  throw new Error(
    `[MagicStudioServer] runtime did not become ready at ${healthUrl} after ${attempts} attempts: ${reason}`,
  );
}

export function createRuntimeMagicStudioServerClient(
  runtime: PlatformRuntime,
  serverClient?: MagicStudioServerClient,
): MagicStudioServerClient {
  if (serverClient) {
    return serverClient;
  }

  const host = resolveRuntimeMagicStudioServerHostDescriptor(runtime);

  return createMagicStudioServerClient({
    host,
    fetch: async (input, init) => runtime.network.request(toRequestUrl(input), init),
  });
}
