import type {
  MagicStudioApiEnvelope,
  MagicStudioGenerationArtifact,
  MagicStudioGenerationTask,
  MagicStudioImageGenerationRequest,
  MagicStudioServerClient,
} from '@sdkwork/magic-studio-server';

type CreateImageVariationRequest = Parameters<MagicStudioServerClient['createImageVariationTask']>[0];
type CreateImageVariationResponse = Awaited<
  ReturnType<MagicStudioServerClient['createImageVariationTask']>
>;

const validImageVariationRequest = {
  prompt: '',
  model: 'gemini-2.5-flash-image',
  width: 1024,
  height: 1024,
  seed: 42,
  referenceImages: [
    {
      id: null,
      uuid: 'variation-input-uuid-1',
      assetId: null,
      assetUuid: 'variation-asset-uuid-1',
      primaryResourceId: null,
      primaryResourceUuid: null,
      resourceViewId: null,
      resourceViewUuid: 'variation-view-uuid-1',
      type: 'image',
      role: 'reference',
      url: 'https://example.com/variation-source.png',
      name: 'variation-source.png',
      mimeType: 'image/png',
      createdAt: '2026-04-25T00:00:00.000Z',
      updatedAt: '2026-04-25T00:00:00.000Z',
    },
  ],
} satisfies CreateImageVariationRequest satisfies MagicStudioImageGenerationRequest;

const validImageVariationArtifact = {
  id: 'artifact-variation-1',
  uuid: 'artifact-variation-uuid-1',
  type: 'image',
  role: 'primary',
  url: 'https://example.com/variation-image.png',
  mimeType: 'image/png',
  name: 'variation-image.png',
  width: 1024,
  height: 1024,
  metadata: {
    aspectRatio: '1:1',
  },
} satisfies MagicStudioGenerationArtifact;

const validImageVariationTask = {
  id: 'task-variation-1',
  uuid: 'task-variation-uuid-1',
  taskId: 'image-variation-task-1',
  product: 'image',
  mode: 'variation',
  status: 'succeeded',
  prompt: '',
  provider: 'runtime-image',
  providerModel: 'gemini-2.5-flash-image',
  remoteJobId: 'image-variation-task-1',
  progress: 100,
  inputRefs: validImageVariationRequest.referenceImages,
  artifacts: [validImageVariationArtifact],
  primaryArtifact: validImageVariationArtifact,
  parameters: {
    width: 1024,
    height: 1024,
    seed: 42,
  },
  providerPayload: {
    source: 'contract',
  },
  createdAt: '2026-04-25T00:00:00.000Z',
  updatedAt: '2026-04-25T00:00:01.000Z',
  completedAt: '2026-04-25T00:00:01.000Z',
} satisfies MagicStudioGenerationTask;

const validImageVariationResponse = {
  requestId: 'req-image-variation-1',
  timestamp: '2026-04-25T00:00:00.000Z',
  data: validImageVariationTask,
  meta: {
    version: '2026-04-25',
  },
} satisfies CreateImageVariationResponse satisfies MagicStudioApiEnvelope<MagicStudioGenerationTask>;

void validImageVariationRequest;
void validImageVariationArtifact;
void validImageVariationTask;
void validImageVariationResponse;
