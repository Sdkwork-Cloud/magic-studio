import type {
  MagicStudioApiEnvelope,
  MagicStudioGenerationArtifact,
  MagicStudioGenerationTask,
  MagicStudioImageGenerationRequest,
  MagicStudioServerClient,
} from '@sdkwork/magic-studio-server';

type CreateImageGenerationRequest = Parameters<MagicStudioServerClient['createImageGenerationTask']>[0];
type CreateImageGenerationResponse = Awaited<
  ReturnType<MagicStudioServerClient['createImageGenerationTask']>
>;
type ReadImageGenerationTaskRequest = Parameters<MagicStudioServerClient['readImageGenerationTask']>[0];
type ReadImageGenerationTaskResponse = Awaited<
  ReturnType<MagicStudioServerClient['readImageGenerationTask']>
>;

const validImageGenerationRequest = {
  prompt: 'floating glass city',
  negativePrompt: 'rain, blur',
  model: 'gemini-2.5-flash-image',
  width: 1280,
  height: 720,
  quality: 'hd',
  style: 'realistic',
  steps: 30,
  guidance: 7,
  aspectRatio: '16:9',
  seed: 42,
  referenceImages: [
    {
      id: null,
      uuid: 'image-input-uuid-1',
      assetId: null,
      assetUuid: 'image-asset-uuid-1',
      primaryResourceId: null,
      primaryResourceUuid: null,
      resourceViewId: null,
      resourceViewUuid: 'image-view-uuid-1',
      type: 'image',
      role: 'reference',
      url: 'https://example.com/reference-1.png',
      name: 'Reference 1',
      mimeType: 'image/png',
      createdAt: '2026-04-25T00:00:00.000Z',
      updatedAt: '2026-04-25T00:00:00.000Z',
    },
  ],
} satisfies CreateImageGenerationRequest satisfies MagicStudioImageGenerationRequest;

const validImageGenerationArtifact = {
  id: 'artifact-1',
  uuid: 'artifact-uuid-1',
  type: 'image',
  role: 'primary',
  url: 'https://example.com/generated-image.png',
  mimeType: 'image/png',
  name: 'generated-image.png',
  width: 1280,
  height: 720,
  metadata: {
    aspectRatio: '16:9',
  },
} satisfies MagicStudioGenerationArtifact;

const validImageGenerationTask = {
  id: 'task-1',
  uuid: 'task-uuid-1',
  taskId: 'image-task-1',
  product: 'image',
  mode: 'text-to-image',
  status: 'succeeded',
  prompt: 'floating glass city',
  negativePrompt: 'rain, blur',
  provider: 'runtime-image',
  providerModel: 'gemini-2.5-flash-image',
  remoteJobId: 'image-task-1',
  progress: 100,
  inputRefs: validImageGenerationRequest.referenceImages,
  artifacts: [validImageGenerationArtifact],
  primaryArtifact: validImageGenerationArtifact,
  parameters: {
    width: 1280,
    height: 720,
    aspectRatio: '16:9',
    steps: 30,
    guidance: 7,
    seed: 42,
  },
  providerPayload: {
    source: 'contract',
  },
  createdAt: '2026-04-25T00:00:00.000Z',
  updatedAt: '2026-04-25T00:00:01.000Z',
  completedAt: '2026-04-25T00:00:01.000Z',
} satisfies MagicStudioGenerationTask;

const validImageGenerationResponse = {
  requestId: 'req-image-create-1',
  timestamp: '2026-04-25T00:00:00.000Z',
  data: validImageGenerationTask,
  meta: {
    version: '2026-04-25',
  },
} satisfies CreateImageGenerationResponse satisfies MagicStudioApiEnvelope<MagicStudioGenerationTask>;

const validImageStatusTaskId: ReadImageGenerationTaskRequest = 'image-task-1';

const validImageStatusResponse = {
  requestId: 'req-image-status-1',
  timestamp: '2026-04-25T00:00:01.000Z',
  data: {
    ...validImageGenerationTask,
    taskId: validImageStatusTaskId,
    status: 'processing',
    progress: 55,
    artifacts: [],
    primaryArtifact: null,
    completedAt: null,
  },
  meta: {
    version: '2026-04-25',
  },
} satisfies ReadImageGenerationTaskResponse satisfies MagicStudioApiEnvelope<MagicStudioGenerationTask>;

void validImageGenerationRequest;
void validImageGenerationArtifact;
void validImageGenerationTask;
void validImageGenerationResponse;
void validImageStatusTaskId;
void validImageStatusResponse;
