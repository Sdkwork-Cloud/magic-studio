import {
  createRuntimeMagicStudioServerClient,
  readDefaultPlatformRuntime,
} from '@sdkwork/magic-studio-core/sdk';

export type SfxServerFeature = 'SfxService';

export const createSfxServerClient = (
  feature: SfxServerFeature = 'SfxService',
) => {
  const runtime = readDefaultPlatformRuntime(feature);
  return createRuntimeMagicStudioServerClient(runtime);
};
