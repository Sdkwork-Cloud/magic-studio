import type { PersistedGenerationOutcomeAsset } from '@sdkwork/magic-studio-assets/services';
import type { GenerationOutcome } from '@sdkwork/magic-studio-types/agi';
import type { CanvasMediaResource } from '@sdkwork/magic-studio-types/canvas';

const toPositiveNumber = (value: unknown): number | undefined => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return undefined;
  }
  return parsed;
};

const resolveCanvasResourceType = (
  outcome: GenerationOutcome,
  fallbackType: CanvasMediaResource['type']
): CanvasMediaResource['type'] => {
  const artifactType = outcome.primaryArtifact.type;
  if (artifactType === 'image' || artifactType === 'video' || artifactType === 'audio') {
    return artifactType;
  }
  return fallbackType;
};

export interface ToCanvasGeneratedResourceInput {
  outcome: GenerationOutcome;
  persisted: PersistedGenerationOutcomeAsset;
  fallbackType: CanvasMediaResource['type'];
}

export const toCanvasGeneratedResource = ({
  outcome,
  persisted,
  fallbackType,
}: ToCanvasGeneratedResourceInput): CanvasMediaResource => ({
  id: persisted.assetId,
  uuid:
    persisted.resourceViewUuid ||
    persisted.primaryResourceUuid ||
    persisted.assetUuid ||
    persisted.assetId,
  assetId: persisted.assetId,
  assetUuid: persisted.assetUuid,
  primaryResourceId: persisted.primaryResourceId,
  primaryResourceUuid: persisted.primaryResourceUuid,
  resourceViewId: persisted.resourceViewId,
  resourceViewUuid: persisted.resourceViewUuid,
  name:
    outcome.primaryArtifact.resource?.name ||
    `${outcome.recipe.product}-${outcome.primaryArtifact.uuid}`,
  type: resolveCanvasResourceType(outcome, fallbackType),
  url: persisted.url,
  path: persisted.path || persisted.url,
  thumbnailUrl: persisted.posterUrl || outcome.delivery.posterUrl || undefined,
  duration: toPositiveNumber(persisted.duration ?? outcome.delivery.duration),
  width: toPositiveNumber(persisted.width ?? outcome.delivery.width),
  height: toPositiveNumber(persisted.height ?? outcome.delivery.height),
  format: persisted.mimeType || outcome.delivery.mimeType,
  metadata: {
    ...(outcome.delivery.metadata || {}),
    assetId: persisted.assetId,
    assetUuid: persisted.assetUuid,
    canonicalPath: persisted.path || persisted.url,
    sourceUrl: persisted.sourceUrl,
    deliveryUrl: persisted.deliveryUrl,
    primaryResourceId: persisted.primaryResourceId,
    primaryResourceUuid: persisted.primaryResourceUuid,
    resourceViewId: persisted.resourceViewId,
    resourceViewUuid: persisted.resourceViewUuid,
    recipeUuid: persisted.recipeUuid,
    executionUuid: persisted.executionUuid,
    artifactSetUuid: persisted.artifactSetUuid,
    artifactUuid: persisted.artifactUuid,
    provider: persisted.provider,
    providerModel: persisted.providerModel,
    prompt: persisted.prompt,
    mode: persisted.mode,
    product: persisted.product,
    scopeDomain: 'canvas',
  },
});
