import type {
  MagicStudioApiEnvelope,
  MagicStudioGenerationArtifact,
  MagicStudioGenerationTask,
  MagicStudioServerClient,
  MagicStudioVideoGenerationRequest,
} from '@sdkwork/magic-studio-server';

type ImageToVideoRequest = Parameters<MagicStudioServerClient['createImageToVideoTask']>[0];
type ImageToVideoResponse = Awaited<ReturnType<MagicStudioServerClient['createImageToVideoTask']>>;

const validEnvelopeBase = {
  requestId: 'req-image-to-video-1',
  timestamp: '2026-04-25T00:00:00.000Z',
  meta: {
    version: '2026-04-25',
  },
};

const validImageToVideoRequest = {
  generationType: 'smart_reference',
  assets: [
    {
      role: 'reference_1',
      type: 'image',
      value: 'https://example.com/reference-1.png',
      assetUuid: 'reference-asset-uuid-1',
    },
  ],
  prompt: 'animate the portrait with subtle motion',
  negativePrompt: 'flicker',
  duration: '5s',
  resolution: '1080p',
  aspectRatio: '16:9',
  model: 'mock-video-model',
  videoStyle: {
    id: 'portrait',
    prompt: 'soft portrait motion',
  },
  options: {
    cameraFixed: true,
  },
} satisfies ImageToVideoRequest;

const validImageToVideoArtifact = {
  id: 'artifact-image-video-1',
  uuid: 'artifact-image-video-uuid-1',
  type: 'video',
  role: 'primary',
  url: 'https://example.com/generated-image-video.mp4',
  posterUrl: 'https://example.com/generated-image-video.jpg',
  mimeType: 'video/mp4',
  name: 'generated-image-video.mp4',
  width: 1920,
  height: 1080,
  duration: 5,
} satisfies MagicStudioGenerationArtifact;

const validImageToVideoTask = {
  id: 'task-image-video-1',
  uuid: 'task-image-video-uuid-1',
  taskId: 'video-image-task-1',
  product: 'video',
  mode: 'image-to-video',
  status: 'succeeded',
  prompt: validImageToVideoRequest.prompt,
  negativePrompt: validImageToVideoRequest.negativePrompt,
  provider: 'runtime-video',
  providerModel: 'mock-video-model',
  remoteJobId: 'video-image-task-1',
  progress: 100,
  inputRefs: [],
  artifacts: [validImageToVideoArtifact],
  primaryArtifact: validImageToVideoArtifact,
  parameters: {
    duration: '5s',
    resolution: '1080p',
    aspectRatio: '16:9',
  },
  createdAt: '2026-04-25T00:00:00.000Z',
  updatedAt: '2026-04-25T00:00:01.000Z',
  completedAt: '2026-04-25T00:00:01.000Z',
} satisfies MagicStudioGenerationTask;

const validImageToVideoResponse = {
  ...validEnvelopeBase,
  data: validImageToVideoTask,
} satisfies ImageToVideoResponse;

const validExplicitEnvelope = {
  ...validEnvelopeBase,
  data: validImageToVideoTask,
} satisfies MagicStudioApiEnvelope<MagicStudioGenerationTask>;

const validServerRequest = validImageToVideoRequest satisfies MagicStudioVideoGenerationRequest;

void validImageToVideoRequest;
void validImageToVideoArtifact;
void validImageToVideoTask;
void validImageToVideoResponse;
void validExplicitEnvelope;
void validServerRequest;
