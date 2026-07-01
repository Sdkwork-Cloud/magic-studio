import {
  createRuntimeMagicStudioServerClient,
  isMagicStudioServerRuntimeSupported,
  readDefaultPlatformRuntime,
} from '@sdkwork/magic-studio-core/sdk';
import type { MagicStudioServerClient } from '@sdkwork/magic-studio-server';

const ASSET_SERVER_CLIENT_FEATURE = 'MagicStudioAssetsServerClient';

let cachedRuntime: ReturnType<typeof readDefaultPlatformRuntime> | undefined;
let cachedServerClient: MagicStudioServerClient | undefined;

export function readAssetServerRuntime(): ReturnType<typeof readDefaultPlatformRuntime> {
  if (!cachedRuntime) {
    const runtime = readDefaultPlatformRuntime(ASSET_SERVER_CLIENT_FEATURE);
    if (!isMagicStudioServerRuntimeSupported(runtime)) {
      throw new Error(
        '[MagicStudioAssetsServerClient] Canonical asset flows require the Magic Studio server runtime.',
      );
    }
    cachedRuntime = runtime;
  }

  return cachedRuntime;
}

export function getAssetServerClient(): MagicStudioServerClient {
  if (!cachedServerClient) {
    cachedServerClient = createRuntimeMagicStudioServerClient(readAssetServerRuntime());
  }

  return cachedServerClient;
}
