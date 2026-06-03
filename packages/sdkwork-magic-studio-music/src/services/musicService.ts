import type {
  MagicStudioGenerationTask,
  MagicStudioMusicExtendRequest,
  MagicStudioMusicGenerationRequest,
  MagicStudioMusicRemixRequest,
  MagicStudioMusicSimilarRequest,
} from '@sdkwork/magic-studio-host-types';
import { assertRuntimeMagicStudioExecutionOperationReady } from '@sdkwork/magic-studio-core/platform';
import { waitForCanonicalTaskResult } from '@sdkwork/magic-studio-core/services';
import type {
  AgiGenerationMode,
  GenerationOutcome,
  MediaInputRef,
} from '@sdkwork/magic-studio-types/agi';

import type { GeneratedMusicResult, MusicConfig } from '../entities';
import {
  resolveGeneratedMusicResultPath,
  resolveGeneratedMusicResultUrl,
} from '../entities';
import { normalizeMusicModel } from '../utils/musicModel';
import { createMusicServerClient } from './musicServerClient';
import {
  isMusicGenerationTaskTerminalStatus,
  mapCanonicalMusicTaskToGenerationOutcome,
} from './musicTaskMapper';

type MusicWorkflowMode = NonNullable<MusicConfig['mode']>;
type MusicServerClient = ReturnType<typeof createMusicServerClient>;

export interface MusicSimilarExecutionInput {
  source: GeneratedMusicResult;
  duration?: number;
  model?: MusicConfig['model'];
  idempotencyKey?: string;
}

export interface MusicRemixExecutionInput {
  source: GeneratedMusicResult;
  style: string;
  model?: MusicConfig['model'];
  idempotencyKey?: string;
}

export interface MusicExtendExecutionInput {
  source: GeneratedMusicResult;
  extendDuration: number;
  style?: string;
  model?: MusicConfig['model'];
  idempotencyKey?: string;
}

interface MusicTaskExecutionContext {
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

const TASK_POLL_INTERVAL_MS = 250;
const TASK_POLL_MAX_ATTEMPTS = 40;

const safeString = (value: unknown): string => {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  return '';
};

const safeIdString = (value: unknown): string => safeString(value);

const resolveMusicMode = (mode?: MusicConfig['mode']): MusicWorkflowMode =>
  mode || 'generate';

const createServerClient = () => createMusicServerClient('MusicService');

const resolveOperationKey = (
  mode: MusicWorkflowMode,
): 'create' | 'similar' | 'remix' | 'extend' => {
  switch (mode) {
    case 'similar':
      return 'similar';
    case 'remix':
      return 'remix';
    case 'extend':
      return 'extend';
    case 'generate':
    default:
      return 'create';
  }
};

const resolveOutcomeMode = (mode: MusicWorkflowMode): AgiGenerationMode => {
  switch (mode) {
    case 'similar':
      return 'variation';
    case 'remix':
      return 'restyle';
    case 'extend':
      return 'extend';
    case 'generate':
    default:
      return 'text-to-music';
  }
};

const shouldReturnTask = (task: MagicStudioGenerationTask): boolean =>
  isMusicGenerationTaskTerminalStatus(task) ||
  !!task.primaryArtifact ||
  (Array.isArray(task.artifacts) && task.artifacts.length > 0);

const buildSourceMusicInputRef = (source: GeneratedMusicResult): MediaInputRef => {
  const resolvedUrl = resolveGeneratedMusicResultUrl(source) || undefined;
  const resolvedPath = resolveGeneratedMusicResultPath(source) || undefined;

  if (!resolvedUrl && !resolvedPath) {
    throw new Error('Music operation requires a canonical source music reference');
  }

  return {
    id: source.id,
    uuid: source.uuid,
    assetId: source.assetId ?? null,
    assetUuid: source.assetUuid ?? null,
    primaryResourceId: source.primaryResourceId ?? null,
    primaryResourceUuid: source.primaryResourceUuid ?? null,
    resourceViewId: source.resourceViewId ?? null,
    resourceViewUuid: source.resourceViewUuid ?? null,
    path: resolvedPath,
    url: resolvedUrl,
    name: source.resource?.name || source.title,
    mimeType: source.resource?.mimeType,
    type: 'music',
    role: 'reference',
    resource: source.resource ? { ...source.resource } : undefined,
    metadata: {
      title: source.title,
      duration: source.duration,
      style: source.style,
      lyrics: source.lyrics,
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
};

const buildMusicGenerationRequest = (
  config: MusicConfig,
): MagicStudioMusicGenerationRequest => ({
  prompt: config.prompt,
  title: safeString(config.title) || undefined,
  lyrics: safeString(config.lyrics) || undefined,
  style: safeString(config.style) || undefined,
  duration: config.duration || 180,
  model: normalizeMusicModel(config.model),
  customMode: config.customMode,
  instrumental: config.instrumental,
});

const buildMusicSimilarRequest = (
  input: MusicSimilarExecutionInput,
): MagicStudioMusicSimilarRequest => ({
  source: buildSourceMusicInputRef(input.source),
  duration: input.duration,
  model: input.model ? normalizeMusicModel(input.model) : undefined,
  idempotencyKey: safeString(input.idempotencyKey) || undefined,
});

const buildMusicRemixRequest = (
  input: MusicRemixExecutionInput,
): MagicStudioMusicRemixRequest => {
  const normalizedStyle = safeString(input.style);
  if (!normalizedStyle) {
    throw new Error('Music remix requires a target style');
  }

  return {
    source: buildSourceMusicInputRef(input.source),
    style: normalizedStyle,
    model: input.model ? normalizeMusicModel(input.model) : undefined,
    idempotencyKey: safeString(input.idempotencyKey) || undefined,
  };
};

const buildMusicExtendRequest = (
  input: MusicExtendExecutionInput,
): MagicStudioMusicExtendRequest => ({
  source: buildSourceMusicInputRef(input.source),
  extendDuration: input.extendDuration,
  style: safeString(input.style) || undefined,
  model: input.model ? normalizeMusicModel(input.model) : undefined,
  idempotencyKey: safeString(input.idempotencyKey) || undefined,
});

const resolveFinalTask = async (
  task: MagicStudioGenerationTask,
): Promise<MagicStudioGenerationTask> => {
  if (shouldReturnTask(task)) {
    return task;
  }

  const taskId = safeIdString(task.taskId);
  if (!taskId) {
    throw new Error(task.errorMessage || 'Music generation did not return a task id');
  }

  const serverClient = createServerClient();
  return waitForCanonicalTaskResult({
    taskId,
    readTask: async (readTaskId) =>
      (await serverClient.readMusicGenerationTask(readTaskId)).data || null,
    shouldReturnTask,
    waitMs: TASK_POLL_INTERVAL_MS,
    maxAttempts: TASK_POLL_MAX_ATTEMPTS,
    timeoutMessage: 'Music generation timed out before output became available',
  });
};

const assertTaskSucceeded = (task: MagicStudioGenerationTask): void => {
  if (task.status === 'failed' || task.status === 'cancelled') {
    throw new Error(
      task.errorMessage || 'Music generation did not produce a canonical artifact',
    );
  }
};

const createCanonicalMusicTask = async ({
  mode,
  createTask,
}: {
  mode: MusicWorkflowMode;
  createTask: (serverClient: MusicServerClient) => Promise<{
    data?: MagicStudioGenerationTask;
  }>;
}): Promise<MagicStudioGenerationTask> => {
  await assertRuntimeMagicStudioExecutionOperationReady(
    'music-generation',
    resolveOperationKey(mode),
    { feature: 'MusicService' },
  );

  const serverClient = createServerClient();
  const response = await createTask(serverClient);
  const task = response.data;

  if (!task) {
    throw new Error('Music generation did not return a task payload');
  }

  return task;
};

const executeMusicTask = async ({
  mode,
  createTask,
  context,
}: {
  mode: MusicWorkflowMode;
  createTask: (serverClient: MusicServerClient) => Promise<{
    data?: MagicStudioGenerationTask;
  }>;
  context: MusicTaskExecutionContext;
}): Promise<GenerationOutcome> => {
  const task = await createCanonicalMusicTask({
    mode,
    createTask,
  });
  const finalTask = await resolveFinalTask(task);
  assertTaskSucceeded(finalTask);
  return mapCanonicalMusicTaskToGenerationOutcome(finalTask, context);
};

class MusicService {
  isConfigured(): boolean {
    return true;
  }

  async generateMusic(config: MusicConfig): Promise<GenerationOutcome> {
    const normalizedTitle = safeString(config.title) || 'Generated Music';
    const normalizedLyrics = safeString(config.lyrics) || undefined;
    const normalizedStyle = safeString(config.style) || undefined;
    const normalizedModel = normalizeMusicModel(config.model);

    return executeMusicTask({
      mode: 'generate',
      createTask: (serverClient) =>
        serverClient.createMusicGenerationTask(buildMusicGenerationRequest({
          ...config,
          model: normalizedModel,
        })),
      context: {
        mode: resolveOutcomeMode('generate'),
        prompt: config.prompt,
        title: normalizedTitle,
        lyrics: normalizedLyrics,
        style: normalizedStyle,
        duration: config.duration || 180,
        model: normalizedModel,
        instrumental: config.instrumental,
        customMode: config.customMode,
      },
    });
  }

  async generateSimilar(input: MusicSimilarExecutionInput): Promise<GenerationOutcome> {
    const normalizedModel = input.model
      ? normalizeMusicModel(input.model)
      : undefined;

    return executeMusicTask({
      mode: 'similar',
      createTask: (serverClient) =>
        serverClient.createMusicSimilarTask(buildMusicSimilarRequest({
          ...input,
          model: normalizedModel,
        })),
      context: {
        mode: resolveOutcomeMode('similar'),
        prompt: `Generate similar music for ${input.source.title || 'source track'}`,
        title: `${input.source.title || 'Generated Music'} Similar`,
        style: input.source.style,
        duration: input.duration || input.source.duration,
        model: normalizedModel,
        source: input.source,
        parameters: {
          operation: 'similar',
        },
        providerPayload: {
          operation: 'similar',
        },
      },
    });
  }

  async remixMusic(input: MusicRemixExecutionInput): Promise<GenerationOutcome> {
    const normalizedStyle = safeString(input.style);
    if (!normalizedStyle) {
      throw new Error('Music remix requires a target style');
    }
    const normalizedModel = input.model
      ? normalizeMusicModel(input.model)
      : undefined;

    return executeMusicTask({
      mode: 'remix',
      createTask: (serverClient) =>
        serverClient.createMusicRemixTask(buildMusicRemixRequest({
          ...input,
          style: normalizedStyle,
          model: normalizedModel,
        })),
      context: {
        mode: resolveOutcomeMode('remix'),
        prompt: `Remix music in ${normalizedStyle} style`,
        title: `${input.source.title || 'Generated Music'} Remix`,
        style: normalizedStyle,
        duration: input.source.duration,
        model: normalizedModel,
        source: input.source,
        parameters: {
          operation: 'remix',
          style: normalizedStyle,
        },
        providerPayload: {
          operation: 'remix',
          style: normalizedStyle,
        },
      },
    });
  }

  async extendMusic(input: MusicExtendExecutionInput): Promise<GenerationOutcome> {
    const normalizedStyle = safeString(input.style) || undefined;
    const normalizedModel = input.model
      ? normalizeMusicModel(input.model)
      : undefined;

    return executeMusicTask({
      mode: 'extend',
      createTask: (serverClient) =>
        serverClient.createMusicExtendTask(buildMusicExtendRequest({
          ...input,
          style: normalizedStyle,
          model: normalizedModel,
        })),
      context: {
        mode: resolveOutcomeMode('extend'),
        prompt: 'Extend existing music',
        title: `${input.source.title || 'Generated Music'} Extend`,
        style: normalizedStyle || input.source.style,
        duration: input.source.duration + input.extendDuration,
        model: normalizedModel,
        source: input.source,
        parameters: {
          operation: 'extend',
          extendDuration: input.extendDuration,
          style: normalizedStyle || null,
        },
        providerPayload: {
          operation: 'extend',
          extendDuration: input.extendDuration,
          style: normalizedStyle || null,
        },
      },
    });
  }
}

export const musicService = new MusicService();
