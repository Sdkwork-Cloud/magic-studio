import type {
  AgiExecutionStatus,
  AgiGenerationMode,
  AgiGenerationProduct,
  AgiMediaKind,
  ArtifactSet,
  ArtifactRole,
  GeneratedArtifact,
  GenerationExecution,
  GenerationExecutionScope,
  GenerationExecutionTelemetry,
  GenerationOutcome,
  GenerationRecipe,
  MediaInputRef,
} from '@sdkwork/magic-studio-types/agi';
import { createClientEntityIdentity } from '@sdkwork/magic-studio-types/entity';
import type { AnyMediaResource, MediaResourceOrigin } from '@sdkwork/magic-studio-types/media';
import { MediaResourceType } from '@sdkwork/magic-studio-types/vocabulary';

interface CreateGenerationOutcomeArtifactInput {
  type: AgiMediaKind;
  url: string;
  role?: ArtifactRole;
  origin?: MediaResourceOrigin;
  posterUrl?: string;
  mimeType?: string;
  name?: string;
  extension?: string;
  duration?: number;
  width?: number;
  height?: number;
  metadata?: Record<string, unknown>;
}

export interface CreateGenerationOutcomeInput {
  product: AgiGenerationProduct;
  mode: AgiGenerationMode;
  provider: string;
  providerModel: string;
  prompt?: string;
  negativePrompt?: string;
  instructions?: string;
  inputRefs?: MediaInputRef[];
  parameters?: Record<string, unknown>;
  providerOptions?: Record<string, unknown>;
  providerPayload?: Record<string, unknown>;
  remoteJobId?: string | null;
  status?: AgiExecutionStatus;
  progress?: number;
  scope?: GenerationExecutionScope;
  artifact: CreateGenerationOutcomeArtifactInput;
}

export interface CreateGenerationExecutionInput {
  product: AgiGenerationProduct;
  mode: AgiGenerationMode;
  provider: string;
  providerModel: string;
  prompt?: string;
  negativePrompt?: string;
  instructions?: string;
  inputRefs?: MediaInputRef[];
  parameters?: Record<string, unknown>;
  providerOptions?: Record<string, unknown>;
  providerPayload?: Record<string, unknown>;
  remoteJobId?: string | null;
  status?: AgiExecutionStatus;
  progress?: number;
  scope?: GenerationExecutionScope;
  telemetry?: GenerationExecutionTelemetry;
  error?: string | null;
}

export interface CreateGenerationOutcomeFromExecutionInput {
  artifact: CreateGenerationOutcomeArtifactInput;
  status?: AgiExecutionStatus;
  progress?: number;
  providerPayload?: Record<string, unknown>;
  remoteJobId?: string | null;
  scope?: GenerationExecutionScope;
  telemetry?: GenerationExecutionTelemetry;
  error?: string | null;
}

const mapAgiMediaKindToResourceType = (type: AgiMediaKind): MediaResourceType => {
  switch (type) {
    case 'image':
      return MediaResourceType.IMAGE;
    case 'video':
      return MediaResourceType.VIDEO;
    case 'audio':
      return MediaResourceType.AUDIO;
    case 'music':
      return MediaResourceType.MUSIC;
    case 'voice':
      return MediaResourceType.VOICE;
    case 'subtitle':
      return MediaResourceType.SUBTITLE;
    case 'text':
      return MediaResourceType.TEXT;
    default:
      return MediaResourceType.FILE;
  }
};

const createResourceIdentity = () => {
  const identity = createClientEntityIdentity();
  return {
    id: identity.uuid,
    uuid: identity.uuid,
    createdAt: identity.createdAt,
    updatedAt: identity.updatedAt,
  };
};

const createGenerationRecipe = (
  input: Pick<
    CreateGenerationExecutionInput,
    | 'product'
    | 'mode'
    | 'prompt'
    | 'negativePrompt'
    | 'instructions'
    | 'inputRefs'
    | 'parameters'
    | 'providerOptions'
  >
): GenerationRecipe => {
  return {
    ...createClientEntityIdentity(),
    product: input.product,
    mode: input.mode,
    prompt: input.prompt,
    negativePrompt: input.negativePrompt,
    instructions: input.instructions,
    inputRefs: input.inputRefs || [],
    parameters: input.parameters || {},
    providerOptions: input.providerOptions,
  };
};

const resolveExecutionProgress = (
  status: AgiExecutionStatus,
  progress: number | undefined,
  fallback: number
): number => {
  if (typeof progress === 'number' && Number.isFinite(progress)) {
    return progress;
  }

  if (status === 'succeeded') {
    return 100;
  }

  return fallback;
};

const mergeExecutionTelemetry = (
  status: AgiExecutionStatus,
  existing: GenerationExecutionTelemetry | undefined,
  incoming: GenerationExecutionTelemetry | undefined,
  now: number
): GenerationExecutionTelemetry | undefined => {
  const telemetry = {
    ...(existing || {}),
    ...(incoming || {}),
  };

  if (status === 'queued' && !telemetry.queuedAt) {
    telemetry.queuedAt = now;
  }
  if (status === 'processing' && !telemetry.startedAt) {
    telemetry.startedAt = now;
  }
  if (status === 'succeeded' && !telemetry.completedAt) {
    telemetry.completedAt = now;
  }
  if ((status === 'failed' || status === 'cancelled') && !telemetry.failedAt) {
    telemetry.failedAt = now;
  }

  return Object.keys(telemetry).length > 0 ? telemetry : undefined;
};

const resolveArtifactMetadataString = (
  artifact: GeneratedArtifact,
  key: string
): string | undefined => {
  const artifactValue = artifact.metadata?.[key];
  if (typeof artifactValue === 'string' && artifactValue.trim().length > 0) {
    return artifactValue;
  }

  const resourceMetadata = artifact.resource?.metadata as Record<string, unknown> | undefined;
  const resourceValue = resourceMetadata?.[key];
  if (typeof resourceValue === 'string' && resourceValue.trim().length > 0) {
    return resourceValue;
  }

  return undefined;
};

const resolveArtifactMetadataNumber = (
  artifact: GeneratedArtifact,
  key: string
): number | undefined => {
  const artifactValue = artifact.metadata?.[key];
  if (typeof artifactValue === 'number' && Number.isFinite(artifactValue)) {
    return artifactValue;
  }

  const resourceMetadata = artifact.resource?.metadata as Record<string, unknown> | undefined;
  const resourceValue = resourceMetadata?.[key];
  if (typeof resourceValue === 'number' && Number.isFinite(resourceValue)) {
    return resourceValue;
  }

  return undefined;
};

const resolveArtifactSetPrimaryArtifact = (
  artifactSet: ArtifactSet
): GeneratedArtifact | null => {
  if (artifactSet.primaryArtifactUuid) {
    const matchedByUuid = artifactSet.artifacts.find(
      (artifact) => artifact.uuid === artifactSet.primaryArtifactUuid
    );
    if (matchedByUuid) {
      return matchedByUuid;
    }
  }

  if (artifactSet.primaryArtifactId) {
    const matchedById = artifactSet.artifacts.find(
      (artifact) => artifact.id === artifactSet.primaryArtifactId
    );
    if (matchedById) {
      return matchedById;
    }
  }

  return artifactSet.artifacts[0] || null;
};

const buildGenerationOutcome = (
  execution: GenerationExecution,
  artifactSet: ArtifactSet,
  primaryArtifact: GeneratedArtifact
): GenerationOutcome => {
  const deliveryUrl = primaryArtifact.resource?.url || '';

  return {
    recipe: execution.recipe,
    execution,
    artifactSet,
    primaryArtifact,
    artifacts: artifactSet.artifacts,
    delivery: {
      artifactId: primaryArtifact.id,
      artifactUuid: primaryArtifact.uuid,
      assetId: primaryArtifact.assetId,
      primaryResourceId: primaryArtifact.primaryResourceId,
      resourceViewId: primaryArtifact.resourceViewId,
      path: primaryArtifact.resource?.path,
      url: deliveryUrl,
      posterUrl: resolveArtifactMetadataString(primaryArtifact, 'posterUrl'),
      mimeType:
        primaryArtifact.resource?.mimeType ||
        resolveArtifactMetadataString(primaryArtifact, 'mimeType'),
      duration: resolveArtifactMetadataNumber(primaryArtifact, 'duration'),
      width: resolveArtifactMetadataNumber(primaryArtifact, 'width'),
      height: resolveArtifactMetadataNumber(primaryArtifact, 'height'),
      metadata: primaryArtifact.metadata || primaryArtifact.resource?.metadata,
    },
  };
};

export const createGenerationExecution = (
  input: CreateGenerationExecutionInput
): GenerationExecution => {
  const recipe = createGenerationRecipe(input);
  const executionIdentity = createClientEntityIdentity();
  const status = input.status || 'queued';
  const now = Date.now();

  return {
    ...executionIdentity,
    recipe,
    provider: input.provider,
    providerModel: input.providerModel,
    status,
    artifactSets: [],
    remoteJobId: input.remoteJobId || null,
    progress: resolveExecutionProgress(status, input.progress, 0),
    scope: input.scope,
    providerPayload: input.providerPayload,
    telemetry: mergeExecutionTelemetry(status, undefined, input.telemetry, now),
    error: input.error ?? null,
  };
};

export const createGenerationOutcomeFromExecution = (
  existingExecution: GenerationExecution,
  input: CreateGenerationOutcomeFromExecutionInput
): GenerationOutcome => {
  const status = input.status || existingExecution.status || 'succeeded';
  const now = Date.now();
  const artifactIdentity = createClientEntityIdentity();
  const resourceIdentity = createResourceIdentity();

  const resource: AnyMediaResource = {
    ...resourceIdentity,
    assetId: null,
    primaryResourceId: resourceIdentity.uuid,
    resourceViewId: resourceIdentity.uuid,
    sourceRecipeId: existingExecution.recipe.id,
    sourceRecipeUuid: existingExecution.recipe.uuid,
    sourceExecutionId: existingExecution.id,
    sourceExecutionUuid: existingExecution.uuid,
    sourceArtifactId: artifactIdentity.id,
    sourceArtifactUuid: artifactIdentity.uuid,
    url: input.artifact.url,
    type: mapAgiMediaKindToResourceType(input.artifact.type),
    mimeType: input.artifact.mimeType,
    name:
      input.artifact.name ||
      `${existingExecution.recipe.product}-${resourceIdentity.uuid}`,
    extension: input.artifact.extension,
    origin: input.artifact.origin || 'ai',
    metadata: {
      ...(input.artifact.metadata || {}),
      posterUrl: input.artifact.posterUrl,
      duration: input.artifact.duration,
      width: input.artifact.width,
      height: input.artifact.height,
      deliveryUrl: input.artifact.url,
    },
  };

  const primaryArtifact: GeneratedArtifact = {
    ...artifactIdentity,
    executionId: existingExecution.id,
    executionUuid: existingExecution.uuid,
    recipeId: existingExecution.recipe.id,
    recipeUuid: existingExecution.recipe.uuid,
    assetId: null,
    primaryResourceId: resource.primaryResourceId,
    resourceViewId: resource.resourceViewId,
    artifactType: input.artifact.type,
    type: input.artifact.type,
    role: input.artifact.role || 'primary',
    origin: input.artifact.origin || 'ai',
    resource,
    metadata: {
      ...(input.artifact.metadata || {}),
      posterUrl: input.artifact.posterUrl,
      duration: input.artifact.duration,
      width: input.artifact.width,
      height: input.artifact.height,
      mimeType: input.artifact.mimeType,
    },
  };

  const artifactSet: ArtifactSet = {
    ...createClientEntityIdentity(),
    executionId: existingExecution.id,
    executionUuid: existingExecution.uuid,
    primaryArtifactId: primaryArtifact.id,
    primaryArtifactUuid: primaryArtifact.uuid,
    artifacts: [primaryArtifact],
    metadata: {
      product: existingExecution.recipe.product,
      mode: existingExecution.recipe.mode,
    },
  };

  const execution: GenerationExecution = {
    ...existingExecution,
    updatedAt: now,
    status,
    artifactSets: [...existingExecution.artifactSets, artifactSet],
    remoteJobId: input.remoteJobId ?? existingExecution.remoteJobId ?? null,
    progress: resolveExecutionProgress(
      status,
      input.progress,
      existingExecution.progress ?? 0
    ),
    scope: input.scope ?? existingExecution.scope,
    providerPayload: input.providerPayload ?? existingExecution.providerPayload,
    telemetry: mergeExecutionTelemetry(
      status,
      existingExecution.telemetry,
      input.telemetry,
      now
    ),
    error:
      input.error ??
      (status === 'failed' || status === 'cancelled'
        ? existingExecution.error ?? null
        : null),
  };

  return buildGenerationOutcome(execution, artifactSet, primaryArtifact);
};

export const createGenerationOutcome = (
  input: CreateGenerationOutcomeInput
): GenerationOutcome => {
  const execution = createGenerationExecution({
    product: input.product,
    mode: input.mode,
    provider: input.provider,
    providerModel: input.providerModel,
    prompt: input.prompt,
    negativePrompt: input.negativePrompt,
    instructions: input.instructions,
    inputRefs: input.inputRefs,
    parameters: input.parameters,
    providerOptions: input.providerOptions,
    providerPayload: input.providerPayload,
    remoteJobId: input.remoteJobId,
    status: input.status || 'succeeded',
    progress: input.progress,
    scope: input.scope,
  });

  return createGenerationOutcomeFromExecution(execution, {
    artifact: input.artifact,
    status: input.status || 'succeeded',
    progress: input.progress,
    providerPayload: input.providerPayload,
    remoteJobId: input.remoteJobId,
    scope: input.scope,
  });
};

export const resolveGenerationOutcomePrimaryArtifact = (
  outcome: GenerationOutcome
) => {
  if (outcome.primaryArtifact) {
    return outcome.primaryArtifact;
  }

  if (outcome.artifactSet.primaryArtifactUuid) {
    return outcome.artifactSet.artifacts.find(
      (artifact) => artifact.uuid === outcome.artifactSet.primaryArtifactUuid
    ) || outcome.artifactSet.artifacts[0];
  }

  return outcome.artifactSet.artifacts[0];
};

export const resolveGenerationExecutionOutcome = (
  execution: GenerationExecution
): GenerationOutcome | null => {
  const artifactSet = [...execution.artifactSets]
    .reverse()
    .find((candidate) => candidate.artifacts.length > 0);

  if (!artifactSet) {
    return null;
  }

  const primaryArtifact = resolveArtifactSetPrimaryArtifact(artifactSet);
  if (!primaryArtifact || !primaryArtifact.resource?.url) {
    return null;
  }

  return buildGenerationOutcome(execution, artifactSet, primaryArtifact);
};

export const resolveGenerationOutcomePrimaryUrl = (
  outcome: GenerationOutcome
): string | null => {
  const artifact = resolveGenerationOutcomePrimaryArtifact(outcome);
  return artifact?.resource?.url || outcome.delivery.url || null;
};

export const resolveGenerationOutcomePosterUrl = (
  outcome: GenerationOutcome
): string | null => {
  const artifact = resolveGenerationOutcomePrimaryArtifact(outcome);
  const metadata = artifact?.resource?.metadata as Record<string, unknown> | undefined;
  const posterUrl =
    artifact?.metadata?.posterUrl ||
    metadata?.posterUrl ||
    outcome.delivery.posterUrl ||
    null;

  return typeof posterUrl === 'string' && posterUrl.trim().length > 0 ? posterUrl : null;
};
