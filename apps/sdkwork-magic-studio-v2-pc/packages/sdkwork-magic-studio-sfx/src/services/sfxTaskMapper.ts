import { createGenerationOutcome } from '@sdkwork/magic-studio-core/services';
import type {
  MagicStudioGenerationArtifact,
  MagicStudioGenerationTask,
} from '@sdkwork/magic-studio-host-types';
import type { GenerationOutcome } from '@sdkwork/magic-studio-types/agi';

import type { SfxConfig } from '../entities';
import { DEFAULT_SFX_MODEL, normalizeSfxModel } from '../utils/sfxModel';

interface SfxOutcomeContext {
  prompt?: string;
  duration?: number;
  model?: SfxConfig['model'];
  mediaType?: SfxConfig['mediaType'];
}

function safeString(value: unknown, fallback = ''): string {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  return fallback;
}

function safeNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

function safeIdString(value: unknown): string {
  return safeString(value);
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : undefined;
}

function resolveSfxTaskStatus(
  status: MagicStudioGenerationTask['status'],
): GenerationOutcome['execution']['status'] {
  switch (status) {
    case 'processing':
    case 'succeeded':
    case 'failed':
    case 'cancelled':
      return status;
    case 'draft':
    case 'queued':
    default:
      return 'queued';
  }
}

function resolvePrimaryArtifact(
  task: MagicStudioGenerationTask,
): MagicStudioGenerationArtifact | null {
  const candidates = [
    task.primaryArtifact || null,
    ...(Array.isArray(task.artifacts) ? task.artifacts : []),
  ];
  const seen = new Set<string>();

  for (const artifact of candidates) {
    if (!artifact) {
      continue;
    }

    const url = safeString(artifact.url);
    const type = safeString(artifact.type);
    if (!url) {
      continue;
    }
    if (type && type !== 'audio') {
      continue;
    }

    const key =
      safeIdString(artifact.uuid) ||
      safeIdString(artifact.id) ||
      url;
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    return artifact;
  }

  return null;
}

export const isSfxGenerationTaskTerminalStatus = (
  task?: Pick<MagicStudioGenerationTask, 'status'> | null,
): boolean =>
  task?.status === 'succeeded' ||
  task?.status === 'failed' ||
  task?.status === 'cancelled';

export function mapCanonicalSfxTaskToGenerationOutcome(
  task: MagicStudioGenerationTask,
  context: SfxOutcomeContext,
): GenerationOutcome {
  const artifact = resolvePrimaryArtifact(task);
  if (!artifact) {
    throw new Error(
      task.errorMessage || 'SFX generation did not return a primary artifact',
    );
  }

  const parameters = asRecord(task.parameters) || {};
  const providerPayload = asRecord(task.providerPayload) || {};
  const artifactMetadata = asRecord(artifact.metadata) || {};
  const status = resolveSfxTaskStatus(task.status);
  const remoteJobId = safeIdString(task.remoteJobId) || safeIdString(task.taskId) || null;
  const requestedModel = normalizeSfxModel(
    task.providerModel || context.model,
    DEFAULT_SFX_MODEL,
  );
  const resolvedDuration =
    artifact.duration ??
    safeNumber(artifactMetadata.duration) ??
    safeNumber(parameters.duration) ??
    safeNumber(providerPayload.duration) ??
    context.duration;
  const mediaType =
    safeString(parameters.mediaType) ||
    safeString(providerPayload.mediaType) ||
    context.mediaType ||
    'sfx';

  return createGenerationOutcome({
    product: 'sfx',
    mode: 'text-to-audio',
    provider: safeString(task.provider, 'magic-studio-server'),
    providerModel: requestedModel,
    prompt: safeString(task.prompt, context.prompt),
    parameters: {
      ...parameters,
      requestedModel,
      duration: resolvedDuration ?? null,
      mediaType,
    },
    providerPayload: {
      ...providerPayload,
      requestedModel,
      duration: resolvedDuration ?? null,
      mediaType,
    },
    remoteJobId,
    status,
    progress: task.progress,
    artifact: {
      type: 'audio',
      url: safeString(artifact.url),
      mimeType: safeString(artifact.mimeType, 'audio/mpeg'),
      name: safeString(artifact.name, 'generated-sfx.mp3'),
      duration: resolvedDuration,
      metadata: {
        ...artifactMetadata,
        requestedModel,
        duration: resolvedDuration ?? null,
        mediaType,
      },
    },
  });
}
