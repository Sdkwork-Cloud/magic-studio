import {
  createRuntimeMagicStudioServerClient,
  readDefaultPlatformRuntime,
} from '@sdkwork/magic-studio-core/sdk';

export type AudioServerFeature = 'AudioService';

export const createAudioServerClient = (
  feature: AudioServerFeature = 'AudioService',
) => {
  const runtime = readDefaultPlatformRuntime(feature);
  return createRuntimeMagicStudioServerClient(runtime);
};
