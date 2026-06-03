import { persistGenerationOutcomeAsset } from '@sdkwork/magic-studio-assets/services';
import type { GenerationOutcome } from '@sdkwork/magic-studio-types/agi';

import { createGeneratedVideoResult, type GeneratedVideoResult } from '../entities';

export interface PersistVideoGenerationResultInput {
  outcome: GenerationOutcome;
  name: string;
}

export const persistVideoGenerationResult = async ({
  outcome,
  name,
}: PersistVideoGenerationResultInput): Promise<GeneratedVideoResult> => {
  const uploaded = await persistGenerationOutcomeAsset({
    outcome,
    type: 'video',
    domain: 'video-studio',
    name,
  });

  return createGeneratedVideoResult({
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
      path: uploaded.path || uploaded.url,
      duration: uploaded.duration,
      width: uploaded.width,
      height: uploaded.height,
    },
    coverResource: uploaded.posterUrl
      ? {
          id: null,
          url: uploaded.posterUrl,
        }
      : undefined,
    modelId: uploaded.providerModel,
  });
};
