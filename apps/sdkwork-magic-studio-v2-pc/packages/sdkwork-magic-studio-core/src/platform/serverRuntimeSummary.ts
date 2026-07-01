import {
  createMagicStudioServerClient,
  resolveMagicStudioServerHostDescriptor,
  type MagicStudioRuntimeSummary,
} from '@sdkwork/magic-studio-server';

import type { SystemPath } from './types';

function readLocationOrigin(): string | undefined {
  if (typeof window === 'undefined') {
    return undefined;
  }

  return window.location?.origin;
}

let serverRuntimeSummaryPromise: Promise<MagicStudioRuntimeSummary> | null = null;

export const readServerRuntimeSummary = async (): Promise<MagicStudioRuntimeSummary> => {
  if (!serverRuntimeSummaryPromise) {
    const client = createMagicStudioServerClient({
      host: resolveMagicStudioServerHostDescriptor({
        runtimeMode: 'server',
        preferSameOrigin: true,
        locationOrigin: readLocationOrigin(),
      }),
    });

    serverRuntimeSummaryPromise = client.readRuntimeSummary().then((response) => response.data);
  }

  try {
    return await serverRuntimeSummaryPromise;
  } catch (error) {
    serverRuntimeSummaryPromise = null;
    throw error;
  }
};

export const readServerRuntimeSystemPath = async (
  name: SystemPath,
): Promise<string> => (await readServerRuntimeSummary()).systemPaths[name];
