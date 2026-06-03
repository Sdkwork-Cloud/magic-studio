import {
  createRuntimeMagicStudioServerClient,
  isMagicStudioServerRuntimeSupported,
  readDefaultPlatformRuntime,
} from '@sdkwork/magic-studio-core/sdk';
import type { MagicStudioServerClient } from '@sdkwork/magic-studio-server';

const CREATION_SERVER_CLIENT_FEATURE = 'MagicStudioCreationServerClient';

let cachedRuntime: ReturnType<typeof readDefaultPlatformRuntime> | undefined;
let cachedServerClient: MagicStudioServerClient | undefined;

export function readCreationServerRuntime(): ReturnType<typeof readDefaultPlatformRuntime> {
  if (!cachedRuntime) {
    const runtime = readDefaultPlatformRuntime(CREATION_SERVER_CLIENT_FEATURE);
    if (!isMagicStudioServerRuntimeSupported(runtime)) {
      throw new Error(
        '[MagicStudioCreationServerClient] Canonical creation flows require the Magic Studio server runtime.',
      );
    }
    cachedRuntime = runtime;
  }

  return cachedRuntime;
}

export function getCreationServerClient(): MagicStudioServerClient {
  if (!cachedServerClient) {
    cachedServerClient = createRuntimeMagicStudioServerClient(readCreationServerRuntime());
  }

  return cachedServerClient;
}
