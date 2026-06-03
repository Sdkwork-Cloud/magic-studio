import { persistGenerationOutcomeAsset } from '@sdkwork/magic-studio-assets/services';
import type { GenerationOutcome } from '@sdkwork/magic-studio-types/agi';

import { createGeneratedImageResult, type GeneratedImageResult } from '../entities';

export interface PersistImageGenerationResultInput {
  outcome: GenerationOutcome;
  name: string;
}

export const persistImageGenerationResult = async ({
  outcome,
  name,
}: PersistImageGenerationResultInput): Promise<GeneratedImageResult> => {
  const storedAsset = await persistGenerationOutcomeAsset({
    outcome,
    type: 'image',
    domain: 'image-studio',
    name,
  });

  return createGeneratedImageResult({
    id: storedAsset.artifactId ?? null,
    uuid: storedAsset.artifactUuid,
    assetId: storedAsset.assetId,
    assetUuid: storedAsset.assetUuid,
    primaryResourceId: storedAsset.primaryResourceId,
    primaryResourceUuid: storedAsset.primaryResourceUuid,
    resourceViewId: storedAsset.resourceViewId,
    resourceViewUuid: storedAsset.resourceViewUuid,
    recipeUuid: storedAsset.recipeUuid,
    executionUuid: storedAsset.executionUuid,
    artifactSetUuid: storedAsset.artifactSetUuid,
    artifactUuid: storedAsset.artifactUuid,
    executionId: storedAsset.executionId,
    resource: {
      id: storedAsset.primaryResourceId ?? null,
      uuid:
        storedAsset.resourceViewUuid ||
        storedAsset.primaryResourceUuid ||
        storedAsset.assetUuid ||
        storedAsset.artifactUuid,
      assetId: storedAsset.assetId,
      assetUuid: storedAsset.assetUuid,
      primaryResourceId: storedAsset.primaryResourceId,
      primaryResourceUuid: storedAsset.primaryResourceUuid,
      resourceViewId: storedAsset.resourceViewId,
      resourceViewUuid: storedAsset.resourceViewUuid,
      url: storedAsset.url,
      path: storedAsset.path || storedAsset.url,
      width: storedAsset.width,
      height: storedAsset.height,
      prompt: storedAsset.prompt,
      name,
      mimeType: storedAsset.mimeType,
    },
    coverResource: storedAsset.posterUrl
      ? {
          id: null,
          url: storedAsset.posterUrl,
        }
      : undefined,
    prompt: storedAsset.prompt,
    negativePrompt: storedAsset.negativePrompt,
    width: storedAsset.width,
    height: storedAsset.height,
  });
};
