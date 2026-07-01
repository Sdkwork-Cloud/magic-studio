import {
  inlineDataService,
  resolveGenerationOutcomePrimaryUrl,
} from '@sdkwork/magic-studio-core/services';
import {
  isCanonicalMagicStudioAssetReference as isStableOutcomeReference,
  isRenderableAssetUrl as isRenderableOutcomeUrl,
} from '@sdkwork/magic-studio-core/storage';
import type {
  AgiGenerationMode,
  AgiGenerationProduct,
  GenerationOutcome,
} from '@sdkwork/magic-studio-types/agi';
import type { AssetBusinessDomain } from '@sdkwork/magic-studio-types/asset-center';
import type { AssetType } from '@sdkwork/magic-studio-types/assets';

import {
  importAssetBySdk,
  importAssetFromUrlBySdk,
  resolveAssetPrimaryUrlBySdk,
} from './assetSdkQueryService';

export interface PersistGenerationOutcomeAssetInput {
  outcome: GenerationOutcome;
  type: AssetType;
  domain: AssetBusinessDomain;
  name: string;
}

export interface PersistedGenerationOutcomeAsset {
  assetId: string;
  assetUuid: string | null;
  path: string;
  url: string;
  sourceUrl: string;
  deliveryUrl: string;
  posterUrl?: string;
  mimeType?: string;
  duration?: number;
  width?: number;
  height?: number;
  product: AgiGenerationProduct;
  mode: AgiGenerationMode;
  provider: string;
  providerModel: string;
  prompt?: string;
  negativePrompt?: string;
  parameters: Record<string, unknown>;
  recipeId: string | null;
  recipeUuid: string;
  executionId: string | null;
  executionUuid: string;
  artifactSetId: string | null;
  artifactSetUuid: string;
  artifactId: string | null;
  artifactUuid: string;
  primaryResourceId: string | null;
  primaryResourceUuid: string | null;
  resourceViewId: string | null;
  resourceViewUuid: string | null;
}

const normalizeValue = (value: string | null | undefined): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const pickFirst = (...values: Array<string | null | undefined>): string | null => {
  for (const value of values) {
    const normalized = normalizeValue(value);
    if (normalized) {
      return normalized;
    }
  }

  return null;
};

const resolveGenerationOutcomePrimaryReference = (
  outcome: GenerationOutcome
): string => {
  const primaryArtifact = outcome.primaryArtifact as typeof outcome.primaryArtifact & {
    resource?: {
      path?: string | null;
      url?: string | null;
    } | null;
  };
  const delivery = outcome.delivery as typeof outcome.delivery & {
    path?: string | null;
  };

  return pickFirst(
    primaryArtifact.resource?.path,
    delivery.path,
    primaryArtifact.resource?.url,
    delivery.url
  ) || '';
};

const resolvePersistedOutcomeReference = (
  uploadedPath: string | null | undefined,
  resolvedUrl: string | null | undefined,
  sourceReference: string,
  sourceUrl: string
): string =>
  pickFirst(
    isStableOutcomeReference(uploadedPath) ? uploadedPath : null,
    resolvedUrl,
    uploadedPath,
    sourceReference,
    sourceUrl
  ) || '';

const resolvePersistedOutcomeUrl = (
  uploadedPath: string | null | undefined,
  resolvedUrl: string | null | undefined,
  sourceUrl: string
): string =>
  pickFirst(
    resolvedUrl,
    isRenderableOutcomeUrl(uploadedPath) ? uploadedPath : null,
    sourceUrl
  ) || '';

const buildPersistedGenerationOutcomeAsset = (
  outcome: GenerationOutcome,
  assetId: string,
  assetUuid: string | null,
  path: string,
  url: string,
  sourceUrl: string
): PersistedGenerationOutcomeAsset => {
  const delivery = outcome.delivery as typeof outcome.delivery & {
    assetUuid?: string | null;
    primaryResourceUuid?: string | null;
    resourceViewUuid?: string | null;
  };
  const primaryArtifact = outcome.primaryArtifact as typeof outcome.primaryArtifact & {
    assetUuid?: string | null;
    primaryResourceUuid?: string | null;
    resourceViewUuid?: string | null;
    resource?: {
      uuid?: string | null;
      assetUuid?: string | null;
      primaryResourceUuid?: string | null;
      resourceViewUuid?: string | null;
    } | null;
  };
  const primaryResourceId =
    pickFirst(
      outcome.delivery.primaryResourceId,
      outcome.primaryArtifact.primaryResourceId
    );
  const resourceViewId =
    pickFirst(
      outcome.delivery.resourceViewId,
      outcome.primaryArtifact.resourceViewId
    );
  const primaryResourceUuid =
    pickFirst(
      delivery.primaryResourceUuid,
      primaryArtifact.primaryResourceUuid,
      primaryArtifact.resource?.primaryResourceUuid,
      primaryArtifact.resource?.uuid
    );
  const resourceViewUuid =
    pickFirst(
      delivery.resourceViewUuid,
      primaryArtifact.resourceViewUuid,
      primaryArtifact.resource?.resourceViewUuid
    );

  return {
    assetId,
    assetUuid,
    path,
    url,
    sourceUrl,
    deliveryUrl: outcome.delivery.url || sourceUrl,
    posterUrl: outcome.delivery.posterUrl,
    mimeType: outcome.delivery.mimeType,
    duration: outcome.delivery.duration,
    width: outcome.delivery.width,
    height: outcome.delivery.height,
    product: outcome.recipe.product,
    mode: outcome.recipe.mode,
    provider: outcome.execution.provider,
    providerModel: outcome.execution.providerModel,
    prompt: outcome.recipe.prompt,
    negativePrompt: outcome.recipe.negativePrompt,
    parameters: outcome.recipe.parameters || {},
    recipeId: outcome.recipe.id,
    recipeUuid: outcome.recipe.uuid,
    executionId: outcome.execution.id,
    executionUuid: outcome.execution.uuid,
    artifactSetId: outcome.artifactSet.id,
    artifactSetUuid: outcome.artifactSet.uuid,
    artifactId: outcome.delivery.artifactId ?? outcome.primaryArtifact.id ?? null,
    artifactUuid: outcome.delivery.artifactUuid || outcome.primaryArtifact.uuid,
    primaryResourceId,
    primaryResourceUuid,
    resourceViewId,
    resourceViewUuid,
  };
};

export const persistGenerationOutcomeAsset = async ({
  outcome,
  type,
  domain,
  name,
}: PersistGenerationOutcomeAssetInput): Promise<PersistedGenerationOutcomeAsset> => {
  const assetId = outcome.delivery.assetId || outcome.primaryArtifact.assetId || null;
  const sourceReference = resolveGenerationOutcomePrimaryReference(outcome);
  const sourceUrl = resolveGenerationOutcomePrimaryUrl(outcome) || outcome.delivery.url;

  if (assetId) {
    const resolvedUrl = await resolveAssetPrimaryUrlBySdk(assetId);
    const delivery = outcome.delivery as typeof outcome.delivery & {
      assetUuid?: string | null;
    };
    const primaryArtifact = outcome.primaryArtifact as typeof outcome.primaryArtifact & {
      assetUuid?: string | null;
      resource?: {
        assetUuid?: string | null;
      } | null;
    };
    const finalUrl =
      resolvedUrl ||
      sourceUrl ||
      (isRenderableOutcomeUrl(sourceReference) ? sourceReference : '');
    const finalPath = sourceReference || finalUrl;
    if (!finalUrl) {
      throw new Error('Generation outcome is missing a delivery url');
    }

    return buildPersistedGenerationOutcomeAsset(
      outcome,
      assetId,
      pickFirst(
        delivery.assetUuid,
        primaryArtifact.assetUuid,
        primaryArtifact.resource?.assetUuid
      ),
      finalPath,
      finalUrl,
      sourceUrl || finalUrl
    );
  }

  if (!sourceUrl) {
    throw new Error('Generation outcome is missing a delivery url');
  }

  const inlineData = await inlineDataService.tryExtractInlineData(sourceUrl);
  const uploaded = inlineData
    ? await importAssetBySdk(
        {
          name,
          data: inlineData,
        },
        type,
        { domain }
      )
    : await importAssetFromUrlBySdk(
        sourceUrl,
        type,
        {
          name,
          domain,
        }
      );
  const resolvedUploadedUrl = await resolveAssetPrimaryUrlBySdk(uploaded.id);

  return buildPersistedGenerationOutcomeAsset(
    outcome,
    uploaded.id,
    pickFirst(uploaded.uuid),
    resolvePersistedOutcomeReference(
      uploaded.path,
      resolvedUploadedUrl,
      sourceReference,
      sourceUrl
    ),
    resolvePersistedOutcomeUrl(
      uploaded.path,
      resolvedUploadedUrl,
      sourceUrl
    ),
    sourceUrl
  );
};
