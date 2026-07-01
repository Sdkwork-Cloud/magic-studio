import {
  createGenerationExecution,
  createGenerationOutcomeFromExecution,
} from '@sdkwork/magic-studio-core/ai';
import { resolveAssetUrlByAssetIdFirst } from '@sdkwork/magic-studio-assets/asset-center';
import {
  assertRuntimeMagicStudioExecutionOperationReady,
  createRuntimeMagicStudioServerClient,
  readDefaultPlatformRuntime,
} from '@sdkwork/magic-studio-core/sdk';
import { waitForCanonicalTaskResult } from '@sdkwork/magic-studio-core/services';
import type {
  MagicStudioGenerationArtifact,
  MagicStudioGenerationPromptEnhanceRequest,
  MagicStudioGenerationPromptEnhanceResult,
  MagicStudioGenerationTask,
} from '@sdkwork/magic-studio-server';
import {
  createClientEntityIdentity,
} from '@sdkwork/magic-studio-types/entity';
import {
  type AgiExecutionStatus,
  type AgiGenerationMode,
  type GenerationExecution,
  type GenerationOutcome,
  type MediaInputRef,
} from '@sdkwork/magic-studio-types/agi';

import {
  type LipSyncStage,
  resolveCanonicalVideoGenerationType,
  type UnifiedVideoGenerationRequest,
  type VideoAspectRatio,
  type VideoDuration,
  type VideoResolution,
} from '../entities';
import {
  readVideoExecutionTarget,
  type VideoExecutionOperation,
} from './videoRequestBuilder';

interface ApiEnvelope<T> {
  data?: T;
  code?: string | number;
  msg?: string;
  message?: string;
}

interface VideoArtifactLike {
  url: string;
  mimeType: string;
  name: string;
  posterUrl?: string;
  width?: number;
  height?: number;
  duration?: number;
  metadata?: Record<string, unknown>;
}

const TASK_POLL_INTERVAL_MS = 2000;
const TASK_POLL_MAX_ATTEMPTS = 120;
const SUCCESS_CODES = new Set(['0', '200', '2000']);

const lipSyncRequestCache = new Map<string, UnifiedVideoGenerationRequest>();

type GenerationTaskResponseLike =
  | ApiEnvelope<MagicStudioGenerationTask>
  | MagicStudioGenerationTask
  | undefined;
type VideoServerClient = ReturnType<typeof createRuntimeMagicStudioServerClient>;

const toServiceError = (code: string, message: string): Error & { code: string } => {
  const error = new Error(message) as Error & { code: string };
  error.code = code;
  return error;
};

const unwrapApiData = (
  payload: unknown,
  fallbackMessage: string
): unknown => {
  if (!payload) {
    return undefined;
  }

  if (typeof payload === 'object') {
    const envelope = payload as ApiEnvelope<unknown>;
    const isEnvelope =
      'data' in envelope ||
      'code' in envelope ||
      'msg' in envelope ||
      'message' in envelope;
    if (!isEnvelope) {
      return payload;
    }

    const code = safeIdString(envelope.code);
    if (code && !SUCCESS_CODES.has(code)) {
      throw new Error(
        normalizeString(envelope.msg) ||
        normalizeString(envelope.message) ||
        fallbackMessage
      );
    }
    if (envelope.data !== undefined) {
      return envelope.data;
    }
    return undefined;
  }

  return payload;
};

const normalizeString = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const safeIdString = (value: unknown): string => {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return '';
};

const toOptionalNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return undefined;
};

const pickFirstString = (...values: unknown[]): string | null => {
  for (const value of values) {
    const normalized = normalizeString(value);
    if (normalized) {
      return normalized;
    }
  }
  return null;
};

const VIDEO_RESOLUTIONS = new Set<VideoResolution>(['720p', '1080p', '4k']);
const VIDEO_ASPECT_RATIOS = new Set<VideoAspectRatio>([
  '16:9',
  '9:16',
  '1:1',
  '4:3',
  '3:4',
  '21:9',
]);

const isVideoDuration = (value: unknown): value is VideoDuration => {
  const normalized = normalizeString(value);
  return Boolean(normalized && /^\d+(?:\.\d+)?s$/.test(normalized));
};

const isVideoResolution = (value: unknown): value is VideoResolution => {
  const normalized = normalizeString(value);
  return Boolean(normalized && VIDEO_RESOLUTIONS.has(normalized as VideoResolution));
};

const isVideoAspectRatio = (value: unknown): value is VideoAspectRatio => {
  const normalized = normalizeString(value);
  return Boolean(normalized && VIDEO_ASPECT_RATIOS.has(normalized as VideoAspectRatio));
};

const readTaskDuration = (value: unknown): VideoDuration =>
  isVideoDuration(value) ? value : '5s';

const readTaskResolution = (value: unknown): VideoResolution =>
  isVideoResolution(value) ? value : '720p';

const readTaskAspectRatio = (value: unknown): VideoAspectRatio =>
  isVideoAspectRatio(value) ? value : '16:9';

const resolveEnhancedPrompt = (
  payload:
    | MagicStudioGenerationPromptEnhanceResult
    | ApiEnvelope<MagicStudioGenerationPromptEnhanceResult>
    | undefined,
): string => {
  const data = unwrapApiData(
    payload as
      | MagicStudioGenerationPromptEnhanceResult
      | ApiEnvelope<MagicStudioGenerationPromptEnhanceResult>
      | undefined,
    'Failed to enhance video prompt.'
  ) as MagicStudioGenerationPromptEnhanceResult | undefined;
  const prompt = normalizeString(data?.prompt);
  if (!prompt) {
    throw new Error('Video prompt enhancement returned an empty prompt');
  }
  return prompt;
};

const isRemoteUrl = (value: string | null | undefined): boolean =>
  typeof value === 'string' &&
  /^(https?:\/\/|data:)/i.test(value.trim());

const decodeDataMediaSource = (
  source: string,
): { mimeType: string; data: string } | null => {
  const matches = source.match(/^data:(.+);base64,(.+)$/);
  if (!matches) {
    return null;
  }

  return {
    mimeType: matches[1],
    data: matches[2],
  };
};

const resolveVideoGenerationMode = (
  request: UnifiedVideoGenerationRequest
): AgiGenerationMode => {
  switch (resolveCanonicalVideoGenerationType(request.generationType)) {
    case 'lip-sync':
      return 'lip-sync';
    case 'extend':
      return 'extend';
    case 'style-transfer':
    case 'face-swap':
      return 'style-transfer';
    case 'image-to-video':
    case 'subject_ref':
    case 'smart_reference':
    case 'smart_multi':
    case 'start_end':
    case 'image':
    case 'multi-image':
    case 'avatar':
      return 'image-to-video';
    case 'text':
    case 'text-to-video':
      return 'text-to-video';
    default:
      break;
  }

  if (request.assets.some((asset) => asset.type === 'video')) {
    return 'style-transfer';
  }
  if (request.assets.some((asset) => asset.type === 'image')) {
    return 'image-to-video';
  }
  return 'text-to-video';
};

const mapVideoAssetRoleToInputRole = (role: string): MediaInputRef['role'] => {
  switch (role) {
    case 'source_video':
      return 'source-video';
    case 'source_image':
      return 'source-image';
    case 'driver_audio':
      return 'driver-audio';
    case 'start_frame':
      return 'start-frame';
    case 'end_frame':
      return 'end-frame';
    case 'subject_reference':
    case 'reference_1':
    case 'reference_2':
    case 'reference_3':
    case 'reference_4':
    case 'keyframe_1':
    case 'keyframe_2':
    case 'keyframe_3':
    case 'keyframe_4':
      return 'reference';
    default:
      return 'input';
  }
};

const buildVideoInputRefs = (
  request: UnifiedVideoGenerationRequest
): MediaInputRef[] =>
  request.assets.map((asset) => {
    if (asset.ref) {
      return asset.ref;
    }

    return {
      ...createClientEntityIdentity(),
      assetId: asset.assetId || null,
      assetUuid: asset.assetUuid || null,
      primaryResourceId: asset.primaryResourceId || null,
      primaryResourceUuid: asset.primaryResourceUuid || null,
      resourceViewId: asset.resourceViewId || null,
      resourceViewUuid: asset.resourceViewUuid || null,
      type: asset.type,
      role: mapVideoAssetRoleToInputRole(asset.role),
      metadata: {
        originalRole: asset.role,
        value: asset.value,
      },
    };
  });

const buildVideoGenerationParameters = (
  request: UnifiedVideoGenerationRequest
): Record<string, unknown> => ({
  generationType: request.generationType,
  duration: request.duration,
  resolution: request.resolution,
  aspectRatio: request.aspectRatio,
  videoStyleId: request.videoStyle.id,
  videoStylePrompt: request.videoStyle.prompt,
  assetCount: request.assets.length,
  options: request.options,
});

const mapTaskStatus = (
  status?: MagicStudioGenerationTask['status']
): AgiExecutionStatus => {
  switch ((status || '').toLowerCase()) {
    case 'processing':
      return 'processing';
    case 'succeeded':
      return 'succeeded';
    case 'failed':
      return 'failed';
    case 'cancelled':
      return 'cancelled';
    case 'queued':
    default:
      return 'queued';
  }
};

const isTerminalStatus = (task?: MagicStudioGenerationTask): boolean => {
  const normalized = (task?.status || '').toLowerCase();
  return normalized === 'succeeded' || normalized === 'failed' || normalized === 'cancelled';
};

const resolveLipSyncStage = (
  status?: MagicStudioGenerationTask['status']
): LipSyncStage => {
  switch ((status || '').toLowerCase()) {
    case 'processing':
      return 'processing';
    case 'succeeded':
      return 'succeeded';
    case 'failed':
      return 'failed';
    case 'cancelled':
      return 'canceled';
    case 'queued':
    default:
      return 'queued';
  }
};

const hasRenderableArtifactUrl = (
  artifact: MagicStudioGenerationArtifact | null | undefined,
): artifact is MagicStudioGenerationArtifact => Boolean(normalizeString(artifact?.url));

const resolvePrimaryVideoArtifact = (
  task: MagicStudioGenerationTask,
): MagicStudioGenerationArtifact | null => {
  if (hasRenderableArtifactUrl(task.primaryArtifact)) {
    return task.primaryArtifact;
  }

  return (
    task.artifacts.find(
      (artifact) => artifact.type === 'video' && hasRenderableArtifactUrl(artifact),
    ) ||
    task.artifacts.find((artifact) => hasRenderableArtifactUrl(artifact)) ||
    null
  );
};

const resolveVideoArtifact = (
  task: MagicStudioGenerationTask,
  request: UnifiedVideoGenerationRequest
): VideoArtifactLike | null => {
  const artifact = resolvePrimaryVideoArtifact(task);
  const url = normalizeString(artifact?.url);
  if (!artifact || !url) {
    return null;
  }

  const metadata = {
    ...(artifact.metadata || {}),
    generationType: request.generationType,
    videoStyleId: request.videoStyle.id || null,
    videoStylePrompt: request.videoStyle.prompt || null,
    taskStatus: task.status || null,
  } as Record<string, unknown>;

  return {
    url,
    posterUrl: normalizeString(artifact.posterUrl) || undefined,
    mimeType: normalizeString(artifact.mimeType) || 'video/mp4',
    name: normalizeString(artifact.name) || `generated-video-${safeIdString(task.taskId)}.mp4`,
    width: toOptionalNumber(artifact.width),
    height: toOptionalNumber(artifact.height),
    duration: toOptionalNumber(artifact.duration),
    metadata,
  };
};

const buildExecutionProviderPayload = (
  task: MagicStudioGenerationTask,
  request: UnifiedVideoGenerationRequest,
  mode: AgiGenerationMode
): Record<string, unknown> => ({
  ...(task.providerPayload || {}),
  taskProduct: task.product,
  taskMode: task.mode,
  taskStatus: task.status || null,
  generationType: request.generationType,
  videoStyleId: request.videoStyle.id || null,
  videoStylePrompt: request.videoStyle.prompt || null,
  ...(mode === 'lip-sync'
    ? {
        stage: resolveLipSyncStage(task.status),
        lipSyncSourceType:
          normalizeString(request.options?.['lipSyncSourceType']) || null,
        lipSyncDriverType:
          normalizeString(request.options?.['lipSyncDriverType']) || null,
      }
    : {}),
  ...(normalizeString(task.errorCode)
    ? { errorCode: normalizeString(task.errorCode) }
    : {}),
  ...(normalizeString(task.errorMessage)
    ? { errorMessage: normalizeString(task.errorMessage) }
    : {}),
});

const createExecutionSnapshot = (
  task: MagicStudioGenerationTask,
  request: UnifiedVideoGenerationRequest,
  mode: AgiGenerationMode
): GenerationExecution => {
  return createGenerationExecution({
    product: 'video',
    mode,
    provider: task.provider || 'runtime-video',
    providerModel: task.providerModel || request.model || 'video-generation',
    prompt: task.prompt ?? request.prompt,
    negativePrompt: task.negativePrompt ?? request.negativePrompt,
    inputRefs: task.inputRefs.length > 0 ? task.inputRefs : buildVideoInputRefs(request),
    parameters: {
      ...buildVideoGenerationParameters(request),
      ...(task.parameters || {}),
    },
    providerPayload: buildExecutionProviderPayload(task, request, mode),
    remoteJobId: task.remoteJobId || safeIdString(task.taskId) || null,
    status: mapTaskStatus(task.status),
    progress: typeof task.progress === 'number' ? task.progress : undefined,
    error: task.errorMessage || null,
  });
};

const buildExecutionFromTask = (
  task: MagicStudioGenerationTask,
  request: UnifiedVideoGenerationRequest,
  mode: AgiGenerationMode
): GenerationExecution => {
  const execution = createExecutionSnapshot(task, request, mode);

  const artifact = resolveVideoArtifact(task, request);
  if (!artifact) {
    return execution;
  }

  return createGenerationOutcomeFromExecution(execution, {
    artifact: {
      type: 'video',
      url: artifact.url,
      posterUrl: artifact.posterUrl,
      mimeType: artifact.mimeType,
      name: artifact.name,
      width: artifact.width,
      height: artifact.height,
      duration: artifact.duration,
      metadata: artifact.metadata,
    },
    status: mapTaskStatus(task.status),
    progress: typeof task.progress === 'number' ? task.progress : undefined,
    providerPayload: buildExecutionProviderPayload(task, request, mode),
    remoteJobId: task.remoteJobId || safeIdString(task.taskId) || null,
    error: task.errorMessage || null,
  }).execution;
};

const buildOutcomeFromTask = (
  task: MagicStudioGenerationTask,
  request: UnifiedVideoGenerationRequest
): GenerationOutcome => {
  const mode = resolveVideoGenerationMode(request);
  const execution = createExecutionSnapshot(task, request, mode);
  const artifact = resolveVideoArtifact(task, request);
  if (!artifact) {
    throw new Error(task.errorMessage || 'Video generation did not return a video artifact');
  }

  const outcome = createGenerationOutcomeFromExecution(execution, {
    artifact: {
      type: 'video',
      url: artifact.url,
      posterUrl: artifact.posterUrl,
      mimeType: artifact.mimeType,
      name: artifact.name,
      width: artifact.width,
      height: artifact.height,
      duration: artifact.duration,
      metadata: artifact.metadata,
    },
    status: mapTaskStatus(task.status),
    progress: typeof task.progress === 'number' ? task.progress : undefined,
    providerPayload: buildExecutionProviderPayload(task, request, mode),
    remoteJobId: task.remoteJobId || safeIdString(task.taskId) || null,
    error: task.errorMessage || null,
  });

  return outcome;
};

const shouldUseImageToVideoEndpoint = (
  request: UnifiedVideoGenerationRequest
): boolean => {
  const hasVideoAsset = request.assets.some((asset) => asset.type === 'video');
  const hasImageAsset = request.assets.some((asset) => asset.type === 'image');
  return hasImageAsset && !hasVideoAsset;
};

const resolveLipSyncSourceType = (
  request: UnifiedVideoGenerationRequest
): 'image' | 'video' => {
  const configured = normalizeString(request.options?.['lipSyncSourceType'])?.toLowerCase();
  if (configured === 'image') {
    return 'image';
  }
  if (configured === 'video') {
    return 'video';
  }
  return request.assets.some((asset) => asset.role === 'source_image') ? 'image' : 'video';
};

const resolveLipSyncDriverType = (
  request: UnifiedVideoGenerationRequest
): 'audio' | 'tts' => {
  const configured = normalizeString(request.options?.['lipSyncDriverType'])?.toLowerCase();
  if (configured === 'tts') {
    return 'tts';
  }
  return 'audio';
};

const getVideoServerClient = (): VideoServerClient => {
  const runtime = readDefaultPlatformRuntime('VideoService');
  return createRuntimeMagicStudioServerClient(runtime);
};

const assertVideoExecutionOperationReady = async (
  operation: VideoExecutionOperation
): Promise<void> => {
  await assertRuntimeMagicStudioExecutionOperationReady(
    'video-generation',
    operation,
    { feature: 'VideoService' }
  );
};

const createTaskBackedLipSyncRequest = (
  task: MagicStudioGenerationTask,
): UnifiedVideoGenerationRequest => ({
  generationType: 'lip-sync',
  assets: [],
  prompt: task.prompt || '',
  negativePrompt: task.negativePrompt || '',
  duration: readTaskDuration(task.parameters?.duration),
  resolution: readTaskResolution(task.parameters?.resolution),
  aspectRatio: readTaskAspectRatio(task.parameters?.aspectRatio),
  model: task.providerModel || 'video-generation',
  videoStyle: {
    id: pickFirstString(task.parameters?.videoStyleId) || 'none',
    prompt: pickFirstString(task.parameters?.videoStylePrompt) || '',
  },
  options: {
    taskId: task.taskId,
    remoteJobId: task.remoteJobId,
  },
});

const assertTaskSucceeded = (
  task: MagicStudioGenerationTask | null,
  fallbackMessage: string
): MagicStudioGenerationTask => {
  if (!task) {
    throw new Error(fallbackMessage);
  }

  const status = (task.status || '').toLowerCase();
  if (status === 'failed' || status === 'cancelled') {
    const error = toServiceError(
      normalizeString(task.errorCode) || 'VIDEO_GENERATION_FAILED',
      normalizeString(task.errorMessage) || fallbackMessage
    );
    throw error;
  }

  return task;
};

const pollTaskResult = async (
  taskId: string,
  serverClient: VideoServerClient,
  timeoutMessage: string,
): Promise<MagicStudioGenerationTask | null> => {
  return waitForCanonicalTaskResult({
    taskId,
    readTask: async (readTaskId) => {
      const response = await serverClient.readVideoGenerationTask(readTaskId);
      return unwrapApiData(
        response as ApiEnvelope<MagicStudioGenerationTask> | MagicStudioGenerationTask,
        'Failed to load video generation task status.'
      ) as MagicStudioGenerationTask | undefined;
    },
    shouldReturnTask: isTerminalStatus,
    waitMs: TASK_POLL_INTERVAL_MS,
    maxAttempts: TASK_POLL_MAX_ATTEMPTS,
    timeoutMessage,
  });
};

const executeStandardVideoTask = async (
  request: UnifiedVideoGenerationRequest,
  serverClient: VideoServerClient,
  createTask: () => Promise<GenerationTaskResponseLike>
): Promise<GenerationOutcome> => {
  const createResponse = await createTask();

  const task = unwrapApiData(
    createResponse as ApiEnvelope<MagicStudioGenerationTask> | MagicStudioGenerationTask,
    'Failed to start video generation.'
  ) as MagicStudioGenerationTask | undefined;

  const completedTask = assertTaskSucceeded(
    task || null,
    'Video generation did not return a task payload'
  );

  if (resolveVideoArtifact(completedTask, request)) {
    return buildOutcomeFromTask(completedTask, request);
  }

  const taskId = safeIdString(completedTask.taskId);
  if (!taskId) {
    throw new Error(completedTask.errorMessage || 'Video generation did not return a task id');
  }

  const finalTask = assertTaskSucceeded(
    await pollTaskResult(
      taskId,
      serverClient,
      'Video generation timed out before output became available'
    ),
    'Video generation timed out before output became available'
  );

  if (!resolveVideoArtifact(finalTask, request)) {
    throw new Error(finalTask.errorMessage || 'Video generation did not return a video artifact');
  }

  return buildOutcomeFromTask(finalTask, request);
};

export interface VideoPromptEnhanceInput {
  prompt: string;
  style?: string;
  language?: string;
  maxWords?: number;
}

export const videoService = {
  isConfigured: () => true,

  enhancePrompt: async ({
    prompt,
    style,
    language,
    maxWords,
  }: VideoPromptEnhanceInput): Promise<string> => {
    await assertVideoExecutionOperationReady('enhance-prompt');

    const normalizedPrompt = normalizeString(prompt);
    if (!normalizedPrompt) {
      return prompt;
    }

    const normalizedStyle = normalizeString(style);
    const normalizedLanguage = normalizeString(language);
    const requestBody: MagicStudioGenerationPromptEnhanceRequest = {
      prompt: normalizedPrompt,
      scene: 'video-generation',
      ...(normalizedStyle ? { style: normalizedStyle } : {}),
      ...(normalizedLanguage ? { language: normalizedLanguage } : {}),
      maxWords: maxWords ?? 120,
    };
    const serverClient = getVideoServerClient();
    const response = await serverClient.enhanceVideoGenerationPrompt(requestBody);

    return resolveEnhancedPrompt(response);
  },

  generateVideo: async (request: UnifiedVideoGenerationRequest): Promise<GenerationOutcome> => {
    if (request.generationType === 'lip-sync') {
      throw toServiceError('LIPSYNC_USE_TASK_API', 'Lip Sync requests must use createLipSyncTask.');
    }
    const generationType = resolveCanonicalVideoGenerationType(request.generationType);

    const executionTarget = readVideoExecutionTarget(request);
    if (!executionTarget.operation) {
      throw toServiceError(
        'VIDEO_OPERATION_NOT_IMPLEMENTED',
        executionTarget.unavailableReason ||
          'Video generation operation is not implemented in the canonical video service yet.'
      );
    }

    await assertVideoExecutionOperationReady(executionTarget.operation);

    const serverClient = getVideoServerClient();
    if (generationType === 'style-transfer') {
      return executeStandardVideoTask(
        request,
        serverClient,
        () => serverClient.createVideoStyleTransferTask(request)
      );
    }
    if (generationType === 'extend') {
      return executeStandardVideoTask(
        request,
        serverClient,
        () => serverClient.createVideoExtendTask(request)
      );
    }

    if (shouldUseImageToVideoEndpoint(request)) {
      return executeStandardVideoTask(
        request,
        serverClient,
        () => serverClient.createImageToVideoTask(request)
      );
    }

    return executeStandardVideoTask(
      request,
      serverClient,
      () => serverClient.createVideoGenerationTask(request)
    );
  },

  createLipSyncTask: async (
    request: UnifiedVideoGenerationRequest
  ): Promise<GenerationExecution> => {
    await assertVideoExecutionOperationReady('lip-sync');

    const sourceType = resolveLipSyncSourceType(request);
    const driverType = resolveLipSyncDriverType(request);
    const sourceRole = sourceType === 'image' ? 'source_image' : 'source_video';
    const sourceAsset = request.assets.find((asset) => asset.role === sourceRole);
    const driverAudioAsset = request.assets.find((asset) => asset.role === 'driver_audio');

    if (!sourceAsset) {
      throw toServiceError('LIPSYNC_INPUT_INVALID', 'Lip Sync requires source media.');
    }
    if (driverType === 'audio' && !driverAudioAsset) {
      throw toServiceError('LIPSYNC_INPUT_INVALID', 'Lip Sync requires an audio driver.');
    }
    if (driverType === 'tts' && !normalizeString(request.prompt)) {
      throw toServiceError('LIPSYNC_INPUT_INVALID', 'Lip Sync requires text when driverType=tts.');
    }

    const serverClient = getVideoServerClient();
    const response = await serverClient.createVideoLipSyncTask(request);

    const task = unwrapApiData(
      response as ApiEnvelope<MagicStudioGenerationTask> | MagicStudioGenerationTask,
      'Failed to start lip sync task.'
    ) as MagicStudioGenerationTask | undefined;
    if (!task) {
      throw new Error('Lip Sync creation did not return a task payload');
    }
    assertTaskSucceeded(task, 'Failed to start lip sync task.');

    const taskId = safeIdString(task.taskId);
    if (taskId) {
      lipSyncRequestCache.set(taskId, request);
    }

    return buildExecutionFromTask(task, request, 'lip-sync');
  },

  queryLipSyncTask: async (remoteJobId: string): Promise<GenerationExecution> => {
    await assertVideoExecutionOperationReady('read-task');

    const serverClient = getVideoServerClient();
    const response = await serverClient.readVideoGenerationTask(remoteJobId);
    const task = unwrapApiData(
      response as ApiEnvelope<MagicStudioGenerationTask> | MagicStudioGenerationTask,
      'Failed to query lip sync task.'
    ) as MagicStudioGenerationTask | undefined;
    if (!task) {
      throw toServiceError('LIPSYNC_TASK_NOT_FOUND', `Lip Sync task not found: ${remoteJobId}`);
    }

    const request =
      lipSyncRequestCache.get(remoteJobId) ||
      lipSyncRequestCache.get(safeIdString(task.taskId)) ||
      createTaskBackedLipSyncRequest(task);

    return buildExecutionFromTask(task, request, 'lip-sync');
  },

  cancelLipSyncTask: async (remoteJobId: string): Promise<GenerationExecution> => {
    await assertVideoExecutionOperationReady('cancel-task');

    const serverClient = getVideoServerClient();
    const response = await serverClient.cancelVideoGenerationTask(remoteJobId);
    const task = unwrapApiData(
      response as ApiEnvelope<MagicStudioGenerationTask> | MagicStudioGenerationTask,
      'Failed to cancel lip sync task.'
    ) as MagicStudioGenerationTask | undefined;
    if (!task) {
      throw new Error('Lip Sync cancellation did not return a task payload');
    }

    const request =
      lipSyncRequestCache.get(remoteJobId) ||
      lipSyncRequestCache.get(safeIdString(task.taskId)) ||
      createTaskBackedLipSyncRequest(task);

    return buildExecutionFromTask(task, request, 'lip-sync');
  },

  resolveMediaSource: async (source: string): Promise<{ mimeType: string; data: string } | null> => {
    if (!source) {
      return null;
    }

    const directMediaSource = decodeDataMediaSource(source);
    if (directMediaSource) {
      return directMediaSource;
    }

    const resolvedSource = await resolveAssetUrlByAssetIdFirst(source);
    return resolvedSource ? decodeDataMediaSource(resolvedSource) : null;
  },
};
