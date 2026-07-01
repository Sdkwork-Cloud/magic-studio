import {
  createRuntimeMagicStudioServerClient,
  readDefaultPlatformRuntime,
} from '@sdkwork/magic-studio-core/sdk';

export type VoiceServerFeature =
  | 'VoiceService'
  | 'VoiceHistoryService'
  | 'VoiceSpeakerService';

export const createVoiceServerClient = (
  feature: VoiceServerFeature = 'VoiceService'
) => {
  const runtime = readDefaultPlatformRuntime(feature);
  return createRuntimeMagicStudioServerClient(runtime);
};
