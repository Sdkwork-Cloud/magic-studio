import { persistGenerationOutcomeAsset } from '@sdkwork/magic-studio-assets/services';
import type { GenerationOutcome } from '@sdkwork/magic-studio-types/agi';

import type { GeneratedVoiceResult } from '../entities';
import { toGeneratedVoiceResult } from './generatedVoiceResult';

export interface PersistVoiceGenerationResultInput {
  outcome: GenerationOutcome;
  name: string;
  speakerId?: string;
  avatarUrl?: string;
}

export const persistVoiceGenerationResult = async ({
  outcome,
  name,
  speakerId,
  avatarUrl,
}: PersistVoiceGenerationResultInput): Promise<GeneratedVoiceResult> => {
  const persisted = await persistGenerationOutcomeAsset({
    outcome,
    type: 'voice',
    domain: 'voice-speaker',
    name,
  });

  return toGeneratedVoiceResult({
    outcome,
    persisted,
    speakerId,
    avatarUrl,
  });
};
