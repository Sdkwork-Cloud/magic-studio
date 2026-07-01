import type {
  MagicStudioGenerationArtifact,
  MagicStudioGenerationTask,
} from '@sdkwork/magic-studio-host-types';
import { createGenerationOutcome } from '@sdkwork/magic-studio-core/services';
import type { AgiGenerationMode, GenerationOutcome } from '@sdkwork/magic-studio-types/agi';

import type { GeneratedMusicResult, MusicConfig } from '../entities';
import {
  resolveGeneratedMusicResultPath,
  resolveGeneratedMusicResultUrl,
} from '../entities';
import {
  DEFAULT_MUSIC_MODEL,
  normalizeMusicModel,
} from '../utils/musicModel';

interface MusicOutcomeContext {
  mode: AgiGenerationMode;
  prompt?: string;
  title?: string;
  lyrics?: string;
  style?: string;
  duration?: number;
  model?: MusicConfig['model'];
  instrumental?: boolean;
  customMode?: boolean;
  source?: GeneratedMusicResult | null;
  parameters?: Record<string, unknown>;
  providerPayload?: Record<string, unknown>;
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

function readRecordString(
  record: Record<string, unknown> | undefined,
  key: string,
): string | undefined {
  const resolved = safeString(record?.[key]);
  return resolved || undefined;
}

function resolveMusicTaskStatus(
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
    if (type && type !== 'music' && type !== 'audio') {
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

function resolvePosterUrl(
  artifact: MagicStudioGenerationArtifact,
  task: MagicStudioGenerationTask,
): string | undefined {
  return (
    safeString(artifact.posterUrl) ||
    safeString(artifact.metadata?.posterUrl) ||
    safeString(task.providerPayload?.posterUrl) ||
    undefined
  );
}

function resolveSourceMetadata(
  source?: GeneratedMusicResult | null,
): {
  sourceMusicUrl?: string | null;
  sourceMusicPath?: string | null;
  sourceMusicTitle?: string | null;
} {
  if (!source) {
    return {};
  }

  return {
    sourceMusicUrl: resolveGeneratedMusicResultUrl(source),
    sourceMusicPath: resolveGeneratedMusicResultPath(source),
    sourceMusicTitle: safeString(source.title) || null,
  };
}

export const isMusicGenerationTaskTerminalStatus = (
  task?: Pick<MagicStudioGenerationTask, 'status'> | null,
): boolean =>
  task?.status === 'succeeded' ||
  task?.status === 'failed' ||
  task?.status === 'cancelled';

export function mapCanonicalMusicTaskToGenerationOutcome(
  task: MagicStudioGenerationTask,
  context: MusicOutcomeContext,
): GenerationOutcome {
  const artifact = resolvePrimaryArtifact(task);
  if (!artifact) {
    throw new Error(
      task.errorMessage || 'Music generation did not return a primary artifact',
    );
  }

  const parameters = asRecord(task.parameters) || {};
  const providerPayload = asRecord(task.providerPayload) || {};
  const artifactMetadata = asRecord(artifact.metadata) || {};
  const status = resolveMusicTaskStatus(task.status);
  const remoteJobId = safeIdString(task.remoteJobId) || safeIdString(task.taskId) || null;
  const posterUrl = resolvePosterUrl(artifact, task);
  const normalizedTitle =
    safeString(artifactMetadata.title) ||
    safeString(parameters.title) ||
    safeString(providerPayload.title) ||
    safeString(context.title) ||
    'Generated Music';
  const normalizedLyrics =
    safeString(artifactMetadata.lyrics) ||
    safeString(parameters.lyrics) ||
    safeString(providerPayload.lyrics) ||
    safeString(context.lyrics);
  const normalizedStyle =
    safeString(artifactMetadata.style) ||
    safeString(parameters.style) ||
    safeString(providerPayload.style) ||
    safeString(context.style);
  const resolvedDuration =
    artifact.duration ??
    safeNumber(artifactMetadata.duration) ??
    safeNumber(parameters.duration) ??
    safeNumber(providerPayload.duration) ??
    context.duration;
  const requestedModel = normalizeMusicModel(
    task.providerModel || context.model,
    DEFAULT_MUSIC_MODEL,
  );
  const sourceMetadata = resolveSourceMetadata(context.source);

  return createGenerationOutcome({
    product: 'music',
    mode: context.mode,
    provider: safeString(task.provider, 'magic-studio-server'),
    providerModel: requestedModel,
    prompt: safeString(task.prompt, context.prompt),
    inputRefs:
      task.inputRefs.length > 0
        ? task.inputRefs
        : context.source
          ? [
              {
                id: context.source.id,
                uuid: context.source.uuid,
                assetId: context.source.assetId ?? null,
                assetUuid: context.source.assetUuid ?? null,
                primaryResourceId: context.source.primaryResourceId ?? null,
                primaryResourceUuid: context.source.primaryResourceUuid ?? null,
                resourceViewId: context.source.resourceViewId ?? null,
                resourceViewUuid: context.source.resourceViewUuid ?? null,
                path: resolveGeneratedMusicResultPath(context.source) || undefined,
                url: resolveGeneratedMusicResultUrl(context.source) || undefined,
                name: context.source.resource?.name || context.source.title,
                mimeType: context.source.resource?.mimeType,
                type: 'music',
                role: 'reference',
                resource: context.source.resource ? { ...context.source.resource } : undefined,
                metadata: {
                  title: context.source.title,
                  duration: context.source.duration,
                  style: context.source.style,
                },
                createdAt: Date.now(),
                updatedAt: Date.now(),
              },
            ]
          : [],
    parameters: {
      ...parameters,
      requestedModel,
      title: normalizedTitle,
      lyrics: normalizedLyrics || null,
      style: normalizedStyle || null,
      duration: resolvedDuration ?? null,
      customMode:
        context.customMode ??
        (typeof parameters.customMode === 'boolean'
          ? parameters.customMode
          : null),
      instrumental:
        context.instrumental ??
        (typeof parameters.instrumental === 'boolean'
          ? parameters.instrumental
          : null),
      ...sourceMetadata,
      ...(context.parameters || {}),
    },
    providerPayload: {
      ...providerPayload,
      requestedModel,
      title: normalizedTitle,
      lyrics: normalizedLyrics || null,
      style: normalizedStyle || null,
      duration: resolvedDuration ?? null,
      posterUrl: posterUrl || null,
      ...sourceMetadata,
      ...(context.providerPayload || {}),
    },
    remoteJobId,
    status,
    progress: task.progress,
    artifact: {
      type: 'music',
      url: safeString(artifact.url),
      posterUrl,
      mimeType: safeString(artifact.mimeType, 'audio/mpeg'),
      name: safeString(artifact.name, `${normalizedTitle}.mp3`),
      duration: resolvedDuration,
      metadata: {
        ...artifactMetadata,
        title: normalizedTitle,
        lyrics: normalizedLyrics || null,
        style: normalizedStyle || null,
        requestedModel,
        posterUrl: posterUrl || null,
        sourceMusicUrl: sourceMetadata.sourceMusicUrl || null,
        sourceMusicPath: sourceMetadata.sourceMusicPath || null,
        sourceMusicTitle: sourceMetadata.sourceMusicTitle || null,
      },
    },
  });
}
