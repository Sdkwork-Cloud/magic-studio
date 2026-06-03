import type { ClientEntityIdentity, EntityTimestamp } from './base.types';
import type { AnyMediaResource, MediaResourceOrigin } from './media.types';

export type AgiMediaKind =
  | 'text'
  | 'image'
  | 'video'
  | 'audio'
  | 'music'
  | 'voice'
  | 'subtitle'
  | 'file';

export type AgiGenerationProduct =
  | 'text'
  | 'image'
  | 'video'
  | 'audio'
  | 'music'
  | 'character'
  | 'sfx'
  | 'speech'
  | 'short-video'
  | 'short-drama-shot'
  | 'edit-image'
  | 'edit-video';

export type AgiGenerationMode =
  | 'text-to-image'
  | 'text-to-character'
  | 'image-to-image'
  | 'variation'
  | 'text-to-video'
  | 'image-to-video'
  | 'style-transfer'
  | 'extend'
  | 'text-to-audio'
  | 'text-to-speech'
  | 'speech-to-text'
  | 'text-to-music'
  | 'lip-sync'
  | 'inpaint'
  | 'outpaint'
  | 'expand'
  | 'upscale'
  | 'restyle';

export type MediaInputRole =
  | 'input'
  | 'reference'
  | 'style-reference'
  | 'character-reference'
  | 'start-frame'
  | 'end-frame'
  | 'driver-audio'
  | 'source-video'
  | 'source-image'
  | 'mask'
  | 'overlay';

export type ArtifactRole =
  | 'primary'
  | 'preview'
  | 'thumbnail'
  | 'source'
  | 'reference'
  | 'mask'
  | 'subtitle'
  | 'waveform';

export type ArtifactType =
  | AgiMediaKind
  | 'timeline'
  | 'project-graph'
  | 'recipe-snapshot';

export type AgiExecutionStatus =
  | 'draft'
  | 'queued'
  | 'processing'
  | 'succeeded'
  | 'failed'
  | 'cancelled';

export interface MediaInputRef extends ClientEntityIdentity {
  assetId: string | null;
  assetUuid?: string | null;
  primaryResourceId?: string | null;
  primaryResourceUuid?: string | null;
  resourceViewId?: string | null;
  resourceViewUuid?: string | null;
  path?: string;
  url?: string;
  name?: string;
  mimeType?: string;
  type: AgiMediaKind;
  role: MediaInputRole;
  resource?: AnyMediaResource | null;
  metadata?: Record<string, unknown>;
}

export interface GenerationRecipe extends ClientEntityIdentity {
  product: AgiGenerationProduct;
  mode: AgiGenerationMode;
  prompt?: string;
  negativePrompt?: string;
  instructions?: string;
  inputRefs: MediaInputRef[];
  parameters: Record<string, unknown>;
  providerOptions?: Record<string, unknown>;
}

export interface GeneratedArtifact extends ClientEntityIdentity {
  executionId: string | null;
  executionUuid?: string | null;
  recipeId?: string | null;
  recipeUuid?: string | null;
  assetId: string | null;
  primaryResourceId?: string | null;
  resourceViewId?: string | null;
  artifactType: ArtifactType;
  type: AgiMediaKind;
  role: ArtifactRole;
  origin: MediaResourceOrigin;
  resource?: AnyMediaResource | null;
  metadata?: Record<string, unknown>;
}

export interface ArtifactSet extends ClientEntityIdentity {
  executionId: string | null;
  executionUuid?: string | null;
  primaryArtifactId?: string | null;
  primaryArtifactUuid?: string | null;
  artifacts: GeneratedArtifact[];
  metadata?: Record<string, unknown>;
}

export interface GenerationExecutionScope {
  workspaceId?: string | null;
  workspaceUuid?: string | null;
  projectId?: string | null;
  projectUuid?: string | null;
  surface?: string;
}

export interface GenerationExecutionTelemetry {
  queuedAt?: EntityTimestamp;
  startedAt?: EntityTimestamp;
  completedAt?: EntityTimestamp | null;
  failedAt?: EntityTimestamp | null;
}

export interface GenerationExecution extends ClientEntityIdentity {
  recipe: GenerationRecipe;
  provider: string;
  providerModel: string;
  status: AgiExecutionStatus;
  artifactSets: ArtifactSet[];
  remoteJobId?: string | null;
  error?: string | null;
  progress?: number;
  scope?: GenerationExecutionScope;
  providerPayload?: Record<string, unknown>;
  telemetry?: GenerationExecutionTelemetry;
}

export interface ArtifactDeliveryView {
  artifactId: string | null;
  artifactUuid: string;
  assetId: string | null;
  primaryResourceId?: string | null;
  resourceViewId?: string | null;
  path?: string;
  url: string;
  posterUrl?: string;
  mimeType?: string;
  duration?: number;
  width?: number;
  height?: number;
  metadata?: Record<string, unknown>;
}

export interface GenerationOutcome {
  recipe: GenerationRecipe;
  execution: GenerationExecution;
  artifactSet: ArtifactSet;
  primaryArtifact: GeneratedArtifact;
  artifacts: GeneratedArtifact[];
  delivery: ArtifactDeliveryView;
}
