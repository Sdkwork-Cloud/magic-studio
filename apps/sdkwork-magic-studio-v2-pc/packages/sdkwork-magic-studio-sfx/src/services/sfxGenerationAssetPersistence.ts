import { persistGenerationOutcomeAsset } from '@sdkwork/magic-studio-assets/services';
import type { GenerationOutcome } from '@sdkwork/magic-studio-types/agi';

import { createGeneratedSfxResult, type GeneratedSfxResult } from '../entities';

export interface PersistSfxGenerationResultInput {
  outcome: GenerationOutcome;
  name: string;
  fallbackDuration?: number;
}

export const persistSfxGenerationResult = async ({
  outcome,
  name,
  fallbackDuration,
}: PersistSfxGenerationResultInput): Promise<GeneratedSfxResult> => {
  const uploaded = await persistGenerationOutcomeAsset({
    outcome,
    type: 'sfx',
    domain: 'audio-studio',
    name,
  });

  const resolvedDuration =
    uploaded.duration ||
    outcome.delivery.duration ||
    fallbackDuration;

  return createGeneratedSfxResult({
    id: uploaded.artifactId || null,
    uuid: uploaded.artifactUuid,
    assetId: uploaded.assetId,
    assetUuid: uploaded.assetUuid,
    primaryResourceId: uploaded.primaryResourceId,
    primaryResourceUuid: uploaded.primaryResourceUuid,
    resourceViewId: uploaded.resourceViewId,
    resourceViewUuid: uploaded.resourceViewUuid,
    recipeUuid: uploaded.recipeUuid,
    executionUuid: uploaded.executionUuid,
    artifactSetUuid: uploaded.artifactSetUuid,
    artifactUuid: uploaded.artifactUuid,
    executionId: uploaded.executionId,
    resource: {
      id: uploaded.primaryResourceId || null,
      uuid:
        uploaded.resourceViewUuid ||
        uploaded.primaryResourceUuid ||
        uploaded.assetUuid ||
        uploaded.artifactUuid,
      assetId: uploaded.assetId,
      assetUuid: uploaded.assetUuid,
      primaryResourceId: uploaded.primaryResourceId,
      primaryResourceUuid: uploaded.primaryResourceUuid,
      resourceViewId: uploaded.resourceViewId,
      resourceViewUuid: uploaded.resourceViewUuid,
      url: uploaded.url,
      duration: resolvedDuration,
      name,
    },
    duration: resolvedDuration,
  });
};
