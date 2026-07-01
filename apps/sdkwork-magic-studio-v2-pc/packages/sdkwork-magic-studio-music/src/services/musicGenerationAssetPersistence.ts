import { persistGenerationOutcomeAsset } from '@sdkwork/magic-studio-assets/services';
import type { GenerationOutcome } from '@sdkwork/magic-studio-types/agi';

import { createGeneratedMusicResult, type GeneratedMusicResult } from '../entities';

export interface PersistMusicGenerationResultInput {
  outcome: GenerationOutcome;
  name: string;
  title: string;
  lyrics?: string;
  style?: string;
  fallbackDuration?: number;
}

export const persistMusicGenerationResult = async ({
  outcome,
  name,
  title,
  lyrics,
  style,
  fallbackDuration,
}: PersistMusicGenerationResultInput): Promise<GeneratedMusicResult> => {
  const uploaded = await persistGenerationOutcomeAsset({
    outcome,
    type: 'music',
    domain: 'music',
    name,
  });

  const resolvedDuration =
    uploaded.duration ||
    outcome.delivery.duration ||
    fallbackDuration ||
    0;

  return createGeneratedMusicResult({
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
      duration: resolvedDuration,
      name,
    },
    coverResource: uploaded.posterUrl ? {
      id: null,
      url: uploaded.posterUrl,
    } : undefined,
    title,
    duration: resolvedDuration,
    lyrics,
    style,
  });
};
