import type {
  MagicStudioApiEnvelope,
  MagicStudioGenerationArtifact,
  MagicStudioGenerationTask,
  MagicStudioImageUpscaleRequest,
  MagicStudioServerClient,
} from '@sdkwork/magic-studio-server';
import type { MediaInputRef } from '@sdkwork/magic-studio-types/agi';

type CreateImageUpscaleRequest = Parameters<MagicStudioServerClient['createImageUpscaleTask']>[0];
type CreateImageUpscaleResponse = Awaited<
  ReturnType<MagicStudioServerClient['createImageUpscaleTask']>
>;

const validSourceRef = {
  id: null,
  uuid: 'source-input-uuid-2',
  assetId: 'source-asset-2',
  assetUuid: 'source-asset-uuid-2',
  primaryResourceId: null,
  primaryResourceUuid: null,
  resourceViewId: null,
  resourceViewUuid: 'source-view-uuid-2',
  type: 'image',
  role: 'source-image',
  url: 'https://example.com/source-2.png',
  name: 'source-2.png',
  mimeType: 'image/png',
  createdAt: '2026-04-25T00:00:00.000Z',
  updatedAt: '2026-04-25T00:00:00.000Z',
} satisfies MediaInputRef;

const validImageUpscaleRequest = {
  source: validSourceRef,
  prompt: 'Upscale the source image while preserving details and overall composition.',
  negativePrompt: 'blurry',
  model: 'upscaler-pro',
  scale: 4,
  targetWidth: 2048,
  targetHeight: 2048,
  format: 'png',
  n: 1,
} satisfies CreateImageUpscaleRequest satisfies MagicStudioImageUpscaleRequest;

const validImageUpscaleArtifact = {
  id: 'artifact-upscale-1',
  uuid: 'artifact-upscale-uuid-1',
  type: 'image',
  role: 'primary',
  url: 'https://example.com/upscaled-image.png',
  mimeType: 'image/png',
  name: 'upscaled-image.png',
  width: 2048,
  height: 2048,
  metadata: {
    aspectRatio: '1:1',
  },
} satisfies MagicStudioGenerationArtifact;

const validImageUpscaleTask = {
  id: 'task-upscale-1',
  uuid: 'task-upscale-uuid-1',
  taskId: 'image-upscale-task-1',
  product: 'image',
  mode: 'upscale',
  status: 'succeeded',
  prompt: validImageUpscaleRequest.prompt,
  negativePrompt: validImageUpscaleRequest.negativePrompt,
  provider: 'runtime-image',
  providerModel: 'upscaler-pro',
  remoteJobId: 'image-upscale-task-1',
  progress: 100,
  inputRefs: [validSourceRef],
  artifacts: [validImageUpscaleArtifact],
  primaryArtifact: validImageUpscaleArtifact,
  parameters: {
    scale: 4,
    targetWidth: 2048,
    targetHeight: 2048,
    format: 'png',
    n: 1,
  },
  providerPayload: {
    source: 'contract',
  },
  createdAt: '2026-04-25T00:00:00.000Z',
  updatedAt: '2026-04-25T00:00:01.000Z',
  completedAt: '2026-04-25T00:00:01.000Z',
} satisfies MagicStudioGenerationTask;

const validImageUpscaleResponse = {
  requestId: 'req-image-upscale-1',
  timestamp: '2026-04-25T00:00:00.000Z',
  data: validImageUpscaleTask,
  meta: {
    version: '2026-04-25',
  },
} satisfies CreateImageUpscaleResponse satisfies MagicStudioApiEnvelope<MagicStudioGenerationTask>;

void validSourceRef;
void validImageUpscaleRequest;
void validImageUpscaleArtifact;
void validImageUpscaleTask;
void validImageUpscaleResponse;
