import type {
  MagicStudioApiEnvelope,
  MagicStudioGenerationTask,
  MagicStudioServerClient,
  MagicStudioVideoGenerationRequest,
} from '@sdkwork/magic-studio-server';

type ExtendVideoRequest = Parameters<MagicStudioServerClient['createVideoExtendTask']>[0];
type ExtendVideoResponse = Awaited<ReturnType<MagicStudioServerClient['createVideoExtendTask']>>;

const validEnvelopeBase = {
  requestId: 'req-video-extend-1',
  timestamp: '2026-04-25T00:00:00.000Z',
  meta: {
    version: '2026-04-25',
  },
};

const validExtendVideoRequest = {
  generationType: 'extend',
  assets: [
    {
      role: 'source_video',
      type: 'video',
      value: 'https://example.com/source-video.mp4',
    },
  ],
  prompt: 'cinematic continuation',
  negativePrompt: '',
  duration: '10s',
  resolution: '1080p',
  aspectRatio: '16:9',
  model: 'mock-extend-model',
  videoStyle: {
    id: 'none',
    prompt: '',
  },
} satisfies ExtendVideoRequest;

const validExtendVideoTask = {
  id: 'task-video-extend-1',
  uuid: 'task-video-extend-uuid-1',
  taskId: 'video-extend-task-1',
  product: 'video',
  mode: 'extend',
  status: 'queued',
  prompt: validExtendVideoRequest.prompt,
  negativePrompt: validExtendVideoRequest.negativePrompt,
  provider: 'runtime-video',
  providerModel: 'mock-extend-model',
  remoteJobId: 'video-extend-task-1',
  progress: 5,
  inputRefs: [],
  artifacts: [],
  primaryArtifact: null,
  parameters: {
    duration: '10s',
    resolution: '1080p',
    aspectRatio: '16:9',
  },
  createdAt: '2026-04-25T00:00:00.000Z',
  updatedAt: '2026-04-25T00:00:00.500Z',
  completedAt: null,
} satisfies MagicStudioGenerationTask;

const validExtendVideoResponse = {
  ...validEnvelopeBase,
  data: validExtendVideoTask,
} satisfies ExtendVideoResponse;

const validExplicitEnvelope = {
  ...validEnvelopeBase,
  data: validExtendVideoTask,
} satisfies MagicStudioApiEnvelope<MagicStudioGenerationTask>;

const validServerRequest = validExtendVideoRequest satisfies MagicStudioVideoGenerationRequest;

void validExtendVideoRequest;
void validExtendVideoTask;
void validExtendVideoResponse;
void validExplicitEnvelope;
void validServerRequest;
