import type {
  MagicStudioApiEnvelope,
  MagicStudioGenerationTask,
  MagicStudioServerClient,
  MagicStudioVideoGenerationRequest,
} from '@sdkwork/magic-studio-server';

type StyleTransferRequest =
  Parameters<MagicStudioServerClient['createVideoStyleTransferTask']>[0];
type StyleTransferResponse =
  Awaited<ReturnType<MagicStudioServerClient['createVideoStyleTransferTask']>>;

const validEnvelopeBase = {
  requestId: 'req-video-style-transfer-1',
  timestamp: '2026-04-25T00:00:00.000Z',
  meta: {
    version: '2026-04-25',
  },
};

const validStyleTransferRequest = {
  generationType: 'style-transfer',
  assets: [
    {
      role: 'source_video',
      type: 'video',
      value: 'https://example.com/source-video.mp4',
    },
  ],
  prompt: 'anime cel shading',
  negativePrompt: '',
  duration: '5s',
  resolution: '1080p',
  aspectRatio: '16:9',
  model: 'mock-style-transfer-model',
  videoStyle: {
    id: 'anime',
    prompt: 'anime cel shading',
  },
  options: {
    promptExtend: true,
  },
} satisfies StyleTransferRequest;

const validStyleTransferTask = {
  id: 'task-video-style-1',
  uuid: 'task-video-style-uuid-1',
  taskId: 'video-style-task-1',
  product: 'video',
  mode: 'style-transfer',
  status: 'queued',
  prompt: validStyleTransferRequest.prompt,
  negativePrompt: validStyleTransferRequest.negativePrompt,
  provider: 'runtime-video',
  providerModel: 'mock-style-transfer-model',
  remoteJobId: 'video-style-task-1',
  progress: 8,
  inputRefs: [],
  artifacts: [],
  primaryArtifact: null,
  parameters: {
    duration: '5s',
    resolution: '1080p',
    aspectRatio: '16:9',
  },
  createdAt: '2026-04-25T00:00:00.000Z',
  updatedAt: '2026-04-25T00:00:00.500Z',
  completedAt: null,
} satisfies MagicStudioGenerationTask;

const validStyleTransferResponse = {
  ...validEnvelopeBase,
  data: validStyleTransferTask,
} satisfies StyleTransferResponse;

const validExplicitEnvelope = {
  ...validEnvelopeBase,
  data: validStyleTransferTask,
} satisfies MagicStudioApiEnvelope<MagicStudioGenerationTask>;

const validServerRequest = validStyleTransferRequest satisfies MagicStudioVideoGenerationRequest;

void validStyleTransferRequest;
void validStyleTransferTask;
void validStyleTransferResponse;
void validExplicitEnvelope;
void validServerRequest;
