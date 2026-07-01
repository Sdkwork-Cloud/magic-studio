import type {
  MagicStudioApiEnvelope,
  MagicStudioGenerationArtifact,
  MagicStudioGenerationTask,
  MagicStudioServerClient,
  MagicStudioVideoGenerationRequest,
} from '@sdkwork/magic-studio-server';

type CreateGenerationVideoRequest =
  Parameters<MagicStudioServerClient['createVideoGenerationTask']>[0];
type CreateGenerationVideoResponse =
  Awaited<ReturnType<MagicStudioServerClient['createVideoGenerationTask']>>;
type ReadVideoTaskRequest = Parameters<MagicStudioServerClient['readVideoGenerationTask']>[0];
type ReadVideoTaskResponse =
  Awaited<ReturnType<MagicStudioServerClient['readVideoGenerationTask']>>;
type CancelVideoTaskRequest = Parameters<MagicStudioServerClient['cancelVideoGenerationTask']>[0];
type CancelVideoTaskResponse =
  Awaited<ReturnType<MagicStudioServerClient['cancelVideoGenerationTask']>>;

const validEnvelopeBase = {
  requestId: 'req-video-generation-1',
  timestamp: '2026-04-25T00:00:00.000Z',
  meta: {
    version: '2026-04-25',
  },
};

const validVideoGenerationRequest = {
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
} satisfies CreateGenerationVideoRequest;

const validVideoArtifact = {
  id: 'artifact-video-1',
  uuid: 'artifact-video-uuid-1',
  type: 'video',
  role: 'primary',
  url: 'https://example.com/generated-video.mp4',
  posterUrl: 'https://example.com/generated-video.jpg',
  mimeType: 'video/mp4',
  name: 'generated-video.mp4',
  width: 1280,
  height: 720,
  duration: 5,
  metadata: {
    generationType: 'text',
  },
} satisfies MagicStudioGenerationArtifact;

const validVideoGenerationTask = {
  id: 'task-video-1',
  uuid: 'task-video-uuid-1',
  taskId: 'video-task-1',
  product: 'video',
  mode: 'text-to-video',
  status: 'succeeded',
  prompt: validVideoGenerationRequest.prompt,
  negativePrompt: validVideoGenerationRequest.negativePrompt,
  provider: 'runtime-video',
  providerModel: 'mock-video-model',
  remoteJobId: 'video-task-1',
  progress: 100,
  inputRefs: [],
  artifacts: [validVideoArtifact],
  primaryArtifact: validVideoArtifact,
  parameters: {
    duration: '5s',
    resolution: '720p',
    aspectRatio: '16:9',
  },
  providerPayload: {
    generationType: 'text',
  },
  createdAt: '2026-04-25T00:00:00.000Z',
  updatedAt: '2026-04-25T00:00:01.000Z',
  completedAt: '2026-04-25T00:00:01.000Z',
} satisfies MagicStudioGenerationTask;

const validVideoGenerationResponse = {
  ...validEnvelopeBase,
  data: validVideoGenerationTask,
} satisfies CreateGenerationVideoResponse;

const validVideoStatusTaskId: ReadVideoTaskRequest = 'video-task-1';

const validVideoStatusResponse = {
  ...validEnvelopeBase,
  data: {
    ...validVideoGenerationTask,
    taskId: validVideoStatusTaskId,
    status: 'processing',
    progress: 40,
    artifacts: [],
    primaryArtifact: null,
    completedAt: null,
  },
} satisfies ReadVideoTaskResponse;

const validVideoCancelTaskId: CancelVideoTaskRequest = 'video-task-1';

const validVideoCancelResponse = {
  ...validEnvelopeBase,
  data: {
    ...validVideoGenerationTask,
    taskId: validVideoCancelTaskId,
    status: 'cancelled',
    progress: 40,
    cancelledAt: '2026-04-25T00:00:02.000Z',
  },
} satisfies CancelVideoTaskResponse;

const validExplicitEnvelope = {
  ...validEnvelopeBase,
  data: validVideoGenerationTask,
} satisfies MagicStudioApiEnvelope<MagicStudioGenerationTask>;

const validServerRequest = validVideoGenerationRequest satisfies MagicStudioVideoGenerationRequest;

void validVideoGenerationRequest;
void validVideoArtifact;
void validVideoGenerationTask;
void validVideoGenerationResponse;
void validVideoStatusTaskId;
void validVideoStatusResponse;
void validVideoCancelTaskId;
void validVideoCancelResponse;
void validExplicitEnvelope;
void validServerRequest;
