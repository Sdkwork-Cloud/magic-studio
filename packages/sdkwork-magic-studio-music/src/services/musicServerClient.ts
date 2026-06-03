import {
  createRuntimeMagicStudioServerClient,
  readDefaultPlatformRuntime,
} from '@sdkwork/magic-studio-core/platform';

export type MusicServerFeature = 'MusicService';

export const createMusicServerClient = (
  feature: MusicServerFeature = 'MusicService',
) => {
  const runtime = readDefaultPlatformRuntime(feature);
  return createRuntimeMagicStudioServerClient(runtime);
};
