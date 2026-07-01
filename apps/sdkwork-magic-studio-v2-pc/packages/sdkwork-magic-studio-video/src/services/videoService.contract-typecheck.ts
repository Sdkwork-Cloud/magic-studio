import type {
  MagicStudioApiEnvelope,
  MagicStudioGenerationPromptEnhanceResult,
  MagicStudioGenerationTask,
  MagicStudioServerClient,
  MagicStudioVideoGenerationRequest,
} from '@sdkwork/magic-studio-server';

type VideoCreateRequest = Parameters<MagicStudioServerClient['createVideoGenerationTask']>[0];
type ImageToVideoRequest = Parameters<MagicStudioServerClient['createImageToVideoTask']>[0];
type VideoStyleTransferRequest =
  Parameters<MagicStudioServerClient['createVideoStyleTransferTask']>[0];
type VideoExtendRequest = Parameters<MagicStudioServerClient['createVideoExtendTask']>[0];
type VideoLipSyncRequest = Parameters<MagicStudioServerClient['createVideoLipSyncTask']>[0];
type VideoPromptEnhanceRequest =
  Parameters<MagicStudioServerClient['enhanceVideoGenerationPrompt']>[0];
type VideoReadTaskRequest = Parameters<MagicStudioServerClient['readVideoGenerationTask']>[0];
type VideoCancelTaskRequest = Parameters<MagicStudioServerClient['cancelVideoGenerationTask']>[0];

type VideoCreateResponse = Awaited<ReturnType<MagicStudioServerClient['createVideoGenerationTask']>>;
type VideoPromptEnhanceResponse =
  Awaited<ReturnType<MagicStudioServerClient['enhanceVideoGenerationPrompt']>>;

const validEnvelopeBase = {
  requestId: 'req-video-service-1',
  timestamp: '2026-04-25T00:00:00.000Z',
  meta: {
    version: '2026-04-25',
  },
};

const validVideoRequest = {
  generationType: 'text',
  assets: [],
  prompt: 'cinematic timelapse over city lights',
  negativePrompt: 'blur',
  duration: '5s',
  resolution: '720p',
  aspectRatio: '16:9',
  model: 'mock-video-model',
  videoStyle: {
    id: 'cinematic',
    prompt: 'warm cinematic lighting',
  },
  options: {
    promptExtend: true,
  },
} satisfies VideoCreateRequest;

const validImageToVideoRequest = {
  ...validVideoRequest,
  generationType: 'smart_reference',
  assets: [
    {
      role: 'reference_1',
      type: 'image',
      value: 'https://example.com/reference-1.png',
    },
  ],
} satisfies ImageToVideoRequest;

const validStyleTransferRequest = {
  ...validVideoRequest,
  generationType: 'style-transfer',
  assets: [
    {
      role: 'source_video',
      type: 'video',
      value: 'https://example.com/source-video.mp4',
    },
  ],
} satisfies VideoStyleTransferRequest;

const validVideoExtendRequest = {
  ...validStyleTransferRequest,
  generationType: 'extend',
  duration: '10s',
} satisfies VideoExtendRequest;

const validVideoLipSyncRequest = {
  ...validVideoRequest,
  generationType: 'lip-sync',
  assets: [
    {
      role: 'source_video',
      type: 'video',
      value: 'https://example.com/source.mp4',
    },
    {
      role: 'driver_audio',
      type: 'audio',
      value: 'https://example.com/driver.wav',
    },
  ],
  options: {
    lipSyncSourceType: 'video',
    lipSyncDriverType: 'audio',
  },
} satisfies VideoLipSyncRequest;

const validPromptEnhanceRequest = {
  prompt: 'make the motion more cinematic',
  scene: 'video-generation',
  style: 'warm cinematic lighting',
  language: 'en',
  maxWords: 140,
} satisfies VideoPromptEnhanceRequest;

const validVideoTask = {
  id: 'task-video-service-1',
  uuid: 'task-video-service-uuid-1',
  taskId: 'video-task-1',
  product: 'video',
  mode: 'text-to-video',
  status: 'succeeded',
  prompt: validVideoRequest.prompt,
  negativePrompt: validVideoRequest.negativePrompt,
  provider: 'runtime-video',
  providerModel: 'mock-video-model',
  remoteJobId: 'video-task-1',
  progress: 100,
  inputRefs: [],
  artifacts: [
    {
      id: 'artifact-video-service-1',
      uuid: 'artifact-video-service-uuid-1',
      type: 'video',
      role: 'primary',
      url: 'https://example.com/generated-video.mp4',
      mimeType: 'video/mp4',
      name: 'generated-video.mp4',
    },
  ],
  primaryArtifact: {
    id: 'artifact-video-service-1',
    uuid: 'artifact-video-service-uuid-1',
    type: 'video',
    role: 'primary',
    url: 'https://example.com/generated-video.mp4',
    mimeType: 'video/mp4',
    name: 'generated-video.mp4',
  },
  createdAt: '2026-04-25T00:00:00.000Z',
  updatedAt: '2026-04-25T00:00:01.000Z',
  completedAt: '2026-04-25T00:00:01.000Z',
} satisfies MagicStudioGenerationTask;

const validVideoTaskResponse = {
  ...validEnvelopeBase,
  data: validVideoTask,
} satisfies VideoCreateResponse;

const validPromptEnhanceResponse = {
  ...validEnvelopeBase,
  data: {
    prompt: 'enhanced cinematic prompt',
  },
} satisfies VideoPromptEnhanceResponse;

const validTaskEnvelope = {
  ...validEnvelopeBase,
  data: validVideoTask,
} satisfies MagicStudioApiEnvelope<MagicStudioGenerationTask>;

const validPromptEnvelope = {
  ...validEnvelopeBase,
  data: {
    prompt: 'enhanced cinematic prompt',
  },
} satisfies MagicStudioApiEnvelope<MagicStudioGenerationPromptEnhanceResult>;

const validReadTaskId: VideoReadTaskRequest = 'video-task-1';
const validCancelTaskId: VideoCancelTaskRequest = 'video-task-1';
const validServerRequest = validVideoRequest satisfies MagicStudioVideoGenerationRequest;

void validVideoRequest;
void validImageToVideoRequest;
void validStyleTransferRequest;
void validVideoExtendRequest;
void validVideoLipSyncRequest;
void validPromptEnhanceRequest;
void validVideoTask;
void validVideoTaskResponse;
void validPromptEnhanceResponse;
void validTaskEnvelope;
void validPromptEnvelope;
void validReadTaskId;
void validCancelTaskId;
void validServerRequest;
